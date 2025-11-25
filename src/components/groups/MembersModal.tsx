import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Avatar,
  IconButton,
  Chip,
  Divider,
  Button,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GroupMember } from '../../types/groups';

interface MembersModalProps {
  visible: boolean;
  onDismiss: () => void;
  members: GroupMember[];
  currentUserId: string;
  currentUserRole: 'admin' | 'member' | null;
  onUserPress?: (userId: string) => void;
  onPromoteToAdmin?: (member: GroupMember) => void;
  onDemoteToMember?: (member: GroupMember) => void;
  onRemoveMember?: (member: GroupMember) => void;
}

export function MembersModal({
  visible,
  onDismiss,
  members,
  currentUserId,
  currentUserRole,
  onUserPress,
  onPromoteToAdmin,
  onDemoteToMember,
  onRemoveMember,
}: MembersModalProps) {
  const theme = useTheme();

  const handlePromote = (member: GroupMember) => {
    Alert.alert(
      'Promote to Admin',
      `Make ${member.userName} an admin? They will have full control over the group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Promote', onPress: () => onPromoteToAdmin?.(member) },
      ]
    );
  };

  const handleDemote = (member: GroupMember) => {
    Alert.alert(
      'Remove Admin',
      `Remove admin privileges from ${member.userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDemoteToMember?.(member) },
      ]
    );
  };

  const handleRemove = (member: GroupMember) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.userName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemoveMember?.(member) },
      ]
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="account-multiple"
            size={28}
            color={theme.colors.primary}
          />
          <Text variant="headlineSmall" style={styles.title}>
            Group Members
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.subtitle}>
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </Text>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {members.map((member, index) => (
            <React.Fragment key={member.userId}>
              <View style={styles.memberItem}>
                <Pressable
                  style={styles.memberInfo}
                  onPress={() => onUserPress?.(member.userId)}
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
                  <View style={styles.memberDetails}>
                    <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                      {member.userName}
                    </Text>
                    <View style={styles.roleBadge}>
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

                {member.userId === currentUserId ? (
                  <Chip mode="flat" compact style={{ backgroundColor: theme.colors.primaryContainer }}>
                    You
                  </Chip>
                ) : currentUserRole === 'admin' && (
                  <View style={styles.actions}>
                    {member.role === 'member' ? (
                      <>
                        <IconButton
                          icon="shield-crown"
                          size={20}
                          onPress={() => handlePromote(member)}
                          iconColor={theme.colors.primary}
                        />
                        <IconButton
                          icon="account-remove"
                          size={20}
                          onPress={() => handleRemove(member)}
                          iconColor={theme.colors.error}
                        />
                      </>
                    ) : (
                      <IconButton
                        icon="shield-off"
                        size={20}
                        onPress={() => handleDemote(member)}
                        iconColor={theme.colors.error}
                      />
                    )}
                  </View>
                )}
              </View>
              {index < members.length - 1 && <Divider style={styles.divider} />}
            </React.Fragment>
          ))}
        </ScrollView>

        <Button mode="outlined" onPress={onDismiss} style={styles.closeButton}>
          Close
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '80%',
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
  scrollView: {
    maxHeight: 400,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberDetails: {
    flex: 1,
    gap: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 8,
  },
  closeButton: {
    marginTop: 16,
  },
});
