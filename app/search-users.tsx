import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Appbar,
  Searchbar,
  Text,
  useTheme,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { UserCard } from '@/src/components/notes';
import { PublicUserProfile } from '@/src/types/notes';
import { UserProfile } from '@/src/types/user';
import followService from '@/src/services/followService';
import firestoreService from '@/src/services/firestoreService';

type SearchMode = 'roll' | 'name';

export default function SearchUsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('roll');
  const [results, setResults] = useState<PublicUserProfile[]>([]);
  const [suggestions, setSuggestions] = useState<PublicUserProfile[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const userProfile = await firestoreService.getUserProfile(user.uid);
        setProfile(userProfile);
        if (userProfile) {
          const suggested = await followService.getSuggestedUsers(userProfile, 10);
          setSuggestions(suggested);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    loadData();
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setIsLoading(true);
    try {
      let searchResults: PublicUserProfile[];
      if (searchMode === 'roll') {
        searchResults = await followService.searchByRollNumber(searchQuery.trim(), user.uid);
      } else {
        searchResults = await followService.searchByName(searchQuery.trim(), user.uid);
      }
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}` as any);
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
  };

  const displayData = searchQuery.trim() ? results : suggestions;
  const showSuggestions = !searchQuery.trim();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface, marginTop: insets.top }}
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Find Classmates" />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <SegmentedButtons
          value={searchMode}
          onValueChange={(value) => setSearchMode(value as SearchMode)}
          buttons={[
            { value: 'roll', label: 'Roll Number', icon: 'card-account-details' },
            { value: 'name', label: 'Name', icon: 'account' },
          ]}
          style={styles.modeToggle}
        />

        <Searchbar
          placeholder={searchMode === 'roll' ? 'Search by roll number...' : 'Search by name...'}
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          onClearIconPress={handleClear}
          style={styles.searchbar}
        />
      </View>

      {showSuggestions && (
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Suggested Classmates
        </Text>
      )}

      {(isLoading || isLoadingSuggestions) && displayData.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : displayData.length === 0 ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {showSuggestions
              ? 'No suggestions available'
              : 'No users found. Try a different search.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              currentUserId={user!.uid}
              onPress={() => handleUserPress(item.uid)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  modeToggle: {
    marginBottom: 12,
  },
  searchbar: {
    marginBottom: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContent: {
    paddingBottom: 16,
  },
});
