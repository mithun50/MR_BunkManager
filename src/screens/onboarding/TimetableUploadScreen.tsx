import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Platform } from 'react-native';
import { Text, Button, useTheme, Card, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { extractTextFromImage } from '../../services/ocrService';
import { parseTimetableFromText } from '../../services/timetableParserService';
import { TimetableEntry } from '../../types/user';

interface TimetableUploadScreenProps {
  onManual: () => void;
  onSkip: () => void;
  onExtracted?: (entries: TimetableEntry[]) => void;
}

export default function TimetableUploadScreen({ onManual, onSkip, onExtracted }: TimetableUploadScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result && buttons[0]?.onPress) {
          buttons[0].onPress();
        } else if (!result && buttons[1]?.onPress) {
          buttons[1].onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
        if (buttons?.[0]?.onPress) {
          buttons[0].onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const pickImageNative = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission needed', 'Photo library permission is required to select images.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showAlert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickImageWeb = () => {
    // Create hidden file input for web
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result as string;
          await processImage(base64);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const processImage = async (imageUri: string) => {
    setIsProcessing(true);
    setPreviewImage(imageUri);
    setProcessingStatus('Extracting text from image...');

    try {
      // Step 1: OCR extraction
      const ocrResult = await extractTextFromImage(imageUri);

      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'Failed to extract text from image');
      }

      setProcessingStatus('Parsing timetable data...');

      // Step 2: AI parsing
      const parseResult = await parseTimetableFromText(ocrResult.text);

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse timetable');
      }

      setIsProcessing(false);
      setPreviewImage(null);

      // Show success and pass data
      showAlert(
        'Success!',
        `Found ${parseResult.entries.length} class${parseResult.entries.length !== 1 ? 'es' : ''} in your timetable. You can review and edit them in the next step.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              if (onExtracted) {
                onExtracted(parseResult.entries);
              }
            },
          },
        ]
      );
    } catch (error) {
      setIsProcessing(false);
      setPreviewImage(null);
      showAlert(
        'Extraction Failed',
        error instanceof Error ? error.message : 'Failed to process image. Please try again or add classes manually.',
        [
          { text: 'Try Again', onPress: () => {} },
          { text: 'Add Manually', onPress: onManual },
        ]
      );
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      // On web, directly open file picker
      pickImageWeb();
    } else {
      // On native, show options
      Alert.alert(
        'Select Timetable Image',
        'Choose how to add your timetable image',
        [
          { text: 'Take Photo', onPress: () => pickImageNative(true) },
          { text: 'Choose from Gallery', onPress: () => pickImageNative(false) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Processing Modal */}
      <Portal>
        <Modal visible={isProcessing} dismissable={false} contentContainerStyle={styles.modal}>
          <Card style={styles.modalCard}>
            <Card.Content style={styles.modalContent}>
              {previewImage && (
                <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
              )}
              <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
              <Text variant="titleMedium" style={styles.processingText}>
                {processingStatus}
              </Text>
              <Text variant="bodySmall" style={styles.processingSubtext}>
                This may take a few seconds...
              </Text>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="timetable" size={64} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Add Your Timetable
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Extract from image or add classes manually
        </Text>
      </View>

      {/* Extract from Image Card */}
      <Card style={[styles.optionCard, { borderColor: theme.colors.primary }]} mode="outlined">
        <Card.Content style={styles.cardContent}>
          <MaterialCommunityIcons name="image-search" size={48} color={theme.colors.primary} />
          <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Extract from Image
          </Text>
          <Text variant="bodyMedium" style={styles.cardDescription}>
            {Platform.OS === 'web'
              ? 'Upload an image of your timetable. AI will extract the schedule automatically.'
              : 'Take a photo or select an image of your timetable. AI will extract the schedule automatically.'}
          </Text>
          <Button
            mode="contained"
            onPress={showImageOptions}
            style={styles.cardButton}
            icon={Platform.OS === 'web' ? 'upload' : 'camera'}
          >
            {Platform.OS === 'web' ? 'Upload Image' : 'Select Image'}
          </Button>
        </Card.Content>
      </Card>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
        <Text variant="bodyMedium" style={[styles.dividerText, { color: theme.colors.outline }]}>
          OR
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
      </View>

      {/* Manual Entry Card */}
      <Card style={styles.optionCard} mode="outlined">
        <Card.Content style={styles.cardContent}>
          <MaterialCommunityIcons name="pencil" size={48} color={theme.colors.secondary} />
          <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.secondary }]}>
            Manual Entry
          </Text>
          <Text variant="bodyMedium" style={styles.cardDescription}>
            Add your classes one by one with complete control over all details.
          </Text>
          <Button
            mode="outlined"
            onPress={onManual}
            style={styles.cardButton}
            icon="calendar-plus"
          >
            Add Manually
          </Button>
        </Card.Content>
      </Card>

      {/* Skip Button */}
      <Button mode="text" onPress={onSkip} style={styles.skipButton}>
        Skip for now (Add later from Profile)
      </Button>

      {/* Info Card */}
      <Card style={styles.infoCard} mode="outlined">
        <Card.Content>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
            <Text variant="bodySmall" style={styles.infoText}>
              Image extraction works best with clear, well-lit photos of printed timetables. You can always edit the results afterwards.
            </Text>
          </View>
        </Card.Content>
      </Card>
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
    marginBottom: 24,
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
  optionCard: {
    marginBottom: 16,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  cardTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  cardDescription: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  cardButton: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontWeight: '500',
  },
  skipButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  infoCard: {
    borderStyle: 'dashed',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    opacity: 0.7,
  },
  modal: {
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
  },
  modalContent: {
    alignItems: 'center',
    padding: 24,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  loader: {
    marginBottom: 16,
  },
  processingText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  processingSubtext: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 8,
  },
});
