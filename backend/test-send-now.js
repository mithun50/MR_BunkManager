/**
 * Quick Test Script - Send Notification Now
 *
 * This script sends a test notification to a specific user immediately
 */

import dotenv from 'dotenv';
import { initializeFirebase, getFirestore } from './config/firebase.js';
import {
  sendNotificationToUser,
  sendClassReminders,
  sendDailyReminders
} from './src/sendNotification.js';

// Load environment
dotenv.config();

// Initialize Firebase
initializeFirebase();
const db = getFirestore();

/**
 * Get first user with push token
 */
async function getFirstUserWithToken() {
  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const tokensSnapshot = await db
      .collection('users')
      .doc(userDoc.id)
      .collection('deviceTokens')
      .get();

    if (tokensSnapshot.size > 0) {
      const token = tokensSnapshot.docs[0].data().token;
      return {
        userId: userDoc.id,
        token: token,
        email: userDoc.data().email || 'unknown'
      };
    }
  }

  return null;
}

/**
 * Main test function
 */
async function testNotification() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        🧪 Quick Notification Test 🧪                     ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Get first user with token
  console.log('🔍 Finding user with push token...');
  const user = await getFirstUserWithToken();

  if (!user) {
    console.log('❌ No users with push tokens found!');
    console.log('   Make sure you have logged into the app on a physical device.');
    process.exit(1);
  }

  console.log('✅ Found user:');
  console.log(`   User ID: ${user.userId}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Token: ${user.token.substring(0, 30)}...\n`);

  // Send test notification
  console.log('📤 Sending test notification...\n');

  const message = {
    title: '🧪 Test Notification',
    body: 'Hello! If you see this, push notifications are working perfectly! 🎉',
    data: {
      type: 'test',
      timestamp: new Date().toISOString()
    }
  };

  const result = await sendNotificationToUser(user.userId, message);

  if (result.success) {
    console.log('✅ SUCCESS! Notification sent!');
    console.log(`   Sent: ${result.sent}`);
    console.log(`   Failed: ${result.failed}`);
    console.log('\n📱 Check your phone now - you should see the notification!\n');
  } else {
    console.log('❌ FAILED to send notification');
    console.log(`   Error: ${result.message || result.error}\n`);
  }

  // Ask if want to test other types
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Want to test other notification types? Run:');
  console.log('  node test-send-now.js daily     → Test daily reminder');
  console.log('  node test-send-now.js 30min     → Test 30-min class reminder');
  console.log('  node test-send-now.js 10min     → Test 10-min class reminder');
  console.log('');

  process.exit(0);
}

/**
 * Test specific notification type based on argument
 */
async function testSpecificType() {
  const type = process.argv[2];

  if (!type) {
    await testNotification();
    return;
  }

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        🧪 Testing Specific Notification Type 🧪          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  switch (type.toLowerCase()) {
    case 'daily':
      console.log('📅 Testing daily reminders...\n');
      const dailyResult = await sendDailyReminders();
      console.log('Result:', dailyResult);
      break;

    case '30min':
      console.log('⏱️  Testing 30-minute class reminders...\n');
      const result30 = await sendClassReminders(30);
      console.log('Result:', result30);
      break;

    case '10min':
      console.log('⏱️  Testing 10-minute class reminders...\n');
      const result10 = await sendClassReminders(10);
      console.log('Result:', result10);
      break;

    default:
      console.log('❌ Invalid type. Use: daily, 30min, or 10min');
      process.exit(1);
  }

  console.log('\n✅ Test completed! Check your phone.\n');
  process.exit(0);
}

// Run test
testSpecificType().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
