import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView, Pressable } from 'react-native';
import {
  Text,
  ActivityIndicator,
  useTheme,
  Button,
  SegmentedButtons,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { NoteCard } from '../../components/notes';
import { FeedNote } from '../../types/notes';
import notesService from '../../services/notesService';
import followService from '../../services/followService';
import { useResponsive } from '../../hooks/useResponsive';

export function FeedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDesktop, isLargeDesktop, containerPadding, contentMaxWidth } = useResponsive();
  const numColumns = isLargeDesktop ? 2 : 1;
  const [notes, setNotes] = useState<FeedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const loadFollowing = async () => {
    if (!user) return [];
    const ids = await followService.getFollowing(user.uid);
    setFollowingIds(ids);
    return ids;
  };

  const loadNotes = async (refresh = false) => {
    if (!user) return;

    try {
      const ids = refresh ? await loadFollowing() : followingIds.length ? followingIds : await loadFollowing();

      if (ids.length === 0) {
        setNotes([]);
        setHasMore(false);
        return;
      }

      const result = await notesService.getFeedNotes(user.uid, ids, refresh ? undefined : lastDoc);

      if (refresh) {
        setNotes(result.items);
      } else {
        setNotes([...notes, ...result.items]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const isFirstLoad = useRef(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadNotes(true);
      setIsLoading(false);
    };
    init();
  }, [user]);

  // Refresh when screen comes into focus (after creating a note)
  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }
      // Silently refresh without showing loading indicator
      loadNotes(true);
    }, [user, followingIds])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotes(true);
    setIsRefreshing(false);
  }, [user]);

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
    router.push(`/user/${authorId}` as any);
  };

  // Group notes by subject
  const notesBySubject = React.useMemo(() => {
    const grouped: Record<string, FeedNote[]> = {};
    notes.forEach((note) => {
      const subject = note.subject || 'Uncategorized';
      if (!grouped[subject]) {
        grouped[subject] = [];
      }
      grouped[subject].push(note);
    });
    return grouped;
  }, [notes]);

  // View mode header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.viewModeRow}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>View:</Text>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'list' | 'grouped')}
          buttons={[
            { value: 'list', label: 'List', icon: 'view-list' },
            { value: 'grouped', label: 'Subject', icon: 'folder-outline' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
    </View>
  );

  // Render grouped view - Subject wise with Name and Roll No
  const renderGroupedView = () => (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.groupedContent, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {renderHeader()}

      {Object.keys(notesBySubject).length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No notes found
          </Text>
        </View>
      ) : (
        Object.entries(notesBySubject).map(([subject, subjectNotes]) => (
          <Surface
            key={subject}
            style={[styles.subjectCard, { backgroundColor: theme.colors.surface }]}
          >
            {/* Subject Header - Click to expand */}
            <Pressable
              style={styles.subjectHeader}
              onPress={() => setExpandedSubject(expandedSubject === subject ? null : subject)}
            >
              <View style={styles.subjectTitleRow}>
                <MaterialCommunityIcons
                  name="book-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="titleMedium" style={styles.subjectTitle}>
                    {subject}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {subjectNotes.length} {subjectNotes.length === 1 ? 'note' : 'notes'}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={expandedSubject === subject ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={theme.colors.onSurface}
                />
              </View>
            </Pressable>

            {/* Notes list - shows Name, Roll No, and Note title */}
            {expandedSubject === subject && (
              <View style={styles.notesListContainer}>
                {subjectNotes.map((note) => (
                  <Pressable
                    key={note.id}
                    style={styles.noteItem}
                    onPress={() => handleNotePress(note.id)}
                  >
                    {/* Content Type Icon */}
                    <MaterialCommunityIcons
                      name={
                        note.contentType === 'pdf'
                          ? 'file-pdf-box'
                          : note.contentType === 'image'
                          ? 'image'
                          : note.contentType === 'link'
                          ? 'link-variant'
                          : 'text-box'
                      }
                      size={24}
                      color={
                        note.contentType === 'pdf'
                          ? '#F44336'
                          : note.contentType === 'image'
                          ? '#2196F3'
                          : note.contentType === 'link'
                          ? '#9C27B0'
                          : '#4CAF50'
                      }
                    />

                    {/* Note Details */}
                    <View style={styles.noteDetails}>
                      <Text variant="bodyLarge" numberOfLines={1} style={styles.noteTitle}>
                        {note.title}
                      </Text>
                      <View style={styles.authorRow}>
                        <MaterialCommunityIcons
                          name="account"
                          size={14}
                          color={theme.colors.onSurfaceVariant}
                        />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {note.authorName}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8 }}>
                          ({note.authorRollNumber})
                        </Text>
                      </View>
                    </View>

                    {/* Arrow */}
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </Surface>
        ))
      )}

      {isLoadingMore && <ActivityIndicator style={styles.footerLoader} />}
    </ScrollView>
  );

  // Early return if user is not authenticated
  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (followingIds.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          No one followed yet
        </Text>
        <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Follow classmates to see their notes here
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/search-users' as any)}
          style={styles.emptyButton}
          icon="account-search"
        >
          Find Classmates
        </Button>
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          No notes yet
        </Text>
        <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
          People you follow haven't shared any notes
        </Text>
      </View>
    );
  }

  // If grouped view mode, render grouped view
  if (viewMode === 'grouped') {
    return renderGroupedView();
  }

  // Default list view
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.contentWrapper, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}>
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          key={numColumns}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={numColumns > 1 ? styles.cardWrapper : undefined}>
              <NoteCard
                note={item}
                currentUserId={user.uid}
                onPress={() => handleNotePress(item.id)}
                onAuthorPress={() => handleAuthorPress(item.authorId)}
              />
            </View>
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
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator style={styles.footerLoader} />
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  groupedContent: {
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 24,
  },
  columnWrapper: {
    gap: 16,
    paddingHorizontal: 8,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '50%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  viewModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  segmentedButtons: {
    flex: 1,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  listContent: {
    paddingVertical: 8,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  // Grouped view styles
  subjectCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  subjectHeader: {
    padding: 16,
  },
  subjectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectTitle: {
    fontWeight: '600',
  },
  notesListContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    gap: 12,
  },
  noteDetails: {
    flex: 1,
  },
  noteTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
