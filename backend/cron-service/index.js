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

// In-memory log buffer (stores last 100 logs)
const logBuffer = [];
const MAX_LOGS = 100;

/**
 * Custom logger that stores logs in buffer
 */
function log(type, message, data = null) {
  const timestamp = formatIST();
  const logEntry = { timestamp, type, message, data };

  logBuffer.push(logEntry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift(); // Remove oldest
  }

  // Also print to console
  const icons = { info: '📡', success: '✅', error: '❌', warning: '⚠️', retry: '⏳' };
  const icon = icons[type] || '📋';
  console.log(`${icon} [${timestamp}] ${message}`);
  if (data) console.log('   ', data);
}

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
    log('info', `[Attempt ${attempt}/${maxRetries}] Calling ${endpoint}`, body);

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
        const result = data.result || {};
        log('success', `${endpoint} - Sent: ${result.sent || 0}, Failed: ${result.failed || 0}`);
        return data;
      } else {
        log('warning', `${endpoint} API failure: ${data.error || 'Unknown'}`);
        return data;
      }
    } catch (error) {
      log('error', `Attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        log('retry', `Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        log('error', `All ${maxRetries} attempts failed for ${endpoint}`);
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

  // Log startup
  log('success', 'Cron service started', { backend: BACKEND_URL });

  // Daily reminders at multiple times (IST)
  const dailyReminderTimes = [
    { hour: 6, label: '6:00 AM' },
    { hour: 7, label: '7:00 AM' },
    { hour: 8, label: '8:00 AM' },
    { hour: 18, label: '6:00 PM' },
    { hour: 19, label: '7:00 PM' },
    { hour: 20, label: '8:00 PM' }
  ];

  dailyReminderTimes.forEach(({ hour, label }) => {
    cron.schedule(`0 ${hour} * * *`, async () => {
      log('info', `[DAILY REMINDER] Triggered at ${label}`);
      await triggerEndpoint('/send-daily-reminders');
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });
  });
  console.log('✅ Daily reminders scheduled: 6 AM, 7 AM, 8 AM, 6 PM, 7 PM, 8 PM IST');

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

/**
 * Generate HTML logs page
 */
function generateLogsHTML() {
  const logs = [...logBuffer].reverse(); // Most recent first
  const logsHTML = logs.map(l => {
    const colors = {
      info: '#3498db',
      success: '#27ae60',
      error: '#e74c3c',
      warning: '#f39c12',
      retry: '#9b59b6'
    };
    const icons = { info: '📡', success: '✅', error: '❌', warning: '⚠️', retry: '⏳' };
    const color = colors[l.type] || '#333';
    const icon = icons[l.type] || '📋';
    const dataStr = l.data ? ` <span style="color:#888">${JSON.stringify(l.data)}</span>` : '';
    return `<div style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;">
      <span style="color:${color}">${icon} [${l.type.toUpperCase()}]</span>
      <span style="color:#666">${l.timestamp}</span>
      <span>${l.message}</span>${dataStr}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>MR BunkManager - Cron Logs</title>
  <meta http-equiv="refresh" content="30">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .status { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
    .status-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .logs { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-height: 600px; overflow-y: auto; }
    .no-logs { padding: 40px; text-align: center; color: #888; }
    h1 { margin: 0; } h3 { margin: 0 0 10px 0; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ MR BunkManager Cron Service</h1>
    <p>Auto-refreshes every 30 seconds</p>
  </div>
  <div class="status">
    <div class="status-card"><h3>Status</h3>🟢 Running</div>
    <div class="status-card"><h3>Backend</h3>${BACKEND_URL}</div>
    <div class="status-card"><h3>Last Updated</h3>${formatIST()}</div>
    <div class="status-card"><h3>Log Count</h3>${logBuffer.length} / ${MAX_LOGS}</div>
  </div>
  <h2>📋 Recent Logs</h2>
  <div class="logs">
    ${logs.length > 0 ? logsHTML : '<div class="no-logs">No logs yet. Waiting for cron jobs to trigger...</div>'}
  </div>
</body>
</html>`;
}

// Health check HTTP server (required by Render)
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'MR BunkManager Cron Service',
      backend: BACKEND_URL,
      timestamp: formatIST(),
      logCount: logBuffer.length
    }));
  } else if (req.url === '/logs') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ logs: logBuffer.slice().reverse() }));
  } else if (req.url === '/' || req.url === '/dashboard') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateLogsHTML());
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
