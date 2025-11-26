import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Group } from '../../types/groups';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
  onJoin?: () => void;
  showJoinButton?: boolean;
  isMember?: boolean;
}

export function GroupCard({ group, onPress, onJoin, showJoinButton, isMember }: GroupCardProps) {
  const theme = useTheme();

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

  const categoryColor = getCategoryColor(group.category);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: categoryColor + '15' }]}>
              <MaterialCommunityIcons
                name={getCategoryIcon(group.category)}
                size={28}
                color={categoryColor}
              />
            </View>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
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
              <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
                {group.description || 'No description provided'}
              </Text>
              <View style={styles.meta}>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                  <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {group.category.toUpperCase()}
                  </Text>
                </View>
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

          {showJoinButton && !isMember && (
            <Button
              mode="contained"
              icon="account-plus"
              onPress={(e) => {
                e.stopPropagation();
                onJoin?.();
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
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  description: {
    opacity: 0.7,
    lineHeight: 18,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
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
});
