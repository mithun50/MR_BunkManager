import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Chip,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CreateGroupModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    category: 'study' | 'project' | 'social' | 'general';
    isPrivate: boolean;
  }) => Promise<void>;
}

const CATEGORIES = [
  { key: 'study', label: 'Study', icon: 'book-open-variant' },
  { key: 'project', label: 'Project', icon: 'briefcase' },
  { key: 'social', label: 'Social', icon: 'account-group' },
  { key: 'general', label: 'General', icon: 'forum' },
] as const;

export function CreateGroupModal({ visible, onDismiss, onSubmit }: CreateGroupModalProps) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'study' | 'project' | 'social' | 'general'>('study');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        category,
        isPrivate,
      });
      // Reset form
      setName('');
      setDescription('');
      setCategory('study');
      setIsPrivate(false);
      onDismiss();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setName('');
    setDescription('');
    setCategory('study');
    setIsPrivate(false);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="headlineSmall" style={styles.title}>
            Create New Group
          </Text>

          <TextInput
            label="Group Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Data Structures Study Group"
            maxLength={50}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="What's this group about?"
            maxLength={200}
          />

          <Text variant="titleSmall" style={styles.label}>
            Category
          </Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat.key}
                selected={category === cat.key}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.categoryChip,
                  category === cat.key && { backgroundColor: theme.colors.primaryContainer }
                ]}
                textStyle={{
                  color: category === cat.key ? theme.colors.primary : theme.colors.onSurface,
                  fontWeight: category === cat.key ? '700' : '500',
                }}
                icon={() => (
                  <MaterialCommunityIcons
                    name={cat.icon}
                    size={18}
                    color={category === cat.key ? theme.colors.primary : theme.colors.onSurface}
                  />
                )}
                mode={category === cat.key ? 'flat' : 'outlined'}
              >
                {cat.label}
              </Chip>
            ))}
          </View>

          <View style={styles.privacyRow}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall">Private Group</Text>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                Only invited members can join
              </Text>
            </View>
            <Button
              mode={isPrivate ? 'contained' : 'outlined'}
              onPress={() => setIsPrivate(!isPrivate)}
              compact
              icon={isPrivate ? 'lock' : 'earth'}
            >
              {isPrivate ? 'Private' : 'Public'}
            </Button>
          </View>

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleDismiss}
              style={styles.button}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              disabled={!name.trim() || isSubmitting}
              loading={isSubmitting}
            >
              Create
            </Button>
          </View>
        </ScrollView>
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
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    marginRight: 0,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
