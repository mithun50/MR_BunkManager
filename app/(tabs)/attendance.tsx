import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, ActivityIndicator, Text } from 'react-native-paper';
import { GroupsListScreen } from '@/src/components/groups';
import { useAuthStore } from '@/src/store/authStore';

export default function GroupsTab() {
  const theme = useTheme();
  const { user, profile, isLoading } = useAuthStore();

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Show message if not logged in
  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge">Please log in to view groups</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GroupsListScreen
        currentUserId={user.uid}
        currentUserName={profile?.displayName || user.displayName || 'User'}
        currentUserPhotoURL={profile?.photoURL || user.photoURL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
