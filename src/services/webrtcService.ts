/**
 * WebRTC Service for Group Voice/Video Calls
 * Uses Firebase Firestore for signaling
 *
 * NOTE: All react-native-webrtc imports are lazy-loaded to prevent
 * app crashes on startup. The native module is only loaded when
 * actually needed (when joining a call).
 */

import { Platform, PermissionsAndroid } from 'react-native';
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

/**
 * Request microphone and camera permissions on Android
 */
async function requestMediaPermissions(isVideo: boolean): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS handles permissions via Info.plist
  }

  try {
    const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

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

// Lazy-loaded WebRTC types - will be initialized on first use
let RTCPeerConnection: any;
let RTCIceCandidate: any;
let RTCSessionDescription: any;
let MediaStream: any;
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

    console.log('📦 WebRTC module keys:', Object.keys(webrtc));

    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    RTCSessionDescription = webrtc.RTCSessionDescription;
    MediaStream = webrtc.MediaStream;
    mediaDevices = webrtc.mediaDevices;

    console.log('📦 Loaded components:', {
      RTCPeerConnection: !!RTCPeerConnection,
      RTCIceCandidate: !!RTCIceCandidate,
      RTCSessionDescription: !!RTCSessionDescription,
      MediaStream: !!MediaStream,
      mediaDevices: !!mediaDevices,
      getUserMedia: !!mediaDevices?.getUserMedia,
    });

    if (!mediaDevices || !mediaDevices.getUserMedia) {
      console.error('❌ mediaDevices.getUserMedia not available');
      // Try alternative access
      if ((webrtc as any).default?.mediaDevices) {
        mediaDevices = (webrtc as any).default.mediaDevices;
        console.log('📦 Using default.mediaDevices');
      }
    }

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

// Session constraints for offer/answer - following official react-native-webrtc docs
const SESSION_CONSTRAINTS = {
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true,
    VoiceActivityDetection: true,
  },
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

  // ICE candidate buffering - CRITICAL for proper WebRTC signaling
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
      const loaded = await loadWebRTC();
      if (!loaded) {
        throw new Error('Failed to load WebRTC module');
      }

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
      // This ensures we're ready to receive offers/answers/candidates
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
    const constraints = {
      audio: true,
      video: isVideo ? {
        facingMode: 'user',
        frameRate: 30,
        width: { ideal: 640 },
        height: { ideal: 480 },
      } : false,
    };

    console.log('📱 Requesting media with constraints:', constraints);
    console.log('📱 mediaDevices available:', !!mediaDevices);
    console.log('📱 getUserMedia available:', !!mediaDevices?.getUserMedia);

    if (!mediaDevices) {
      throw new Error('mediaDevices is not available - WebRTC module not properly loaded');
    }

    if (!mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not available on mediaDevices');
    }

    try {
      console.log('📱 Calling getUserMedia...');
      const stream = await mediaDevices.getUserMedia(constraints);
      console.log('📱 getUserMedia returned:', stream, typeof stream);

      if (!stream) {
        throw new Error('getUserMedia returned null stream');
      }

      console.log('✅ getUserMedia succeeded, stream:', stream);
      console.log('✅ Stream tracks:', stream.getTracks?.()?.length || 'unknown');

      // If voice-only call, disable video track (following official docs)
      if (!isVideo && stream.getVideoTracks) {
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach((track: any) => {
          track.enabled = false;
        });
      }

      return stream as MediaStreamType;
    } catch (error: any) {
      console.error('❌ getUserMedia failed:', error);
      console.error('❌ Error name:', error?.name);
      console.error('❌ Error message:', error?.message);
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
          console.log(`👤 Participant joined: ${participant.name} (${participant.id})`);
          this.callbacks?.onParticipantJoined(participant);

          // Initialize pending candidates array for this peer
          this.pendingIceCandidates.set(participant.id, []);

          // Create peer connection for new participant (we are the initiator)
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
          console.log(`📨 Received signaling message: ${data.type} from ${data.from}`);
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
    console.log(`🔗 Creating peer connection for ${remoteUserId} (initiator: ${isInitiator})`);

    // Check if we already have a connection
    if (this.peerConnections.has(remoteUserId)) {
      console.log(`⚠️ Peer connection already exists for ${remoteUserId}`);
      return this.peerConnections.get(remoteUserId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(remoteUserId, pc);

    // Initialize remote stream for this peer
    const remoteStream = new MediaStream();
    this.remoteStreams.set(remoteUserId, remoteStream);

    // Add local tracks to connection
    if (this.localStream) {
      console.log(`📤 Adding local tracks to peer connection for ${remoteUserId}`);
      this.localStream.getTracks().forEach((track: any) => {
        console.log(`  - Adding track: ${track.kind}, enabled: ${track.enabled}`);
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming tracks - following official react-native-webrtc documentation
    pc.addEventListener('track', (event: any) => {
      console.log(`📥 Track event from ${remoteUserId}:`, {
        kind: event.track?.kind,
        enabled: event.track?.enabled,
        readyState: event.track?.readyState,
      });

      // Get or create remote stream
      let stream = this.remoteStreams.get(remoteUserId);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(remoteUserId, stream);
      }

      // Add the track to the remote stream (official approach)
      stream.addTrack(event.track);

      console.log(`📊 Remote stream for ${remoteUserId}:`, {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      // Notify callback with the updated stream
      this.callbacks?.onRemoteStream(remoteUserId, stream);
    });

    // Handle ICE candidates
    pc.addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        console.log(`🧊 Sending ICE candidate to ${remoteUserId}`);
        this.sendSignalingMessage(remoteUserId, 'ice-candidate', {
          candidate: event.candidate.toJSON(),
        });
      } else {
        console.log(`🧊 ICE gathering complete for ${remoteUserId}`);
      }
    });

    // Handle ICE candidate errors
    pc.addEventListener('icecandidateerror', (event: any) => {
      console.warn(`⚠️ ICE candidate error for ${remoteUserId}:`, event);
      // Errors can be ignored - connections can still work
    });

    // Handle connection state changes
    pc.addEventListener('connectionstatechange', () => {
      const state = pc.connectionState;
      console.log(`🔌 Connection state with ${remoteUserId}:`, state);
      this.callbacks?.onConnectionStateChange(`peer-${remoteUserId}: ${state}`);

      if (state === 'failed') {
        console.error(`❌ Connection failed with ${remoteUserId}`);
        this.restartIce(remoteUserId, pc);
      } else if (state === 'connected') {
        console.log(`✅ Connected with ${remoteUserId}!`);
      }
    });

    // Handle ICE connection state for detailed debugging
    pc.addEventListener('iceconnectionstatechange', () => {
      const iceState = pc.iceConnectionState;
      console.log(`🧊 ICE connection state with ${remoteUserId}:`, iceState);

      if (iceState === 'failed') {
        console.error(`❌ ICE connection failed with ${remoteUserId}`);
        this.callbacks?.onError(new Error(`ICE connection failed with peer`));
      } else if (iceState === 'connected' || iceState === 'completed') {
        console.log(`✅ ICE connection successful with ${remoteUserId}`);
      }
    });

    // Handle ICE gathering state
    pc.addEventListener('icegatheringstatechange', () => {
      console.log(`🧊 ICE gathering state with ${remoteUserId}:`, pc.iceGatheringState);
    });

    // Handle signaling state
    pc.addEventListener('signalingstatechange', () => {
      console.log(`📡 Signaling state with ${remoteUserId}:`, pc.signalingState);
    });

    // Handle negotiation needed
    pc.addEventListener('negotiationneeded', () => {
      console.log(`🔄 Negotiation needed with ${remoteUserId}`);
    });

    // If we're the initiator, create and send an offer
    if (isInitiator) {
      try {
        console.log(`📤 Creating offer for ${remoteUserId}...`);
        const offer = await pc.createOffer(SESSION_CONSTRAINTS);
        await pc.setLocalDescription(offer);

        console.log(`📤 Sending offer to ${remoteUserId}`);
        await this.sendSignalingMessage(remoteUserId, 'offer', {
          sdp: offer.sdp,
          type: offer.type,
        });
      } catch (error) {
        console.error(`❌ Error creating offer for ${remoteUserId}:`, error);
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

    // Initialize pending candidates if not exists
    if (!this.pendingIceCandidates.has(fromUserId)) {
      this.pendingIceCandidates.set(fromUserId, []);
    }

    let pc = this.peerConnections.get(fromUserId);
    if (!pc) {
      pc = await this.createPeerConnection(fromUserId, false);
    }

    try {
      const offerDescription = new RTCSessionDescription(payload);
      console.log(`📥 Setting remote description (offer) from ${fromUserId}`);
      await pc.setRemoteDescription(offerDescription);

      console.log(`📤 Creating answer for ${fromUserId}...`);
      const answer = await pc.createAnswer(SESSION_CONSTRAINTS);
      await pc.setLocalDescription(answer);

      // Process any pending ICE candidates NOW (after remote description is set)
      await this.processPendingCandidates(fromUserId);

      console.log(`📤 Sending answer to ${fromUserId}`);
      await this.sendSignalingMessage(fromUserId, 'answer', {
        sdp: answer.sdp,
        type: answer.type,
      });
    } catch (error) {
      console.error(`❌ Error handling offer from ${fromUserId}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(fromUserId: string, payload: any): Promise<void> {
    console.log(`📥 Handling answer from ${fromUserId}`);

    const pc = this.peerConnections.get(fromUserId);
    if (pc) {
      try {
        const answerDescription = new RTCSessionDescription(payload);
        console.log(`📥 Setting remote description (answer) from ${fromUserId}`);
        await pc.setRemoteDescription(answerDescription);

        // Process any pending ICE candidates NOW (after remote description is set)
        await this.processPendingCandidates(fromUserId);
      } catch (error) {
        console.error(`❌ Error handling answer from ${fromUserId}:`, error);
        throw error;
      }
    } else {
      console.warn(`⚠️ No peer connection for answer from ${fromUserId}`);
    }
  }

  /**
   * Handle incoming ICE candidate - with proper buffering
   */
  private async handleIceCandidate(fromUserId: string, payload: any): Promise<void> {
    if (!payload.candidate) {
      console.log(`🧊 Received end-of-candidates signal from ${fromUserId}`);
      return;
    }

    const pc = this.peerConnections.get(fromUserId);
    const iceCandidate = new RTCIceCandidate(payload.candidate);

    // CRITICAL: Buffer candidates if remote description not set yet
    if (!pc || pc.remoteDescription == null) {
      console.log(`🧊 Buffering ICE candidate from ${fromUserId} (remote description not set)`);

      if (!this.pendingIceCandidates.has(fromUserId)) {
        this.pendingIceCandidates.set(fromUserId, []);
      }
      this.pendingIceCandidates.get(fromUserId)!.push(iceCandidate);
      return;
    }

    // Remote description is set, add candidate immediately
    try {
      console.log(`🧊 Adding ICE candidate from ${fromUserId}`);
      await pc.addIceCandidate(iceCandidate);
    } catch (error) {
      console.warn(`⚠️ Error adding ICE candidate from ${fromUserId}:`, error);
    }
  }

  /**
   * Process buffered ICE candidates after remote description is set
   */
  private async processPendingCandidates(remoteUserId: string): Promise<void> {
    const candidates = this.pendingIceCandidates.get(remoteUserId);
    if (!candidates || candidates.length === 0) {
      console.log(`🧊 No pending candidates for ${remoteUserId}`);
      return;
    }

    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      console.warn(`⚠️ No peer connection for ${remoteUserId} when processing candidates`);
      return;
    }

    console.log(`🧊 Processing ${candidates.length} pending ICE candidates for ${remoteUserId}`);

    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.warn(`⚠️ Error adding pending candidate for ${remoteUserId}:`, error);
      }
    }

    // Clear the buffer
    this.pendingIceCandidates.set(remoteUserId, []);
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
      const offer = await pc.createOffer({ ...SESSION_CONSTRAINTS, iceRestart: true });
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
    this.pendingIceCandidates.delete(userId);
  }

  /**
   * Toggle local audio mute
   */
  toggleMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !muted;
        console.log(`🔊 Audio track enabled: ${track.enabled}`);
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
      this.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = !videoOff;
        console.log(`📹 Video track enabled: ${track.enabled}`);
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
    console.log('📞 Leaving call...');

    // Stop all unsubscribers
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Close all peer connections
    this.peerConnections.forEach((pc, oduserId) => {
      console.log(`🔌 Closing peer connection with ${oduserId}`);
      pc.close();
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.pendingIceCandidates.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        track.stop();
        console.log(`🛑 Stopped track: ${track.kind}`);
      });
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

    console.log('✅ Call cleanup complete');
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
