/**
 * MR BunkManager - Push Notification Backend Server
 *
 * Express server with Firebase Admin SDK and Expo Server SDK
 * Handles push notifications for class schedules and attendance tracking
 *
 * All times are in Indian Standard Time (IST)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeFirebase, getFirestore } from '../config/firebase.js';
import {
  sendNotificationToUser,
  sendNotificationToAllUsers,
  sendDailyReminders,
  sendClassReminders,
  sendNotificationToFollowers,
  isValidExpoPushToken
} from './sendNotification.js';
import {
  uploadFileToDrive,
  deleteFileFromDrive,
} from './driveUpload.js';
import multer from 'multer';

// ES Module directory resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
// Use APP_ENV instead of NODE_ENV (some platforms reserve NODE_ENV)
const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development';
const IS_PRODUCTION = APP_ENV === 'production';
// Use TIMEZONE instead of TZ (more explicit and less likely to conflict)
const TIMEZONE = process.env.TIMEZONE || process.env.TZ || 'Asia/Kolkata';

// CORS Configuration - Allow all origins for mobile app
const corsOptions = {
  origin: true,
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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded
})); // Security headers
app.use(cors(corsOptions)); // Enable CORS with configuration
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev')); // HTTP request logging
app.use('/public', express.static(path.join(__dirname, '../public'))); // Serve static files

// Rate limiting (simple implementation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const requests = requestCounts.get(ip).filter(time => now - time < RATE_LIMIT_WINDOW);

  if (requests.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later'
    });
  }

  requests.push(now);
  requestCounts.set(ip, requests);
  next();
});

// Initialize Firebase Admin
initializeFirebase();
const db = getFirestore();

/**
 * Get current time in IST
 */
function getISTTime() {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return istTime;
}

/**
 * Format date/time for logging in IST
 */
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

// ============================================
// ROUTES
// ============================================

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  const istTime = formatISTDateTime();
  res.json({
    status: 'healthy',
    message: 'MR BunkManager Notification Server is running',
    timestamp: istTime,
    timezone: 'Asia/Kolkata (IST)',
    uptime: process.uptime()
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

    // Save to flat pushTokens collection with token as document ID
    await db.collection('pushTokens').doc(token).set({
      token: token,
      userId: userId,
      tokenType: tokenType,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true
    }, { merge: true });

    console.log(`✅ Token saved for user ${userId} (${tokenType}) at ${formatISTDateTime()}`);

    res.json({
      success: true,
      message: 'Push token saved successfully',
      userId,
      tokenType,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('❌ Error saving token:', error);
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

    if (token) {
      await db.collection('pushTokens').doc(token).delete();
      console.log(`🗑️ Token deleted at ${formatISTDateTime()}`);
      return res.json({
        success: true,
        message: 'Push token deleted successfully',
        timestamp: formatISTDateTime()
      });
    }

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
    console.error('❌ Error deleting token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete push token',
      details: error.message
    });
  }
});

/**
 * Send notification to a specific user
 * POST /send-notification
 *
 * Body:
 * {
 *   "userId": "user123",
 *   "title": "Custom Title" (optional - auto-generated if not provided),
 *   "body": "Custom message" (optional - auto-generated if not provided),
 *   "data": {} (optional - additional data)
 * }
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

    // Create custom message if provided, otherwise auto-generate
    const customMessage = (title || body) ? { title, body, data } : null;

    console.log(`📤 Sending notification to user ${userId} at ${formatISTDateTime()}`);

    // Send notification
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
    console.error('❌ Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
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

    console.log(`📤 Notifying followers of ${authorName} about new note at ${formatISTDateTime()}`);

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
    console.error('❌ Error notifying followers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to notify followers',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Send notification to all users
 * POST /send-notification-all
 *
 * Body:
 * {
 *   "title": "Custom Title" (optional),
 *   "body": "Custom message" (optional),
 *   "data": {} (optional)
 * }
 */
