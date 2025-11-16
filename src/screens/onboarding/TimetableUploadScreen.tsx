import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, Card, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import geminiService from '../../services/geminiService';
import { TimetableEntry } from '../../types/user';

interface TimetableUploadScreenProps {
  onNext: (timetable: TimetableEntry[]) => void;
  onSkip: () => void;
}

export default function TimetableUploadScreen({ onNext, onSkip }: TimetableUploadScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery permission to upload timetable');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0].uri);
        setExtracted(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permission');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0].uri);
        setExtracted(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };


  const extractTimetable = async () => {
    if (!selectedFile) return;

    setExtracting(true);
    try {
      const timetableData = await geminiService.extractTimetableFromImage(selectedFile);

      if (timetableData.length === 0) {
        Alert.alert('No Data Found', 'Could not extract timetable data. Please try another image or add manually.');
        return;
      }

      setExtracted(true);
      Alert.alert(
        'Success!',
        `Extracted ${timetableData.length} classes from your timetable. You can review and edit them in the next step.`,
        [
          {
            text: 'Continue',
            onPress: () => onNext(timetableData),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Extraction Failed', error.message || 'Failed to extract timetable. Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setExtracted(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="timetable" size={64} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Upload Your Timetable
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          We'll use AI to extract your class schedule
        </Text>
      </View>

      {/* Upload Options */}
      {!selectedFile && (
        <View style={styles.uploadOptions}>
          <Card style={styles.optionCard} onPress={takePhoto}>
            <Card.Content style={styles.optionContent}>
              <MaterialCommunityIcons name="camera" size={48} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.optionTitle}>
                Take Photo
              </Text>
              <Text variant="bodySmall" style={styles.optionDescription}>
                Capture your timetable
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.optionCard} onPress={pickImage}>
            <Card.Content style={styles.optionContent}>
              <MaterialCommunityIcons name="image" size={48} color={theme.colors.secondary} />
              <Text variant="titleMedium" style={styles.optionTitle}>
                Choose Image
              </Text>
              <Text variant="bodySmall" style={styles.optionDescription}>
                From your gallery
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Selected File Preview */}
      {selectedFile && (
        <View style={styles.preview}>
          <Card style={styles.previewCard}>
            <Card.Content>
              <View style={styles.previewHeader}>
                <Text variant="titleMedium">Selected Image</Text>
                <IconButton icon="close" size={20} onPress={removeFile} />
              </View>

              <Image source={{ uri: selectedFile }} style={styles.previewImage} resizeMode="contain" />
            </Card.Content>
          </Card>

          {extracting ? (
            <View style={styles.extractingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.extractingText}>
                Extracting timetable with AI...
              </Text>
              <Text variant="bodySmall" style={styles.extractingSubtext}>
                This may take a few seconds
              </Text>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={extractTimetable}
              style={styles.extractButton}
              contentStyle={styles.buttonContent}
              icon="robot"
            >
              Extract with AI
            </Button>
          )}
        </View>
      )}

      {/* Skip Button */}
      <Button mode="text" onPress={onSkip} style={styles.skipButton}>
        Skip for now (Add manually later)
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
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
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  uploadOptions: {
    gap: 16,
    marginBottom: 24,
  },
  optionCard: {
    elevation: 2,
  },
  optionContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  optionTitle: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  optionDescription: {
    marginTop: 4,
    opacity: 0.7,
  },
  preview: {
    marginBottom: 24,
  },
  previewCard: {
    elevation: 2,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  extractingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  extractingText: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  extractingSubtext: {
    marginTop: 8,
    opacity: 0.7,
  },
  extractButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  skipButton: {
    marginTop: 16,
  },
});
