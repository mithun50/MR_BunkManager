import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  Avatar,
  useTheme,
  Appbar,
  Menu,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Unsubscribe } from 'firebase/firestore';
import { Group, GroupMessage, GroupMember } from '../../types/groups';
import { MessageBubble } from './MessageBubble';
import groupsService from '../../services/groupsService';
import fileUploadService from '../../services/fileUploadService';

interface GroupChatScreenProps {
  group: Group;
  currentUserId: string;
  currentUserName: string;
  currentUserPhotoURL?: string | null;
  onClose: () => void;
  onViewMembers: () => void;
  onAddMembers: () => void;
  onLeaveGroup: () => void;
  onDeleteGroup?: () => void;
  onUserPress?: (userId: string) => void;
}

export function GroupChatScreen({
  group,
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  onClose,
  onViewMembers,
  onAddMembers,
  onLeaveGroup,
  onDeleteGroup,
  onUserPress,
}: GroupChatScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member' | null>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const setupSubscription = async () => {
      setIsLoading(true);

      // Load user role
      try {
        const members = await groupsService.getGroupMembers(group.id);
        const currentMember = members.find(m => m.userId === currentUserId);
        setCurrentUserRole(currentMember?.role || null);
      } catch (error) {
        console.error('Error loading user role:', error);
      }

      // Subscribe to messages
      unsubscribe = groupsService.subscribeToMessages(
        group.id,
        (updatedMessages) => {
          setMessages(updatedMessages);
          setIsLoading(false);
        },
        100
      );
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [group.id, currentUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || isSending) return;

    setIsSending(true);
    setNewMessage('');

    try {
      await groupsService.sendMessage(
        group.id,
        currentUserId,
        currentUserName,
        currentUserPhotoURL || undefined,
        trimmedMessage
      );

      // Send notification to group members (non-blocking)
      groupsService.notifyGroupMembers(
        group.id,
        group.name,
        currentUserId,
        currentUserName,
        'message',
        { message: trimmedMessage }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(trimmedMessage); // Restore message on error
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      const file = await fileUploadService.pickDocument();
      if (!file) return;

      setIsSending(true);

      const fileUrl = await fileUploadService.uploadFile(file.uri, file.name, file.mimeType);

      await groupsService.sendMessage(
        group.id,
        currentUserId,
        currentUserName,
        currentUserPhotoURL || undefined,
        '',
        fileUrl,
        file.name,
        file.mimeType
      );

      // Send notification to group members (non-blocking)
      groupsService.notifyGroupMembers(
        group.id,
        group.name,
        currentUserId,
        currentUserName,
        'file',
        { fileName: file.name }
      );

      setMenuVisible(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await groupsService.deleteMessage(group.id, messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message.');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return 'book-open-variant';
      case 'project': return 'briefcase';
      case 'social': return 'account-group';
      default: return 'forum';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return theme.colors.primary;
      case 'project': return theme.colors.tertiary;
      case 'social': return theme.colors.secondary;
      default: return theme.colors.outline;
    }
  };

  const renderMessage = useCallback((item: GroupMessage) => (
    <MessageBubble
      key={item.id}
      message={item}
      isCurrentUser={item.userId === currentUserId}
      currentUserPhotoURL={currentUserPhotoURL}
      currentUserName={currentUserName}
      onUserPress={onUserPress}
      onDelete={() => handleDeleteMessage(item.id)}
    />
  ), [currentUserId, currentUserPhotoURL, currentUserName, onUserPress]);

  const renderEmptyMessages = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons
          name="message-text-outline"
          size={48}
          color={theme.colors.primary}
        />
      </View>
      <Text variant="titleMedium" style={{ fontWeight: '600', marginTop: 16 }}>
        No messages yet
      </Text>
      <Text variant="bodySmall" style={{ opacity: 0.6, textAlign: 'center', marginTop: 4 }}>
        Be the first to start the conversation!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={onClose} />
        <Pressable style={styles.headerContent} onPress={onViewMembers}>
          <Avatar.Icon
            size={40}
            icon={getCategoryIcon(group.category)}
            style={{ backgroundColor: getCategoryColor(group.category) + '20' }}
            color={getCategoryColor(group.category)}
          />
          <View style={styles.headerText}>
            <Text variant="titleMedium" numberOfLines={1} style={{ fontWeight: '600' }}>
              {group.name}
            </Text>
            <Text variant="bodySmall" style={{ opacity: 0.7 }}>
              {group.memberCount} members
            </Text>
          </View>
        </Pressable>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onViewMembers();
            }}
            leadingIcon="account-multiple"
            title="View Members"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onAddMembers();
            }}
            leadingIcon="account-plus"
            title="Add Members"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleFileUpload();
            }}
            leadingIcon="file-upload"
            title="Share File"
          />
          <Divider />
          {currentUserRole === 'admin' && onDeleteGroup && (
            <>
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  onDeleteGroup();
                }}
                leadingIcon="delete"
                title="Delete Group"
                titleStyle={{ color: theme.colors.error }}
              />
              <Divider />
            </>
          )}
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onLeaveGroup();
            }}
            leadingIcon="exit-to-app"
            title="Leave Group"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      </Appbar.Header>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <KeyboardAwareScrollView
            ref={scrollViewRef}
            style={styles.messagesScrollView}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyList,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bottomOffset={60}
          >
            {messages.length === 0 ? (
              renderEmptyMessages()
            ) : (
              messages.map(renderMessage)
            )}
          </KeyboardAwareScrollView>
        )}

        {/* Message Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          <IconButton
            icon="paperclip"
            size={24}
            onPress={handleFileUpload}
            iconColor={theme.colors.primary}
            disabled={isSending}
          />
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            mode="flat"
            style={styles.input}
            multiline
            maxLength={1000}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            disabled={isSending}
            onSubmitEditing={handleSendMessage}
          />
          <IconButton
            icon="send"
            mode="contained"
            size={24}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            loading={isSending}
            containerColor={newMessage.trim() ? theme.colors.primary : theme.colors.surfaceVariant}
            iconColor={newMessage.trim() ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 4,
  },
  headerText: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: 'transparent',
  },
});
