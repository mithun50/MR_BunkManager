import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Appbar,
  Text,
  useTheme,
  ActivityIndicator,
  SegmentedButtons,
  Searchbar,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { UserCard } from '@/src/components/notes';
import { PublicUserProfile } from '@/src/types/notes';
import followService from '@/src/services/followService';

export default function FollowersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { userId, tab, userName } = useLocalSearchParams<{
    userId: string;
    tab: 'followers' | 'following';
    userName: string;
  }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(tab || 'followers');
  const [followers, setFollowers] = useState<PublicUserProfile[]>([]);
  const [following, setFollowing] = useState<PublicUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [userId, user]);

  const loadData = async () => {
    if (!userId || !user) return;
    setIsLoading(true);
    try {
      const [followersList, followingList] = await Promise.all([
        followService.getFollowerProfiles(userId, user.uid),
        followService.getFollowingProfiles(userId, user.uid),
      ]);
      setFollowers(followersList);
      setFollowing(followingList);
    } catch (error) {
      console.error('Error loading followers/following:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPress = (targetUserId: string) => {
    router.push(`/user/${targetUserId}` as any);
  };

  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = searchQuery
    ? currentList.filter(
        (p) =>
          p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentList;


  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
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
        <Appbar.Content title={userName || 'User'} />
      </Appbar.Header>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'followers' | 'following')}
          buttons={[
            {
              value: 'followers',
              label: `Followers (${followers.length})`,
              icon: 'account-group',
            },
            {
              value: 'following',
              label: `Following (${following.length})`,
              icon: 'account-multiple',
            },
          ]}
        />
      </View>

      {/* Search */}
      <Searchbar
        placeholder="Search by name or roll no..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            currentUserId={user!.uid}
            onPress={() => handleUserPress(item.uid)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={activeTab === 'followers' ? 'account-group' : 'account-multiple'}
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}
            >
              {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
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
  tabContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  listContent: {
    paddingBottom: 16,
  },
});
