import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView, Pressable, Platform } from 'react-native';
import {
  Text,
  ActivityIndicator,
  useTheme,
  Chip,
  Searchbar,
  SegmentedButtons,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { NoteCard } from '../../components/notes';
import { FeedNote, NoteFilters, NoteContentType } from '../../types/notes';
import { useResponsive } from '../../hooks/useResponsive';
import notesService from '../../services/notesService';
import firestoreService from '../../services/firestoreService';
import { UserProfile } from '../../types/user';

type SortOption = 'recent' | 'popular' | 'trending';

export function ExploreScreen() {
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<NoteFilters>({
    sortBy: 'recent',
  });
  const [selectedType, setSelectedType] = useState<NoteContentType | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // New filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [authorNameFilter, setAuthorNameFilter] = useState('');
  const [rollNoFilter, setRollNoFilter] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'subject' | 'author' | 'rollno'>('all');

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const p = await firestoreService.getUserProfile(user.uid);
        setProfile(p);
      }
    };
    loadProfile();
  }, [user]);

  const loadNotes = async (refresh = false) => {
    if (!user || !profile) return;

    try {
      const currentFilters: NoteFilters = {
        college: profile.college,
        course: profile.course,
        contentType: selectedType || undefined,
        subject: subjectFilter || undefined,
        sortBy,
      };

      const result = await notesService.getExploreNotes(
        user.uid,
        currentFilters,
        refresh ? undefined : lastDoc
      );

      // Apply client-side filters for author name and roll number
      let filteredItems = result.items;
      if (authorNameFilter) {
        filteredItems = filteredItems.filter((note) =>
          note.authorName.toLowerCase().includes(authorNameFilter.toLowerCase())
        );
      }
      if (rollNoFilter) {
        filteredItems = filteredItems.filter((note) =>
          note.authorRollNumber.toLowerCase().includes(rollNoFilter.toLowerCase())
        );
      }

      if (refresh) {
        setNotes(filteredItems);
      } else {
        setNotes([...notes, ...filteredItems]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading explore notes:', error);
    }
  };

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (profile) {
      const init = async () => {
        setIsLoading(true);
        await loadNotes(true);
        setIsLoading(false);
      };
      init();
    }
  }, [profile, selectedType, sortBy, subjectFilter, authorNameFilter, rollNoFilter]);

  // Refresh when screen comes into focus (after creating a note)
  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }
      if (profile) {
        // Silently refresh without showing loading indicator
        loadNotes(true);
      }
    }, [profile, selectedType, sortBy, subjectFilter, authorNameFilter, rollNoFilter])
  );

  // Web-specific: Refresh when browser window/tab gains focus
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleFocus = () => {
      if (!isFirstLoad.current && profile) {
        loadNotes(true);
      }
    };

    window.addEventListener('focus', handleFocus);

    // Also listen for visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isFirstLoad.current && profile) {
        loadNotes(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile, selectedType, sortBy, subjectFilter, authorNameFilter, rollNoFilter]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotes(true);
    setIsRefreshing(false);
  }, [profile, selectedType, sortBy, subjectFilter, authorNameFilter, rollNoFilter]);

  const clearAllFilters = () => {
    setSubjectFilter('');
    setAuthorNameFilter('');
    setRollNoFilter('');
    setFilterMode('all');
    setViewMode('list');
    setExpandedSubject(null);
  };

  const hasActiveFilters = subjectFilter || authorNameFilter || rollNoFilter;

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await loadNotes(false);
    setIsLoadingMore(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setIsLoading(true);
    try {
      const results = await notesService.searchNotes(user.uid, searchQuery.trim(), filters);
      setNotes(results);
      setHasMore(false);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}` as any);
  };

  const handleAuthorPress = (authorId: string) => {
    router.push(`/user/${authorId}` as any);
  };

  const clearSearch = () => {
    setSearchQuery('');
    loadNotes(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Searchbar
        placeholder="Search notes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        onClearIconPress={clearSearch}
        style={styles.searchbar}
      />

      {/* View Mode Toggle */}
      <View style={styles.viewModeRow}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>View:</Text>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'list' | 'grouped')}
          buttons={[
            { value: 'list', label: 'List', icon: 'view-list' },
            { value: 'grouped', label: 'Grouped', icon: 'folder-outline' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Type Filters */}
      <View style={styles.filterRow}>
        <Chip
          selected={selectedType === null}
          onPress={() => setSelectedType(null)}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={selectedType === 'text'}
          onPress={() => setSelectedType(selectedType === 'text' ? null : 'text')}
          icon="text-box"
          style={styles.filterChip}
        >
          Text
        </Chip>
        <Chip
          selected={selectedType === 'image'}
          onPress={() => setSelectedType(selectedType === 'image' ? null : 'image')}
          icon="image"
          style={styles.filterChip}
        >
          Images
        </Chip>
        <Chip
          selected={selectedType === 'pdf'}
          onPress={() => setSelectedType(selectedType === 'pdf' ? null : 'pdf')}
          icon="file-pdf-box"
          style={styles.filterChip}
        >
          PDFs
        </Chip>
      </View>

      {/* Sort Options */}
      <View style={styles.filterRow}>
        <Chip
          selected={sortBy === 'recent'}
          onPress={() => setSortBy('recent')}
          style={styles.filterChip}
        >
          Recent
        </Chip>
        <Chip
          selected={sortBy === 'popular'}
          onPress={() => setSortBy('popular')}
          icon="heart"
          style={styles.filterChip}
        >
          Popular
        </Chip>
        <Chip
          selected={sortBy === 'trending'}
          onPress={() => setSortBy('trending')}
          icon="trending-up"
          style={styles.filterChip}
        >
          Trending
        </Chip>
      </View>
    </View>
  );

  // Group notes by subject only (simpler structure)
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

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isLoading && notes.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No notes found
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                Be the first to share notes!
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator style={styles.footerLoader} /> : null
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
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    marginBottom: 12,
  },
  viewModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  segmentedButtons: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  listContent: {
    paddingBottom: 8,
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
