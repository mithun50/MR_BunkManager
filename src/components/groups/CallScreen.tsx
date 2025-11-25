import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  IconButton,
  Avatar,
  useTheme,
  Portal,
  Modal,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Try to import WebRTC (only works in development builds, not Expo Go)
let RTCView: any = null;
let webrtcService: any = null;
let isWebRTCAvailable = false;

try {
  const webrtc = require('react-native-webrtc');
  RTCView = webrtc.RTCView;
  webrtcService = require('../../services/webrtcService').default;
  isWebRTCAvailable = true;
  console.log('✅ WebRTC is available');
} catch (e) {
  console.log('⚠️ WebRTC not available (requires development build)');
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Participant {
  id: string;
  name: string;
  photoURL?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  joinedAt: Date;
}

interface CallScreenProps {
  groupId: string;
  groupName: string;
  isVideo: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserPhotoURL?: string | null;
  onEndCall: () => void;
}

export function CallScreen({
  groupId,
  groupName,
  isVideo,
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  onEndCall,
}: CallScreenProps) {
  const theme = useTheme();

  // State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, any>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!isVideo);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showEndCallModal, setShowEndCallModal] = useState(false);

  // Refs
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<Audio.Sound | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Play ringtone while connecting
  const playRingtone = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/callringtone.wav'),
        { isLooping: true, volume: 0.7 }
      );
      ringtoneRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.log('Ringtone not available:', error);
    }
  };

  // Stop ringtone
  const stopRingtone = async () => {
    try {
      if (ringtoneRef.current) {
        await ringtoneRef.current.stopAsync();
        await ringtoneRef.current.unloadAsync();
        ringtoneRef.current = null;
      }
    } catch (error) {
      console.log('Error stopping ringtone:', error);
    }
  };

  // Initialize call
  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: !isSpeakerOn,
        });

        // Play ringtone while connecting
        await playRingtone();

        if (isWebRTCAvailable && webrtcService) {
          // Use real WebRTC
          await webrtcService.joinCall(
            groupId,
            currentUserId,
            currentUserName,
            currentUserPhotoURL || undefined,
            isVideo,
            {
              onLocalStream: (stream: any) => {
                console.log('Local stream received');
                setLocalStream(stream);
                stopRingtone();
                setIsConnecting(false);
                startCallTimer();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              },
              onRemoteStream: (userId: string, stream: any) => {
                console.log('Remote stream received from:', userId);
                setRemoteStreams((prev) => new Map(prev).set(userId, stream));
              },
              onParticipantJoined: (participant: Participant) => {
                console.log('Participant joined:', participant.name);
                setParticipants((prev) => {
                  if (prev.some(p => p.id === participant.id)) return prev;
                  return [...prev, participant];
                });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              },
              onParticipantLeft: (userId: string) => {
                console.log('Participant left:', userId);
                setParticipants((prev) => prev.filter((p) => p.id !== userId));
                setRemoteStreams((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(userId);
                  return newMap;
                });
              },
              onParticipantUpdated: (participant: Participant) => {
                setParticipants((prev) =>
                  prev.map((p) => (p.id === participant.id ? participant : p))
                );
              },
              onConnectionStateChange: (state: string) => {
                console.log('Connection state:', state);
              },
              onError: (error: Error) => {
                console.error('WebRTC error:', error);
                stopRingtone();
              },
            }
          );
        } else {
          // Fallback: Simulation mode (for Expo Go)
          await initializeSimulationMode();
        }

        // Add self to participants list
        setParticipants([{
          id: currentUserId,
          name: currentUserName,
          photoURL: currentUserPhotoURL || undefined,
          isMuted: false,
          isVideoOff: !isVideo,
          joinedAt: new Date(),
        }]);

      } catch (error: any) {
        console.error('Error initializing call:', error);
        stopRingtone();
        Alert.alert('Connection Error', 'Failed to connect to call. Please try again.', [
          { text: 'OK', onPress: onEndCall }
        ]);
      }
    };

    initializeCall();

    return () => {
      cleanup();
    };
  }, [groupId, currentUserId, isVideo]);

  // Simulation mode for Expo Go (no real audio/video, just presence)
  const initializeSimulationMode = async () => {
    try {
      // Add self to Firebase call room
      const participantRef = doc(db, 'groups', groupId, 'calls', 'active', 'participants', currentUserId);
      await setDoc(participantRef, {
        id: currentUserId,
        name: currentUserName,
        photoURL: currentUserPhotoURL || null,
        isMuted: false,
        isVideoOff: !isVideo,
        joinedAt: serverTimestamp(),
      });

      // Subscribe to participants
      const participantsRef = collection(db, 'groups', groupId, 'calls', 'active', 'participants');
      const participantsQuery = query(participantsRef, orderBy('joinedAt', 'asc'));

      unsubscribeRef.current = onSnapshot(participantsQuery, (snapshot) => {
        const participantsList: Participant[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          participantsList.push({
            id: doc.id,
            name: data.name,
            photoURL: data.photoURL,
            isMuted: data.isMuted,
            isVideoOff: data.isVideoOff,
            joinedAt: data.joinedAt?.toDate() || new Date(),
          });
        });
        setParticipants(participantsList);

        if (participantsList.length > 0) {
          stopRingtone();
          setIsConnecting(false);
        }
      });

      // Start call timer
      startCallTimer();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      console.error('Error in simulation mode:', error);
      throw error;
    }
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const cleanup = async () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    stopRingtone();

    if (isWebRTCAvailable && webrtcService) {
      await webrtcService.leaveCall();
    } else {
      // Cleanup simulation mode
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      const participantRef = doc(db, 'groups', groupId, 'calls', 'active', 'participants', currentUserId);
      await deleteDoc(participantRef).catch(console.error);
    }
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle mute
  const toggleMute = async () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isWebRTCAvailable && webrtcService) {
      webrtcService.toggleMute(newMuteState);
    } else {
      // Update in Firestore for simulation mode
      const participantRef = doc(db, 'groups', groupId, 'calls', 'active', 'participants', currentUserId);
      await setDoc(participantRef, { isMuted: newMuteState }, { merge: true });
    }

    setParticipants((prev) =>
      prev.map((p) => (p.id === currentUserId ? { ...p, isMuted: newMuteState } : p))
    );
  };

  // Toggle video
  const toggleVideo = async () => {
    const newVideoState = !isVideoOff;
    setIsVideoOff(newVideoState);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isWebRTCAvailable && webrtcService) {
      webrtcService.toggleVideo(newVideoState);
    } else {
      // Update in Firestore for simulation mode
      const participantRef = doc(db, 'groups', groupId, 'calls', 'active', 'participants', currentUserId);
      await setDoc(participantRef, { isVideoOff: newVideoState }, { merge: true });
    }

    setParticipants((prev) =>
      prev.map((p) => (p.id === currentUserId ? { ...p, isVideoOff: newVideoState } : p))
    );
  };

  // Switch camera
  const switchCamera = async () => {
    if (isWebRTCAvailable && webrtcService) {
      await webrtcService.switchCamera();
    }
    setIsFrontCamera(!isFrontCamera);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Toggle speaker
  const toggleSpeaker = async () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await Audio.setAudioModeAsync({
      playThroughEarpieceAndroid: !newSpeakerState,
    });
  };

  // End call
  const handleEndCall = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowEndCallModal(true);
  };

  const confirmEndCall = async () => {
    setShowEndCallModal(false);
    await cleanup();
    onEndCall();
  };

  // Render participant view
  const renderParticipant = (participant: Participant) => {
    const isCurrentUser = participant.id === currentUserId;
    const stream = isCurrentUser ? localStream : remoteStreams.get(participant.id);
    const hasVideo = isWebRTCAvailable && stream && !participant.isVideoOff;

    if (hasVideo && RTCView) {
      return (
        <View style={styles.videoContainer} key={participant.id}>
          <RTCView
            streamURL={stream.toURL()}
            style={styles.videoStream}
            objectFit="cover"
            mirror={isCurrentUser && isFrontCamera}
          />
          <View style={styles.videoOverlay}>
            <Text style={styles.videoName}>
              {isCurrentUser ? 'You' : participant.name}
            </Text>
            {participant.isMuted && (
              <View style={[styles.muteBadge, { backgroundColor: theme.colors.error }]}>
                <MaterialCommunityIcons name="microphone-off" size={12} color="#fff" />
              </View>
            )}
          </View>
        </View>
      );
    }

    // No video or simulation mode - show avatar
    const size = participants.length <= 2 ? 100 : participants.length <= 4 ? 80 : 60;

    return (
      <View style={styles.avatarContainer} key={participant.id}>
        {participant.photoURL ? (
          <Avatar.Image size={size} source={{ uri: participant.photoURL }} />
        ) : (
          <Avatar.Text
            size={size}
            label={participant.name.charAt(0)}
            style={{ backgroundColor: theme.colors.primaryContainer }}
          />
        )}
        <Text style={styles.avatarName}>
          {isCurrentUser ? 'You' : participant.name}
        </Text>
        {participant.isMuted && (
          <View style={[styles.muteBadgeAvatar, { backgroundColor: theme.colors.error }]}>
            <MaterialCommunityIcons name="microphone-off" size={12} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1a1a2e' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="titleLarge" style={styles.groupName}>
            {groupName}
          </Text>
          <View style={styles.callInfo}>
            <MaterialCommunityIcons
              name={isVideo ? 'video' : 'phone'}
              size={16}
              color="rgba(255,255,255,0.7)"
            />
            <Text variant="bodySmall" style={styles.callDuration}>
              {isConnecting ? 'Connecting...' : formatDuration(callDuration)}
            </Text>
            {!isWebRTCAvailable && !isConnecting && (
              <Text variant="labelSmall" style={styles.simulationBadge}>
                SIMULATION
              </Text>
            )}
          </View>
        </View>
        <View style={styles.participantCount}>
          <MaterialCommunityIcons name="account-multiple" size={16} color="#fff" />
          <Text variant="labelMedium" style={{ color: '#fff', marginLeft: 4 }}>
            {participants.length}
          </Text>
        </View>
      </View>

      {/* Participants Grid */}
      {isConnecting ? (
        <View style={styles.connectingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text variant="titleMedium" style={styles.connectingText}>
            Connecting to call...
          </Text>
          {!isWebRTCAvailable && (
            <Text variant="bodySmall" style={styles.simulationNote}>
              Running in simulation mode (Expo Go)
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.participantsGrid}>
          {participants.map(renderParticipant)}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlsRow}>
          {/* Mute Button */}
          <IconButton
            icon={isMuted ? 'microphone-off' : 'microphone'}
            mode="contained"
            size={28}
            onPress={toggleMute}
            containerColor={isMuted ? theme.colors.error : 'rgba(255,255,255,0.2)'}
            iconColor="#fff"
            style={styles.controlButton}
          />

          {/* Video Toggle (if video call) */}
          {isVideo && (
            <IconButton
              icon={isVideoOff ? 'video-off' : 'video'}
              mode="contained"
              size={28}
              onPress={toggleVideo}
              containerColor={isVideoOff ? theme.colors.error : 'rgba(255,255,255,0.2)'}
              iconColor="#fff"
              style={styles.controlButton}
            />
          )}

          {/* Switch Camera (if video call and video is on and WebRTC available) */}
          {isVideo && !isVideoOff && isWebRTCAvailable && (
            <IconButton
              icon="camera-flip"
              mode="contained"
              size={28}
              onPress={switchCamera}
              containerColor="rgba(255,255,255,0.2)"
              iconColor="#fff"
              style={styles.controlButton}
            />
          )}

          {/* Speaker Toggle */}
          <IconButton
            icon={isSpeakerOn ? 'volume-high' : 'volume-off'}
            mode="contained"
            size={28}
            onPress={toggleSpeaker}
            containerColor={isSpeakerOn ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}
            iconColor="#fff"
            style={styles.controlButton}
          />

          {/* End Call Button */}
          <IconButton
            icon="phone-hangup"
            mode="contained"
            size={32}
            onPress={handleEndCall}
            containerColor={theme.colors.error}
            iconColor="#fff"
            style={[styles.controlButton, styles.endCallButton]}
          />
        </View>
      </View>

      {/* End Call Confirmation Modal */}
      <Portal>
        <Modal
          visible={showEndCallModal}
          onDismiss={() => setShowEndCallModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <MaterialCommunityIcons
            name="phone-hangup"
            size={48}
            color={theme.colors.error}
            style={{ alignSelf: 'center', marginBottom: 16 }}
          />
          <Text variant="titleLarge" style={styles.modalTitle}>
            End Call?
          </Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Are you sure you want to leave this call?
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowEndCallModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmEndCall}
              buttonColor={theme.colors.error}
              style={styles.modalButton}
            >
              End Call
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
  },
  groupName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  callDuration: {
    color: 'rgba(255,255,255,0.7)',
  },
  simulationBadge: {
    color: '#ffa500',
    backgroundColor: 'rgba(255,165,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  participantCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingText: {
    color: '#fff',
    marginTop: 16,
  },
  simulationNote: {
    color: '#ffa500',
    marginTop: 8,
  },
  participantsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  videoContainer: {
    flex: 1,
    minWidth: SCREEN_WIDTH / 2 - 24,
    minHeight: SCREEN_HEIGHT / 3 - 32,
    maxHeight: SCREEN_HEIGHT / 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoStream: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 8,
    minWidth: SCREEN_WIDTH / 3 - 24,
  },
  avatarName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  muteBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBadgeAvatar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  controls: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    borderRadius: 50,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  modal: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
