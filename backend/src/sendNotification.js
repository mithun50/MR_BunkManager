/**
 * Push Notification Service using Expo Server SDK
 *
 * This module handles sending push notifications to users via Expo Push Notification service.
 * It includes logic to send context-aware notifications about:
 * - Upcoming classes (tomorrow's schedule)
 * - Attendance percentages
 * - Lab sessions
 */

import { Expo } from 'expo-server-sdk';
import { getFirestore } from '../config/firebase.js';

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Get the day name for tomorrow
 * @returns {string} Day name (e.g., "Monday", "Tuesday")
 */
function getTomorrowDayName() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[tomorrow.getDay()];
}

/**
 * Format time to 12-hour format
 * @param {string} time - Time string (e.g., "09:00 AM")
 * @returns {string} Formatted time
 */
function formatTime(time) {
  return time; // Already in 12-hour format from your app
}

/**
 * Get tomorrow's classes for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of timetable entries for tomorrow
 */
async function getTomorrowClasses(userId) {
  const db = getFirestore();
  const tomorrowDay = getTomorrowDayName();

  try {
    // Get user's timetable from Firestore
    const timetableSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('timetable')
      .get();

    // Filter classes for tomorrow and sort by start time
    const tomorrowClasses = timetableSnapshot.docs
      .map(doc => doc.data())
      .filter(entry => entry.day === tomorrowDay)
      .sort((a, b) => {
        // Convert to 24-hour format for sorting
        const timeA = convertTo24Hour(a.startTime);
        const timeB = convertTo24Hour(b.startTime);
        return timeA.localeCompare(timeB);
      });

    return tomorrowClasses;
  } catch (error) {
    console.error('Error fetching tomorrow\'s classes:', error);
    return [];
  }
}

/**
 * Convert 12-hour time to 24-hour format for sorting
 * @param {string} time - Time in 12-hour format (e.g., "09:00 AM")
 * @returns {string} Time in 24-hour format (e.g., "09:00")
 */
function convertTo24Hour(time) {
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':');
  let hour = parseInt(hours);

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Get user's overall attendance percentage
 * @param {string} userId - User ID
 * @returns {Promise<number>} Overall attendance percentage
 */
async function getUserAttendancePercentage(userId) {
  const db = getFirestore();

  try {
    // Get all subjects for the user
    const subjectsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('subjects')
      .get();

    let totalClasses = 0;
    let attendedClasses = 0;

    // Calculate overall attendance
    subjectsSnapshot.docs.forEach(doc => {
      const subject = doc.data();
      if (!subject.deleted) {
        totalClasses += subject.totalClasses || 0;
        attendedClasses += subject.attendedClasses || 0;
      }
    });

    if (totalClasses === 0) return 0;

    return Math.round((attendedClasses / totalClasses) * 100);
  } catch (error) {
    console.error('Error calculating attendance:', error);
    return 0;
  }
}

/**
 * Create notification message based on tomorrow's schedule and attendance
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Notification title and body
 */
async function createNotificationMessage(userId) {
  const tomorrowClasses = await getTomorrowClasses(userId);
  const attendancePercentage = await getUserAttendancePercentage(userId);

  if (tomorrowClasses.length === 0) {
    // No classes tomorrow
    return {
      title: '🎉 No Classes Tomorrow!',
      body: `Your overall attendance is ${attendancePercentage}%. Enjoy your day off!`
    };
  }

  // Get first class of the day
  const firstClass = tomorrowClasses[0];
  const classType = firstClass.type === 'lab' ? 'Lab' : 'Class';

  // Check if there's a lab tomorrow
  const hasLab = tomorrowClasses.some(c => c.type === 'lab');

  // Create notification message
  let title, body;

  if (hasLab) {
    const labClass = tomorrowClasses.find(c => c.type === 'lab');
    title = `🔬 You have ${labClass.subject} Lab Tomorrow!`;
    body = `${labClass.subject} lab at ${formatTime(labClass.startTime)}. Your overall attendance is ${attendancePercentage}%.`;
  } else {
    title = `📚 You have ${firstClass.subject} ${classType} Tomorrow!`;
    body = `${firstClass.subject} class at ${formatTime(firstClass.startTime)}. Your overall attendance is ${attendancePercentage}%.`;
  }

  // Add reminder if attendance is low
  if (attendancePercentage < 75) {
    body += ` ⚠️ Attendance below 75%!`;
  }

  return { title, body, data: { tomorrowClasses, attendancePercentage } };
}

