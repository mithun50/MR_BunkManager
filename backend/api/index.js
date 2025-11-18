/**
 * Vercel Serverless Function Entry Point
 * This is a wrapper for Express app to work with Vercel serverless
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeFirebase, getFirestore } from '../config/firebase.js';
import {
  sendNotificationToUser,
  sendNotificationToAllUsers,
  sendDailyReminders,
  sendClassReminders,
  isValidExpoPushToken
} from '../src/sendNotification.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development';
const IS_PRODUCTION = APP_ENV === 'production';

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8081', 'http://localhost:19000', 'http://localhost:19006'];

const corsOptions = {
  origin: (origin, callback) => {
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
    timezone: 'Asia/Kolkata (IST)'
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MR BunkManager Notification Server',
    endpoints: [
      'GET /health',
      'POST /save-token',
      'DELETE /delete-token',
      'POST /send-notification',
      'POST /send-notification-all',
      'POST /send-daily-reminders',
      'POST /send-class-reminders',
      'GET /tokens/:userId'
    ]
  });
});

// Save push token
app.post('/save-token', async (req, res) => {
  try {
    const { userId, token, deviceId } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId and token'
      });
    }

    if (!isValidExpoPushToken(token)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Expo push token format'
      });
    }

    const finalDeviceId = deviceId || `device_${Date.now()}`;
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

    res.json({
      success: true,
      message: 'Push token saved successfully',
      userId,
      deviceId: finalDeviceId,
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

// Delete push token
app.delete('/delete-token', async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId and deviceId'
      });
    }

    await db
      .collection('users')
      .doc(userId)
      .collection('deviceTokens')
      .doc(deviceId)
      .delete();

    res.json({
      success: true,
      message: 'Push token deleted successfully',
      timestamp: formatISTDateTime()
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

// Send notification to specific user
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

// Send notification to all users
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

// Send daily reminders
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

// Send class reminders (supports both POST body and GET query params for Vercel cron)
app.all('/send-class-reminders', async (req, res) => {
  try {
    // Support both POST body and GET query parameters for Vercel cron
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

// Get user tokens
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
    console.error('Error fetching tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens',
      details: error.message,
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
