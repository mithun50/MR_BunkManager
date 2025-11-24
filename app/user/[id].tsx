import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import {
  Appbar,
  Text,
  useTheme,
  ActivityIndicator,
  Surface,
  Button,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { NoteCard } from '@/src/components/notes';
import { PublicUserProfile, FeedNote, Note } from '@/src/types/notes';
import followService from '@/src/services/followService';
import notesService from '@/src/services/notesService';

export default function UserProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadData = async (refresh = false) => {
    if (!user || !id) return;
    try {
      const [userProfile, userNotes] = await Promise.all([
        followService.getPublicProfile(id, user.uid),
        notesService.getUserNotes(id, refresh ? undefined : lastDoc),
      ]);

      setProfile(userProfile);
      setIsFollowing(userProfile?.isFollowing || false);

      if (refresh) {
        setNotes(userNotes.items);
      } else {
        setNotes([...notes, ...userNotes.items]);
      }
      setLastDoc(userNotes.lastDoc);
      setHasMore(userNotes.hasMore);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadData(true);
      setIsLoading(false);
    };
    init();
  }, [user, id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(true);
    setIsRefreshing(false);
  };

  const handleFollow = async () => {
    if (!user || !id || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(user.uid, id);
        setIsFollowing(false);
        if (profile) {
          setProfile({ ...profile, followersCount: profile.followersCount - 1 });
        }
      } else {
        await followService.followUser(user.uid, id);
        setIsFollowing(true);
        if (profile) {
          setProfile({ ...profile, followersCount: profile.followersCount + 1 });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}` as any);
  };

  const convertToFeedNote = (note: Note): FeedNote => ({
    ...note,
    isLiked: false,
    isSaved: false,
    isFollowingAuthor: isFollowing,
  });

  const renderHeader = () => {
    if (!profile) return null;

    return (
      <Surface style={[styles.profileSection, { backgroundColor: theme.colors.surface }]}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {profile.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>
                {profile.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Name & Roll */}
        <Text variant="headlineSmall" style={styles.name}>
          {profile.displayName}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {profile.rollNumber}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {profile.course} • Semester {profile.semester}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {profile.college}
        </Text>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="note-text" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.statNumber}>
              {profile.notesCount}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Notes
            </Text>
          </View>
          <Pressable
            style={styles.statItem}
            onPress={() =>
              router.push({
                pathname: '/user/followers',
                params: { userId: id, tab: 'followers', userName: profile.displayName },
              } as any)
            }
          >
            <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.statNumber}>
              {profile.followersCount}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Followers
            </Text>
          </Pressable>
          <Pressable
            style={styles.statItem}
            onPress={() =>
              router.push({
                pathname: '/user/followers',
                params: { userId: id, tab: 'following', userName: profile.displayName },
              } as any)
            }
          >
            <MaterialCommunityIcons name="account-multiple" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.statNumber}>
              {profile.followingCount}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Following
            </Text>
          </Pressable>
        </View>

        {/* Follow Button */}
        {user?.uid !== id && (
          <Button
            mode={isFollowing ? 'outlined' : 'contained'}
            onPress={handleFollow}
            loading={isFollowLoading}
            disabled={isFollowLoading}
            style={styles.followButton}
            icon={isFollowing ? 'account-check' : 'account-plus'}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}

        {/* Notes Header */}
        <Text variant="titleMedium" style={styles.notesHeader}>
          Shared Notes
        </Text>
      </Surface>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text>User not found</Text>
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
        <Appbar.Content title={profile.displayName} />
      </Appbar.Header>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <NoteCard
            note={convertToFeedNote(item)}
            currentUserId={user!.uid}
            onPress={() => handleNotePress(item.id)}
            onAuthorPress={() => {}}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyNotes}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              No public notes yet
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
  profileSection: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  followButton: {
    marginTop: 8,
    minWidth: 150,
  },
  notesHeader: {
    alignSelf: 'flex-start',
    marginTop: 24,
    fontWeight: 'bold',
  },
  emptyNotes: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  listContent: {
    paddingBottom: 16,
  },
});
