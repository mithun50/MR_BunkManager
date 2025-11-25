import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Text,
  ActivityIndicator,
  useTheme,
  SegmentedButtons,
  FAB,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { NoteCard } from '../../components/notes';
import { Note, FeedNote } from '../../types/notes';
import notesService from '../../services/notesService';
import socialService from '../../services/socialService';

type ViewMode = 'my' | 'saved';

export function MyNotesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<FeedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('my');

  // Convert Note to FeedNote with actual like/save status
  const convertToFeedNote = async (note: Note, userId: string, isSavedMode: boolean): Promise<FeedNote> => {
    const [isLiked, isSaved] = await Promise.all([
      socialService.isLiked(note.id, userId),
      isSavedMode ? Promise.resolve(true) : socialService.isSaved(note.id, userId),
    ]);
    return {
      ...note,
      isLiked,
      isSaved,
      isFollowingAuthor: false,
    };
  };

  const loadNotes = async (refresh = false) => {
    if (!user) return;

    try {
      let result;
      if (viewMode === 'my') {
        result = await notesService.getUserNotes(user.uid, refresh ? undefined : lastDoc);
      } else {
        result = await socialService.getSavedNotes(user.uid, refresh ? undefined : lastDoc);
      }

      // Convert all notes to FeedNote with actual status
      const feedNotes = await Promise.all(
        result.items.map((note: Note) => convertToFeedNote(note, user.uid, viewMode === 'saved'))
      );

      if (refresh) {
        setNotes(feedNotes);
      } else {
        setNotes([...notes, ...feedNotes]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const isFirstLoad = useRef(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setNotes([]);
      setLastDoc(null);
      await loadNotes(true);
      setIsLoading(false);
    };
    init();
  }, [user, viewMode]);

  // Refresh when screen comes into focus (after creating a note)
  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }
      // Silently refresh without showing loading indicator
      loadNotes(true);
    }, [user, viewMode])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotes(true);
    setIsRefreshing(false);
  }, [user, viewMode]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await loadNotes(false);
    setIsLoadingMore(false);
  };

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}` as any);
  };

  const handleAuthorPress = (authorId: string) => {
    if (authorId === user?.uid) return;
    router.push(`/user/${authorId}` as any);
  };

  if (isLoading || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            { value: 'my', label: 'My Notes', icon: 'note-text' },
            { value: 'saved', label: 'Saved', icon: 'bookmark' },
          ]}
        />
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            currentUserId={user!.uid}
            onPress={() => handleNotePress(item.id)}
            onAuthorPress={() => handleAuthorPress(item.authorId)}
            onDelete={viewMode === 'my' ? () => setNotes(notes.filter(n => n.id !== item.id)) : undefined}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {viewMode === 'my' ? "You haven't shared any notes yet" : "You haven't saved any notes"}
            </Text>
            {viewMode === 'my' && (
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
              >
                Tap the + button to create your first note
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? <ActivityIndicator style={styles.footerLoader} /> : null
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Create Note FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/create-note' as any)}
        color={theme.colors.onPrimary}
      />
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
  toggleContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  listContent: {
    paddingBottom: 80,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
