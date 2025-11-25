/**
 * Vercel Serverless Function Entry Point
 *
 * Pattern: Same as Reshme_Info project
 * - Flat token storage in pushTokens collection
 * - Token as document ID for easy lookup and cleanup
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import multer from 'multer';
import { initializeFirebase, getFirestore } from '../config/firebase.js';
import {
  sendNotificationToUser,
  sendNotificationToAllUsers,
  sendDailyReminders,
  sendClassReminders,
  sendNotificationToFollowers,
  sendNotificationToGroupMembers,
  isValidExpoPushToken
} from '../src/sendNotification.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development';
const IS_PRODUCTION = APP_ENV === 'production';

// CORS Configuration - Allow all origins for mobile app
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200
};

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Initialize Firebase Admin (singleton pattern for serverless)
let db;
try {
  initializeFirebase();
  db = getFirestore();
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Helper functions
function formatISTDateTime(date = new Date()) {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'MR BunkManager Notification Server (Vercel Serverless)',
    timestamp: formatISTDateTime(),
    timezone: 'Asia/Kolkata (IST)',
    pattern: 'Reshme_Info (flat pushTokens collection)'
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MR BunkManager Notification Server',
    pattern: 'Reshme_Info (flat pushTokens collection)',
    endpoints: [
      'GET /health',
      'POST /save-token',
      'DELETE /delete-token',
      'POST /send-notification',
      'POST /notify-group-members',
      'POST /notify-followers',
      'POST /send-notification-all',
      'POST /send-daily-reminders',
      'POST /send-class-reminders',
      'GET /tokens/:userId',
      'POST /upload-catbox',
      'GET /note/:noteId'
    ]
  });
});

/**
 * Save push token to flat pushTokens collection (Reshme_Info pattern)
 * Token is used as document ID for easy lookup and cleanup
 */
app.post('/save-token', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId and token'
      });
    }

    if (!isValidExpoPushToken(token)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid push token format'
      });
    }

    const tokenType = token.startsWith('ExponentPushToken') ? 'expo' : 'fcm';

    // Save to flat pushTokens collection with token as document ID (Reshme_Info pattern)
    await db.collection('pushTokens').doc(token).set({
      token: token,
      userId: userId,
      tokenType: tokenType,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true
    }, { merge: true });

    console.log(`✅ Token saved for user ${userId} (${tokenType})`);

    res.json({
      success: true,
      message: 'Push token saved successfully',
      userId,
      tokenType,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('Error saving token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save push token',
      details: error.message
    });
  }
});

/**
 * Delete push token from flat pushTokens collection
 */
app.delete('/delete-token', async (req, res) => {
  try {
    const { token, userId } = req.body;

    // If token is provided, delete directly
    if (token) {
      await db.collection('pushTokens').doc(token).delete();
      console.log(`🗑️ Token deleted: ${token.substring(0, 20)}...`);

      return res.json({
        success: true,
        message: 'Push token deleted successfully',
        timestamp: formatISTDateTime()
      });
    }

    // If only userId is provided, delete all tokens for that user
    if (userId) {
      const tokensSnapshot = await db
        .collection('pushTokens')
        .where('userId', '==', userId)
        .get();

      if (tokensSnapshot.empty) {
        return res.json({
          success: true,
          message: 'No tokens found for user',
          timestamp: formatISTDateTime()
        });
      }

      const deletePromises = tokensSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);

      console.log(`🗑️ Deleted ${tokensSnapshot.size} tokens for user ${userId}`);

      return res.json({
        success: true,
        message: `Deleted ${tokensSnapshot.size} tokens for user`,
        timestamp: formatISTDateTime()
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Missing required field: token or userId'
    });
  } catch (error) {
    console.error('Error deleting token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete push token',
      details: error.message
    });
  }
});

/**
 * Send notification to specific user
 */
