import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import {
  TextInput,
  IconButton,
  Text,
  useTheme,
  ActivityIndicator,
  Divider,
  Button,
} from 'react-native-paper';
import { Image } from 'expo-image';
import { formatDistanceToNow } from 'date-fns';
import { NoteComment } from '../../types/notes';
import { UserProfile } from '../../types/user';
import socialService from '../../services/socialService';

interface CommentSectionProps {
  noteId: string;
  currentUser: UserProfile;
  onCommentAdded?: () => void;
}

export function CommentSection({ noteId, currentUser, onCommentAdded }: CommentSectionProps) {
  const theme = useTheme();
  const [comments, setComments] = useState<NoteComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadComments();
  }, [noteId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const result = await socialService.getComments(noteId);
      setComments(result.items);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || !lastDoc) return;
    setIsLoadingMore(true);
    try {
      const result = await socialService.getComments(noteId, lastDoc);
      setComments([...comments, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more comments:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSend = async () => {
    if (!newComment.trim() || isSending) return;
    setIsSending(true);
    try {
      const comment = await socialService.addComment(noteId, currentUser, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment('');
      onCommentAdded?.();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await socialService.deleteComment(noteId, commentId, currentUser.uid);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const renderComment = ({ item }: { item: NoteComment }) => (
    <View style={styles.commentItem}>
      {item.authorPhotoURL ? (
        <Image source={{ uri: item.authorPhotoURL }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={{ color: 'white', fontSize: 12 }}>
            {item.authorName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text variant="labelMedium">{item.authorName}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.commentText}>
          {item.content}
        </Text>
      </View>
      {item.authorId === currentUser.uid && (
        <IconButton
          icon="delete-outline"
          size={18}
          onPress={() => handleDelete(item.id)}
          iconColor={theme.colors.error}
        />
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text variant="titleMedium" style={styles.title}>
        Comments
      </Text>
      <Divider style={styles.divider} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : comments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No comments yet. Be the first to comment!
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {comments.map((item) => (
            <View key={item.id}>{renderComment({ item })}</View>
          ))}
          {hasMore && (
            <Button
              mode="text"
              onPress={loadMore}
              loading={isLoadingMore}
              disabled={isLoadingMore}
              style={styles.loadMoreButton}
            >
              Load More Comments
            </Button>
          )}
          {isLoadingMore && <ActivityIndicator style={styles.footerLoader} />}
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Write a comment..."
          mode="outlined"
          dense
          style={styles.input}
          multiline
          maxLength={500}
        />
        <IconButton
          icon="send"
          mode="contained"
          onPress={handleSend}
          disabled={!newComment.trim() || isSending}
          loading={isSending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  divider: {
    marginVertical: 8,
  },
  loader: {
    marginTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  list: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentText: {
    marginTop: 2,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  loadMoreButton: {
    marginVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
});
