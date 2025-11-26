import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Share, Alert, Platform } from 'react-native';
import {
  Surface,
  Text,
  Avatar,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { formatDistanceToNow } from 'date-fns';
import { FeedNote, NoteContentType } from '../../types/notes';
import socialService from '../../services/socialService';
import notesService from '../../services/notesService';
import { useNotesStore } from '../../store/notesStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-app.vercel.app';

interface NoteCardProps {
  note: FeedNote;
  currentUserId: string;
  onPress: () => void;
  onAuthorPress: () => void;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  onSaveChange?: (isSaved: boolean) => void;
  onDelete?: () => void;
  compact?: boolean; // Condensed view for grouped display
}

const contentTypeIcons: Record<NoteContentType, string> = {
  text: 'text-box',
  pdf: 'file-pdf-box',
  image: 'image',
  link: 'link-variant',
};

const contentTypeColors: Record<NoteContentType, string> = {
  text: '#4CAF50',
  pdf: '#F44336',
  image: '#2196F3',
  link: '#9C27B0',
};

export function NoteCard({
  note,
  currentUserId,
  onPress,
  onAuthorPress,
  onLikeChange,
  onSaveChange,
  onDelete,
  compact = false,
}: NoteCardProps) {
  const theme = useTheme();

  // Use global store for like/save state
  const { interactions, setLiked, setSaved, setInteraction } = useNotesStore();
  const storedInteraction = interactions[note.id];

  // Use store state if available, otherwise fall back to prop
  const isLiked = storedInteraction?.isLiked ?? note.isLiked;
  const isSaved = storedInteraction?.isSaved ?? note.isSaved;
  const likesCount = storedInteraction?.likesCount ?? note.likesCount;

  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize store with note data if not present
  useEffect(() => {
    if (!storedInteraction) {
      setInteraction(note.id, {
        isLiked: note.isLiked,
        isSaved: note.isSaved,
        likesCount: note.likesCount,
      });
    }
  }, [note.id, note.isLiked, note.isSaved, note.likesCount]);

  const isAuthor = note.authorId === currentUserId;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const newIsLiked = await socialService.toggleLike(note.id, currentUserId);
      const newCount = newIsLiked ? likesCount + 1 : likesCount - 1;
      // Update global store
      setLiked(note.id, newIsLiked, newCount);
      onLikeChange?.(newIsLiked, newCount);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const newIsSaved = await socialService.toggleSave(note.id, currentUserId);
      // Update global store
      setSaved(note.id, newIsSaved);
      onSaveChange?.(newIsSaved);
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareLink = `${BACKEND_URL}/note/${note.id}`;
      const shareMessage = `📚 ${note.title}\n\nBy: ${note.authorName} (${note.authorRollNumber})${note.subject ? `\nSubject: ${note.subject}` : ''}${note.description ? `\n\n${note.description}` : ''}\n\n🔗 View in BunkManager:\n${shareLink}`;

      await Share.share({
        message: shareMessage,
        title: note.title,
      });
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === 'web') {
          resolve(window.confirm('Are you sure you want to delete this note? This action cannot be undone.'));
        } else {
          Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        }
      });
    };

    const confirmed = await confirmDelete();
    if (!confirmed) return;

    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await notesService.deleteNote(note.id, currentUserId);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting note:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete note. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to delete note. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const timeAgo = formatDistanceToNow(note.createdAt, { addSuffix: true });

  // Compact view for grouped display
  if (compact) {
    return (
      <Surface
        style={[styles.compactContainer, { backgroundColor: theme.colors.surface }]}
        elevation={0}
      >
        <Pressable
          onPress={onPress}
          style={styles.compactRow}
          android_ripple={{ color: theme.colors.primary + '20' }}
        >
          <MaterialCommunityIcons
            name={contentTypeIcons[note.contentType]}
            size={20}
            color={contentTypeColors[note.contentType]}
          />
          <View style={styles.compactContent}>
            <Text variant="bodyMedium" numberOfLines={1} style={styles.compactTitle}>
              {note.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {timeAgo} • {likesCount} likes
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      </Surface>
    );
  }

  // Full view
  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Pressable onPress={onPress} android_ripple={{ color: theme.colors.primary + '20' }}>
        {/* Header with Author Info */}
        <Pressable onPress={onAuthorPress} style={styles.header}>
          {note.authorPhotoURL ? (
            <Image
              source={{ uri: note.authorPhotoURL }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <Avatar.Text
              size={40}
              label={note.authorName.charAt(0).toUpperCase()}
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          <View style={styles.authorInfo}>
            <Text variant="titleSmall" numberOfLines={1}>
              {note.authorName}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {note.authorRollNumber} • {timeAgo}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: contentTypeColors[note.contentType] + '20' }]}>
            <MaterialCommunityIcons
              name={contentTypeIcons[note.contentType]}
              size={14}
              color={contentTypeColors[note.contentType]}
            />
            <Text style={[styles.typeBadgeText, { color: contentTypeColors[note.contentType] }]}>
              {note.contentType.toUpperCase()}
            </Text>
          </View>
        </Pressable>

        {/* Note Content */}
        <View style={styles.content}>
          <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
            {note.title}
          </Text>
          {note.description && (
            <Text
              variant="bodyMedium"
              numberOfLines={2}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {note.description}
            </Text>
          )}

          {/* Thumbnail for images */}
          {note.thumbnailUrl && note.contentType === 'image' && (
            <Image
              source={{ uri: note.thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          )}

          {/* PDF Preview Placeholder */}
          {note.contentType === 'pdf' && (
            <View style={[styles.pdfPreview, { backgroundColor: theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={48}
                color="#F44336"
              />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                {note.fileName || 'PDF Document'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Tap to view
              </Text>
            </View>
          )}

          {/* Subject & Tags */}
          <View style={styles.tags}>
            {note.subject && (
              <View style={[styles.subjectBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons
                  name="book-outline"
                  size={12}
                  color={theme.colors.onPrimaryContainer}
                />
                <Text style={[styles.badgeText, { color: theme.colors.onPrimaryContainer }]}>
                  {note.subject}
                </Text>
              </View>
            )}
            {note.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.tagBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.badgeText, { color: theme.colors.onSurfaceVariant }]}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>

      {/* Action Bar */}
      <View style={styles.actions}>
        <View style={styles.actionGroup}>
          <IconButton
            icon={isLiked ? 'heart' : 'heart-outline'}
            iconColor={isLiked ? '#F44336' : theme.colors.onSurfaceVariant}
            size={20}
            onPress={handleLike}
            disabled={isLiking}
          />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {likesCount}
          </Text>
        </View>

        <View style={styles.actionGroup}>
          <IconButton
            icon="comment-outline"
            iconColor={theme.colors.onSurfaceVariant}
            size={20}
            onPress={onPress}
          />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {note.commentsCount}
          </Text>
        </View>

        <IconButton
          icon={isSaved ? 'bookmark' : 'bookmark-outline'}
          iconColor={isSaved ? theme.colors.primary : theme.colors.onSurfaceVariant}
          size={20}
          onPress={handleSave}
          disabled={isSaving}
        />

        <IconButton
          icon="share-variant-outline"
          iconColor={theme.colors.onSurfaceVariant}
          size={20}
          onPress={handleShare}
        />

        {isAuthor && onDelete && (
          <IconButton
            icon="delete-outline"
            iconColor={theme.colors.error}
            size={20}
            onPress={handleDelete}
            disabled={isDeleting}
          />
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  // Compact styles
  compactContainer: {
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  thumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  pdfPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
