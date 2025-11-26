/**
 * WebRTC Service for Group Voice/Video Calls
 * Uses Firebase Firestore for signaling
 *
 * NOTE: All react-native-webrtc imports are lazy-loaded to prevent
 * app crashes on startup in Expo Go (where native modules aren't available).
 * The module is loaded when joinCall() is called.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Request microphone and camera permissions on Android
 */
async function requestMediaPermissions(isVideo: boolean): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS handles permissions via Info.plist
  }

  try {
    const permissions: any[] = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

    if (isVideo) {
      permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    }

    console.log('📱 Requesting permissions:', permissions);

    const granted = await PermissionsAndroid.requestMultiple(permissions);

    const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
    const cameraGranted = !isVideo || granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;

    console.log('📱 Permission results:', {
      audio: audioGranted ? 'granted' : 'denied',
      camera: isVideo ? (cameraGranted ? 'granted' : 'denied') : 'not requested',
    });

    if (!audioGranted) {
      throw new Error('Microphone permission is required for calls');
    }

    if (isVideo && !cameraGranted) {
      throw new Error('Camera permission is required for video calls');
    }

    return true;
  } catch (error) {
    console.error('❌ Permission request failed:', error);
    throw error;
  }
}

// Lazy-loaded WebRTC module reference
let webrtcModule: any = null;
let webrtcLoaded = false;

/**
 * Lazy-load WebRTC module and initialize it
 */
async function loadWebRTC(): Promise<boolean> {
  if (webrtcLoaded && webrtcModule) return true;

  try {
    console.log('📦 Loading WebRTC module...');

    // Dynamic require to avoid crash at startup in Expo Go
    webrtcModule = require('react-native-webrtc');

    console.log('📦 WebRTC module loaded, available exports:', Object.keys(webrtcModule));

    // Call registerGlobals to set up browser-compatible WebRTC functions
    if (typeof webrtcModule.registerGlobals === 'function') {
      webrtcModule.registerGlobals();
      console.log('📦 registerGlobals() called successfully');
    }

    // Verify essential components are available
    if (!webrtcModule.RTCPeerConnection) {
      throw new Error('RTCPeerConnection not found in WebRTC module');
    }
    if (!webrtcModule.mediaDevices || !webrtcModule.mediaDevices.getUserMedia) {
      throw new Error('mediaDevices.getUserMedia not found in WebRTC module');
    }

    console.log('✅ WebRTC module initialized successfully:', {
      RTCPeerConnection: !!webrtcModule.RTCPeerConnection,
      RTCIceCandidate: !!webrtcModule.RTCIceCandidate,
      RTCSessionDescription: !!webrtcModule.RTCSessionDescription,
      MediaStream: !!webrtcModule.MediaStream,
      mediaDevices: !!webrtcModule.mediaDevices,
      getUserMedia: !!webrtcModule.mediaDevices?.getUserMedia,
    });

    webrtcLoaded = true;
    return true;
  } catch (error: any) {
    console.error('❌ Failed to load WebRTC module:', error);
    webrtcModule = null;
    webrtcLoaded = false;
    throw new Error(`WebRTC not available: ${error.message}. Make sure you're using a development build, not Expo Go.`);
  }
}

