import * as FileSystem from 'expo-file-system/legacy';

class ImageUploadService {
  /**
   * Upload image to Catbox.moe (FREE, no API key needed!)
   * @param imageUri - Local file URI (from image picker)
   * @returns URL of uploaded image
   */
  async uploadImage(imageUri: string): Promise<string> {
    try {
      // Get file extension from URI
      const uriParts = imageUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();

      // Determine mime type
      let mimeType = 'image/jpeg';
      if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
      else if (fileExtension === 'gif') mimeType = 'image/gif';
      else if (fileExtension === 'webp') mimeType = 'image/webp';

      // Create form data for Catbox (React Native compatible)
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');

      // In React Native, we can append the file directly using uri
      formData.append('fileToUpload', {
        uri: imageUri,
        type: mimeType,
        name: `avatar.${fileExtension}`,
      } as any);

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
