/**
 * Push Notification Service using Firebase Cloud Messaging
 *
 * Pattern: Same as Reshme_Info project
 * - FCM only (Firebase Cloud Messaging)
 * - Flat token storage in pushTokens collection
 * - Auto-cleanup of invalid tokens
 */

import { getFirestore, getAdmin } from '../config/firebase.js';

// Get Firebase Admin messaging instance
const getMessaging = () => getAdmin().messaging();

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
 * Get tomorrow's classes for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of timetable entries for tomorrow
 */
async function getTomorrowClasses(userId) {
  const db = getFirestore();
  const tomorrowDay = getTomorrowDayName();

  try {
    const timetableSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('timetable')
      .get();

    const tomorrowClasses = timetableSnapshot.docs
      .map(doc => doc.data())
      .filter(entry => entry.day === tomorrowDay)
      .sort((a, b) => {
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
 * Get user's attendance data including percentage and minimum requirement
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { percentage, minimumRequired }
 */
async function getUserAttendanceData(userId) {
  const db = getFirestore();

  try {
    // Get user's minimum attendance setting
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};
    const minimumRequired = userData.minimumAttendance || userData.minAttendance || 75;

    // Calculate overall attendance
    const subjectsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('subjects')
      .get();

    let totalClasses = 0;
    let attendedClasses = 0;

    subjectsSnapshot.docs.forEach(doc => {
      const subject = doc.data();
      if (!subject.deleted) {
        totalClasses += subject.totalClasses || 0;
        attendedClasses += subject.attendedClasses || 0;
      }
    });

    const percentage = totalClasses === 0 ? 0 : Math.round((attendedClasses / totalClasses) * 100);

    return { percentage, minimumRequired };
  } catch (error) {
    console.error('Error calculating attendance:', error);
    return { percentage: 0, minimumRequired: 75 };
  }
}

/**
 * Get user's overall attendance percentage (backward compatible)
 * @param {string} userId - User ID
 * @returns {Promise<number>} Overall attendance percentage
 */
async function getUserAttendancePercentage(userId) {
  const { percentage } = await getUserAttendanceData(userId);
  return percentage;
}

/**
 * Create notification message based on tomorrow's schedule and attendance
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Notification title and body
 */
async function createNotificationMessage(userId) {
  const tomorrowClasses = await getTomorrowClasses(userId);
  const { percentage: attendancePercentage, minimumRequired } = await getUserAttendanceData(userId);

  // No classes tomorrow - send attendance-based message
  if (tomorrowClasses.length === 0) {
    let title, body;

    if (attendancePercentage >= minimumRequired + 15) {
      // Well above minimum
      title = '🌟 Excellent Attendance!';
      body = `Your attendance is ${attendancePercentage}% (min: ${minimumRequired}%). Keep up the great work!`;
    } else if (attendancePercentage >= minimumRequired) {
      // Above minimum
      title = '✅ Good Attendance!';
      body = `Your attendance is ${attendancePercentage}% (min: ${minimumRequired}%). You're on track!`;
    } else if (attendancePercentage >= minimumRequired - 10) {
      // Slightly below minimum
      title = '⚠️ Attendance Alert';
      body = `Your attendance is ${attendancePercentage}% (min: ${minimumRequired}%). Attend more classes to reach your goal!`;
    } else if (attendancePercentage > 0) {
      // Well below minimum
      title = '🚨 Low Attendance Warning!';
      body = `Your attendance is only ${attendancePercentage}% (min: ${minimumRequired}%). You need ${minimumRequired - attendancePercentage}% more!`;
    } else {
      title = '📚 MR BunkManager';
      body = `Start tracking your attendance to stay on top of your classes!`;
    }

    return { title, body, data: { attendancePercentage, minimumRequired, type: 'attendance_update' } };
  }

  // Has classes tomorrow
  const firstClass = tomorrowClasses[0];
  const classType = firstClass.type === 'lab' ? 'Lab' : 'Class';
  const hasLab = tomorrowClasses.some(c => c.type === 'lab');

  let title, body;

  if (hasLab) {
    const labClass = tomorrowClasses.find(c => c.type === 'lab');
    title = `🔬 You have ${labClass.subject} Lab Tomorrow!`;
    body = `${labClass.subject} lab at ${formatTime(labClass.startTime)}. Attendance: ${attendancePercentage}%`;
  } else {
    title = `📚 You have ${firstClass.subject} ${classType} Tomorrow!`;
    body = `${firstClass.subject} class at ${formatTime(firstClass.startTime)}. Attendance: ${attendancePercentage}%`;
  }

  // Add warning if below minimum
  if (attendancePercentage < minimumRequired) {
    body += ` ⚠️ Below ${minimumRequired}%!`;
  }

  return { title, body, data: { tomorrowClasses, attendancePercentage, minimumRequired } };
}

/**
 * Get all push tokens from flat pushTokens collection (Reshme_Info pattern)
 * @returns {Promise<Array>} Array of token objects
 */
async function getAllPushTokens() {
  const db = getFirestore();

  try {
    const tokensSnapshot = await db.collection('pushTokens').get();

    if (tokensSnapshot.empty) {
      return [];
    }

    return tokensSnapshot.docs.map(doc => ({
      token: doc.data().token,
      docId: doc.id,
      userId: doc.data().userId,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching push tokens:', error);
    return [];
  }
}

/**
 * Get push tokens for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of token objects
 */
async function getUserPushTokens(userId) {
  const db = getFirestore();

  try {
    const tokensSnapshot = await db
      .collection('pushTokens')
      .where('userId', '==', userId)
      .get();

    return tokensSnapshot.docs.map(doc => ({
      token: doc.data().token,
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user push tokens:', error);
    return [];
  }
}

/**
 * Clean up invalid tokens after failed send (Reshme_Info pattern)
 * @param {Array} tokens - Array of token strings
 * @param {Array} responses - Array of send responses
 * @returns {Promise<number>} Number of tokens removed
 */
async function cleanupInvalidTokens(tokens, responses) {
  const db = getFirestore();
  const invalidTokens = [];

  responses.forEach((resp, idx) => {
    if (!resp.success) {
      invalidTokens.push(tokens[idx]);
      console.error(`❌ Failed token ${idx}:`, resp.error?.code, resp.error?.message);
    }
  });

  if (invalidTokens.length > 0) {
    console.log(`🗑️ Cleaning up ${invalidTokens.length} invalid tokens...`);

    const deletePromises = invalidTokens.map(token =>
      db.collection('pushTokens').doc(token).delete().catch(err => {
        console.error(`Failed to delete token ${token}:`, err.message);
      })
    );

    await Promise.all(deletePromises);
    console.log(`✅ Cleaned up ${invalidTokens.length} invalid tokens`);
  }

  return invalidTokens.length;
}

/**
 * Get followers of a user
 * @param {string} userId - User ID to get followers for
 * @returns {Promise<Array>} Array of follower user IDs
 */
async function getUserFollowers(userId) {
  const db = getFirestore();

  try {
    const followersSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('followers')
      .get();

    return followersSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
}

/**
 * Send notification to all followers of a user (for new note uploads)
 * @param {string} authorId - User ID of the note author
 * @param {Object} noteInfo - Note information {title, subject, authorName, noteId}
 * @returns {Promise<Object>} Result of sending notifications
 */
export async function sendNotificationToFollowers(authorId, noteInfo) {
  try {
    const followers = await getUserFollowers(authorId);

    if (followers.length === 0) {
      return {
        success: true,
        message: 'No followers to notify',
        sent: 0
      };
    }

    console.log(`📤 Sending note notification to ${followers.length} followers of ${authorId}...`);

    const message = {
      title: `📚 ${noteInfo.authorName} shared a new note!`,
      body: noteInfo.subject
        ? `${noteInfo.title} - ${noteInfo.subject}`
        : noteInfo.title,
      data: {
        type: 'new_note',
        noteId: noteInfo.noteId,
        authorId: authorId,
        authorName: noteInfo.authorName
      }
    };

    let totalSent = 0;
    let totalFailed = 0;
    let totalInvalidRemoved = 0;

    // Send to each follower
    let followersWithTokens = 0;
    let followersWithoutTokens = 0;

    for (const followerId of followers) {
      const tokenObjects = await getUserPushTokens(followerId);

      if (tokenObjects.length === 0) {
        followersWithoutTokens++;
        console.log(`   ⚠️ Follower ${followerId} has no push token (web user or notifications disabled)`);
        continue;
      }
      followersWithTokens++;

      const tokens = tokenObjects.map(t => t.token);

      const fcmMessage = {
        notification: {
          title: message.title,
          body: message.body,
        },
        data: Object.fromEntries(
          Object.entries(message.data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
        ),
        android: {
          notification: {
            color: '#3B82F6',
            sound: 'default',
            priority: 'high',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        tokens: tokens,
      };

      const messaging = getMessaging();
      const response = await messaging.sendEachForMulticast(fcmMessage);

      totalSent += response.successCount;
      totalFailed += response.failureCount;

      // Clean up invalid tokens
      const invalidRemoved = await cleanupInvalidTokens(tokens, response.responses);
      totalInvalidRemoved += invalidRemoved;
    }

    console.log(`✅ Note notifications sent: ${totalSent} success, ${totalFailed} failed`);
    if (followersWithoutTokens > 0) {
      console.log(`   ℹ️ ${followersWithoutTokens}/${followers.length} followers have no push tokens (web users or notifications disabled)`);
    }

    return {
      success: true,
      followersCount: followers.length,
      followersWithTokens,
      followersWithoutTokens,
      sent: totalSent,
      failed: totalFailed,
      invalidTokensRemoved: totalInvalidRemoved
    };
  } catch (error) {
    console.error('Error sending notification to followers:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to a specific user
 * @param {string} userId - User ID to send notification to
 * @param {Object} customMessage - Optional custom message {title, body, data}
 * @returns {Promise<Object>} Result of sending notification
 */
export async function sendNotificationToUser(userId, customMessage = null) {
  try {
    const tokenObjects = await getUserPushTokens(userId);

    if (tokenObjects.length === 0) {
      return {
        success: false,
        message: 'No push tokens found for user',
        userId
      };
    }

    const tokens = tokenObjects.map(t => t.token);
    const message = customMessage || await createNotificationMessage(userId);

    console.log(`📱 Sending to ${tokens.length} FCM tokens for user ${userId}...`);

    const fcmMessage = {
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.data ? Object.fromEntries(
        Object.entries(message.data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
      ) : {},
      android: {
        notification: {
          color: '#3B82F6',
          sound: 'default',
          priority: 'high',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      tokens: tokens,
    };

    const messaging = getMessaging();
    const response = await messaging.sendEachForMulticast(fcmMessage);

    console.log(`✅ FCM sent: ${response.successCount}, ❌ Failed: ${response.failureCount}`);

    // Clean up invalid tokens (Reshme_Info pattern)
    const invalidRemoved = await cleanupInvalidTokens(tokens, response.responses);

    return {
      success: true,
      userId,
      sent: response.successCount,
      failed: response.failureCount,
      invalidTokensRemoved: invalidRemoved,
      responses: response.responses
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
 * Send notification to all users (Reshme_Info pattern)
 * @param {Object} customMessage - Optional custom message {title, body, data}
 * @returns {Promise<Object>} Summary of sending results
 */
export async function sendNotificationToAllUsers(customMessage = null) {
  try {
    console.log('📡 Fetching all push tokens...');
    const tokenObjects = await getAllPushTokens();

    if (tokenObjects.length === 0) {
      return {
        success: false,
        message: 'No push tokens found'
      };
    }

    const tokens = tokenObjects.map(t => t.token);

    console.log(`📱 Sending to ${tokens.length} FCM tokens...`);

    // Create message
    const message = customMessage || {
      title: '📚 MR BunkManager Update',
      body: 'Check your attendance and upcoming classes!'
    };

    const fcmMessage = {
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.data ? Object.fromEntries(
        Object.entries(message.data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
      ) : {},
      android: {
        notification: {
          color: '#3B82F6',
          sound: 'default',
          priority: 'high',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      tokens: tokens,
    };

    const messaging = getMessaging();
    const response = await messaging.sendEachForMulticast(fcmMessage);

    console.log(`✅ FCM sent: ${response.successCount}, ❌ Failed: ${response.failureCount}`);

    // Clean up invalid tokens (Reshme_Info pattern)
    const invalidRemoved = await cleanupInvalidTokens(tokens, response.responses);

    return {
      success: true,
      totalTokens: tokens.length,
      sent: response.successCount,
      failed: response.failureCount,
      invalidTokensRemoved: invalidRemoved
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
 * @returns {Promise<Object>} Summary of sending results
 */
export async function sendDailyReminders() {
  console.log('⏰ Starting daily reminder notifications...');

  try {
    const tokenObjects = await getAllPushTokens();

    if (tokenObjects.length === 0) {
      console.log('No tokens to send reminders to');
      return { success: true, sent: 0, failed: 0 };
    }

    // Group tokens by userId for personalized messages
    const userTokens = {};
    tokenObjects.forEach(t => {
      if (t.userId) {
        if (!userTokens[t.userId]) {
          userTokens[t.userId] = [];
        }
        userTokens[t.userId].push(t.token);
      }
    });

    const results = [];
    let totalSent = 0;
    let totalFailed = 0;
    let totalInvalidRemoved = 0;

    // Send personalized reminders to each user
    for (const [userId, tokens] of Object.entries(userTokens)) {
      const message = await createNotificationMessage(userId);

      const fcmMessage = {
        notification: {
          title: message.title,
          body: message.body,
        },
        data: message.data ? Object.fromEntries(
          Object.entries(message.data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
        ) : {},
        android: {
          notification: {
            color: '#3B82F6',
            sound: 'default',
            priority: 'high',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        tokens: tokens,
      };

      const messaging = getMessaging();
      const response = await messaging.sendEachForMulticast(fcmMessage);

      totalSent += response.successCount;
      totalFailed += response.failureCount;

      // Clean up invalid tokens
      const invalidRemoved = await cleanupInvalidTokens(tokens, response.responses);
      totalInvalidRemoved += invalidRemoved;

      results.push({
        userId,
        sent: response.successCount,
        failed: response.failureCount
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Daily reminders completed: ${totalSent} sent, ${totalFailed} failed`);

    return {
      success: true,
      sent: totalSent,
      failed: totalFailed,
      invalidTokensRemoved: totalInvalidRemoved,
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
 * Validate push token (FCM format)
 * @param {string} token - Push token to validate
 * @returns {boolean} True if valid FCM token
 */
export function isValidExpoPushToken(token) {
  if (!token || typeof token !== 'string') return false;

  // FCM tokens are typically 150+ characters alphanumeric
  // Also accept Expo tokens for development
  return token.length > 20 && (
    token.startsWith('ExponentPushToken[') ||
    /^[a-zA-Z0-9_:-]+$/.test(token)
  );
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
    const usersSnapshot = await db.collection('users').get();
    const usersWithClasses = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      const timetableSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('timetable')
        .get();

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

  const [time, period] = startTime.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const classTime = new Date(istTime);
  classTime.setHours(hours, minutes, 0, 0);

  const diffMinutes = Math.floor((classTime - istTime) / (1000 * 60));

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
    let totalSent = 0;
    let totalFailed = 0;
    let totalInvalidRemoved = 0;

    for (const { userId, classes } of usersWithClasses) {
      const upcomingClasses = classes.filter(cls =>
        isClassStartingSoon(cls.startTime, minutesBefore)
      );

      if (upcomingClasses.length === 0) continue;

      const attendancePercentage = await getUserAttendancePercentage(userId);
      const tokenObjects = await getUserPushTokens(userId);

      if (tokenObjects.length === 0) continue;

      const tokens = tokenObjects.map(t => t.token);

      for (const upcomingClass of upcomingClasses) {
        const classType = upcomingClass.type === 'lab' ? 'Lab' : 'Class';
        const emoji = upcomingClass.type === 'lab' ? '🔬' : '📚';

        const fcmMessage = {
          notification: {
            title: `${emoji} ${upcomingClass.subject} ${classType} Starting Soon!`,
            body: `Your ${upcomingClass.subject} ${classType.toLowerCase()} starts in ${minutesBefore} minutes at ${upcomingClass.startTime}. Overall attendance: ${attendancePercentage}%.`,
          },
          data: {
            type: 'class_reminder',
            minutesBefore: String(minutesBefore),
            subject: upcomingClass.subject,
            attendancePercentage: String(attendancePercentage)
          },
          android: {
            notification: {
              color: '#3B82F6',
              sound: 'default',
              priority: 'high',
              channelId: 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
          tokens: tokens,
        };

        const messaging = getMessaging();
        const response = await messaging.sendEachForMulticast(fcmMessage);

        totalSent += response.successCount;
        totalFailed += response.failureCount;

        // Clean up invalid tokens
        const invalidRemoved = await cleanupInvalidTokens(tokens, response.responses);
        totalInvalidRemoved += invalidRemoved;

        console.log(`📤 Sent ${minutesBefore}-min reminder to user ${userId} for ${upcomingClass.subject}`);
      }
    }

    console.log(`✅ ${minutesBefore}-min reminders completed: ${totalSent} sent, ${totalFailed} failed`);

    return {
      success: true,
      minutesBefore,
      sent: totalSent,
      failed: totalFailed,
      invalidTokensRemoved: totalInvalidRemoved
    };
  } catch (error) {
    console.error(`Error sending ${minutesBefore}-min reminders:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
