import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { NoteEditor } from '@/src/components/notes';
import { CreateNoteInput } from '@/src/types/notes';
import { UserProfile } from '@/src/types/user';
import notesService from '@/src/services/notesService';
import firestoreService from '@/src/services/firestoreService';

export default function CreateNoteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [userProfile, userSubjects] = await Promise.all([
          firestoreService.getUserProfile(user.uid),
          firestoreService.getSubjects(user.uid),
        ]);
        setProfile(userProfile);
        setSubjects(userSubjects.map((s) => s.name));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [user]);

  const handleSubmit = async (noteData: CreateNoteInput) => {
    if (!profile) {
      Alert.alert('Error', 'Profile not loaded');
      return;
    }

    try {
      await notesService.createNote(profile, noteData);
      Alert.alert('Success', 'Note posted successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating note:', error);
      Alert.alert('Error', error.message || 'Failed to create note');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface, marginTop: insets.top }}
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Create Note" />
      </Appbar.Header>

      <NoteEditor
        subjects={subjects}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
