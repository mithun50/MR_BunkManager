import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  FAB,
  Searchbar,
  SegmentedButtons,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Unsubscribe } from 'firebase/firestore';
import { Group, GroupMember } from '../../types/groups';
import { GroupCard } from './GroupCard';
import { GroupChatScreen } from './GroupChatScreen';
import { CreateGroupModal } from './CreateGroupModal';
import { MembersModal } from './MembersModal';
import { AddMembersModal } from './AddMembersModal';
import { CallScreen } from './CallScreen';
import groupsService from '../../services/groupsService';
import { ThemeSwitcher } from '../ThemeSwitcher';

interface GroupsListScreenProps {
  currentUserId: string;
  currentUserName: string;
  currentUserPhotoURL?: string | null;
  onUserPress?: (userId: string) => void;
}

type ViewMode = 'my-groups' | 'discover';

export function GroupsListScreen({
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  onUserPress,
}: GroupsListScreenProps) {
  const theme = useTheme();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('my-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member' | null>(null);

  // Call state
  const [activeCall, setActiveCall] = useState<{
    groupId: string;
    groupName: string;
    isVideo: boolean;
  } | null>(null);

  // Load groups
  useEffect(() => {
    let unsubscribeMyGroups: Unsubscribe | null = null;
    let isMounted = true;

    const loadGroups = async () => {
      try {
        // Subscribe to my groups
        unsubscribeMyGroups = groupsService.subscribeToMyGroups(
          currentUserId,
          (groups) => {
            if (isMounted) {
              setMyGroups(groups);
              setIsLoading(false);
            }
          }
        );

        // Load public groups for discovery
        const groups = await groupsService.getPublicGroups(50);
        if (isMounted) {
          setPublicGroups(groups);
          // Set loading to false after public groups load too (fallback)
          setTimeout(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadGroups();

    return () => {
      isMounted = false;
      if (unsubscribeMyGroups) {
        unsubscribeMyGroups();
      }
    };
  }, [currentUserId]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const groups = await groupsService.getPublicGroups(50);
      const filteredGroups = groups.filter(
        (g) => !myGroups.some((mg) => mg.id === g.id)
      );
      setPublicGroups(filteredGroups);
    } catch (error) {
      console.error('Error refreshing groups:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create group handler
  const handleCreateGroup = async (data: {
    name: string;
    description: string;
    category: 'study' | 'project' | 'social' | 'general';
    isPrivate: boolean;
  }) => {
    try {
      await groupsService.createGroup(
        data.name,
        data.description,
        data.category,
        data.isPrivate,
        currentUserId,
        currentUserName,
        currentUserPhotoURL || undefined
      );
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
      throw error;
    }
  };

  // Join group handler
  const handleJoinGroup = async (group: Group) => {
    try {
      await groupsService.joinGroup(
        group.id,
        currentUserId,
        currentUserName,
        currentUserPhotoURL || undefined
      );
      // Remove from public groups list
      setPublicGroups((prev) => prev.filter((g) => g.id !== group.id));
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    }
  };

  // Leave group handler
  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;

    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${selectedGroup.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsService.leaveGroup(selectedGroup.id, currentUserId);
              setSelectedGroup(null);
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group.');
            }
          },
        },
      ]
    );
  };

  // Delete group handler
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${selectedGroup.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsService.deleteGroup(selectedGroup.id);
              setSelectedGroup(null);
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group.');
            }
          },
        },
      ]
    );
  };

  // View members handler
  const handleViewMembers = async () => {
    if (!selectedGroup) return;

    try {
      const groupMembers = await groupsService.getGroupMembers(selectedGroup.id);
      setMembers(groupMembers);
      const currentMember = groupMembers.find((m) => m.userId === currentUserId);
      setCurrentUserRole(currentMember?.role || null);
      setShowMembersModal(true);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load members.');
    }
  };

  // Add members handler
  const handleAddMembers = async (users: { id: string; displayName: string; photoURL?: string }[]) => {
    if (!selectedGroup) return;

    try {
      // Add each user to the group with full user data
      for (const user of users) {
        await groupsService.addMember(
          selectedGroup.id,
          user.id,
          user.displayName,
          user.photoURL,
          'member'
        );
      }
      // Refresh members list
      const groupMembers = await groupsService.getGroupMembers(selectedGroup.id);
      setMembers(groupMembers);
    } catch (error) {
      console.error('Error adding members:', error);
      throw error;
    }
  };

  // Member management handlers
  const handlePromoteToAdmin = async (member: GroupMember) => {
    if (!selectedGroup) return;
    try {
      await groupsService.updateMemberRole(selectedGroup.id, member.userId, 'admin');
      const groupMembers = await groupsService.getGroupMembers(selectedGroup.id);
      setMembers(groupMembers);
    } catch (error) {
      console.error('Error promoting member:', error);
      Alert.alert('Error', 'Failed to promote member.');
    }
  };

  const handleDemoteToMember = async (member: GroupMember) => {
    if (!selectedGroup) return;
    try {
      await groupsService.updateMemberRole(selectedGroup.id, member.userId, 'member');
      const groupMembers = await groupsService.getGroupMembers(selectedGroup.id);
      setMembers(groupMembers);
    } catch (error) {
      console.error('Error demoting member:', error);
      Alert.alert('Error', 'Failed to demote member.');
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!selectedGroup) return;
    try {
      await groupsService.removeMember(selectedGroup.id, member.userId);
      const groupMembers = await groupsService.getGroupMembers(selectedGroup.id);
      setMembers(groupMembers);
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Error', 'Failed to remove member.');
    }
  };

  // Call handlers
  const handleStartCall = (isVideo: boolean) => {
    if (!selectedGroup) return;
    setActiveCall({
      groupId: selectedGroup.id,
      groupName: selectedGroup.name,
      isVideo,
    });

    // Send notification to group members about the call (non-blocking)
    groupsService.notifyGroupMembers(
      selectedGroup.id,
      selectedGroup.name,
      currentUserId,
      currentUserName,
      'call',
      { isVideo }
    );
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  // Filter groups based on search
  const filteredGroups = viewMode === 'my-groups'
    ? myGroups.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : publicGroups.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Render group card
  const renderGroupCard = useCallback(({ item }: { item: Group }) => (
    <GroupCard
      group={item}
      onPress={() => setSelectedGroup(item)}
      onJoin={viewMode === 'discover' ? () => handleJoinGroup(item) : undefined}
      showJoinButton={viewMode === 'discover'}
      isMember={myGroups.some((g) => g.id === item.id)}
    />
  ), [viewMode, myGroups]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons
          name={viewMode === 'my-groups' ? 'account-group-outline' : 'compass-outline'}
          size={64}
          color={theme.colors.primary}
        />
      </View>
      <Text variant="titleLarge" style={styles.emptyTitle}>
        {viewMode === 'my-groups' ? 'No Groups Yet' : 'No Groups Found'}
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        {viewMode === 'my-groups'
          ? 'Create a group or discover public groups to join'
          : 'No public groups match your search'}
      </Text>
    </View>
  );

  // If a group is selected, show the chat screen
  if (selectedGroup && !activeCall) {
    return (
      <>
        <GroupChatScreen
          group={selectedGroup}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserPhotoURL={currentUserPhotoURL}
          onClose={() => setSelectedGroup(null)}
          onViewMembers={handleViewMembers}
          onAddMembers={() => setShowAddMembersModal(true)}
          onLeaveGroup={handleLeaveGroup}
          onDeleteGroup={currentUserRole === 'admin' ? handleDeleteGroup : undefined}
          onUserPress={onUserPress}
          onStartVoiceCall={() => handleStartCall(false)}
          onStartVideoCall={() => handleStartCall(true)}
        />

        {/* Members Modal */}
        <MembersModal
          visible={showMembersModal}
          onDismiss={() => setShowMembersModal(false)}
          members={members}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onUserPress={onUserPress}
          onPromoteToAdmin={handlePromoteToAdmin}
          onDemoteToMember={handleDemoteToMember}
          onRemoveMember={handleRemoveMember}
        />

        {/* Add Members Modal */}
        <AddMembersModal
          visible={showAddMembersModal}
          onDismiss={() => setShowAddMembersModal(false)}
          onAddMembers={handleAddMembers}
          existingMemberIds={members.map((m) => m.userId)}
          groupName={selectedGroup.name}
        />
      </>
    );
  }

  // If there's an active call, show the call screen
  if (activeCall) {
    return (
      <CallScreen
        groupId={activeCall.groupId}
        groupName={activeCall.groupName}
        isVideo={activeCall.isVideo}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserPhotoURL={currentUserPhotoURL}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              Groups
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Connect and collaborate with others
            </Text>
          </View>
          <ThemeSwitcher />
        </View>
      </View>

      {/* View Mode Toggle */}
      <SegmentedButtons
        value={viewMode}
        onValueChange={(value) => setViewMode(value as ViewMode)}
        buttons={[
          {
            value: 'my-groups',
            label: 'My Groups',
            icon: 'account-group',
          },
          {
            value: 'discover',
            label: 'Discover',
            icon: 'compass',
          },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Search Bar */}
      <Searchbar
        placeholder="Search groups..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchbar}
        elevation={0}
      />

      {/* Groups List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      {/* Create Group FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => setShowCreateModal(true)}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        onSubmit={handleCreateGroup}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 16,
  },
});
