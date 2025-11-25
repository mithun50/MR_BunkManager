import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Avatar,
  Checkbox,
  useTheme,
  ActivityIndicator,
  Chip,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../../config/firebase';

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

interface AddMembersModalProps {
  visible: boolean;
  onDismiss: () => void;
  onAddMembers: (users: User[]) => Promise<void>;
  existingMemberIds: string[];
  groupName: string;
}

export function AddMembersModal({
  visible,
  onDismiss,
  onAddMembers,
  existingMemberIds,
  groupName,
}: AddMembersModalProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchUsers = async (queryText: string) => {
    setIsSearching(true);
    try {
      const usersRef = collection(db, 'users');

      // Search by displayName (case-insensitive prefix search)
      const nameQuery = query(
        usersRef,
        orderBy('displayName'),
        startAt(queryText),
        endAt(queryText + '\uf8ff'),
        limit(20)
      );

      const snapshot = await getDocs(nameQuery);
      const users: User[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out existing members
        if (!existingMemberIds.includes(doc.id)) {
          users.push({
            id: doc.id,
            displayName: data.displayName || 'Unknown User',
            email: data.email || '',
            photoURL: data.photoURL,
          });
        }
      });

      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    setIsAdding(true);
    try {
      await onAddMembers(selectedUsers);
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
      onDismiss();
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'Failed to add members. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDismiss = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    onDismiss();
  };

  const renderUserItem = useCallback(({ item }: { item: User }) => {
    const isSelected = selectedUsers.some((u) => u.id === item.id);

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          {item.photoURL ? (
            <Avatar.Image size={44} source={{ uri: item.photoURL }} />
          ) : (
            <Avatar.Text
              size={44}
              label={item.displayName.charAt(0)}
              style={{ backgroundColor: theme.colors.primaryContainer }}
            />
          )}
          <View style={styles.userDetails}>
            <Text variant="titleSmall" style={{ fontWeight: '600' }}>
              {item.displayName}
            </Text>
            <Text variant="bodySmall" style={{ opacity: 0.7 }}>
              {item.email}
            </Text>
          </View>
        </View>
        <Checkbox
          status={isSelected ? 'checked' : 'unchecked'}
          onPress={() => toggleUserSelection(item)}
          color={theme.colors.primary}
        />
      </View>
    );
  }, [selectedUsers, theme.colors]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="account-plus"
            size={28}
            color={theme.colors.primary}
          />
          <Text variant="headlineSmall" style={styles.title}>
            Add Members
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.subtitle}>
          Add members to {groupName}
        </Text>

        <TextInput
          mode="outlined"
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          right={
            isSearching ? (
              <TextInput.Icon icon={() => <ActivityIndicator size={20} />} />
            ) : searchQuery ? (
              <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} />
            ) : null
          }
          style={styles.searchInput}
        />

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text variant="labelMedium" style={styles.selectedLabel}>
              Selected ({selectedUsers.length})
            </Text>
            <View style={styles.selectedChips}>
              {selectedUsers.map((user) => (
                <Chip
                  key={user.id}
                  onClose={() => toggleUserSelection(user)}
                  style={styles.chip}
                  avatar={
                    user.photoURL ? (
                      <Avatar.Image size={24} source={{ uri: user.photoURL }} />
                    ) : (
                      <Avatar.Text size={24} label={user.displayName.charAt(0)} />
                    )
                  }
                >
                  {user.displayName}
                </Chip>
              ))}
            </View>
          </View>
        )}

        <Divider style={{ marginVertical: 12 }} />

        {/* Search Results */}
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          style={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {searchQuery.length >= 2 ? (
                isSearching ? (
                  <ActivityIndicator />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="account-search"
                      size={48}
                      color={theme.colors.outline}
                    />
                    <Text variant="bodyMedium" style={{ opacity: 0.6, marginTop: 8 }}>
                      No users found
                    </Text>
                  </>
                )
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="account-search-outline"
                    size={48}
                    color={theme.colors.outline}
                  />
                  <Text variant="bodyMedium" style={{ opacity: 0.6, marginTop: 8 }}>
                    Search for users to add
                  </Text>
                  <Text variant="bodySmall" style={{ opacity: 0.5, marginTop: 4 }}>
                    Type at least 2 characters
                  </Text>
                </>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={handleDismiss}
            style={styles.button}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleAddMembers}
            style={styles.button}
            disabled={selectedUsers.length === 0 || isAdding}
            loading={isAdding}
            icon="account-plus"
          >
            Add ({selectedUsers.length})
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 12,
  },
  selectedContainer: {
    marginBottom: 8,
  },
  selectedLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  resultsList: {
    maxHeight: 280,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
});