// ICE servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // TURN servers for NAT traversal when STUN fails
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
  private pendingIceCandidates: Map<string, any[]> = new Map();

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
      console.log('📦 Loading WebRTC...');
      await loadWebRTC();

      // Request permissions BEFORE accessing media
      console.log('📱 Requesting media permissions...');
      await requestMediaPermissions(isVideo);

      console.log('🎙️ Getting local media stream...');

      // Get local media stream
      this.localStream = await this.getLocalStream(isVideo);

      if (!this.localStream) {
        throw new Error('Failed to get local media stream');
      }

      console.log('✅ Local stream obtained:', {
        audioTracks: this.localStream.getAudioTracks?.()?.length ?? 0,
        videoTracks: this.localStream.getVideoTracks?.()?.length ?? 0,
      });

      callbacks.onLocalStream(this.localStream);

      // Add self to participants
      await this.addParticipant(userId, userName, userPhotoURL);

      // Listen for signaling messages FIRST (before participants)
      this.subscribeToSignaling();

      // Listen for other participants
      this.subscribeToParticipants();

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
    if (!webrtcModule || !webrtcModule.mediaDevices) {
      throw new Error('WebRTC module not loaded');
    }

    const mediaConstraints: any = {
      audio: true,
      video: isVideo ? {
        frameRate: 30,
        facingMode: 'user',
      } : false,
    };

    console.log('📱 Requesting media with constraints:', mediaConstraints);

    try {
      const mediaStream = await webrtcModule.mediaDevices.getUserMedia(mediaConstraints);

      if (!mediaStream) {
        throw new Error('getUserMedia returned null');
      }

      // If voice-only call, disable video track
      if (!isVideo) {
        const videoTracks = mediaStream.getVideoTracks();
        if (videoTracks && videoTracks.length > 0) {
          videoTracks[0].enabled = false;
        }
      }

      console.log('✅ Got media stream:', {
        id: mediaStream.id,
        audioTracks: mediaStream.getAudioTracks().length,
        videoTracks: mediaStream.getVideoTracks().length,
      });

      return mediaStream;
    } catch (error: any) {
      console.error('❌ getUserMedia failed:', error);
      throw new Error(`Failed to access camera/microphone: ${error?.message || error}`);
    }
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
    console.log('✅ Added self to participants');
  }

  /**
   * Subscribe to participant changes
   */
  private subscribeToParticipants(): void {
    const participantsRef = collection(db, 'groups', this.currentGroupId, 'calls', 'active', 'participants');
    const participantsQuery = query(participantsRef, orderBy('joinedAt', 'asc'));

    const unsubscribe = onSnapshot(participantsQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
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
          console.log(`👤 Participant joined: ${participant.name}`);
          this.callbacks?.onParticipantJoined(participant);
          this.pendingIceCandidates.set(participant.id, []);
          await this.createPeerConnection(participant.id, true);
        } else if (change.type === 'modified') {
          this.callbacks?.onParticipantUpdated(participant);
        } else if (change.type === 'removed') {
          console.log(`👤 Participant left: ${participant.name}`);
          this.callbacks?.onParticipantLeft(participant.id);
          this.closePeerConnection(participant.id);
        }
      }
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

    console.log('📡 Subscribing to signaling messages...');

    const unsubscribe = onSnapshot(signalingRef, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data();
          console.log(`📨 Received signaling: ${data.type} from ${data.from}`);
          await this.handleSignalingMessage(data);
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
    console.log(`🔗 Creating peer connection for ${remoteUserId} (initiator: ${isInitiator})`);

    if (!webrtcModule) {
      throw new Error('WebRTC module not loaded');
    }

    if (this.peerConnections.has(remoteUserId)) {
      console.log(`⚠️ Peer connection already exists for ${remoteUserId}`);
      return this.peerConnections.get(remoteUserId)!;
    }

    const { RTCPeerConnection, MediaStream } = webrtcModule;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(remoteUserId, pc);

    // Initialize remote stream
    const remoteStream = new MediaStream();
    this.remoteStreams.set(remoteUserId, remoteStream);

    // Add local tracks
    if (this.localStream) {
      console.log(`📤 Adding local tracks to peer connection`);
      this.localStream.getTracks().forEach((track: any) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming tracks
    pc.addEventListener('track', (event: any) => {
      console.log(`📥 Track received from ${remoteUserId}:`, event.track?.kind);

      let stream = this.remoteStreams.get(remoteUserId);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(remoteUserId, stream);
      }

      stream.addTrack(event.track);
      this.callbacks?.onRemoteStream(remoteUserId, stream);
    });

    // Handle ICE candidates
    pc.addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        console.log(`🧊 Sending ICE candidate to ${remoteUserId}`);
        this.sendSignalingMessage(remoteUserId, 'ice-candidate', {
          candidate: event.candidate.toJSON(),
        });
      }
    });

    // Handle connection state
    pc.addEventListener('connectionstatechange', () => {
      console.log(`🔌 Connection state with ${remoteUserId}:`, pc.connectionState);
      this.callbacks?.onConnectionStateChange(`peer-${remoteUserId}: ${pc.connectionState}`);

      if (pc.connectionState === 'failed') {
        this.restartIce(remoteUserId, pc);
      }
    });

    // Handle ICE connection state
    pc.addEventListener('iceconnectionstatechange', () => {
      console.log(`🧊 ICE state with ${remoteUserId}:`, pc.iceConnectionState);
    });

    // Create and send offer if initiator
    if (isInitiator) {
      try {
        console.log(`📤 Creating offer for ${remoteUserId}`);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: this.isVideoCall,
        });
        await pc.setLocalDescription(offer);

        await this.sendSignalingMessage(remoteUserId, 'offer', {
          sdp: offer.sdp,
          type: offer.type,
        });
      } catch (error) {
        console.error(`❌ Error creating offer:`, error);
        throw error;
      }
    }

    return pc;
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(fromUserId: string, payload: any): Promise<void> {
    console.log(`📥 Handling offer from ${fromUserId}`);

    if (!webrtcModule) {
      throw new Error('WebRTC module not loaded');
    }

    const { RTCSessionDescription } = webrtcModule;

    if (!this.pendingIceCandidates.has(fromUserId)) {
      this.pendingIceCandidates.set(fromUserId, []);
    }

    let pc = this.peerConnections.get(fromUserId);
    if (!pc) {
      pc = await this.createPeerConnection(fromUserId, false);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Process pending ICE candidates
      await this.processPendingCandidates(fromUserId);

      await this.sendSignalingMessage(fromUserId, 'answer', {
        sdp: answer.sdp,
        type: answer.type,
      });
    } catch (error) {
      console.error(`❌ Error handling offer:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(fromUserId: string, payload: any): Promise<void> {
    console.log(`📥 Handling answer from ${fromUserId}`);

    if (!webrtcModule) {
      throw new Error('WebRTC module not loaded');
    }

    const { RTCSessionDescription } = webrtcModule;

    const pc = this.peerConnections.get(fromUserId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
        await this.processPendingCandidates(fromUserId);
      } catch (error) {
        console.error(`❌ Error handling answer:`, error);
      }
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(fromUserId: string, payload: any): Promise<void> {
    if (!payload.candidate) return;

    if (!webrtcModule) {
      throw new Error('WebRTC module not loaded');
    }

    const { RTCIceCandidate } = webrtcModule;

    const pc = this.peerConnections.get(fromUserId);
    const candidate = new RTCIceCandidate(payload.candidate);

    if (!pc || !pc.remoteDescription) {
      console.log(`🧊 Buffering ICE candidate from ${fromUserId}`);
      if (!this.pendingIceCandidates.has(fromUserId)) {
        this.pendingIceCandidates.set(fromUserId, []);
      }
      this.pendingIceCandidates.get(fromUserId)!.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      console.warn(`⚠️ Error adding ICE candidate:`, error);
    }
  }

  /**
   * Process pending ICE candidates
   */
  private async processPendingCandidates(remoteUserId: string): Promise<void> {
    const candidates = this.pendingIceCandidates.get(remoteUserId);
    if (!candidates || candidates.length === 0) return;

    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) return;

    console.log(`🧊 Processing ${candidates.length} pending candidates`);

    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.warn(`⚠️ Error adding pending candidate:`, error);
      }
    }

    this.pendingIceCandidates.set(remoteUserId, []);
  }

  /**
   * Send signaling message
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
   * Restart ICE
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
   * Close peer connection
   */
  private closePeerConnection(userId: string): void {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
    this.remoteStreams.delete(userId);
    this.pendingIceCandidates.delete(userId);
  }

  /**
   * Toggle mute
   */
  toggleMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !muted;
      });
    }
    const participantRef = doc(
      db, 'groups', this.currentGroupId, 'calls', 'active', 'participants', this.currentUserId
    );
    setDoc(participantRef, { isMuted: muted }, { merge: true });
  }

  /**
   * Toggle video
   */
  toggleVideo(videoOff: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = !videoOff;
      });
    }
    const participantRef = doc(
      db, 'groups', this.currentGroupId, 'calls', 'active', 'participants', this.currentUserId
    );
    setDoc(participantRef, { isVideoOff: videoOff }, { merge: true });
  }

  /**
   * Switch camera
   */
  async switchCamera(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack && videoTrack._switchCamera) {
        videoTrack._switchCamera();
      }
    }
  }

  /**
   * Leave call
   */
  async leaveCall(): Promise<void> {
    console.log('📞 Leaving call...');

    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.pendingIceCandidates.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => track.stop());
      this.localStream = null;
    }

    if (this.currentGroupId && this.currentUserId) {
      const participantRef = doc(
        db, 'groups', this.currentGroupId, 'calls', 'active', 'participants', this.currentUserId
      );
      await deleteDoc(participantRef).catch(console.error);

      const signalingRef = collection(
        db, 'groups', this.currentGroupId, 'calls', 'active', 'signaling', this.currentUserId, 'messages'
      );
      const messages = await getDocs(signalingRef);
      messages.forEach((msgDoc) => deleteDoc(msgDoc.ref).catch(console.error));
    }

    this.callbacks = null;
    this.currentGroupId = '';
    this.currentUserId = '';

    console.log('✅ Call cleanup complete');
  }

  getLocalStream(): MediaStreamType | null {
    return this.localStream;
  }

  getRemoteStreams(): Map<string, MediaStreamType> {
    return this.remoteStreams;
  }
}

export default new WebRTCService();
