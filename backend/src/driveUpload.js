/**
 * Google Drive Upload Service
 *
 * Uses a Service Account to upload files to a shared Google Drive folder.
 * All users' notes files are stored in one centralized folder.
 *
 * Setup required:
 * 1. Create a Google Cloud Project
 * 2. Enable Google Drive API
 * 3. Create a Service Account
 * 4. Download the JSON key file
 * 5. Create a folder in Google Drive and share it with the service account email
 * 6. Set GOOGLE_DRIVE_FOLDER_ID in .env
 */

import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Initialize Google Drive API with Service Account
let driveClient = null;

/**
 * Initialize the Google Drive client with service account credentials
 */
function initializeDriveClient() {
  if (driveClient) return driveClient;

  try {
    const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
                        path.join(process.cwd(), 'config', 'serviceAccountKey.json');

    if (!fs.existsSync(keyFilePath)) {
      console.error('❌ Google Service Account key file not found at:', keyFilePath);
      console.error('Please create a service account and download the JSON key file');
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    driveClient = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive client initialized');
    return driveClient;
  } catch (error) {
    console.error('❌ Error initializing Google Drive client:', error);
    return null;
  }
}

/**
 * Upload a file to Google Drive
 *
 * @param {Buffer} fileBuffer - The file data as a buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{fileId: string, webViewLink: string, webContentLink: string, thumbnailLink: string}>}
 */
export async function uploadFileToDrive(fileBuffer, fileName, mimeType) {
  const drive = initializeDriveClient();
  if (!drive) {
    throw new Error('Google Drive client not initialized. Check service account configuration.');
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID not set in environment variables');
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;

    // Create a readable stream from the buffer
    const { Readable } = await import('stream');
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    // Upload file to Drive
    const response = await drive.files.create({
      requestBody: {
        name: uniqueFileName,
        parents: [folderId],
      },
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
      fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink, size',
    });

    const fileId = response.data.id;

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Get updated file info with public links
    const fileInfo = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink, size',
    });

    console.log(`✅ File uploaded to Drive: ${uniqueFileName}`);

    return {
      fileId: fileInfo.data.id,
      fileName: fileInfo.data.name,
      mimeType: fileInfo.data.mimeType,
      size: parseInt(fileInfo.data.size) || 0,
      webViewLink: fileInfo.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: fileInfo.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`,
      thumbnailLink: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
    };
  } catch (error) {
    console.error('❌ Error uploading file to Drive:', error);
    throw error;
  }
}

/**
 * Delete a file from Google Drive
 *
 * @param {string} fileId - The Google Drive file ID
 */
export async function deleteFileFromDrive(fileId) {
  const drive = initializeDriveClient();
  if (!drive) {
    throw new Error('Google Drive client not initialized');
  }

  try {
    await drive.files.delete({ fileId });
    console.log(`🗑️ File deleted from Drive: ${fileId}`);
    return true;
  } catch (error) {
    // If file not found, treat as success
    if (error.code === 404) {
      console.log(`⚠️ File not found on Drive: ${fileId}`);
      return true;
    }
    console.error('❌ Error deleting file from Drive:', error);
    throw error;
  }
}

/**
 * Get direct download URL for a file
 */
export function getDirectDownloadUrl(fileId) {
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

/**
 * Get preview/view URL for a file
 */
export function getPreviewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Get thumbnail URL for a file
 */
export function getThumbnailUrl(fileId, size = 400) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}
