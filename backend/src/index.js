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
import cron from 'node-cron';
import { initializeFirebase, getFirestore } from '../config/firebase.js';
import {
  sendNotificationToUser,
  sendNotificationToAllUsers,
  sendDailyReminders,
  sendClassReminders,
  isValidExpoPushToken
} from './sendNotification.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
// Use APP_ENV instead of NODE_ENV (some platforms reserve NODE_ENV)
const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development';
const IS_PRODUCTION = APP_ENV === 'production';

// CORS Configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8081', 'http://localhost:19000', 'http://localhost:19006'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Enable CORS with configuration
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev')); // HTTP request logging

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
 * Save or update Expo push token for a user
 * POST /save-token
 *
 * Body:
 * {
 *   "userId": "user123",
 *   "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
 *   "deviceId": "unique-device-id" (optional)
 * }
 */
app.post('/save-token', async (req, res) => {
  try {
    const { userId, token, deviceId } = req.body;

    // Validate input
    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId and token'
      });
    }

    // Validate Expo push token format
    if (!isValidExpoPushToken(token)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Expo push token format'
      });
    }

    // Generate device ID if not provided
    const finalDeviceId = deviceId || `device_${Date.now()}`;

    // Save token to Firestore: users/{userId}/deviceTokens/{tokenId}
    const tokenRef = db
      .collection('users')
      .doc(userId)
      .collection('deviceTokens')
      .doc(finalDeviceId);

    await tokenRef.set({
      token,
      deviceId: finalDeviceId,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true
    }, { merge: true });

    console.log(`✅ Token saved for user ${userId} at ${formatISTDateTime()}`);

    res.json({
      success: true,
      message: 'Push token saved successfully',
      userId,
      deviceId: finalDeviceId,
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
 * Delete a push token for a user
 * DELETE /delete-token
 *
 * Body:
 * {
 *   "userId": "user123",
 *   "deviceId": "unique-device-id"
 * }
 */
app.delete('/delete-token', async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId and deviceId'
      });
    }

    // Delete token from Firestore
    await db
      .collection('users')
      .doc(userId)
      .collection('deviceTokens')
      .doc(deviceId)
      .delete();

    console.log(`🗑️ Token deleted for user ${userId}, device ${deviceId} at ${formatISTDateTime()}`);

    res.json({
      success: true,
      message: 'Push token deleted successfully',
      timestamp: formatISTDateTime()
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
 * Get user's push tokens (for debugging)
 * GET /tokens/:userId
 */
app.get('/tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const tokensSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('deviceTokens')
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

// ============================================
// SCHEDULED JOBS (CRON)
// ============================================

/**
 * Schedule daily reminders at 8:00 PM IST (Indian Standard Time)
 * Cron expression: '0 20 * * *' means "At 20:00 (8:00 PM) every day"
 *
 * Users will receive notifications about tomorrow's classes
 */
cron.schedule('0 20 * * *', async () => {
  const istTime = formatISTDateTime();
  console.log(`\n⏰ Daily Reminder Cron Job triggered at ${istTime}`);
  console.log('🔔 Sending daily reminders to all users...');

  try {
    const result = await sendDailyReminders();
    console.log(`✅ Daily reminders completed at ${formatISTDateTime()}`);
    console.log(`📊 Results: ${result.sent} sent, ${result.failed} failed`);
  } catch (error) {
    console.error(`❌ Error in daily reminders job at ${formatISTDateTime()}:`, error);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata' // IST timezone
});

/**
 * Schedule 30-minute class reminders
 * Cron expression: '*/1 * * * *' means "Every 1 minute"
 *
 * Checks every minute if any class is starting in 30 minutes
 * Only sends notification if class starts in 29-31 minutes window
 */
cron.schedule('*/1 * * * *', async () => {
  try {
    await sendClassReminders(30);
  } catch (error) {
    console.error(`❌ Error in 30-min reminder job:`, error);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata' // IST timezone
});

/**
 * Schedule 10-minute class reminders
 * Cron expression: '*/1 * * * *' means "Every 1 minute"
 *
 * Checks every minute if any class is starting in 10 minutes
 * Only sends notification if class starts in 9-11 minutes window
 */
cron.schedule('*/1 * * * *', async () => {
  try {
    await sendClassReminders(10);
  } catch (error) {
    console.error(`❌ Error in 10-min reminder job:`, error);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata' // IST timezone
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
      'GET /tokens/:userId'
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
  const istTime = formatISTDateTime();
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║        🚀 MR BunkManager Notification Server 🚀           ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`🕐 Server started at: ${istTime}`);
  console.log(`🌏 Timezone: Asia/Kolkata (IST)`);
  console.log(`\n⏰ Scheduled Notifications:`);
  console.log(`   📅 Daily reminders: 8:00 PM IST`);
  console.log(`   ⏱️  30-min class reminders: Every minute (checks)`);
  console.log(`   ⏱️  10-min class reminders: Every minute (checks)`);
  console.log('\n📋 Available Routes:');
  console.log('   GET  /health - Health check');
  console.log('   POST /save-token - Save push token');
  console.log('   DELETE /delete-token - Delete push token');
  console.log('   POST /send-notification - Send to one user');
  console.log('   POST /send-notification-all - Send to all users');
  console.log('   POST /send-daily-reminders - Trigger daily reminders');
  console.log('   POST /send-class-reminders - Trigger class reminders (30/10 min)');
  console.log('   GET  /tokens/:userId - Get user tokens\n');
  console.log('════════════════════════════════════════════════════════════\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`\n🛑 Server shutting down at ${formatISTDateTime()}`);
  process.exit(0);
});
