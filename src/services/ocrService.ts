import { Platform } from 'react-native';
import { File } from 'expo-file-system/next';

const OCR_API_URL = 'https://api.ocr.space/parse/image';
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY;

export interface OCRResult {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * Detect image MIME type from base64 or file extension
 */
function getImageMimeType(imageUri: string): string {
  const lower = imageUri.toLowerCase();

  // Check data URI prefix
  if (lower.startsWith('data:image/png')) return 'image/png';
  if (lower.startsWith('data:image/jpeg') || lower.startsWith('data:image/jpg')) return 'image/jpeg';
  if (lower.startsWith('data:image/gif')) return 'image/gif';
  if (lower.startsWith('data:image/webp')) return 'image/webp';
  if (lower.startsWith('data:image/bmp')) return 'image/bmp';
  if (lower.startsWith('data:image/tiff')) return 'image/tiff';

  // Check file extension
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.bmp')) return 'image/bmp';
  if (lower.includes('.tiff') || lower.includes('.tif')) return 'image/tiff';

  // Default to JPEG
  return 'image/jpeg';
}

/**
 * Extract text from an image using OCR.space API
 * @param imageUri - Local file URI, base64 string, or URL
 * @returns OCRResult with extracted text
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  try {
    if (!OCR_API_KEY) {
      return {
        success: false,
        text: '',
        error: 'OCR API key not configured',
      };
    }

    const formData = new FormData();
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2');
    formData.append('isTable', 'true');
    formData.append('scale', 'true');
    formData.append('filetype', 'AUTO'); // Auto-detect file type

    // Handle different image input types
    if (imageUri.startsWith('data:')) {
      // Base64 string (works on both web and native)
      formData.append('base64Image', imageUri);
    } else if (imageUri.startsWith('file://') || imageUri.startsWith('/') || imageUri.startsWith('content://')) {
      // Local file - convert to base64 (native only)
      if (Platform.OS === 'web') {
        return {
          success: false,
          text: '',
          error: 'File URI not supported on web. Please use image upload.',
        };
      }

      try {
        // Use new expo-file-system/next API (Expo SDK 54+)
        const file = new File(imageUri);
        const base64 = await file.base64();
        const mimeType = getImageMimeType(imageUri);
        formData.append('base64Image', `data:${mimeType};base64,${base64}`);
      } catch (fsError) {
        console.error('FileSystem error:', fsError);
        return {
          success: false,
          text: '',
          error: 'Failed to read image file: ' + (fsError instanceof Error ? fsError.message : 'Unknown error'),
        };
      }
    } else if (imageUri.startsWith('http')) {
      // URL
      formData.append('url', imageUri);
    } else {
      return {
        success: false,
        text: '',
        error: 'Invalid image URI format. Supported: JPG, PNG, GIF, BMP, TIFF, WebP',
      };
    }

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      return {
        success: false,
        text: '',
        error: result.ErrorMessage?.[0] || 'OCR processing failed',
      };
    }

    if (result.ParsedResults && result.ParsedResults.length > 0) {
      const extractedText = result.ParsedResults
        .map((r: { ParsedText: string }) => r.ParsedText)
        .join('\n');

      return {
        success: true,
        text: extractedText.trim(),
      };
    }

    return {
      success: false,
      text: '',
      error: 'No text found in image',
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'OCR extraction failed',
    };
  }
}
