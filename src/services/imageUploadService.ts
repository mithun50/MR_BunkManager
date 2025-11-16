import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

class ImageUploadService {
  /**
   * Convert any image format to PNG for better compatibility
   * @param imageUri - Local file URI
   * @returns URI of converted PNG image
   */
  private async convertToPNG(imageUri: string): Promise<string> {
    try {
      console.log('Converting image to PNG format...');
      const manipulatedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }], // Resize to reasonable size
        {
          compress: 0.9,
          format: SaveFormat.PNG
        }
      );
      console.log('Image converted to PNG:', manipulatedImage.uri);
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Image conversion error:', error);
      // If conversion fails, return original URI
      return imageUri;
    }
  }

  /**
   * Upload image to Catbox.moe (FREE, no API key needed!)
   * Converts all images to PNG for better compatibility
   * @param imageUri - Local file URI (from image picker)
   * @returns URL of uploaded image
   */
  async uploadImage(imageUri: string): Promise<string> {
    try {
      // Convert to PNG for better compatibility
      const pngUri = await this.convertToPNG(imageUri);

      // Create form data for Catbox (React Native compatible)
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');

      // Upload as PNG
      formData.append('fileToUpload', {
        uri: pngUri,
        type: 'image/png',
        name: 'avatar.png',
      } as any);

      console.log('Uploading PNG to Catbox...');

      // Upload to Catbox (no API key needed!)
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = await response.text();

      // Catbox returns the URL directly as plain text
      if (!url || !url.startsWith('https://')) {
        throw new Error('Invalid response from server');
      }

      console.log('Image uploaded to Catbox:', url);
      return url;
    } catch (error: any) {
      console.error('Catbox upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  /**
   * Alternative: Upload using base64 directly
   */
  async uploadImageBase64(base64Image: string, mimeType: string = 'image/jpeg'): Promise<string> {
    try {
      // Create a data URI from base64
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', {
        uri: dataUri,
        type: mimeType,
        name: 'image.jpg',
      } as any);

      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = await response.text();

      if (!url || !url.startsWith('https://')) {
        throw new Error('Invalid response from server');
      }

      return url;
    } catch (error: any) {
      console.error('Catbox upload error:', error);
      throw new Error('Failed to upload image.');
    }
  }
}

export default new ImageUploadService();
