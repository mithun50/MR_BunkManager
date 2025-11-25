import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

// File types allowed by Catbox
const CATBOX_ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'svg',
  'mp3', 'mp4', 'webm', 'ogg', 'wav', 'flac', 'm4a',
  'pdf', 'txt', 'json', 'xml', 'csv', 'html', 'css', 'js',
  'zip', 'rar', '7z', 'tar', 'gz',
];

class FileUploadService {
  /**
   * Check if file type is supported
   */
  isFileTypeSupported(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return CATBOX_ALLOWED_EXTENSIONS.includes(extension);
  }

  /**
   * Get list of supported formats for display
   */
  getSupportedFormats(): string {
    return 'Images (jpg, png, gif, webp), Videos (mp4, webm), Audio (mp3, wav, ogg), Documents (pdf, txt), Archives (zip, rar)';
  }

  /**
   * Upload file to Catbox - only supported formats
   */
  async uploadFile(fileUri: string, fileName: string, mimeType: string): Promise<string> {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    if (!CATBOX_ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(`Unsupported file format: .${extension}\n\nSupported formats:\n${this.getSupportedFormats()}`);
    }

    return this.uploadToCatbox(fileUri, fileName, mimeType);
  }

  /**
   * Upload to Catbox.moe
   */
  private async uploadToCatbox(fileUri: string, fileName: string, mimeType: string): Promise<string> {
    try {
      console.log('📤 Uploading to Catbox:', fileName, mimeType);

      const formData = new FormData();
      formData.append('reqtype', 'fileupload');

      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        formData.append('fileToUpload', blob, fileName);
      } else {
        formData.append('fileToUpload', {
          uri: fileUri,
          type: mimeType,
          name: fileName,
        } as any);
      }

      const uploadResponse = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData,
        headers: Platform.OS === 'web' ? {} : {
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = await uploadResponse.text();
      const trimmedUrl = url.trim();

      if (!trimmedUrl || !trimmedUrl.startsWith('https://')) {
        throw new Error('Invalid response from Catbox: ' + trimmedUrl);
      }

      console.log('✅ File uploaded to Catbox:', trimmedUrl);
      return trimmedUrl;
    } catch (error: any) {
      console.error('❌ Catbox upload error:', error);
      throw new Error('Failed to upload file. Please try again.');
    }
  }

  /**
   * Pick a document from the device
   * Supports: PDF, images, etc.
   */
  async pickDocument(): Promise<{ uri: string; name: string; mimeType: string } | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const file = result.assets[0];

      return {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
      };
    } catch (error) {
      console.error('❌ Error picking document:', error);
      throw error;
    }
  }

  /**
   * Pick an image from the device
   */
  async pickImage(): Promise<{ uri: string; name: string; mimeType: string } | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const file = result.assets[0];

      return {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType || 'image/jpeg',
      };
    } catch (error) {
      console.error('❌ Error picking image:', error);
      throw error;
    }
  }

  /**
   * Get file type from MIME type
   */
  getFileType(mimeType: string): 'image' | 'pdf' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      mimeType.includes('text')
    ) return 'document';
    return 'other';
  }

  /**
   * Get file icon name based on MIME type
   */
  getFileIcon(mimeType: string): string {
    const type = this.getFileType(mimeType);
    switch (type) {
      case 'image': return 'file-image';
      case 'pdf': return 'file-pdf-box';
      case 'document': return 'file-document';
      default: return 'file';
    }
  }
}

export default new FileUploadService();
