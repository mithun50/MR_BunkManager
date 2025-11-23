/**
 * ChatBot Component - BunkBot AI Assistant
 * Attendance helper and study assistant with image support
 * Supports multiple conversations with persistence
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Keyboard,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import {
  Text,
  TextInput,
  IconButton,
  useTheme,
  Chip,
  ActivityIndicator,
  Surface,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MarkdownRenderer from './MarkdownRenderer';
import VoiceBot from './VoiceBot';

// Optional speech recognition (requires development build)
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => {};
try {
  const speechModule = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
} catch (e) {
  console.log('Speech recognition not available (requires development build)');
}
import { sendMessage, quickPrompts, ChatMessage as APIChatMessage, AttendanceContext } from '@/src/services/chatService';
import chatStorageService, { Chat, ChatMessage } from '@/src/services/chatStorageService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface ChatBotProps {
  attendanceContext: AttendanceContext | null;
  onClose?: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm BunkBot, your attendance assistant. Ask me about your attendance, study tips, or upload an image for help!",
  timestamp: new Date(),
};

export default function ChatBot({ attendanceContext, onClose }: ChatBotProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Chat state
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechAvailable] = useState(!!ExpoSpeechRecognitionModule);
  const [voiceBotVisible, setVoiceBotVisible] = useState(false);

  // Speech recognition event handlers (only if available)
  useSpeechRecognitionEvent('start', () => setIsRecording(true));
  useSpeechRecognitionEvent('end', () => setIsRecording(false));
  useSpeechRecognitionEvent('result', (event: any) => {
    const transcript = event.results?.[0]?.transcript || '';
    if (transcript) {
      setInputText(prev => prev + (prev ? ' ' : '') + transcript);
    }
  });
  useSpeechRecognitionEvent('error', (event: any) => {
    console.log('Speech recognition error:', event.error);
    setIsRecording(false);
    setError('Voice recognition failed. Please try again.');
  });

  // Start/stop speech recognition
  const toggleRecording = async () => {
    if (!ExpoSpeechRecognitionModule) {
      setError('Voice input requires a development build');
      return;
    }

    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
    } else {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setError('Microphone permission is required for voice input');
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
      });
    }
  };

  // Markdown colors for AI responses
  const markdownColors = useMemo(() => ({
    textColor: theme.colors.onSurfaceVariant,
    codeBackground: theme.colors.surfaceDisabled,
    codeColor: theme.colors.primary,
    linkColor: theme.colors.primary,
    borderColor: theme.colors.outline,
  }), [theme]);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (currentChatId && messages.length > 1) {
      chatStorageService.updateChatMessages(currentChatId, messages);
    }
  }, [messages, currentChatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const loadChats = async () => {
    const savedChats = await chatStorageService.getAllChats();
    setChats(savedChats);

    const activeChatId = await chatStorageService.getActiveChatId();
    if (activeChatId && savedChats.find(c => c.id === activeChatId)) {
      await switchToChat(activeChatId, savedChats);
    } else if (savedChats.length > 0) {
      await switchToChat(savedChats[0].id, savedChats);
    }
  };

  const switchToChat = async (chatId: string, chatList?: Chat[]) => {
    const list = chatList || chats;
    const chat = list.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages.length > 0 ? chat.messages : [WELCOME_MESSAGE]);
      await chatStorageService.setActiveChatId(chatId);
    }
    closeDrawer();
  };

  const createNewChat = async () => {
    const newChat = await chatStorageService.createChat();
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([WELCOME_MESSAGE]);
    closeDrawer();
  };

  const deleteChat = async (chatId: string) => {
    await chatStorageService.deleteChat(chatId);
    const updatedChats = chats.filter(c => c.id !== chatId);
    setChats(updatedChats);

    if (chatId === currentChatId) {
      if (updatedChats.length > 0) {
        await switchToChat(updatedChats[0].id, updatedChats);
      } else {
        await createNewChat();
      }
    }
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeDrawer = () => {
    Animated.spring(drawerAnim, {
      toValue: -DRAWER_WIDTH,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => setDrawerOpen(false));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permission to access gallery is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setSelectedImage(base64);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Permission to access camera is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setSelectedImage(base64);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText && !selectedImage) return;

    // Create new chat if none exists
    if (!currentChatId) {
      const newChat = await chatStorageService.createChat();
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    }

    Keyboard?.dismiss?.();
    setError(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText || 'Analyze this image',
      image: selectedImage || undefined,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Build conversation history (exclude welcome, limit to recent)
      const history: APIChatMessage[] = newMessages
        .filter(m => m.id !== 'welcome')
        .slice(-20) // Keep last 20 messages for context
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const response = await sendMessage(
        messageText || 'Please analyze this image and help me.',
        history,
        attendanceContext,
        imageToSend || undefined
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const clearCurrentChat = async () => {
    if (currentChatId) {
      setMessages([WELCOME_MESSAGE]);
      await chatStorageService.updateChatMessages(currentChatId, [WELCOME_MESSAGE]);
    }
  };

  const getCurrentChatTitle = () => {
    const chat = chats.find(c => c.id === currentChatId);
    return chat?.title || 'New Chat';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Main Chat Area */}
      <View style={[styles.mainContent, { paddingTop: insets.top }]}>
        {/* Header */}
        <Surface style={[styles.chatHeader, { backgroundColor: theme.colors.primaryContainer }]}>
          <View style={styles.headerLeft}>
            <IconButton
              icon="menu"
              size={24}
              onPress={openDrawer}
              iconColor={theme.colors.onPrimaryContainer}
            />
            <MaterialCommunityIcons name="robot-happy" size={24} color={theme.colors.primary} />
            <Text
              variant="titleMedium"
              style={{ fontWeight: 'bold', marginLeft: 8, color: theme.colors.onPrimaryContainer, flex: 1 }}
              numberOfLines={1}
            >
              {getCurrentChatTitle()}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon="microphone-message"
              size={22}
              onPress={() => setVoiceBotVisible(true)}
              iconColor={theme.colors.onPrimaryContainer}
            />
            <IconButton
              icon="plus"
              size={22}
              onPress={createNewChat}
              iconColor={theme.colors.onPrimaryContainer}
            />
            <IconButton
              icon="broom"
              size={22}
              onPress={clearCurrentChat}
              iconColor={theme.colors.onPrimaryContainer}
            />
            {onClose && (
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                iconColor={theme.colors.onPrimaryContainer}
              />
            )}
          </View>
        </Surface>

        {/* Messages */}
        <KeyboardAwareScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bottomOffset={120}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                {
                  backgroundColor: msg.role === 'user'
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                }
              ]}
            >
              {msg.image && (
                <Image
                  source={{ uri: msg.image }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              )}
              {msg.role === 'user' ? (
                <Text
                  style={[
                    styles.messageText,
                    { color: theme.colors.onPrimary }
                  ]}
                >
                  {msg.content}
                </Text>
              ) : (
                <MarkdownRenderer
                  content={msg.content}
                  {...markdownColors}
                />
              )}
            </View>
          ))}
          {isLoading && (
            <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>Thinking...</Text>
            </View>
          )}
        </KeyboardAwareScrollView>

        {/* Bottom Section */}
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.quickPrompts, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.quickPromptsContent}
            keyboardShouldPersistTaps="handled"
          >
            {quickPrompts.map((item, index) => (
              <Chip
                key={index}
                onPress={() => handleQuickPrompt(item.prompt)}
                style={styles.promptChip}
                textStyle={{ fontSize: 12 }}
                disabled={isLoading}
              >
                {item.label}
              </Chip>
            ))}
          </ScrollView>

          {selectedImage && (
            <View style={[styles.imagePreview, { backgroundColor: theme.colors.background }]}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <IconButton
                icon="close"
                size={16}
                onPress={() => setSelectedImage(null)}
                style={styles.removeImage}
                iconColor="#fff"
              />
            </View>
          )}

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom }]}>
            <IconButton icon="camera" size={22} onPress={takePhoto} disabled={isLoading || isRecording} />
            <IconButton icon="image" size={22} onPress={pickImage} disabled={isLoading || isRecording} />
            <IconButton
              icon={isRecording ? "microphone" : "microphone-outline"}
              size={22}
              onPress={toggleRecording}
              disabled={isLoading}
              iconColor={isRecording ? theme.colors.error : theme.colors.onSurface}
              style={isRecording ? styles.recordingButton : undefined}
            />
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={isRecording ? "Listening..." : "Ask BunkBot..."}
              style={styles.textInput}
              mode="outlined"
              dense
              disabled={isLoading || isRecording}
              onSubmitEditing={() => handleSend()}
            />
            <IconButton
              icon="send"
              size={22}
              onPress={() => handleSend()}
              disabled={isLoading || isRecording || (!inputText.trim() && !selectedImage)}
              iconColor={theme.colors.primary}
            />
          </View>
        </KeyboardStickyView>
      </View>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeDrawer}
        />
      )}

      {/* Chat History Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.colors.surface,
            transform: [{ translateX: drawerAnim }],
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.drawerHeader}>
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
            Chat History
          </Text>
          <IconButton
            icon="plus-circle"
            size={28}
            onPress={createNewChat}
            iconColor={theme.colors.primary}
          />
        </View>
        <Divider />

        <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
          {chats.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={theme.colors.outline} />
              <Text style={{ color: theme.colors.outline, marginTop: 8 }}>No chats yet</Text>
            </View>
          ) : (
            chats.map((chat) => (
              <View
                key={chat.id}
                style={[
                  styles.chatItem,
                  chat.id === currentChatId && { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <TouchableOpacity
                  style={styles.chatItemContent}
                  onPress={() => switchToChat(chat.id)}
                >
                  <MaterialCommunityIcons
                    name="chat"
                    size={20}
                    color={chat.id === currentChatId ? theme.colors.primary : theme.colors.outline}
                  />
                  <View style={styles.chatItemText}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.chatTitle,
                        { color: chat.id === currentChatId ? theme.colors.onPrimaryContainer : theme.colors.onSurface },
                      ]}
                    >
                      {chat.title}
                    </Text>
                    <Text style={[styles.chatDate, { color: theme.colors.outline }]}>
                      {formatDate(chat.updatedAt)} • {chat.messages.length} messages
                    </Text>
                  </View>
                </TouchableOpacity>
                <IconButton
                  icon="delete-outline"
                  size={20}
                  onPress={() => deleteChat(chat.id)}
                  iconColor={theme.colors.error}
                />
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>

      {/* Voice Bot Modal */}
      <Modal
        visible={voiceBotVisible}
        onRequestClose={() => setVoiceBotVisible(false)}
        animationType="slide"
        statusBarTranslucent
      >
        <VoiceBot
          attendanceContext={attendanceContext}
          onClose={() => setVoiceBotVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingVertical: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  messagesContainer: {
    flex: 1,
    minHeight: 200,
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    flexDirection: 'column',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  quickPrompts: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  quickPromptsContent: {
    padding: 8,
    gap: 8,
  },
  promptChip: {
    marginRight: 8,
  },
  imagePreview: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImage: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    marginLeft: -20,
    marginTop: -40,
  },
  errorText: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
  },
  recordingButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 20,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingRight: 8,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  chatItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatItemText: {
    marginLeft: 12,
    flex: 1,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  chatDate: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