app.post('/send-notification', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const customMessage = (title || body) ? { title, body, data } : null;
    const result = await sendNotificationToUser(userId, customMessage);

    if (result.success) {
      res.json({
        success: true,
        message: 'Notification sent successfully',
        result,
        timestamp: formatISTDateTime()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message || 'Failed to send notification',
        result,
        timestamp: formatISTDateTime()
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Notify all members of a group
 * POST /notify-group-members
 *
 * Body:
 * {
 *   "groupId": "group123",
 *   "groupName": "Study Group",
 *   "senderId": "user123",
 *   "senderName": "John Doe",
 *   "type": "message" | "file" | "call",
 *   "extra": { "message": "Hello", "fileName": "doc.pdf", "isVideo": true }
 * }
 */
app.post('/notify-group-members', async (req, res) => {
  try {
    const { groupId, groupName, senderId, senderName, type, extra } = req.body;

    if (!groupId || !groupName || !senderId || !senderName || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: groupId, groupName, senderId, senderName, type'
      });
    }

    const validTypes = ['message', 'file', 'call'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be one of: message, file, call'
      });
    }

    console.log(`📤 Notifying group ${groupName} members about ${type}`);

    const result = await sendNotificationToGroupMembers(
      groupId,
      groupName,
      senderId,
      senderName,
      type,
      extra || {}
    );

    res.json({
      success: true,
      message: 'Group members notified successfully',
      result,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('Error notifying group members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to notify group members',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Notify followers when a user uploads a new note
 * POST /notify-followers
 *
 * Body:
 * {
 *   "authorId": "user123",
 *   "authorName": "John Doe",
 *   "noteId": "note123",
 *   "title": "Note title",
 *   "subject": "Math" (optional)
 * }
 */
app.post('/notify-followers', async (req, res) => {
  try {
    const { authorId, authorName, noteId, title, subject } = req.body;

    if (!authorId || !authorName || !noteId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: authorId, authorName, noteId, title'
      });
    }

    console.log(`📤 Notifying followers of ${authorName} about new note`);

    const result = await sendNotificationToFollowers(authorId, {
      authorName,
      noteId,
      title,
      subject
    });

    res.json({
      success: true,
      message: 'Followers notified successfully',
      result,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('Error notifying followers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to notify followers',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Send notification to all users (Reshme_Info pattern)
 */
app.post('/send-notification-all', async (req, res) => {
  try {
    const { title, body, data } = req.body;
    const customMessage = (title || body) ? { title, body, data } : null;

    const result = await sendNotificationToAllUsers(customMessage);

    if (result.success) {
      res.json({
        success: true,
        message: 'Notifications sent to all users',
        result,
        timestamp: formatISTDateTime()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message || 'Failed to send notifications',
        result,
        timestamp: formatISTDateTime()
      });
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notifications',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Send daily reminders
 */
app.post('/send-daily-reminders', async (req, res) => {
  try {
    const result = await sendDailyReminders();

    res.json({
      success: true,
      message: 'Daily reminders sent',
      result,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('Error sending daily reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send daily reminders',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Send class reminders (supports both POST body and GET query params for Vercel cron)
 */
app.all('/send-class-reminders', async (req, res) => {
  try {
    const minutesBefore = parseInt(req.body.minutesBefore || req.query.minutesBefore || 30);

    if (minutesBefore !== 30 && minutesBefore !== 10) {
      return res.status(400).json({
        success: false,
        error: 'minutesBefore must be 30 or 10',
        timestamp: formatISTDateTime()
      });
    }

    const result = await sendClassReminders(minutesBefore);

    res.json({
      success: true,
      message: `${minutesBefore}-minute class reminders sent`,
      result,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('Error sending class reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send class reminders',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Get user tokens from flat pushTokens collection
 */
app.get('/tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Query from flat pushTokens collection
    const tokensSnapshot = await db
      .collection('pushTokens')
      .where('userId', '==', userId)
      .get();

    const tokens = tokensSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      userId,
      tokens,
      count: tokens.length,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Get all tokens (admin endpoint)
 */
app.get('/tokens', async (req, res) => {
  try {
    const tokensSnapshot = await db.collection('pushTokens').get();

    const tokens = tokensSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      tokens,
      count: tokens.length,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('Error fetching all tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

// ============================================
// DEEP LINK ROUTES
// ============================================

/**
 * Deep link handler for notes
 * GET /note/:noteId
 *
 * Serves an HTML page that:
 * 1. Tries to open the app via custom scheme
 * 2. Shows note preview if app not installed
 */
app.get('/note/:noteId', async (req, res) => {
  const { noteId } = req.params;

  let noteData = null;

  // Try to fetch note data from Firestore
  try {
    if (db) {
      const noteDoc = await db.collection('notes').doc(noteId).get();
      if (noteDoc.exists) {
        noteData = noteDoc.data();
      }
    }
  } catch (error) {
    console.error('Error fetching note for deep link:', error);
  }

  const appScheme = `mrbunkmanager://note/${noteId}`;

  const title = noteData?.title || 'Shared Note';
  const description = noteData?.description || 'Open this note in BunkManager app';
  const authorName = noteData?.authorName || 'BunkManager User';
  const subject = noteData?.subject || '';

  // Serve HTML page with smart redirect
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - BunkManager</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="BunkManager" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 32px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 25px 80px rgba(0,0,0,0.3);
      text-align: center;
    }
    .logo-container {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }
    .logo-text {
      color: white;
      font-size: 28px;
      font-weight: 800;
    }
    .app-name {
      font-size: 20px;
      font-weight: 700;
      color: #3B82F6;
      margin-bottom: 20px;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 20px 0;
    }
    .note-label {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .title { font-size: 22px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
    .author { font-size: 14px; color: #6b7280; margin-bottom: 12px; }
    .subject {
      display: inline-block;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .description { font-size: 14px; color: #4b5563; margin-bottom: 24px; line-height: 1.6; }
    .btn {
      display: block;
      width: 100%;
      padding: 16px 24px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      margin-bottom: 12px;
      transition: all 0.2s;
    }
    .btn:active { transform: scale(0.98); }
    .btn-primary {
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      color: white;
      border: none;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
    }
    .status { font-size: 13px; color: #9ca3af; margin-top: 8px; }
    .footer {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .team { font-size: 11px; color: #9ca3af; }
    .team-names { font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <span class="logo-text">BM</span>
    </div>
    <p class="app-name">BunkManager</p>

    <div class="divider"></div>

    <p class="note-label">📚 Shared Note</p>
    <h1 class="title">${title}</h1>
    <p class="author">By ${authorName}</p>
    ${subject ? `<span class="subject">${subject}</span>` : ''}
    ${description ? `<p class="description">${description}</p>` : ''}

    <a href="${appScheme}" class="btn btn-primary">📱 Open in BunkManager</a>
    <p class="status">Tap to view this note in the app</p>

    <div class="footer">
      <p class="team">Developed with ❤️ by</p>
      <p class="team-names">Nevil • Lavanya • Manas • Manasvi • Mithun • Naren</p>
    </div>
  </div>
  <script>
    // Auto-try to open app on mobile
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setTimeout(() => { window.location.href = '${appScheme}'; }, 500);
    }
  </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ============================================
// FILE UPLOAD ROUTES
// ============================================

/**
 * Proxy upload to Catbox.moe (CORS-free for web clients)
 * POST /upload-catbox
 *
 * Multipart form with:
 * - file: The file to upload
 *
 * Returns: { success, url, fileId, fileName, mimeType }
 */
app.post('/upload-catbox', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        timestamp: formatISTDateTime()
      });
    }

    console.log(`📤 Proxying file to Catbox: ${req.file.originalname} (${req.file.mimetype})`);

    // Create form data for Catbox
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Upload to Catbox
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    const url = await response.text();

    if (!url.startsWith('https://')) {
      throw new Error(url || 'Upload to Catbox failed');
    }

    const fileId = url.split('/').pop() || '';

    console.log(`✅ File uploaded to Catbox: ${url}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: url,
      fileId: fileId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      webViewLink: url,
      webContentLink: url,
      thumbnailLink: req.file.mimetype.startsWith('image/') ? url : undefined,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('❌ Error uploading to Catbox:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file',
      timestamp: formatISTDateTime()
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    timestamp: formatISTDateTime()
  });
});

// Export for Vercel serverless
export default app;
