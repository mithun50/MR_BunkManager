import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, Avatar, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ProfileSetupScreenProps {
  onNext: (data: ProfileData) => void;
  initialData?: ProfileData;
}

export interface ProfileData {
  displayName: string;
  college: string;
  course: string;
  department: string;
  semester: string;
  rollNumber: string;
  section?: string;
  photoURL?: string;
}

export default function ProfileSetupScreen({ onNext, initialData }: ProfileSetupScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [college, setCollege] = useState(initialData?.college || '');
  const [course, setCourse] = useState(initialData?.course || '');
  const [department, setDepartment] = useState(initialData?.department || '');
  const [semester, setSemester] = useState(initialData?.semester || '');
  const [rollNumber, setRollNumber] = useState(initialData?.rollNumber || '');
  const [section, setSection] = useState(initialData?.section || '');
  const [photoURL, setPhotoURL] = useState(initialData?.photoURL || '');
  const [error, setError] = useState('');

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        setError('Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (err) {
      setError('Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        setError('Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (err) {
      setError('Failed to take photo');
    }
  };

  const validateAndNext = () => {
    setError('');

    if (!displayName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!college.trim()) {
      setError('Please enter your college name');
      return;
    }

    if (!course.trim()) {
      setError('Please enter your course');
      return;
    }

    if (!department.trim()) {
      setError('Please enter your branch');
      return;
    }

    if (!semester.trim()) {
      setError('Please enter your semester');
      return;
    }

    if (!rollNumber.trim()) {
      setError('Please enter your USN number');
      return;
    }

    onNext({
      displayName: displayName.trim(),
      college: college.trim(),
      course: course.trim(),
      department: department.trim(),
      semester: semester.trim(),
      rollNumber: rollNumber.trim(),
      section: section.trim() || undefined,
      photoURL: photoURL || undefined,
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
              Complete Your Profile
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Tell us about yourself
            </Text>
          </View>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatarImage} />
            ) : (
              <Avatar.Icon
                size={120}
                icon="account"
                style={{ backgroundColor: theme.colors.primaryContainer }}
              />
            )}
            <View style={styles.avatarButtons}>
              <IconButton
                icon="camera"
                mode="contained"
                size={24}
                onPress={takePhoto}
                containerColor={theme.colors.primary}
                iconColor={theme.colors.onPrimary}
              />
              <IconButton
                icon="image"
                mode="contained"
                size={24}
                onPress={pickImage}
                containerColor={theme.colors.secondary}
                iconColor={theme.colors.onSecondary}
              />
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Full Name *"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
              autoCapitalize="words"
            />

            <TextInput
              label="College/University *"
              value={college}
              onChangeText={setCollege}
              mode="outlined"
              left={<TextInput.Icon icon="school" />}
              style={styles.input}
            />

            <TextInput
              label="Course *"
              value={course}
              onChangeText={setCourse}
              mode="outlined"
              left={<TextInput.Icon icon="school-outline" />}
              style={styles.input}
              placeholder="e.g., B.Tech, BCA, MCA"
            />

            <TextInput
              label="Branch/Stream *"
              value={department}
              onChangeText={setDepartment}
              mode="outlined"
              left={<TextInput.Icon icon="book-open-variant" />}
              style={styles.input}
              placeholder="e.g., Computer Science, Information Science"
            />

            <View style={styles.row}>
              <TextInput
                label="Semester *"
                value={semester}
                onChangeText={setSemester}
                mode="outlined"
                left={<TextInput.Icon icon="numeric" />}
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
                placeholder="e.g., 3"
              />

              <TextInput
                label="Section"
                value={section}
                onChangeText={setSection}
                mode="outlined"
                left={<TextInput.Icon icon="alpha-a" />}
                style={[styles.input, styles.halfInput]}
                placeholder="e.g., A"
              />
            </View>

            <TextInput
              label="USN No / Roll No *"
              value={rollNumber}
              onChangeText={setRollNumber}
              mode="outlined"
              left={<TextInput.Icon icon="card-account-details" />}
              style={styles.input}
              placeholder="e.g., 1CR21CS001"
              autoCapitalize="characters"
            />

            {error ? (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={validateAndNext}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="arrow-right"
            >
              Continue
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
