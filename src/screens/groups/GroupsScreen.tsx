import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, FlatList, Pressable, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  Card,
  Button,
  Chip,
  useTheme,
  Portal,
  Modal,
  TextInput,
  IconButton,
  Divider,
  Appbar,
  Avatar,
  FAB,
  Menu,
  Searchbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Unsubscribe } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import firestoreService from '../../services/firestoreService';
import groupsService from '../../services/groupsService';
import fileUploadService from '../../services/fileUploadService';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import OnlineButton from '../../components/OnlineButton';
import { Group, GroupMessage } from '../../types/groups';

export default function GroupsScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();

  // State
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupCategory, setGroupCategory] = useState<'study' | 'project' | 'social' | 'general'>('study');
  const [isPrivate, setIsPrivate] = useState(false);

  // Group Detail/Chat Modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [messageUnsubscribe, setMessageUnsubscribe] = useState<Unsubscribe | null>(null);

  // Add Members Modal
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchType, setMemberSearchType] = useState<'name' | 'rollNumber'>('name');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // User Profile Modal
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // View Members Modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  // User role in current group
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member' | null>(null);

  const loadGroups = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user's groups and all public groups in parallel
      const [userGroups, publicGroups] = await Promise.all([
        groupsService.getUserGroups(user.uid),
        groupsService.getPublicGroups(),
      ]);

      setMyGroups(userGroups);
      setAllGroups(publicGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      const profile = await firestoreService.getUserProfile(user.uid);

      await groupsService.createGroup(
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || undefined,
        {
          name: groupName.trim(),
          description: groupDescription.trim(),
          category: groupCategory,
          isPrivate,
          college: profile?.college,
          course: profile?.course,
          department: profile?.department,
        }
      );

      // Reset form
      setGroupName('');
      setGroupDescription('');
      setGroupCategory('study');
      setIsPrivate(false);
      setShowCreateModal(false);

      // Reload groups
      await loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      await groupsService.addMember(
        groupId,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || undefined,
        'member'
      );
      await loadGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group. Please try again.');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    // Check if user is admin
    if (currentUserRole === 'admin') {
      Alert.alert(
        'Cannot Leave Group',
        'As an admin, you must transfer ownership to another member before leaving the group. Go to View Members and promote someone to admin first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              // Unsubscribe from messages before leaving
              if (messageUnsubscribe) {
                messageUnsubscribe();
                setMessageUnsubscribe(null);
              }

              await groupsService.removeMember(groupId, user.uid);
              setShowGroupModal(false);
              setMessages([]);
              await loadGroups();
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!user || !selectedGroup || !newMessage.trim()) return;

    try {
      await groupsService.sendMessage(
        selectedGroup.id,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || undefined,
        newMessage.trim()
      );

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleViewMembers = async () => {
    if (!selectedGroup) return;

    try {
      const members = await groupsService.getGroupMembers(selectedGroup.id);
      setGroupMembers(members);
      setShowMembersModal(true);
      setMenuVisible(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Failed to load members. Please try again.');
    }
  };

  const handleSearchUsers = async () => {
    if (!user || !memberSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);

      let results;
      if (memberSearchType === 'rollNumber') {
        results = await groupsService.searchUsersByRollNumber(memberSearchQuery.trim(), user.uid);
      } else {
        results = await groupsService.searchUsersByName(memberSearchQuery.trim(), user.uid);
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      alert('Failed to search users. Please try again.');
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleInviteUser = async (invitedUser: any) => {
    if (!selectedGroup || !user) return;

    try {
      // Check if user is already a member
      const isMember = await groupsService.isMember(selectedGroup.id, invitedUser.uid);
      if (isMember) {
        alert(`${invitedUser.displayName} is already a member of this group`);
        return;
      }

      await groupsService.addMember(
        selectedGroup.id,
        invitedUser.uid,
        invitedUser.displayName,
        invitedUser.photoURL,
        'member'
      );

      alert(`Successfully invited ${invitedUser.displayName} to the group!`);

      // Remove from search results
      setSearchResults(searchResults.filter(u => u.uid !== invitedUser.uid));
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to invite user. Please try again.');
    }
  };

  const handleUserTap = async (userId: string, userName: string) => {
    try {
      // Fetch user profile from Firestore
      const profile = await firestoreService.getUserProfile(userId);
      if (profile) {
        setSelectedUser(profile);
        setShowUserProfile(true);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      alert('Failed to load user profile');
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleFileUpload = async () => {
    if (!user || !selectedGroup) return;

    try {
      // Pick a file
      const file = await fileUploadService.pickDocument();
      if (!file) return;

      // Upload file
      const fileUrl = await fileUploadService.uploadFile(file.uri, file.name, file.mimeType);

      // Send message with file attachment
      await groupsService.sendMessage(
        selectedGroup.id,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || undefined,
        '',
        fileUrl,
        file.name,
        file.mimeType
      );

      setMenuVisible(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup || !user || currentUserRole !== 'admin') {
      Alert.alert('Error', 'Only admins can delete groups');
      return;
    }

    // Confirm deletion
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
              Alert.alert('Success', 'Group deleted successfully');
              setShowGroupModal(false);
              setMenuVisible(false);
              loadGroups(); // Refresh the groups list
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedGroup) return;

    try {
      await groupsService.deleteMessage(selectedGroup.id, messageId);
      // Message will be automatically removed via real-time subscription
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!selectedGroup || currentUserRole !== 'admin') {
      Alert.alert('Error', 'Only admins can remove members');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsService.removeMember(selectedGroup.id, memberId);
              // Refresh members list
              const updatedMembers = groupMembers.filter(m => m.userId !== memberId);
              setGroupMembers(updatedMembers);
              Alert.alert('Success', 'Member removed successfully');
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handlePromoteToAdmin = async (memberId: string, memberName: string) => {
    if (!selectedGroup || currentUserRole !== 'admin') {
      Alert.alert('Error', 'Only admins can promote members');
      return;
    }

    Alert.alert(
      'Promote to Admin',
      `Promote ${memberName} to admin? They will have full control over the group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              await groupsService.updateMemberRole(selectedGroup.id, memberId, 'admin');
              // Refresh members list
              const updatedMembers = groupMembers.map(m =>
                m.userId === memberId ? { ...m, role: 'admin' as const } : m
              );
              setGroupMembers(updatedMembers);
              Alert.alert('Success', `${memberName} is now an admin`);
            } catch (error) {
              console.error('Error promoting member:', error);
              Alert.alert('Error', 'Failed to promote member. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDemoteToMember = async (adminId: string, adminName: string) => {
    if (!selectedGroup || currentUserRole !== 'admin') {
      Alert.alert('Error', 'Only admins can change roles');
      return;
    }

    Alert.alert(
      'Demote to Member',
      `Remove admin privileges from ${adminName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsService.updateMemberRole(selectedGroup.id, adminId, 'member');
              // Refresh members list
              const updatedMembers = groupMembers.map(m =>
                m.userId === adminId ? { ...m, role: 'member' as const } : m
              );
              setGroupMembers(updatedMembers);
              Alert.alert('Success', `${adminName} is now a regular member`);
            } catch (error) {
              console.error('Error demoting admin:', error);
              Alert.alert('Error', 'Failed to demote admin. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Subscribe to real-time messages when group modal opens
  useEffect(() => {
    if (showGroupModal && selectedGroup && user) {
      // Load user's role in this group
      const loadUserRole = async () => {
        try {
          const members = await groupsService.getGroupMembers(selectedGroup.id);
          const currentMember = members.find(m => m.userId === user.uid);
          setCurrentUserRole(currentMember?.role || null);
        } catch (error) {
          console.error('Error loading user role:', error);
        }
      };
      loadUserRole();

      // Subscribe to messages
      const unsubscribe = groupsService.subscribeToMessages(
        selectedGroup.id,
        (updatedMessages) => {
          setMessages(updatedMessages);
        },
        50
      );

      setMessageUnsubscribe(() => unsubscribe);

      // Cleanup on unmount or when group changes
      return () => {
        unsubscribe();
      };
    } else {
      // Clean up subscription when modal closes
      if (messageUnsubscribe) {
        messageUnsubscribe();
        setMessageUnsubscribe(null);
      }
      setMessages([]);
      setCurrentUserRole(null);
    }
  }, [showGroupModal, selectedGroup, user]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return 'book-open-variant';
      case 'project': return 'briefcase';
      case 'social': return 'account-group';
      default: return 'forum';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return theme.colors.primary;
      case 'project': return theme.colors.tertiary;
      case 'social': return theme.colors.secondary;
      default: return theme.colors.outline;
    }
  };

  const filteredGroups = (activeTab === 'my' ? myGroups : allGroups).filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} style={{ marginLeft: 16 }} />
        <Appbar.Content title="Study Groups" titleStyle={{ fontWeight: 'bold' }} />
        <View style={{ marginRight: 16 }}>
          <ThemeSwitcher />
        </View>
      </Appbar.Header>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text variant="titleSmall" style={[styles.tabText, activeTab === 'my' && { color: theme.colors.primary, fontWeight: 'bold' }]}>
            My Groups ({myGroups.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text variant="titleSmall" style={[styles.tabText, activeTab === 'discover' && { color: theme.colors.primary, fontWeight: 'bold' }]}>
            Discover ({allGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search groups..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredGroups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name={activeTab === 'my' ? 'account-group-outline' : 'magnify'}
                size={64}
                color={theme.colors.outline}
              />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                {activeTab === 'my' ? 'No Groups Yet' : 'No Groups Found'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {activeTab === 'my'
                  ? 'Create or join a study group to collaborate with classmates'
                  : 'Try adjusting your search or create a new group'}
              </Text>
              {activeTab === 'my' && (
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => setShowCreateModal(true)}
                  style={styles.emptyButton}
                >
                  Create Group
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.groupsList}>
            {filteredGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                onPress={() => {
                  setSelectedGroup(group);
                  setShowGroupModal(true);
                }}
                activeOpacity={0.7}
              >
                <Card style={styles.groupCard} mode="elevated">
                  <Card.Content style={styles.groupCardContent}>
                    <View style={styles.groupHeader}>
                      <View style={[styles.groupIconContainer, { backgroundColor: getCategoryColor(group.category) + '15' }]}>
                        <MaterialCommunityIcons
                          name={getCategoryIcon(group.category)}
                          size={28}
                          color={getCategoryColor(group.category)}
                        />
                      </View>
                      <View style={styles.groupInfo}>
                        <View style={styles.groupTitleRow}>
                          <Text variant="titleMedium" style={styles.groupName} numberOfLines={1}>
                            {group.name}
                          </Text>
                          {group.isPrivate && (
                            <MaterialCommunityIcons
                              name="lock"
                              size={16}
                              color={theme.colors.outline}
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </View>
                        <Text variant="bodySmall" style={styles.groupDescription} numberOfLines={2}>
                          {group.description || 'No description provided'}
                        </Text>
                        <View style={styles.groupMeta}>
                          <Chip
                            mode="flat"
                            compact
                            style={[styles.categoryChip, { backgroundColor: getCategoryColor(group.category) + '20' }]}
                            textStyle={{ color: getCategoryColor(group.category), fontSize: 11, fontWeight: '600' }}
                          >
                            {group.category.toUpperCase()}
                          </Chip>
                          <View style={styles.membersInfo}>
                            <MaterialCommunityIcons
                              name="account-multiple"
                              size={16}
                              color={theme.colors.primary}
                            />
                            <Text variant="bodySmall" style={styles.memberCount}>
                              {group.memberCount}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {activeTab === 'discover' && !group.members.includes(user?.uid || '') && (
                      <Button
                        mode="contained"
                        icon="account-plus"
                        onPress={(e) => {
                          e.stopPropagation();
                          handleJoinGroup(group.id);
                        }}
                        style={styles.joinButton}
                        labelStyle={{ fontSize: 13 }}
                      >
                        Join
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoCardHeader}>
              <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
              <Text variant="titleSmall" style={styles.infoCardTitle}>
                About Study Groups
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.infoCardText}>
              Study groups allow you to collaborate with classmates, share notes, discuss assignments, and work on projects together. Create a group or join existing ones to enhance your learning experience.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button - Create Group */}
      <FAB
        icon="plus"
        label={activeTab === 'my' ? 'Create Group' : undefined}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            ...styles.fabShadow,
          },
        ]}
        color={theme.colors.onPrimary}
        onPress={() => setShowCreateModal(true)}
        visible={true}
        animated={true}
      />

      {/* Create Group Modal */}
      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Create Study Group
          </Text>

          <TextInput
            label="Group Name *"
            value={groupName}
            onChangeText={setGroupName}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Data Structures Study Group"
          />

          <TextInput
            label="Description"
            value={groupDescription}
            onChangeText={setGroupDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="Brief description of the group..."
          />

          <Text variant="titleSmall" style={styles.label}>
            Category
          </Text>
          <View style={styles.categoryButtons}>
            {(['study', 'project', 'social', 'general'] as const).map((cat) => (
              <Chip
                key={cat}
                selected={groupCategory === cat}
                onPress={() => setGroupCategory(cat)}
                style={[
                  styles.categoryChipButton,
                  groupCategory === cat && { backgroundColor: theme.colors.primaryContainer }
                ]}
                textStyle={{
                  color: groupCategory === cat ? theme.colors.primary : theme.colors.onSurface,
                  fontWeight: groupCategory === cat ? '700' : '500',
                }}
                icon={getCategoryIcon(cat)}
                mode={groupCategory === cat ? 'flat' : 'outlined'}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Chip>
            ))}
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text variant="titleSmall">Private Group</Text>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                Requires invitation to join
              </Text>
            </View>
            <Button
              mode={isPrivate ? 'contained' : 'outlined'}
              onPress={() => setIsPrivate(!isPrivate)}
              compact
            >
              {isPrivate ? 'Private' : 'Public'}
            </Button>
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowCreateModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <OnlineButton
              mode="contained"
              onPress={handleCreateGroup}
              style={styles.modalButton}
              disabled={!groupName.trim()}
              requiresOnline={true}
              offlineMessage="You need internet connection to create a group"
            >
              Create
            </OnlineButton>
          </View>
        </Modal>
      </Portal>

      {/* Group Detail/Chat Modal */}
      <Portal>
        <Modal
          visible={showGroupModal}
          onDismiss={() => setShowGroupModal(false)}
          contentContainerStyle={[styles.chatModal, { backgroundColor: theme.colors.surface }]}
        >
          {selectedGroup && (
            <>
              {/* Group Header */}
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderInfo}>
                  <Avatar.Icon
                    size={40}
                    icon={getCategoryIcon(selectedGroup.category)}
                    style={{ backgroundColor: getCategoryColor(selectedGroup.category) + '20' }}
                    color={getCategoryColor(selectedGroup.category)}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.chatGroupName}>
                      {selectedGroup.name}
                    </Text>
                    <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                      {selectedGroup.memberCount} members
                    </Text>
                  </View>
                </View>
                <View style={styles.chatHeaderActions}>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setShowGroupModal(false)}
                  />
                  <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        size={24}
                        onPress={() => setMenuVisible(true)}
                      />
                    }
                  >
                    <Menu.Item
                      onPress={handleViewMembers}
                      leadingIcon="account-multiple"
                      title="View Members"
                    />
                    <Menu.Item
                      onPress={() => {
                        setMenuVisible(false);
                        setShowAddMembersModal(true);
                      }}
                      leadingIcon="account-plus"
                      title="Add Members"
                    />
                    <Menu.Item
                      onPress={() => {
                        setMenuVisible(false);
                        handleFileUpload();
                      }}
                      leadingIcon="file-upload"
                      title="Share File"
                    />
                    <Divider />
                    {currentUserRole === 'admin' && (
                      <>
                        <Menu.Item
                          onPress={handleDeleteGroup}
                          leadingIcon="delete"
                          title="Delete Group"
                          titleStyle={{ color: theme.colors.error }}
                        />
                        <Divider />
                      </>
                    )}
                    <Menu.Item
                      onPress={() => {
                        setMenuVisible(false);
                        handleLeaveGroup(selectedGroup.id);
                      }}
                      leadingIcon="exit-to-app"
                      title="Leave Group"
                      titleStyle={{ color: theme.colors.error }}
                    />
                  </Menu>
                </View>
              </View>

              <Divider />

              {/* Messages Area */}
              <ScrollView
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.length === 0 ? (
                  <View style={styles.emptyMessages}>
                    <View style={[styles.emptyMessagesIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <MaterialCommunityIcons name="message-text-outline" size={40} color={theme.colors.primary} />
                    </View>
                    <Text variant="titleMedium" style={{ fontWeight: '600', marginTop: 16 }}>
                      No messages yet
                    </Text>
                    <Text variant="bodySmall" style={{ opacity: 0.6, textAlign: 'center', marginTop: 4 }}>
                      Be the first to start the conversation!
                    </Text>
                  </View>
                ) : (
                  messages.map((msg) => {
                    const isCurrentUser = msg.userId === user?.uid;
                    return (
                      <View
                        key={msg.id}
                        style={[
                          styles.messageItem,
                          isCurrentUser && styles.messageItemRight,
                        ]}
                      >
                        {!isCurrentUser && (
                          msg.userPhotoURL ? (
                            <Avatar.Image size={32} source={{ uri: msg.userPhotoURL }} />
                          ) : (
                            <Avatar.Text size={32} label={msg.userName.charAt(0)} />
                          )
                        )}
                        <Pressable
                          onLongPress={() => {
                            if (isCurrentUser) {
                              Alert.alert(
                                'Delete Message',
                                'Are you sure you want to delete this message?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => handleDeleteMessage(msg.id),
                                  },
                                ]
                              );
                            }
                          }}
                          style={[
                            styles.messageBubble,
                            isCurrentUser
                              ? [styles.messageBubbleRight, { backgroundColor: theme.colors.primary }]
                              : [styles.messageBubbleLeft, { backgroundColor: theme.colors.surfaceVariant }],
                          ]}
                        >
                          {!isCurrentUser && (
                            <Pressable onPress={() => handleUserTap(msg.userId, msg.userName)}>
                              <Text
                                variant="labelSmall"
                                style={[styles.messageSender, { color: theme.colors.primary }]}
                              >
                                {msg.userName}
                              </Text>
                            </Pressable>
                          )}
                          {msg.message && msg.message.trim() !== '' && (
                            <Text
                              variant="bodyMedium"
                              style={[
                                styles.messageText,
                                isCurrentUser && { color: theme.colors.onPrimary },
                              ]}
                            >
                              {msg.message}
                            </Text>
                          )}
                          {msg.fileUrl && (
                            <TouchableOpacity
                              style={[
                                styles.fileAttachment,
                                isCurrentUser
                                  ? { backgroundColor: 'rgba(255,255,255,0.2)' }
                                  : { backgroundColor: 'rgba(0,0,0,0.05)' }
                              ]}
                              onPress={() => {
                                if (msg.fileUrl) {
                                  // Open the file URL in browser
                                  Linking.openURL(msg.fileUrl).catch(err => {
                                    console.error('Failed to open file:', err);
                                    alert('Failed to open file. Please try again.');
                                  });
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.fileAttachmentContent}>
                                <MaterialCommunityIcons
                                  name={fileUploadService.getFileIcon(msg.fileType || '')}
                                  size={32}
                                  color={isCurrentUser ? theme.colors.onPrimary : theme.colors.primary}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    variant="bodyMedium"
                                    style={[
                                      styles.fileName,
                                      isCurrentUser && { color: theme.colors.onPrimary },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {msg.fileName}
                                  </Text>
                                  <Text
                                    variant="labelSmall"
                                    style={[
                                      { opacity: 0.7, marginTop: 2 },
                                      isCurrentUser && { color: theme.colors.onPrimary },
                                    ]}
                                  >
                                    Tap to open
                                  </Text>
                                </View>
                                <MaterialCommunityIcons
                                  name="download"
                                  size={20}
                                  color={isCurrentUser ? theme.colors.onPrimary : theme.colors.primary}
                                  style={{ opacity: 0.7 }}
                                />
                              </View>
                            </TouchableOpacity>
                          )}
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.messageTime,
                              isCurrentUser && { color: theme.colors.onPrimary },
                            ]}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </Text>
                        </Pressable>
                        {isCurrentUser && (
                          user?.photoURL ? (
                            <Avatar.Image size={32} source={{ uri: user.photoURL }} />
                          ) : (
                            <Avatar.Text size={32} label={user?.displayName?.charAt(0) || 'U'} />
                          )
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Message Input */}
              <View style={[styles.messageInputContainer, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.messageInputWrapper}>
                  <IconButton
                    icon="paperclip"
                    size={22}
                    onPress={handleFileUpload}
                    iconColor={theme.colors.primary}
                  />
                  <TextInput
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    mode="flat"
                    style={styles.messageInput}
                    multiline
                    maxLength={500}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                  />
                  <IconButton
                    icon="send"
                    mode="contained"
                    size={24}
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim()}
                    containerColor={newMessage.trim() ? theme.colors.primary : theme.colors.surfaceVariant}
                    iconColor={newMessage.trim() ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
            </>
          )}
        </Modal>
      </Portal>

      {/* Add Members Modal */}
      <Portal>
        <Modal
          visible={showAddMembersModal}
          onDismiss={() => {
            setShowAddMembersModal(false);
            setMemberSearchQuery('');
            setSearchResults([]);
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Add Members
          </Text>
          <Text variant="bodySmall" style={{ opacity: 0.7, marginBottom: 16 }}>
            Search for users by name or roll number to invite them to this group
          </Text>

          {/* Search Type Toggle */}
          <View style={styles.searchTypeContainer}>
            <Chip
              selected={memberSearchType === 'name'}
              onPress={() => setMemberSearchType('name')}
              style={styles.searchTypeChip}
              mode={memberSearchType === 'name' ? 'flat' : 'outlined'}
            >
              By Name
            </Chip>
            <Chip
              selected={memberSearchType === 'rollNumber'}
              onPress={() => setMemberSearchType('rollNumber')}
              style={styles.searchTypeChip}
              mode={memberSearchType === 'rollNumber' ? 'flat' : 'outlined'}
            >
              By Roll Number
            </Chip>
          </View>

          {/* Search Input */}
          <Searchbar
            placeholder={
              memberSearchType === 'name'
                ? 'Search by name...'
                : 'Search by roll number...'
            }
            onChangeText={setMemberSearchQuery}
            value={memberSearchQuery}
            onSubmitEditing={handleSearchUsers}
            style={styles.searchbar}
            loading={searchingUsers}
            icon="magnify"
          />

          <Button
            mode="contained"
            onPress={handleSearchUsers}
            style={{ marginTop: 8, marginBottom: 16 }}
            loading={searchingUsers}
            disabled={!memberSearchQuery.trim()}
          >
            Search
          </Button>

          {/* Search Results */}
          <ScrollView style={styles.searchResultsContainer}>
            {searchResults.length === 0 && memberSearchQuery.trim() && !searchingUsers ? (
              <View style={styles.emptySearchResults}>
                <MaterialCommunityIcons
                  name="account-search"
                  size={48}
                  color={theme.colors.outline}
                />
                <Text variant="bodyMedium" style={{ opacity: 0.7, marginTop: 8, textAlign: 'center' }}>
                  No users found. Try a different search term.
                </Text>
              </View>
            ) : (
              searchResults.map((searchUser) => (
                <Card key={searchUser.uid} style={styles.searchResultCard} mode="elevated">
                  <Card.Content style={{ paddingVertical: 12 }}>
                    <View style={styles.searchResultHeader}>
                      <View style={styles.searchResultLeft}>
                        {searchUser.photoURL ? (
                          <Avatar.Image size={48} source={{ uri: searchUser.photoURL }} />
                        ) : (
                          <Avatar.Text
                            size={48}
                            label={searchUser.displayName?.charAt(0) || 'U'}
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                          />
                        )}
                        <View style={styles.searchResultInfo}>
                          <Text variant="titleSmall" style={{ fontWeight: '700', fontSize: 15 }}>
                            {searchUser.displayName}
                          </Text>
                          <View style={styles.searchResultBadge}>
                            <MaterialCommunityIcons
                              name="card-account-details"
                              size={14}
                              color={theme.colors.primary}
                            />
                            <Text variant="bodySmall" style={{ fontWeight: '600', color: theme.colors.primary }}>
                              {searchUser.rollNumber}
                            </Text>
                          </View>
                          <Text variant="bodySmall" style={{ opacity: 0.6, marginTop: 2 }}>
                            {searchUser.department} • Sem {searchUser.semester}
                          </Text>
                        </View>
                      </View>
                      <Button
                        mode="contained"
                        compact
                        onPress={() => handleInviteUser(searchUser)}
                        icon="account-plus"
                        style={{ borderRadius: 12 }}
                        labelStyle={{ fontSize: 12 }}
                      >
                        Invite
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowAddMembersModal(false);
                setMemberSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.modalButton}
            >
              Close
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* User Profile Modal */}
      <Portal>
        <Modal
          visible={showUserProfile}
          onDismiss={() => setShowUserProfile(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          {selectedUser && (
            <>
              <View style={styles.profileModalHeader}>
                {selectedUser.photoURL ? (
                  <Avatar.Image size={80} source={{ uri: selectedUser.photoURL }} />
                ) : (
                  <Avatar.Text
                    size={80}
                    label={selectedUser.displayName?.charAt(0) || 'U'}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                  />
                )}
                <View style={styles.profileModalInfo}>
                  <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
                    {selectedUser.displayName}
                  </Text>
                  <View style={styles.profileBadge}>
                    <MaterialCommunityIcons
                      name="card-account-details"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                      {selectedUser.rollNumber}
                    </Text>
                  </View>
                </View>
              </View>

              <Divider style={{ marginVertical: 16 }} />

              <View style={styles.profileDetails}>
                <View style={styles.profileDetailRow}>
                  <MaterialCommunityIcons name="school" size={20} color={theme.colors.onSurfaceVariant} />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={{ opacity: 0.6 }}>
                      College
                    </Text>
                    <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                      {selectedUser.college || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileDetailRow}>
                  <MaterialCommunityIcons name="book-open-variant" size={20} color={theme.colors.onSurfaceVariant} />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={{ opacity: 0.6 }}>
                      Department
                    </Text>
                    <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                      {selectedUser.department || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileDetailRow}>
                  <MaterialCommunityIcons name="school-outline" size={20} color={theme.colors.onSurfaceVariant} />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={{ opacity: 0.6 }}>
                      Course & Semester
                    </Text>
                    <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                      {selectedUser.course || 'N/A'} • Semester {selectedUser.semester || 'N/A'}
                    </Text>
                  </View>
                </View>

                {selectedUser.section && (
                  <View style={styles.profileDetailRow}>
                    <MaterialCommunityIcons name="alpha-a" size={20} color={theme.colors.onSurfaceVariant} />
                    <View style={{ flex: 1 }}>
                      <Text variant="labelSmall" style={{ opacity: 0.6 }}>
                        Section
                      </Text>
                      <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                        {selectedUser.section}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <Button
                mode="outlined"
                onPress={() => setShowUserProfile(false)}
                style={{ marginTop: 16 }}
              >
                Close
              </Button>
            </>
          )}
        </Modal>
      </Portal>

      {/* View Members Modal */}
      <Portal>
        <Modal
          visible={showMembersModal}
          onDismiss={() => setShowMembersModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.membersModalHeader}>
            <MaterialCommunityIcons name="account-multiple" size={28} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Group Members
            </Text>
          </View>
          <Text variant="bodySmall" style={{ opacity: 0.7, marginBottom: 16 }}>
            {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
          </Text>

          <ScrollView style={styles.membersScrollView} showsVerticalScrollIndicator={false}>
            {groupMembers.map((member, index) => (
              <React.Fragment key={member.userId}>
                <View style={styles.memberItem}>
                  <Pressable
                    style={styles.memberItemLeft}
                    onPress={() => handleUserTap(member.userId, member.userName)}
                  >
                    {member.userPhotoURL ? (
                      <Avatar.Image size={48} source={{ uri: member.userPhotoURL }} />
                    ) : (
                      <Avatar.Text
                        size={48}
                        label={member.userName?.charAt(0) || 'U'}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                      />
                    )}
                    <View style={styles.memberItemInfo}>
                      <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                        {member.userName}
                      </Text>
                      <View style={styles.memberRoleBadge}>
                        <MaterialCommunityIcons
                          name={member.role === 'admin' ? 'shield-crown' : 'account'}
                          size={14}
                          color={member.role === 'admin' ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                        <Text
                          variant="labelSmall"
                          style={{
                            color: member.role === 'admin' ? theme.colors.primary : theme.colors.onSurfaceVariant,
                            fontWeight: '600',
                            textTransform: 'capitalize',
                          }}
                        >
                          {member.role}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                  {currentUserRole === 'admin' && member.userId !== user?.uid && (
                    <View style={styles.memberActions}>
                      {member.role === 'member' ? (
                        <>
                          <IconButton
                            icon="shield-crown"
                            size={20}
                            onPress={() => handlePromoteToAdmin(member.userId, member.userName)}
                            iconColor={theme.colors.primary}
                          />
                          <IconButton
                            icon="account-remove"
                            size={20}
                            onPress={() => handleRemoveMember(member.userId, member.userName)}
                            iconColor={theme.colors.error}
                          />
                        </>
                      ) : (
                        <IconButton
                          icon="shield-off"
                          size={20}
                          onPress={() => handleDemoteToMember(member.userId, member.userName)}
                          iconColor={theme.colors.error}
                        />
                      )}
                    </View>
                  )}
                  {member.userId === user?.uid && (
                    <Chip mode="flat" compact style={{ backgroundColor: theme.colors.primaryContainer }}>
                      You
                    </Chip>
                  )}
                </View>
                {index < groupMembers.length - 1 && <Divider style={{ marginVertical: 8 }} />}
              </React.Fragment>
            ))}
          </ScrollView>

          <Button
            mode="outlined"
            onPress={() => setShowMembersModal(false)}
            style={{ marginTop: 16 }}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6200ee',
  },
  tabText: {
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    elevation: 0,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    marginBottom: 0,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  groupCardContent: {
    paddingVertical: 16,
  },
  groupIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  groupInfo: {
    flex: 1,
    gap: 6,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  groupDescription: {
    opacity: 0.7,
    lineHeight: 18,
    marginTop: 2,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  categoryChip: {
    height: 26,
    borderRadius: 13,
  },
  membersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCount: {
    fontWeight: '600',
    fontSize: 12,
  },
  joinButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  infoCard: {
    marginTop: 24,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontWeight: '600',
  },
  infoCardText: {
    opacity: 0.8,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChipButton: {
    marginRight: 0,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  chatModal: {
    margin: 0,
    height: '100%',
    borderRadius: 0,
  },
  chatHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatGroupName: {
    fontWeight: 'bold',
  },
  chatHeaderActions: {
    flexDirection: 'row',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMessagesIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageItemRight: {
    flexDirection: 'row-reverse',
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
  },
  messageBubbleLeft: {
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    borderBottomRightRadius: 4,
  },
  messageSender: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 11,
  },
  messageText: {
    lineHeight: 20,
  },
  fileAttachment: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  fileAttachmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileName: {
    fontWeight: '600',
    fontSize: 14,
  },
  messageInputContainer: {
    padding: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: 'transparent',
  },
  searchTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchTypeChip: {
    flex: 1,
  },
  searchResultsContainer: {
    maxHeight: 320,
  },
  emptySearchResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchResultCard: {
    marginBottom: 10,
    borderRadius: 16,
    elevation: 2,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  searchResultInfo: {
    flex: 1,
    gap: 4,
  },
  searchResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  messageTime: {
    opacity: 0.7,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileModalInfo: {
    flex: 1,
    gap: 8,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  profileDetails: {
    gap: 16,
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fabShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  membersModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  membersScrollView: {
    maxHeight: 400,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  memberItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberItemInfo: {
    flex: 1,
    gap: 4,
  },
  memberRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
