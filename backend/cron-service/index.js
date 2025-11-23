/**
 * MR BunkManager - Standalone Cron Service
 *
 * Separate service that triggers backend notification endpoints
 * Deploy on Render as Web Service (needs port for health check)
 *
 * Environment Variables:
 *   BACKEND_URL - Your backend API URL (e.g., https://mr-bunkmanager-api.onrender.com)
 *   PORT - Port for health check server (default: 5000)
 */

import http from 'http';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 5000;

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
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call backend endpoint with retry mechanism
 * @param {string} endpoint - API endpoint
 * @param {object} body - Request body
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 */
async function triggerEndpoint(endpoint, body = {}, maxRetries = 3) {
  const url = `${BACKEND_URL}${endpoint}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📡 [Attempt ${attempt}/${maxRetries}] Calling ${url} at ${formatIST()}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Success:`, data.message || 'OK');
        if (data.result) {
          console.log(`   Sent: ${data.result.sent || 0}, Failed: ${data.result.failed || 0}`);
        }
        return data;
      } else {
        console.log(`⚠️ API returned failure:`, data.error || 'Unknown error');
        // Don't retry if API explicitly returned failure (not a network issue)
        return data;
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s...
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        console.error(`🚫 All ${maxRetries} attempts failed for ${endpoint}`);
        return { success: false, error: error.message, attempts: maxRetries };
      }
    }
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

// Health check HTTP server (required by Render)
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'MR BunkManager Cron Service',
      backend: BACKEND_URL,
      timestamp: formatIST()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🌐 Health check server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Cron service stopping at ${formatIST()}`);
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`\n🛑 Cron service stopped at ${formatIST()}`);
  server.close();
  process.exit(0);
});
