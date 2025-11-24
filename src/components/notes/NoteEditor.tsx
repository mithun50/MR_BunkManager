import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  Chip,
  IconButton,
  Surface,
  useTheme,
  ProgressBar,
} from 'react-native-paper';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NoteContentType, CreateNoteInput } from '../../types/notes';
import googleDriveService from '../../services/googleDriveService';

interface NoteEditorProps {
  initialData?: Partial<CreateNoteInput>;
  subjects?: string[];
  onSubmit: (note: CreateNoteInput) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function NoteEditor({
  initialData,
  subjects = [],
  onSubmit,
  onCancel,
  isEditing = false,
}: NoteEditorProps) {
  const theme = useTheme();
  const [contentType, setContentType] = useState<NoteContentType>(
    initialData?.contentType || 'text'
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [fileUrl, setFileUrl] = useState(initialData?.fileUrl || '');
  const [fileName, setFileName] = useState(initialData?.fileName || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailUrl || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadFile(
        result.assets[0].uri,
        result.assets[0].fileName || 'image.jpg',
        'image/jpeg'
      );
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadFile(
        result.assets[0].uri,
        `photo_${Date.now()}.jpg`,
        'image/jpeg'
      );
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadFile(
        result.assets[0].uri,
        result.assets[0].name,
        result.assets[0].mimeType || 'application/pdf'
      );
    }
  };

  const uploadFile = async (uri: string, name: string, mimeType: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await googleDriveService.uploadFile(uri, name, mimeType, (progress) => {
        setUploadProgress(progress / 100);
      });
      setFileUrl(result.webViewLink);
      setFileName(result.fileName);
      setThumbnailUrl(result.thumbnailLink || googleDriveService.getThumbnailUrl(result.fileId));
      Alert.alert('Success', 'File uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Could not upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a title');
      return;
    }

    if (contentType === 'text' && !content.trim()) {
      Alert.alert('Validation', 'Please enter some content');
      return;
    }

    if ((contentType === 'image' || contentType === 'pdf') && !fileUrl) {
      Alert.alert('Validation', 'Please upload a file');
      return;
    }

    if (contentType === 'link' && !content.trim()) {
      Alert.alert('Validation', 'Please enter a URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        contentType,
        content: content.trim(),
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        subject: subject || undefined,
        tags,
        isPublic,
      });
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Content Type Selector */}
        <Text variant="labelLarge" style={styles.label}>
          Note Type
        </Text>
        <SegmentedButtons
          value={contentType}
          onValueChange={(value) => setContentType(value as NoteContentType)}
          buttons={[
            { value: 'text', label: 'Text', icon: 'text-box' },
            { value: 'image', label: 'Image', icon: 'image' },
            { value: 'pdf', label: 'PDF', icon: 'file-pdf-box' },
            { value: 'link', label: 'Link', icon: 'link-variant' },
          ]}
          style={styles.segmented}
        />

        {/* Title */}
        <TextInput
          label="Title *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          maxLength={100}
        />

        {/* Description */}
        <TextInput
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={2}
          style={styles.input}
          maxLength={300}
        />

        {/* Content based on type */}
        {contentType === 'text' && (
          <TextInput
            label="Note Content *"
            value={content}
            onChangeText={setContent}
            mode="outlined"
            multiline
            numberOfLines={8}
            style={[styles.input, styles.contentInput]}
          />
        )}

        {contentType === 'link' && (
          <TextInput
            label="URL *"
            value={content}
            onChangeText={setContent}
            mode="outlined"
            keyboardType="url"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="link" />}
          />
        )}

        {(contentType === 'image' || contentType === 'pdf') && (
          <Surface style={[styles.uploadSection, { backgroundColor: theme.colors.surfaceVariant }]}>
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <Text variant="bodyMedium">Uploading to Google Drive...</Text>
                <ProgressBar progress={uploadProgress} style={styles.progressBar} />
              </View>
            ) : fileUrl ? (
              <View style={styles.filePreview}>
                {contentType === 'image' && thumbnailUrl && (
                  <Image source={{ uri: thumbnailUrl }} style={styles.previewImage} contentFit="cover" />
                )}
                <View style={styles.fileInfo}>
                  <MaterialCommunityIcons
                    name={contentType === 'pdf' ? 'file-pdf-box' : 'image'}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text variant="bodyMedium" numberOfLines={1} style={styles.fileName}>
                    {fileName}
                  </Text>
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => {
                      setFileUrl('');
                      setFileName('');
                      setThumbnailUrl('');
                    }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.uploadButtons}>
                <Button
                  mode="outlined"
                  icon={contentType === 'image' ? 'image' : 'file-upload'}
                  onPress={contentType === 'image' ? pickImage : pickDocument}
                >
                  Choose {contentType === 'image' ? 'Image' : 'File'}
                </Button>
                {contentType === 'image' && (
                  <Button mode="outlined" icon="camera" onPress={takePhoto}>
                    Take Photo
                  </Button>
                )}
              </View>
            )}
          </Surface>
        )}

        {/* Subject Selector */}
        {subjects.length > 0 && (
          <>
            <Text variant="labelLarge" style={styles.label}>
              Subject (optional)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subjectScroll}
            >
              {subjects.map((s) => (
                <Chip
                  key={s}
                  selected={subject === s}
                  onPress={() => setSubject(subject === s ? '' : s)}
                  style={styles.subjectChip}
                >
                  {s}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        {/* Tags */}
        <Text variant="labelLarge" style={styles.label}>
          Tags (up to 5)
        </Text>
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <Chip key={tag} onClose={() => removeTag(tag)} style={styles.tag}>
              #{tag}
            </Chip>
          ))}
        </View>
        {tags.length < 5 && (
          <View style={styles.tagInputRow}>
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add tag..."
              mode="outlined"
              dense
              style={styles.tagInput}
              onSubmitEditing={addTag}
            />
            <IconButton icon="plus" mode="contained" onPress={addTag} disabled={!tagInput.trim()} />
          </View>
        )}

        {/* Visibility */}
        <SegmentedButtons
          value={isPublic ? 'public' : 'private'}
          onValueChange={(value) => setIsPublic(value === 'public')}
          buttons={[
            { value: 'public', label: 'Public', icon: 'earth' },
            { value: 'private', label: 'Private', icon: 'lock' },
          ]}
          style={styles.segmented}
        />

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button mode="outlined" onPress={onCancel} style={styles.actionButton}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || isUploading}
            style={styles.actionButton}
          >
            {isEditing ? 'Update' : 'Post'} Note
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  contentInput: {
    minHeight: 200,
  },
  segmented: {
    marginBottom: 16,
  },
  uploadSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  progressBar: {
    width: '100%',
    marginTop: 12,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  filePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
  },
  subjectScroll: {
    marginBottom: 12,
  },
  subjectChip: {
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    marginBottom: 4,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
