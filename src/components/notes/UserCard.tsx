import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Surface, Text, Button, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PublicUserProfile } from '../../types/notes';
import followService from '../../services/followService';

interface UserCardProps {
  user: PublicUserProfile;
  currentUserId: string;
  onPress: () => void;
  onFollowChange?: (isFollowing: boolean) => void;
  compact?: boolean;
}

export function UserCard({
  user,
  currentUserId,
  onPress,
  onFollowChange,
  compact = false,
}: UserCardProps) {
  const theme = useTheme();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(currentUserId, user.uid);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followService.followUser(currentUserId, user.uid);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isOwnProfile = currentUserId === user.uid;

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.compactContainer, { backgroundColor: theme.colors.surface }]}
        android_ripple={{ color: theme.colors.primary + '20' }}
      >
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.compactAvatar} contentFit="cover" />
        ) : (
          <View style={[styles.compactAvatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.compactInfo}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {user.rollNumber}
          </Text>
        </View>
        {!isOwnProfile && (
          <Button
            mode={isFollowing ? 'outlined' : 'contained'}
            compact
            onPress={handleFollow}
            loading={isLoading}
            disabled={isLoading}
            style={styles.compactButton}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </Pressable>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: theme.colors.primary + '20' }}
        style={styles.pressable}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                {user.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.infoContainer}>
          <Text variant="titleMedium" numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {user.rollNumber}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {user.course} • Sem {user.semester}
          </Text>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="note-text"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodySmall" style={{ marginLeft: 4 }}>
                {user.notesCount} notes
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="account-group"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodySmall" style={{ marginLeft: 4 }}>
                {user.followersCount} followers
              </Text>
            </View>
          </View>
        </View>

        {/* Follow Button */}
        {!isOwnProfile && (
          <Button
            mode={isFollowing ? 'outlined' : 'contained'}
            onPress={handleFollow}
            loading={isLoading}
            disabled={isLoading}
            style={styles.followButton}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </Pressable>
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
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    marginLeft: 8,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactButton: {
    marginLeft: 8,
  },
});
