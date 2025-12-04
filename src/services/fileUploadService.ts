import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

// Backend URL for proxy uploads (web platform needs this due to CORS)
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://mr-bunk-manager-backend.vercel.app';

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
   * On web: Uses backend proxy to bypass CORS restrictions
   * On mobile: Direct upload to Catbox (no CORS issues)
   */
  private async uploadToCatbox(fileUri: string, fileName: string, mimeType: string): Promise<string> {
    try {
      console.log('📤 Uploading to Catbox:', fileName, mimeType, `(Platform: ${Platform.OS})`);

      if (Platform.OS === 'web') {
        // Web: Use backend proxy to bypass CORS
        return await this.uploadViaBackendProxy(fileUri, fileName, mimeType);
      } else {
        // Mobile: Direct upload to Catbox (no CORS restrictions)
        return await this.uploadDirectToCatbox(fileUri, fileName, mimeType);
      }
    } catch (error: any) {
      console.error('❌ Catbox upload error:', error);
      throw new Error('Failed to upload file. Please try again.');
    }
  }

  /**
   * Upload via backend proxy (for web platform - bypasses CORS)
   */
  private async uploadViaBackendProxy(fileUri: string, fileName: string, mimeType: string): Promise<string> {
    console.log('🌐 Using backend proxy for web upload...');

    // Fetch the file as blob from the local URI
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Create form data for backend
    const formData = new FormData();
    formData.append('file', blob, fileName);

    // Upload to backend proxy endpoint
    const uploadResponse = await fetch(`${BACKEND_URL}/upload-catbox`, {
      method: 'POST',
      body: formData,
    });

    const result = await uploadResponse.json();

    if (!result.success || !result.url) {
      throw new Error(result.error || 'Backend proxy upload failed');
    }

    console.log('✅ File uploaded via backend proxy:', result.url);
    return result.url;
  }

  /**
   * Direct upload to Catbox (for mobile platforms)
   */
  private async uploadDirectToCatbox(fileUri: string, fileName: string, mimeType: string): Promise<string> {
    console.log('📱 Direct upload to Catbox (mobile)...');

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as any);

    const uploadResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const url = await uploadResponse.text();
    const trimmedUrl = url.trim();

    if (!trimmedUrl || !trimmedUrl.startsWith('https://')) {
      throw new Error('Invalid response from Catbox: ' + trimmedUrl);
    }

    console.log('✅ File uploaded directly to Catbox:', trimmedUrl);
    return trimmedUrl;
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
