import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert, Modal, Dimensions, Share } from 'react-native';
import {
  Appbar,
  Text,
  useTheme,
  ActivityIndicator,
  Surface,
  Chip,
  IconButton,
  Button,
  Divider,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { WebView } from 'react-native-webview';
import { useAuthStore } from '@/src/store/authStore';
import { CommentSection } from '@/src/components/notes';
import { FeedNote } from '@/src/types/notes';
import { UserProfile } from '@/src/types/user';
import notesService from '@/src/services/notesService';
import socialService from '@/src/services/socialService';
import firestoreService from '@/src/services/firestoreService';
import googleDriveService from '@/src/services/googleDriveService';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-app.vercel.app';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NoteDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [note, setNote] = useState<FeedNote | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !id) return;
      setIsLoading(true);
      try {
        const [noteData, userProfile] = await Promise.all([
          notesService.getNoteWithContext(id, user.uid),
          firestoreService.getUserProfile(user.uid),
        ]);
        if (noteData) {
          setNote(noteData);
          setIsLiked(noteData.isLiked);
          setIsSaved(noteData.isSaved);
          setLikesCount(noteData.likesCount);
          setCommentsCount(noteData.commentsCount);
        }
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading note:', error);
        Alert.alert('Error', 'Failed to load note');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, id]);

  const handleLike = async () => {
    if (!note || !user) return;
    try {
      const newIsLiked = await socialService.toggleLike(note.id, user.uid);
      setIsLiked(newIsLiked);
      setLikesCount(newIsLiked ? likesCount + 1 : likesCount - 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async () => {
    if (!note || !user) return;
    try {
      const newIsSaved = await socialService.toggleSave(note.id, user.uid);
      setIsSaved(newIsSaved);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleOpenFile = () => {
    if (note?.fileUrl) {
      Linking.openURL(note.fileUrl);
    }
  };

  const handleAuthorPress = () => {
    if (note && note.authorId !== user?.uid) {
      router.push(`/user/${note.authorId}` as any);
    }
  };

  const handleShare = async () => {
    if (!note) return;
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

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text>Note not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface, marginTop: insets.top }}
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Note" />
        {note.authorId === user?.uid && (
          <Appbar.Action
            icon="delete"
            onPress={() => {
              Alert.alert('Delete Note', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await notesService.deleteNote(note.id, user!.uid);
                    router.back();
                  },
                },
              ]);
            }}
          />
        )}
      </Appbar.Header>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Author Header */}
        <Surface style={[styles.authorSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.authorRow}>
            {note.authorPhotoURL ? (
              <Image
                source={{ uri: note.authorPhotoURL }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: 'white', fontSize: 18 }}>
                  {note.authorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.authorInfo}>
              <Text variant="titleMedium" onPress={handleAuthorPress}>
                {note.authorName}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {note.authorRollNumber} • {note.authorCourse}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatDistanceToNow(note.createdAt, { addSuffix: true })}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Note Content */}
        <Surface style={[styles.contentSection, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineSmall" style={styles.title}>
            {note.title}
          </Text>

          {note.description && (
            <Text variant="bodyLarge" style={styles.description}>
              {note.description}
            </Text>
          )}

          {/* Subject & Tags */}
          <View style={styles.tags}>
            {note.subject && (
              <Chip icon="book-outline" style={styles.chip}>
                {note.subject}
              </Chip>
            )}
            <Chip
              icon={() => (
                <MaterialCommunityIcons
                  name={
                    note.contentType === 'text'
                      ? 'text-box'
                      : note.contentType === 'pdf'
                      ? 'file-pdf-box'
                      : note.contentType === 'image'
                      ? 'image'
                      : 'link-variant'
                  }
                  size={16}
                  color={theme.colors.primary}
                />
              )}
              style={styles.chip}
            >
              {note.contentType.toUpperCase()}
            </Chip>
            {note.tags.map((tag, index) => (
              <Chip key={index} style={styles.chip}>
                #{tag}
              </Chip>
            ))}
          </View>

          <Divider style={styles.divider} />

          {/* Content Display */}
          {note.contentType === 'text' && (
            <Text variant="bodyLarge" style={styles.textContent}>
              {note.content}
            </Text>
          )}

          {/* Image Preview */}
          {note.contentType === 'image' && note.fileUrl && (
            <View style={styles.fileSection}>
              <Image
                source={{ uri: note.fileUrl }}
                style={styles.imagePreview}
                contentFit="contain"
              />
              <Button
                mode="outlined"
                icon="open-in-new"
                onPress={handleOpenFile}
                style={styles.openButton}
              >
                Open Full Image
              </Button>
            </View>
          )}

          {/* PDF Preview */}
          {note.contentType === 'pdf' && note.fileUrl && (
            <View style={styles.fileSection}>
              {/* PDF Preview using WebView */}
              <View style={[
                styles.pdfPreviewContainer,
                {
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surfaceVariant,
                }
              ]}>
                <WebView
                  source={{
                    uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(note.fileUrl)}`,
                  }}
                  style={[styles.pdfWebView, { backgroundColor: theme.colors.surface }]}
                  onLoadStart={() => setPdfLoading(true)}
                  onLoadEnd={() => setPdfLoading(false)}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={[styles.pdfLoadingContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                      <Text style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                        Loading PDF...
                      </Text>
                    </View>
                  )}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.pdfActions}>
                <Button
                  mode="contained"
                  icon="fullscreen"
                  onPress={() => setShowPdfViewer(true)}
                  style={styles.pdfButton}
                >
                  View Fullscreen
                </Button>
                <Button
                  mode="outlined"
                  icon="open-in-new"
                  onPress={handleOpenFile}
                  style={styles.pdfButton}
                >
                  Open External
                </Button>
              </View>
            </View>
          )}

          {note.contentType === 'link' && (
            <Button
              mode="outlined"
              icon="link-variant"
              onPress={() => Linking.openURL(note.content)}
              style={styles.linkButton}
            >
              Open Link
            </Button>
          )}
        </Surface>

        {/* Action Bar */}
        <Surface style={[styles.actionBar, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.actionGroup}>
            <IconButton
              icon={isLiked ? 'heart' : 'heart-outline'}
              iconColor={isLiked ? '#F44336' : theme.colors.onSurfaceVariant}
              size={24}
              onPress={handleLike}
            />
            <Text variant="bodyMedium">{likesCount}</Text>
          </View>

          <View style={styles.actionGroup}>
            <IconButton
              icon="comment-outline"
              iconColor={theme.colors.onSurfaceVariant}
              size={24}
            />
            <Text variant="bodyMedium">{commentsCount}</Text>
          </View>

          <IconButton
            icon={isSaved ? 'bookmark' : 'bookmark-outline'}
            iconColor={isSaved ? theme.colors.primary : theme.colors.onSurfaceVariant}
            size={24}
            onPress={handleSave}
          />

          <IconButton
            icon="share-variant-outline"
            iconColor={theme.colors.onSurfaceVariant}
            size={24}
            onPress={handleShare}
          />
        </Surface>

        {/* Comments Section */}
        {profile && (
          <Surface style={[styles.commentsSection, { backgroundColor: theme.colors.surface }]}>
            <CommentSection
              noteId={note.id}
              currentUser={profile}
              onCommentAdded={() => setCommentsCount(commentsCount + 1)}
            />
          </Surface>
        )}
      </ScrollView>

      {/* Fullscreen PDF Viewer Modal */}
      <Modal
        visible={showPdfViewer}
        animationType="slide"
        onRequestClose={() => setShowPdfViewer(false)}
      >
        <View style={[styles.pdfModalContainer, { backgroundColor: theme.colors.background }]}>
          <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
            <Appbar.BackAction onPress={() => setShowPdfViewer(false)} />
            <Appbar.Content title={note?.fileName || 'PDF Viewer'} />
            <Appbar.Action icon="open-in-new" onPress={handleOpenFile} />
          </Appbar.Header>
          {note?.fileUrl && (
            <WebView
              source={{
                uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(note.fileUrl)}`,
              }}
              style={[styles.fullscreenPdf, { backgroundColor: theme.colors.surface }]}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={[styles.pdfLoadingContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                    Loading PDF...
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  authorSection: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contentSection: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
    opacity: 0.8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  textContent: {
    lineHeight: 24,
  },
  fileSection: {
    alignItems: 'center',
  },
  filePreview: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  pdfPreviewContainer: {
    width: '100%',
    height: 350,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
  },
  pdfWebView: {
    flex: 1,
  },
  pdfLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  pdfButton: {
    flex: 1,
  },
  pdfModalContainer: {
    flex: 1,
  },
  fullscreenPdf: {
    flex: 1,
  },
  openButton: {
    marginTop: 8,
  },
  linkButton: {
    marginTop: 8,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    margin: 16,
    marginTop: 8,
    padding: 8,
    borderRadius: 12,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsSection: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    minHeight: 200,
    marginBottom: 32,
  },
});
