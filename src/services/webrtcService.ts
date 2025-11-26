/**
 * WebRTC Service for Group Voice/Video Calls
 * Uses Firebase Firestore for signaling
 *
 * NOTE: All react-native-webrtc imports are lazy-loaded to prevent
 * app crashes on startup. The native module is only loaded when
 * actually needed (when joining a call).
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Lazy-loaded WebRTC types - will be initialized on first use
let RTCPeerConnection: any;
let RTCIceCandidate: any;
let RTCSessionDescription: any;
let mediaDevices: any;

// Track if WebRTC module has been loaded
let webrtcLoaded = false;

/**
 * Lazily load the WebRTC module to prevent crashes on app startup
 */
async function loadWebRTC(): Promise<boolean> {
  if (webrtcLoaded) return true;

  try {
    const webrtc = await import('react-native-webrtc');
    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    RTCSessionDescription = webrtc.RTCSessionDescription;
    mediaDevices = webrtc.mediaDevices;
    webrtcLoaded = true;
    console.log('✅ WebRTC module loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load WebRTC module:', error);
    return false;
  }
}

// ICE servers for NAT traversal
// STUN servers help discover public IP, TURN servers relay media when direct connection fails
const ICE_SERVERS = {
  iceServers: [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Free TURN servers from Open Relay Project (metered.ca)
    // These are essential for mobile networks behind symmetric NAT
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'e8dd65c92f6ec3a2949fa549',
      credential: 'uWdEpQ1hE5J8lxBU',
    },
    {
      urls: 'turn:a.relay.metered.ca:80?transport=tcp',
      username: 'e8dd65c92f6ec3a2949fa549',
      credential: 'uWdEpQ1hE5J8lxBU',
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'e8dd65c92f6ec3a2949fa549',
      credential: 'uWdEpQ1hE5J8lxBU',
    },
    {
      urls: 'turns:a.relay.metered.ca:443',
      username: 'e8dd65c92f6ec3a2949fa549',
      credential: 'uWdEpQ1hE5J8lxBU',
    },
  ],
  iceCandidatePoolSize: 10,
};

export interface CallParticipant {
  id: string;
  name: string;
  photoURL?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  joinedAt: Date;
}

// Use 'any' for MediaStream since WebRTC is lazy-loaded
type MediaStreamType = any;

export interface WebRTCCallbacks {
  onLocalStream: (stream: MediaStreamType) => void;
  onRemoteStream: (userId: string, stream: MediaStreamType) => void;
  onParticipantJoined: (participant: CallParticipant) => void;
  onParticipantLeft: (userId: string) => void;
  onParticipantUpdated: (participant: CallParticipant) => void;
  onConnectionStateChange: (state: string) => void;
  onError: (error: Error) => void;
}

class WebRTCService {
  private localStream: MediaStreamType | null = null;
  private peerConnections: Map<string, any> = new Map();
  private remoteStreams: Map<string, MediaStreamType> = new Map();
  private callbacks: WebRTCCallbacks | null = null;
  private currentUserId: string = '';
  private currentGroupId: string = '';
  private unsubscribers: Unsubscribe[] = [];
  private isVideoCall: boolean = false;

  /**
   * Initialize and join a call
   */
  async joinCall(
    groupId: string,
    userId: string,
    userName: string,
    userPhotoURL: string | undefined,
    isVideo: boolean,
    callbacks: WebRTCCallbacks
  ): Promise<void> {
    this.currentGroupId = groupId;
    this.currentUserId = userId;
    this.isVideoCall = isVideo;
    this.callbacks = callbacks;

    try {
      // Load WebRTC module first
      const loaded = await loadWebRTC();
      if (!loaded) {
        throw new Error('Failed to load WebRTC module');
      }

      // Get local media stream
      this.localStream = await this.getLocalStream(isVideo);
      callbacks.onLocalStream(this.localStream);

      // Add self to participants
      await this.addParticipant(userId, userName, userPhotoURL);

      // Listen for other participants
      this.subscribeToParticipants();

      // Listen for signaling messages (offers, answers, ICE candidates)
      this.subscribeToSignaling();

      callbacks.onConnectionStateChange('connected');
    } catch (error: any) {
      console.error('Error joining call:', error);
      callbacks.onError(error);
      throw error;
    }
  }

