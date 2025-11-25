import React from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, Linking, Alert, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GroupMessage } from '../../types/groups';

interface MessageBubbleProps {
  message: GroupMessage;
  isCurrentUser: boolean;
  currentUserPhotoURL?: string | null;
  currentUserName?: string;
  onUserPress?: (userId: string) => void;
  onDelete?: () => void;
  onFileOpen?: (url: string) => void;
}

export function MessageBubble({
  message,
  isCurrentUser,
  currentUserPhotoURL,
  currentUserName,
  onUserPress,
  onDelete,
  onFileOpen,
}: MessageBubbleProps) {
  const theme = useTheme();
  const isDark = theme.dark;

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (mimeType: string = '') => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'file-pdf-box';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word-box';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'file-excel-box';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-powerpoint-box';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'folder-zip';
    if (mimeType.includes('video')) return 'file-video';
    if (mimeType.includes('audio')) return 'file-music';
    return 'file';
  };

  const handleLongPress = () => {
    if (isCurrentUser && onDelete) {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]
      );
    }
  };

  const handleFilePress = () => {
    if (message.fileUrl) {
      if (onFileOpen) {
        onFileOpen(message.fileUrl);
      } else {
        Linking.openURL(message.fileUrl).catch(err => {
          console.error('Failed to open file:', err);
          Alert.alert('Error', 'Failed to open file. Please try again.');
        });
      }
    }
  };

  // Get avatar URL - prioritize actual photo
  const getAvatarUrl = () => {
    if (isCurrentUser) {
      return currentUserPhotoURL || null;
    }
    return message.userPhotoURL || null;
  };

  const avatarUrl = getAvatarUrl();

  // Render avatar with profile image priority
  const renderAvatar = () => {
    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
      );
    }

    // Fallback to initials only if no photo
    const initial = isCurrentUser
      ? (currentUserName?.charAt(0) || 'U')
      : (message.userName?.charAt(0) || 'U');

    return (
      <View style={[
        styles.avatarFallback,
        { backgroundColor: isCurrentUser ? theme.colors.primary : theme.colors.secondary }
      ]}>
        <Text style={styles.avatarText}>{initial.toUpperCase()}</Text>
      </View>
    );
  };

  // Colors based on theme and sender
  const bubbleColor = isCurrentUser
    ? (isDark ? '#1E88E5' : '#0084FF')
    : (isDark ? '#2C2C2E' : '#E8E8E8');

  const textColor = isCurrentUser
    ? '#FFFFFF'
    : (isDark ? '#FFFFFF' : '#000000');

  const secondaryTextColor = isCurrentUser
    ? 'rgba(255,255,255,0.7)'
    : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)');

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.containerRight : styles.containerLeft
    ]}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {renderAvatar()}
      </View>

      {/* Message Bubble */}
      <Pressable
        onLongPress={handleLongPress}
        style={[
          styles.bubble,
          isCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
          { backgroundColor: bubbleColor }
        ]}
      >
        {/* Sender name (only for others) */}
        {!isCurrentUser && (
          <Pressable onPress={() => onUserPress?.(message.userId)}>
            <Text style={[styles.sender, { color: isDark ? '#64B5F6' : '#0066CC' }]}>
              {message.userName}
            </Text>
          </Pressable>
        )}

        {/* Message text */}
        {message.message && message.message.trim() !== '' && (
          <Text style={[styles.text, { color: textColor }]}>
            {message.message}
          </Text>
        )}

        {/* File attachment - compact WhatsApp style */}
        {message.fileUrl && (
          <TouchableOpacity
            style={[
              styles.fileAttachment,
              {
                backgroundColor: isCurrentUser
                  ? 'rgba(255,255,255,0.15)'
                  : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
              }
            ]}
            onPress={handleFilePress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={getFileIcon(message.fileType)}
              size={20}
              color={textColor}
            />
            <Text
              style={[styles.fileName, { color: textColor }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {message.fileName}
            </Text>
            <MaterialCommunityIcons
              name="download"
              size={18}
              color={secondaryTextColor}
            />
          </TouchableOpacity>
        )}

        {/* Timestamp */}
        <Text style={[styles.time, { color: secondaryTextColor }]}>
          {formatMessageTime(message.createdAt)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  containerLeft: {
    justifyContent: 'flex-start',
  },
  containerRight: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bubbleLeft: {
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    borderBottomRightRadius: 4,
  },
  sender: {
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  fileAttachment: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
