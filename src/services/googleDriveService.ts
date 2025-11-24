import * as FileSystem from 'expo-file-system/legacy';

interface UploadResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
  size: number;
}

class FileUploadService {
  /**
   * Upload a file to Catbox.moe (free, no API key needed)
   * Perfect for college projects - simple and reliable
   */
  async uploadFile(
    fileUri: string,
    fileName: string,
    mimeType: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      onProgress?.(10);

      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }

      onProgress?.(20);

      // Create form data with file
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      onProgress?.(40);

      // Upload to Catbox
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData,
      });

      onProgress?.(80);

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      // Catbox returns the URL as plain text
      const url = await response.text();

      if (!url.startsWith('https://')) {
        throw new Error(url || 'Upload failed');
      }

      onProgress?.(100);

      // Extract file ID from URL
      const fileId = url.split('/').pop() || '';

      return {
        fileId: fileId,
        fileName: fileName,
        mimeType: mimeType,
        webViewLink: url,
        webContentLink: url,
        thumbnailLink: mimeType.startsWith('image/') ? url : undefined,
        size: fileInfo.size || 0,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async uploadImage(imageUri: string, fileName: string): Promise<UploadResult> {
    const mimeType = fileName.toLowerCase().endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';
    return this.uploadFile(imageUri, fileName, mimeType);
  }

  async uploadPdf(pdfUri: string, fileName: string): Promise<UploadResult> {
    return this.uploadFile(pdfUri, fileName, 'application/pdf');
  }

  async uploadDocument(docUri: string, fileName: string, mimeType: string): Promise<UploadResult> {
    return this.uploadFile(docUri, fileName, mimeType);
  }

  async deleteFile(fileId: string): Promise<void> {
    // Catbox files are permanent - no delete API
    console.log('Catbox files cannot be deleted via API');
  }

  getDirectDownloadUrl(fileId: string): string {
    return `https://files.catbox.moe/${fileId}`;
  }

  getPreviewUrl(fileId: string): string {
    return `https://files.catbox.moe/${fileId}`;
  }

  getViewUrl(fileId: string): string {
    return `https://files.catbox.moe/${fileId}`;
  }

  getThumbnailUrl(fileId: string, size: number = 200): string {
    return `https://files.catbox.moe/${fileId}`;
  }
}

export default new FileUploadService();
