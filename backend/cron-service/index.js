/**
 * MR BunkManager - Standalone Cron Service
 *
 * Separate service that triggers backend notification endpoints
 * Deploy this separately on Render as a Background Worker
 *
 * Environment Variables:
 *   BACKEND_URL - Your backend API URL (e.g., https://mr-bunkmanager-api.onrender.com)
 */

import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Format IST time for logging
 */
function formatIST() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Call backend endpoint
 */
async function triggerEndpoint(endpoint, body = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`📡 Calling ${url} at ${formatIST()}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Success:`, data.message || 'OK');
      if (data.result) {
        console.log(`   Sent: ${data.result.sent || 0}, Failed: ${data.result.failed || 0}`);
      }
    } else {
      console.log(`⚠️ Failed:`, data.error || 'Unknown error');
    }

    return data;
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize cron jobs
 */
function startCronJobs() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      ⏰ MR BunkManager Cron Service Started ⏰              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`🕐 Started at: ${formatIST()}`);
  console.log(`🌏 Timezone: Asia/Kolkata (IST)\n`);

  // Daily reminders at 8:00 PM IST
  cron.schedule('0 20 * * *', async () => {
    console.log(`\n📅 [DAILY REMINDER] Triggered at ${formatIST()}`);
    await triggerEndpoint('/send-daily-reminders');
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  console.log('✅ Daily reminders scheduled: 8:00 PM IST');

  // 30-minute class reminders - Every minute
  cron.schedule('* * * * *', async () => {
    await triggerEndpoint('/send-class-reminders', { minutesBefore: 30 });
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  console.log('✅ 30-min class reminders scheduled: Every minute');

  // 10-minute class reminders - Every minute
  cron.schedule('* * * * *', async () => {
    await triggerEndpoint('/send-class-reminders', { minutesBefore: 10 });
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  console.log('✅ 10-min class reminders scheduled: Every minute');

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🚀 Cron service is running. Press Ctrl+C to stop.\n');
}

// Start the cron jobs
startCronJobs();

// Keep the process alive
process.on('SIGTERM', () => {
  console.log(`\n🛑 Cron service stopping at ${formatIST()}`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`\n🛑 Cron service stopped at ${formatIST()}`);
  process.exit(0);
});