app.post('/send-notification-all', async (req, res) => {
  try {
    const { title, body, data } = req.body;

    // Create custom message if provided
    const customMessage = (title || body) ? { title, body, data } : null;

    console.log(`📤 Sending notifications to all users at ${formatISTDateTime()}`);

    // Send notifications
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
    console.error('❌ Error sending notifications to all users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notifications',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Manually trigger daily reminders
 * POST /send-daily-reminders
 *
 * This sends personalized notifications to all users about tomorrow's classes
 */
app.post('/send-daily-reminders', async (req, res) => {
  try {
    console.log(`⏰ Manually triggering daily reminders at ${formatISTDateTime()}`);

    const result = await sendDailyReminders();

    res.json({
      success: true,
      message: 'Daily reminders sent',
      result,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('❌ Error sending daily reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send daily reminders',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Manually trigger class reminders (30 min or 10 min before)
 * POST /send-class-reminders
 *
 * Body:
 * {
 *   "minutesBefore": 30  // or 10
 * }
 */
app.post('/send-class-reminders', async (req, res) => {
  try {
    const { minutesBefore = 30 } = req.body;

    if (minutesBefore !== 30 && minutesBefore !== 10) {
      return res.status(400).json({
        success: false,
        error: 'minutesBefore must be 30 or 10',
        timestamp: formatISTDateTime()
      });
    }

    console.log(`⏰ Manually triggering ${minutesBefore}-min class reminders at ${formatISTDateTime()}`);

    const result = await sendClassReminders(minutesBefore);

    res.json({
      success: true,
      message: `${minutesBefore}-minute class reminders sent`,
      result,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('❌ Error sending class reminders:', error);
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
    console.error('❌ Error fetching tokens:', error);
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
    console.error('❌ Error fetching all tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens',
      details: error.message,
      timestamp: formatISTDateTime()
    });
  }
});

// ============================================
// FILE UPLOAD ROUTES
// ============================================

/**
 * Upload a file to Google Drive
 * POST /upload
 *
 * Multipart form with:
 * - file: The file to upload
 *
 * Returns: { success, fileId, webViewLink, webContentLink, thumbnailLink, ... }
 */
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        timestamp: formatISTDateTime()
      });
    }

    console.log(`📤 Uploading file: ${req.file.originalname} (${req.file.mimetype})`);

    const result = await uploadFileToDrive(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    console.log(`✅ File uploaded successfully: ${result.fileId}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      ...result,
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file',
      timestamp: formatISTDateTime()
    });
  }
});

/**
 * Delete a file from Google Drive
 * DELETE /upload/:fileId
 */
app.delete('/upload/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required',
        timestamp: formatISTDateTime()
      });
    }

    await deleteFileFromDrive(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully',
      timestamp: formatISTDateTime()
    });
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete file',
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
    const noteDoc = await db.collection('notes').doc(noteId).get();
    if (noteDoc.exists) {
      noteData = noteDoc.data();
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
      margin: 0 auto 16px;
    }
    .logo-img {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      object-fit: contain;
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
      <img src="/public/logo.png" alt="BunkManager" class="logo-img" />
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
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    availableRoutes: [
      'GET /health',
      'POST /save-token',
      'DELETE /delete-token',
      'POST /send-notification',
      'POST /send-notification-all',
      'POST /send-daily-reminders',
      'POST /send-class-reminders',
      'GET /tokens/:userId',
      'POST /upload',
      'DELETE /upload/:fileId',
      'GET /note/:noteId'
    ],
    timestamp: formatISTDateTime()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message,
    timestamp: formatISTDateTime()
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      🚀 MR BunkManager Notification Server (Render) 🚀     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🕐 Started at: ${formatISTDateTime()}`);
  console.log(`🌏 Timezone: Asia/Kolkata (IST)`);
  console.log(`📦 Pattern: Reshme_Info (flat pushTokens collection)`);
  console.log('\n📋 Available Routes:');
  console.log('   GET  /health');
  console.log('   POST /save-token');
  console.log('   DELETE /delete-token');
  console.log('   POST /send-notification');
  console.log('   POST /send-notification-all');
  console.log('   POST /send-daily-reminders');
  console.log('   POST /send-class-reminders');
  console.log('   GET  /tokens/:userId');
  console.log('   GET  /tokens');
  console.log('   GET  /note/:noteId (Deep Link)');
  console.log('\n⏰ Note: Deploy cron-service separately for scheduled notifications');
  console.log('════════════════════════════════════════════════════════════\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`\n🛑 Server shutting down at ${formatISTDateTime()}`);
  process.exit(0);
});