  /**
   * Get local media stream (audio/video)
   */
  private async getLocalStream(isVideo: boolean): Promise<MediaStreamType> {
    const constraints = {
      audio: true,
      video: isVideo ? {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
      } : false,
    };

    const stream = await mediaDevices.getUserMedia(constraints);
    return stream as MediaStreamType;
  }

  /**
   * Add self as participant in Firestore
   */
  private async addParticipant(userId: string, userName: string, photoURL?: string): Promise<void> {
    const participantRef = doc(db, 'groups', this.currentGroupId, 'calls', 'active', 'participants', userId);
    await setDoc(participantRef, {
      id: userId,
      name: userName,
      photoURL: photoURL || null,
      isMuted: false,
      isVideoOff: !this.isVideoCall,
      joinedAt: serverTimestamp(),
    });
  }

  /**
   * Subscribe to participant changes
   */
  private subscribeToParticipants(): void {
    const participantsRef = collection(db, 'groups', this.currentGroupId, 'calls', 'active', 'participants');
    const participantsQuery = query(participantsRef, orderBy('joinedAt', 'asc'));

    const unsubscribe = onSnapshot(participantsQuery, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        const participant: CallParticipant = {
          id: change.doc.id,
          name: data.name,
          photoURL: data.photoURL,
          isMuted: data.isMuted,
          isVideoOff: data.isVideoOff,
          joinedAt: data.joinedAt?.toDate() || new Date(),
        };

        if (change.type === 'added' && participant.id !== this.currentUserId) {
          this.callbacks?.onParticipantJoined(participant);
          // Create peer connection for new participant
          await this.createPeerConnection(participant.id, true);
        } else if (change.type === 'modified') {
          this.callbacks?.onParticipantUpdated(participant);
        } else if (change.type === 'removed') {
          this.callbacks?.onParticipantLeft(participant.id);
          this.closePeerConnection(participant.id);
        }
      });
    });

    this.unsubscribers.push(unsubscribe);
  }

  /**
   * Subscribe to signaling messages
   */
  private subscribeToSignaling(): void {
    const signalingRef = collection(
      db, 'groups', this.currentGroupId, 'calls', 'active', 'signaling', this.currentUserId, 'messages'
    );

    const unsubscribe = onSnapshot(signalingRef, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data();
          await this.handleSignalingMessage(data);
          // Delete processed message
          await deleteDoc(change.doc.ref);
        }
      }
    });

    this.unsubscribers.push(unsubscribe);
  }

  /**
   * Handle incoming signaling messages
   */
  private async handleSignalingMessage(data: any): Promise<void> {
    const { type, from, payload } = data;

    switch (type) {
      case 'offer':
        await this.handleOffer(from, payload);
        break;
      case 'answer':
        await this.handleAnswer(from, payload);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(from, payload);
        break;
    }
  }

  /**
   * Create peer connection for a participant
   */
  private async createPeerConnection(remoteUserId: string, isInitiator: boolean): Promise<any> {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(remoteUserId, pc);

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event: any) => {
      console.log(`📥 Track received from ${remoteUserId}:`, {
        kind: event.track?.kind,
        enabled: event.track?.enabled,
        readyState: event.track?.readyState,
        streamsCount: event.streams?.length,
      });

      const remoteStream = event.streams[0];
      if (remoteStream) {
        // Log track details for debugging
        const audioTracks = remoteStream.getAudioTracks();
        const videoTracks = remoteStream.getVideoTracks();
        console.log(`📊 Remote stream from ${remoteUserId}:`, {
          audioTracks: audioTracks.length,
          videoTracks: videoTracks.length,
          audioEnabled: audioTracks[0]?.enabled,
          audioReadyState: audioTracks[0]?.readyState,
        });

        // Ensure audio track is enabled
        audioTracks.forEach((track: any) => {
          if (!track.enabled) {
            console.log(`🔊 Enabling audio track from ${remoteUserId}`);
            track.enabled = true;
          }
        });

        this.remoteStreams.set(remoteUserId, remoteStream);
        this.callbacks?.onRemoteStream(remoteUserId, remoteStream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        this.sendSignalingMessage(remoteUserId, 'ice-candidate', {
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`Connection state with ${remoteUserId}:`, state);
      this.callbacks?.onConnectionStateChange(`peer-${remoteUserId}: ${state}`);

      if (state === 'failed') {
        console.error(`❌ Connection failed with ${remoteUserId} - ICE negotiation failed`);
        // Try to restart ICE
        this.restartIce(remoteUserId, pc);
      } else if (state === 'disconnected') {
        console.warn(`⚠️ Connection disconnected with ${remoteUserId}`);
      }
    };

    // Handle ICE connection state for more detailed debugging
    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      console.log(`ICE connection state with ${remoteUserId}:`, iceState);

      if (iceState === 'failed') {
        console.error(`❌ ICE connection failed with ${remoteUserId}`);
        this.callbacks?.onError(new Error(`ICE connection failed with peer`));
      } else if (iceState === 'connected' || iceState === 'completed') {
        console.log(`✅ ICE connection successful with ${remoteUserId}`);
      }
    };

    // Handle ICE gathering state
    pc.onicegatheringstatechange = () => {
      console.log(`ICE gathering state with ${remoteUserId}:`, pc.iceGatheringState);
    };

    // If we're the initiator, create and send an offer
    if (isInitiator) {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.isVideoCall,
      });
      await pc.setLocalDescription(offer);
      await this.sendSignalingMessage(remoteUserId, 'offer', {
        sdp: offer.sdp,
        type: offer.type,
      });
    }

    return pc;
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(fromUserId: string, payload: any): Promise<void> {
    let pc = this.peerConnections.get(fromUserId);
    if (!pc) {
      pc = await this.createPeerConnection(fromUserId, false);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(payload));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await this.sendSignalingMessage(fromUserId, 'answer', {
      sdp: answer.sdp,
      type: answer.type,
    });
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(fromUserId: string, payload: any): Promise<void> {
    const pc = this.peerConnections.get(fromUserId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload));
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(fromUserId: string, payload: any): Promise<void> {
    const pc = this.peerConnections.get(fromUserId);
    if (pc && payload.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  }

  /**
   * Send signaling message to another participant
   */
  private async sendSignalingMessage(toUserId: string, type: string, payload: any): Promise<void> {
    const messageRef = doc(
      collection(db, 'groups', this.currentGroupId, 'calls', 'active', 'signaling', toUserId, 'messages')
    );
    await setDoc(messageRef, {
      type,
      from: this.currentUserId,
      payload,
      timestamp: serverTimestamp(),
    });
  }

  /**
   * Restart ICE for a failed connection
   */
  private async restartIce(remoteUserId: string, pc: any): Promise<void> {
    try {
      console.log(`🔄 Restarting ICE for ${remoteUserId}`);
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      await this.sendSignalingMessage(remoteUserId, 'offer', {
        sdp: offer.sdp,
        type: offer.type,
      });
    } catch (error) {
      console.error('Failed to restart ICE:', error);
    }
  }

  /**
   * Close peer connection with a participant
   */
  private closePeerConnection(userId: string): void {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
    this.remoteStreams.delete(userId);
  }

  /**
   * Toggle local audio mute
   */
  toggleMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    // Update Firestore
    const participantRef = doc(
      db, 'groups', this.currentGroupId, 'calls', 'active', 'participants', this.currentUserId
    );
    setDoc(participantRef, { isMuted: muted }, { merge: true });
  }

  /**
   * Toggle local video
   */
  toggleVideo(videoOff: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoOff;
      });
    }
    // Update Firestore
    const participantRef = doc(
      db, 'groups', this.currentGroupId, 'calls', 'active', 'participants', this.currentUserId
    );
    setDoc(participantRef, { isVideoOff: videoOff }, { merge: true });
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        (videoTrack as any)._switchCamera();
      }
    }
  }

  /**
   * Leave the call and cleanup
   */
  async leaveCall(): Promise<void> {
    // Stop all unsubscribers
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Remove self from participants
    if (this.currentGroupId && this.currentUserId) {
      const participantRef = doc(
        db, 'groups', this.currentGroupId, 'calls', 'active', 'participants', this.currentUserId
      );
      await deleteDoc(participantRef).catch(console.error);

      // Clean up signaling messages
      const signalingRef = collection(
        db, 'groups', this.currentGroupId, 'calls', 'active', 'signaling', this.currentUserId, 'messages'
      );
      const messages = await getDocs(signalingRef);
      messages.forEach((doc) => deleteDoc(doc.ref).catch(console.error));
    }

    this.callbacks = null;
    this.currentGroupId = '';
    this.currentUserId = '';
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStreamType | null {
    return this.localStream;
  }

  /**
   * Get remote streams
   */
  getRemoteStreams(): Map<string, MediaStreamType> {
    return this.remoteStreams;
  }
}

export default new WebRTCService();