/**
 * Get all push tokens for a user from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of Expo push tokens
 */
async function getUserPushTokens(userId) {
  const db = getFirestore();

  try {
    const tokensSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('deviceTokens')
      .get();

    return tokensSnapshot.docs
      .map(doc => doc.data().token)
      .filter(token => Expo.isExpoPushToken(token));
  } catch (error) {
    console.error('Error fetching push tokens:', error);
    return [];
  }
}

/**
 * Get all users who have push tokens enabled
 * @returns {Promise<Array>} Array of user IDs
 */
async function getAllUsersWithTokens() {
  const db = getFirestore();

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const userIds = [];

    // Check each user for device tokens
    for (const userDoc of usersSnapshot.docs) {
      const tokensSnapshot = await db
        .collection('users')
        .doc(userDoc.id)
        .collection('deviceTokens')
        .get();

      if (tokensSnapshot.size > 0) {
        userIds.push(userDoc.id);
      }
    }

    return userIds;
  } catch (error) {
    console.error('Error fetching users with tokens:', error);
    return [];
  }
}

/**
 * Send push notification to a specific user
 * @param {string} userId - User ID to send notification to
 * @param {Object} customMessage - Optional custom message {title, body, data}
 * @returns {Promise<Object>} Result of sending notification
 */
export async function sendNotificationToUser(userId, customMessage = null) {
  try {
    // Get user's push tokens
    const pushTokens = await getUserPushTokens(userId);

    if (pushTokens.length === 0) {
      return {
        success: false,
        message: 'No push tokens found for user',
        userId
      };
    }

    // Create notification message
    const message = customMessage || await createNotificationMessage(userId);

    // Create notification messages for each token
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data || {},
      priority: 'high',
      channelId: 'default'
    }));

    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }

    // Log results
    const successful = tickets.filter(t => t.status === 'ok').length;
    const failed = tickets.filter(t => t.status === 'error').length;

    console.log(`📤 Sent to user ${userId}: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      userId,
      sent: successful,
      failed,
      tickets
    };
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return {
      success: false,
      error: error.message,
      userId
    };
  }
}

/**
 * Send push notification to all users
 * @param {Object} customMessage - Optional custom message {title, body, data}
 * @returns {Promise<Object>} Summary of sending results
 */
export async function sendNotificationToAllUsers(customMessage = null) {
  try {
    console.log('📡 Fetching all users with push tokens...');
    const userIds = await getAllUsersWithTokens();

    if (userIds.length === 0) {
      return {
        success: false,
        message: 'No users with push tokens found'
      };
    }

    console.log(`📤 Sending notifications to ${userIds.length} users...`);

    // Send notifications to all users
    const results = [];
    for (const userId of userIds) {
      const result = await sendNotificationToUser(userId, customMessage);
      results.push(result);
    }

    // Summarize results
    const totalSent = results.reduce((sum, r) => sum + (r.sent || 0), 0);
    const totalFailed = results.reduce((sum, r) => sum + (r.failed || 0), 0);

    console.log(`✅ Notifications sent: ${totalSent} successful, ${totalFailed} failed`);

    return {
      success: true,
      totalUsers: userIds.length,
      sent: totalSent,
      failed: totalFailed,
      details: results
    };
  } catch (error) {
    console.error('Error sending notifications to all users:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send daily reminder notifications to all users
 * This function is designed to be called by a cron job daily
 * @returns {Promise<Object>} Summary of sending results
 */
export async function sendDailyReminders() {
  console.log('⏰ Starting daily reminder notifications...');

  try {
    const userIds = await getAllUsersWithTokens();

    if (userIds.length === 0) {
      console.log('No users to send reminders to');
      return { success: true, sent: 0 };
    }

    const results = [];

    // Send personalized reminders to each user
    for (const userId of userIds) {
      // Each user gets a personalized message based on their schedule
      const result = await sendNotificationToUser(userId, null);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalSent = results.reduce((sum, r) => sum + (r.sent || 0), 0);
    const totalFailed = results.reduce((sum, r) => sum + (r.failed || 0), 0);

    console.log(`✅ Daily reminders completed: ${totalSent} sent, ${totalFailed} failed`);

    return {
      success: true,
      sent: totalSent,
      failed: totalFailed,
      details: results
    };
  } catch (error) {
    console.error('Error sending daily reminders:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate Expo push token
 * @param {string} token - Expo push token to validate
 * @returns {boolean} True if valid
 */
export function isValidExpoPushToken(token) {
  return Expo.isExpoPushToken(token);
}

/**
 * Get today's classes for all users
 * @returns {Promise<Array>} Array of { userId, classes }
 */
async function getTodayClassesForAllUsers() {
  const db = getFirestore();
  const todayDay = new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long'
  });

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const usersWithClasses = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Get user's timetable
      const timetableSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('timetable')
        .get();

      // Filter classes for today
      const todayClasses = timetableSnapshot.docs
        .map(doc => doc.data())
        .filter(entry => entry.day === todayDay)
        .sort((a, b) => {
          const timeA = convertTo24Hour(a.startTime);
          const timeB = convertTo24Hour(b.startTime);
          return timeA.localeCompare(timeB);
        });

      if (todayClasses.length > 0) {
        usersWithClasses.push({ userId, classes: todayClasses });
      }
    }

    return usersWithClasses;
  } catch (error) {
    console.error('Error fetching today\'s classes:', error);
    return [];
  }
}

/**
 * Check if class is starting within specified minutes
 * @param {string} startTime - Class start time (e.g., "09:00 AM")
 * @param {number} minutesBefore - Minutes before class
 * @returns {boolean} True if class is starting soon
 */
function isClassStartingSoon(startTime, minutesBefore) {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  // Parse class time
  const [time, period] = startTime.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const classTime = new Date(istTime);
  classTime.setHours(hours, minutes, 0, 0);

  // Calculate time difference in minutes
  const diffMinutes = Math.floor((classTime - istTime) / (1000 * 60));

  // Check if within the specified window (e.g., 29-31 minutes for 30-min reminder)
  return diffMinutes >= (minutesBefore - 1) && diffMinutes <= (minutesBefore + 1);
}

/**
 * Send class reminder notifications (30 min or 10 min before)
 * @param {number} minutesBefore - Minutes before class (30 or 10)
 * @returns {Promise<Object>} Summary of sending results
 */
export async function sendClassReminders(minutesBefore = 30) {
  console.log(`⏰ Checking for classes starting in ${minutesBefore} minutes...`);

  try {
    const usersWithClasses = await getTodayClassesForAllUsers();
    const results = [];

    for (const { userId, classes } of usersWithClasses) {
      // Find classes starting soon
      const upcomingClasses = classes.filter(cls =>
        isClassStartingSoon(cls.startTime, minutesBefore)
      );

      if (upcomingClasses.length === 0) continue;

      // Get user's attendance
      const attendancePercentage = await getUserAttendancePercentage(userId);

      // Send notification for each upcoming class
      for (const upcomingClass of upcomingClasses) {
        const classType = upcomingClass.type === 'lab' ? 'Lab' : 'Class';
        const emoji = upcomingClass.type === 'lab' ? '🔬' : '📚';

        const message = {
          title: `${emoji} ${upcomingClass.subject} ${classType} Starting Soon!`,
          body: `Your ${upcomingClass.subject} ${classType.toLowerCase()} starts in ${minutesBefore} minutes at ${upcomingClass.startTime}. Overall attendance: ${attendancePercentage}%.`,
          data: {
            type: 'class_reminder',
            minutesBefore,
            classInfo: upcomingClass,
            attendancePercentage
          }
        };

        const result = await sendNotificationToUser(userId, message);
        results.push(result);

        console.log(`📤 Sent ${minutesBefore}-min reminder to user ${userId} for ${upcomingClass.subject}`);
      }
    }

    const totalSent = results.reduce((sum, r) => sum + (r.sent || 0), 0);
    const totalFailed = results.reduce((sum, r) => sum + (r.failed || 0), 0);

    console.log(`✅ ${minutesBefore}-min reminders completed: ${totalSent} sent, ${totalFailed} failed`);

    return {
      success: true,
      minutesBefore,
      sent: totalSent,
      failed: totalFailed,
      details: results
    };
  } catch (error) {
    console.error(`Error sending ${minutesBefore}-min reminders:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
