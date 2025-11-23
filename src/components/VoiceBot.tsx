/**
 * VoiceBot Component - Voice-based AI Chat
 * Full voice conversation with AI using STT and TTS
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Text, IconButton, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { sendMessage, AttendanceContext } from '@/src/services/chatService';

// Optional speech recognition (requires development build)
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => {};
try {
  const speechModule = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
} catch (e) {
  console.log('Speech recognition not available');
}

interface VoiceBotProps {
  attendanceContext: AttendanceContext | null;
  onClose: () => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export default function VoiceBot({ attendanceContext, onClose }: VoiceBotProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  // Refs to prevent duplicate processing
  const isProcessingRef = useRef(false);
  const lastProcessedTextRef = useRef('');

  // Animation for the mic button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for listening state
  useEffect(() => {
    if (state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  // Wave animation for speaking state
  useEffect(() => {
    if (state === 'speaking') {
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      waveAnim.setValue(0);
    }
  }, [state]);

  // Speech recognition handlers
  useSpeechRecognitionEvent('start', () => {
    setState('listening');
    setTranscript('');
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
    if (state === 'listening') {
      setState('idle');
    }
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const text = event.results?.[0]?.transcript || '';
    setTranscript(text);

    // If final result, process it (with duplicate prevention)
    if (event.isFinal && text) {
      const normalizedText = text.trim().toLowerCase();

      // Skip if already processing or same text as last processed
      if (isProcessingRef.current) {
        console.log('Skipping - already processing');
        return;
      }
      if (normalizedText === lastProcessedTextRef.current) {
        console.log('Skipping - duplicate text');
        return;
      }

      // Mark as processing and store the text
      isProcessingRef.current = true;
      lastProcessedTextRef.current = normalizedText;

      processUserInput(text);
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    console.log('Speech error:', event.error);
    setState('idle');
    setError('Could not understand. Please try again.');
  });

  const processUserInput = async (text: string) => {
    setState('processing');

    try {
      // Add user message to history
      const newHistory = [...conversationHistory, { role: 'user' as const, content: text }];
      setConversationHistory(newHistory);

      // Get AI response
      const aiResponse = await sendMessage(
        text,
        newHistory.slice(-10), // Keep last 10 messages for context
        attendanceContext
      );

      // Add AI response to history
      setConversationHistory([...newHistory, { role: 'assistant' as const, content: aiResponse }]);
      setResponse(aiResponse);

      // Speak the response
      speakResponse(aiResponse);
    } catch (err: any) {
      setState('idle');
      setError('Failed to get response. Please try again.');
      console.error('Voice bot error:', err);
    } finally {
      // Reset processing flag after a short delay to prevent rapid re-triggers
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const speakResponse = (text: string) => {
    setState('speaking');

    // Clean the text for speech (remove markdown)
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/`([^`]+)`/g, '$1') // code
      .replace(/#{1,6}\s*/g, '') // headings
      .replace(/[-*+]\s+/g, '') // list items
      .replace(/\n+/g, '. '); // newlines to pauses

    Speech.speak(cleanText, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setState('idle'),
      onError: () => {
        setState('idle');
        setError('Could not play audio response');
      },
    });
  };

  const startListening = async () => {
    if (!ExpoSpeechRecognitionModule) {
      setError('Voice input requires a development build');
      return;
    }

    // Stop any ongoing speech
    Speech.stop();

    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      setError('Microphone permission required');
      return;
    }

    // Reset for new listening session
    setError(null);
    lastProcessedTextRef.current = '';
    isProcessingRef.current = false;

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
    });
  };

  const stopListening = () => {
    if (ExpoSpeechRecognitionModule) {
      ExpoSpeechRecognitionModule.stop();
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setState('idle');
  };

  const handleMicPress = () => {
    switch (state) {
      case 'idle':
        startListening();
        break;
      case 'listening':
        stopListening();
        break;
      case 'speaking':
        stopSpeaking();
        break;
      // Don't do anything while processing
    }
  };

  const getStateText = () => {
    switch (state) {
      case 'idle':
        return 'Tap to speak';
      case 'listening':
        return transcript || 'Listening...';
      case 'processing':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
    }
  };

  const getMicIcon = () => {
    switch (state) {
      case 'idle':
        return 'microphone';
      case 'listening':
        return 'microphone';
      case 'processing':
        return 'loading';
      case 'speaking':
        return 'volume-high';
    }
  };

  const getMicColor = () => {
    switch (state) {
      case 'idle':
        return theme.colors.primary;
      case 'listening':
        return theme.colors.error;
      case 'processing':
        return theme.colors.secondary;
      case 'speaking':
        return theme.colors.tertiary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.colors.primaryContainer }]}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="robot-happy" size={28} color={theme.colors.primary} />
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onPrimaryContainer }]}>
            Voice Chat
          </Text>
        </View>
        <IconButton
          icon="close"
          size={24}
          onPress={onClose}
          iconColor={theme.colors.onPrimaryContainer}
        />
      </Surface>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Response Display */}
        {response && (
          <Surface style={[styles.responseCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {response.length > 200 ? response.substring(0, 200) + '...' : response}
            </Text>
          </Surface>
        )}

        {/* State Text */}
        <Text
          variant="titleMedium"
          style={[styles.stateText, { color: theme.colors.onBackground }]}
        >
          {getStateText()}
        </Text>

        {/* Error Display */}
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        {/* Mic Button */}
        <View style={styles.micContainer}>
          {/* Pulse Ring */}
          {state === 'listening' && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  backgroundColor: theme.colors.error,
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.3, 0],
                  }),
                },
              ]}
            />
          )}

          <Animated.View style={{ transform: [{ scale: state === 'listening' ? pulseAnim : 1 }] }}>
            <IconButton
              icon={getMicIcon()}
              size={64}
              onPress={handleMicPress}
              disabled={state === 'processing'}
              style={[styles.micButton, { backgroundColor: getMicColor() }]}
              iconColor="#fff"
            />
          </Animated.View>
        </View>

        {/* Instructions */}
        <Text
          variant="bodySmall"
          style={[styles.instructions, { color: theme.colors.outline }]}
        >
          {state === 'speaking' ? 'Tap to stop' : state === 'listening' ? 'Tap to stop listening' : 'Have a voice conversation with BunkBot'}
        </Text>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text variant="labelMedium" style={{ color: theme.colors.outline, marginBottom: 8 }}>
              Recent conversation
            </Text>
            {conversationHistory.slice(-4).map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.historyItem,
                  { backgroundColor: msg.role === 'user' ? theme.colors.primaryContainer : theme.colors.surfaceVariant }
                ]}
              >
                <MaterialCommunityIcons
                  name={msg.role === 'user' ? 'account' : 'robot'}
                  size={16}
                  color={msg.role === 'user' ? theme.colors.primary : theme.colors.secondary}
                />
                <Text
                  variant="bodySmall"
                  style={{ marginLeft: 8, flex: 1, color: theme.colors.onSurface }}
                  numberOfLines={2}
                >
                  {msg.content}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  responseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    maxWidth: '100%',
  },
  stateText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 24,
  },
  historyContainer: {
    width: '100%',
    marginTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
});
