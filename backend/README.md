# 🚀 MR BunkManager - Push Notification Backend

Complete Node.js + Express backend for sending context-aware push notifications using Firebase Cloud Messaging (FCM).

## 📋 Features

- ✅ **Firebase Cloud Messaging (FCM)** - Production-ready push notifications
- ✅ **Flat Token Storage** - Reshme_Info pattern with auto-cleanup
- ✅ **Smart Notifications** - Auto-generates messages based on:
  - Tomorrow's class schedule
  - Lab sessions
  - Overall attendance percentage
  - Low attendance warnings
- ✅ **Scheduled Notifications** - Daily reminders at 8:00 PM IST
- ✅ **Class Reminders** - 30-min and 10-min before class alerts
- ✅ **Indian Standard Time (IST)** - All times in Asia/Kolkata timezone
- ✅ **RESTful API** - Clean, documented endpoints
- ✅ **Vercel Deployment** - Serverless ready
- ✅ **Auto Token Cleanup** - Invalid tokens removed automatically

## 🌐 Production URL

**Vercel:** `https://mr-bunk-manager.vercel.app`

---

## 📁 Folder Structure

```
backend/
├── config/
│   ├── firebase.js              # Firebase Admin setup
│   └── serviceAccountKey.json   # Your Firebase credentials (create this)
├── src/
│   ├── index.js                 # Express server (Vercel)
│   └── sendNotification.js      # Notification logic
├── cron-service/                # Standalone cron service (Render)
│   ├── index.js                 # Cron jobs + health check server
│   ├── package.json             # Cron service dependencies
│   └── .env.example             # Cron service config
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## ⚙️ Setup Instructions

### 1️⃣ Install Dependencies

```bash
cd backend
npm install
```

### 2️⃣ Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Save it as `config/serviceAccountKey.json`

**⚠️ IMPORTANT:** Never commit this file to Git! It's already in `.gitignore`.

### 3️⃣ Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase URL (optional):

```env
PORT=3000
NODE_ENV=development
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
TZ=Asia/Kolkata
```

### 4️⃣ Run the Server

```bash
npm start
```

You should see:

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🚀 MR BunkManager Notification Server 🚀           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on port 3000
🌐 Base URL: http://localhost:3000
🕐 Server started at: 18/11/2025, 02:30:45 PM
🌏 Timezone: Asia/Kolkata (IST)
⏰ Daily reminders scheduled for 8:00 PM IST
```

---

## 🔌 API Endpoints

### 1. Health Check

Check if the server is running.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "message": "MR BunkManager Notification Server is running",
  "timestamp": "18/11/2025, 02:30:45 PM",
  "timezone": "Asia/Kolkata (IST)",
  "uptime": 125.45
}
```

---

### 2. Save Push Token

Save a user's Expo push token to Firestore.

```http
POST /save-token
Content-Type: application/json

{
  "userId": "user123",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "deviceId": "device-001" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Push token saved successfully",
  "userId": "user123",
  "deviceId": "device-001",
  "timestamp": "18/11/2025, 02:35:12 PM"
}
```

**Firestore Structure (Flat pushTokens Collection):**
```
pushTokens/
  └── {token}/                    # Token as document ID
      ├── token: "FCM_TOKEN"
      ├── userId: "user123"
      ├── tokenType: "fcm" | "expo"
      ├── platform: "android" | "ios"
      ├── createdAt: Timestamp
      ├── updatedAt: Timestamp
      ├── active: true
      └── deviceInfo: {...}
```

---

### 3. Send Notification to One User

Send a notification to a specific user.

**Auto-generated message** (based on schedule & attendance):
```http
POST /send-notification
Content-Type: application/json

{
  "userId": "user123"
}
```

**Custom message:**
```http
POST /send-notification
Content-Type: application/json

{
  "userId": "user123",
  "title": "📚 Reminder",
  "body": "Don't forget your assignment!",
  "data": {
    "type": "reminder",
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "result": {
    "success": true,
    "userId": "user123",
    "sent": 1,
    "failed": 0
  },
  "timestamp": "18/11/2025, 02:40:30 PM"
}
```

**Example Auto-Generated Messages:**

1. **Lab Session:**
   ```
   Title: 🔬 You have Computer Networks Lab Tomorrow!
   Body: Computer Networks lab at 02:00 PM. Your overall attendance is 78%.
   ```

2. **Regular Class:**
   ```
   Title: 📚 You have Mathematics Class Tomorrow!
   Body: Mathematics class at 09:00 AM. Your overall attendance is 82%.
   ```

3. **Low Attendance Warning:**
   ```
   Title: 📚 You have Physics Class Tomorrow!
   Body: Physics class at 10:00 AM. Your overall attendance is 72%. ⚠️ Attendance below 75%!
   ```

4. **No Classes:**
   ```
   Title: 🎉 No Classes Tomorrow!
   Body: Your overall attendance is 85%. Enjoy your day off!
   ```

---

### 4. Send Notification to All Users

Send notifications to all users with push tokens.

```http
POST /send-notification-all
Content-Type: application/json

{
  "title": "🎓 Important Announcement",
  "body": "Exam schedule has been released. Check your portal!",
  "data": {
    "type": "announcement"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications sent to all users",
  "result": {
    "success": true,
    "totalUsers": 150,
    "sent": 148,
    "failed": 2
  },
  "timestamp": "18/11/2025, 03:00:00 PM"
}
```

---

### 5. Trigger Daily Reminders Manually

Send personalized daily reminders to all users.

```http
POST /send-daily-reminders
```

**Response:**
```json
{
  "success": true,
  "message": "Daily reminders sent",
  "result": {
    "success": true,
    "sent": 145,
    "failed": 5
  },
  "timestamp": "18/11/2025, 08:00:00 PM"
}
```

---

### 6. Delete Push Token

Remove a user's push token.

```http
DELETE /delete-token
Content-Type: application/json

{
  "userId": "user123",
  "deviceId": "device-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Push token deleted successfully",
  "timestamp": "18/11/2025, 03:15:00 PM"
}
```

---

### 7. Get User Tokens (Debug)

Retrieve all tokens for a user.

```http
GET /tokens/user123
```

**Response:**
```json
{
  "success": true,
  "userId": "user123",
  "tokens": [
    {
      "id": "device-001",
      "token": "ExponentPushToken[...]",
      "deviceId": "device-001",
      "createdAt": "2025-11-18T09:00:00Z",
      "active": true
    }
  ],
  "count": 1,
  "timestamp": "18/11/2025, 03:20:00 PM"
}
```

---

## ⏰ Scheduled Notifications

Scheduled notifications are handled by a **separate cron service** that calls the main backend API.

**Cron Service Schedules:**

| Schedule | Endpoint | Description |
|----------|----------|-------------|
| 8:00 PM IST daily | `/send-daily-reminders` | Tomorrow's class reminders |
| Every minute | `/send-class-reminders` (30 min) | 30-min before class alert |
| Every minute | `/send-class-reminders` (10 min) | 10-min before class alert |

**How It Works:**
1. Cron service runs on Render with scheduled jobs
2. At trigger time, it calls the backend API via HTTP POST
3. Backend processes the request and sends FCM notifications
4. Invalid tokens are automatically cleaned up

**Cron Service Code:**
```javascript
// Daily reminders at 8:00 PM IST
cron.schedule('0 20 * * *', async () => {
  await triggerEndpoint('/send-daily-reminders');
}, { timezone: 'Asia/Kolkata' });

// Class reminders every minute
cron.schedule('* * * * *', async () => {
  await triggerEndpoint('/send-class-reminders', { minutesBefore: 30 });
}, { timezone: 'Asia/Kolkata' });

cron.schedule('* * * * *', async () => {
  await triggerEndpoint('/send-class-reminders', { minutesBefore: 10 });
}, { timezone: 'Asia/Kolkata' });
```

**Logs (Cron Service):**
```
📡 Calling https://mr-bunk-manager.vercel.app/send-daily-reminders at 18/11/2025, 08:00:00 PM
✅ Success: Daily reminders sent
   Sent: 150, Failed: 2
```

---

## 🧪 Testing Notifications

### Production (Vercel)

**Send to all users:**
```bash
curl -s --location 'https://mr-bunk-manager.vercel.app/send-notification-all' \
  --header 'Content-Type: application/json' \
  --data '{"title":"Test Notification","body":"Hello from MR BunkManager!"}'
```

**Send daily reminders:**
```bash
curl -s --location 'https://mr-bunk-manager.vercel.app/send-daily-reminders' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

**Send class reminders (30 min):**
```bash
curl -s --location 'https://mr-bunk-manager.vercel.app/send-class-reminders' \
  --header 'Content-Type: application/json' \
  --data '{"minutesBefore":30}'
```

**Send class reminders (10 min):**
```bash
curl -s --location 'https://mr-bunk-manager.vercel.app/send-class-reminders' \
  --header 'Content-Type: application/json' \
  --data '{"minutesBefore":10}'
```

**Check registered tokens:**
```bash
curl -s 'https://mr-bunk-manager.vercel.app/tokens'
```

### Local Development

**1. Save a token:**
```bash
curl -X POST http://localhost:3000/save-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","token":"FCM_TOKEN_HERE"}'
```

**2. Send a test notification:**
```bash
curl -X POST http://localhost:3000/send-notification-all \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello!"}'
```

---

## 🔒 Firestore Data Structure

```
pushTokens/                          # Flat token storage (Reshme_Info pattern)
  └── {token}/                       # Token as document ID
      ├── token: string
      ├── userId: string
      ├── tokenType: "fcm" | "expo"
      ├── platform: "android" | "ios"
      ├── createdAt: Timestamp
      ├── updatedAt: Timestamp
      ├── active: boolean
      └── deviceInfo: object

users/
  └── {userId}/
      ├── timetable/                 # User's timetable (read by backend)
      │   └── {entryId}/
      │       ├── day: string        # "Monday", "Tuesday", etc.
      │       ├── startTime: string  # "09:00 AM"
      │       ├── endTime: string    # "10:00 AM"
      │       ├── subject: string
      │       ├── type: string       # "lecture", "lab", etc.
      │       └── room: string
      │
      └── subjects/                  # User's subjects (read by backend)
          └── {subjectId}/
              ├── name: string
              ├── totalClasses: number
              ├── attendedClasses: number
              ├── attendancePercentage: number
              └── deleted: boolean
```

---

## 📱 Integrating with Your Expo App

### 1. Install Expo Notifications

```bash
npx expo install expo-notifications expo-device expo-constants
```

### 2. Request Permission & Get Token

```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

async function registerForPushNotifications() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;
  }

  return token;
}
```

### 3. Save Token to Backend

```javascript
import { useAuthStore } from '@/src/store/authStore';

async function savePushToken() {
  const token = await registerForPushNotifications();
  const { user } = useAuthStore.getState();

  if (token && user) {
    await fetch('http://your-server:3000/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        token: token,
        deviceId: Constants.deviceId
      })
    });
  }
}
```

### 4. Configure Notifications (app.json)

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#ffffff",
      "androidMode": "default",
      "androidCollapsedTitle": "MR BunkManager"
    },
    "android": {
      "useNextNotificationsApi": true,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

---

## 🚀 Deployment

### Architecture Overview

The MR BunkManager notification system uses a **two-service architecture**:

1. **Main Backend (Vercel)**: Express API server handling notification endpoints
2. **Cron Service (Render)**: Standalone service that triggers backend endpoints on schedule

```
┌─────────────────┐         ┌──────────────────────┐
│  Cron Service   │  HTTP   │    Main Backend      │
│    (Render)     │ ──────► │     (Vercel)         │
│                 │  POST   │                      │
│ - Daily 8PM IST │         │ - /send-daily-reminders
│ - Every minute  │         │ - /send-class-reminders
│   (30min/10min) │         │ - FCM notifications  │
└─────────────────┘         └──────────────────────┘
```

---

### Deploy Main Backend to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
4. Deploy automatically

---

### Deploy Cron Service to Render

1. Create new **Web Service** in Render (NOT background worker)
2. Connect to your repo and set root directory: `backend/cron-service`
3. Set environment variables:
   ```
   BACKEND_URL=https://mr-bunk-manager.vercel.app
   PORT=5000
   ```
4. Build command: `npm install`
5. Start command: `npm start`

The cron service runs an HTTP server on port 5000 for Render health checks.

---

### Deploy to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Add environment variables in Railway dashboard
4. Upload `serviceAccountKey.json` securely

### Deploy to Render

1. Create account at [Render.com](https://render.com)
2. Connect GitHub repo
3. Set environment variables
4. Deploy automatically

### Deploy to Google Cloud Run

1. Build Docker image
2. Push to Google Container Registry
3. Deploy to Cloud Run
4. Set environment variables

---

## 🐛 Troubleshooting

### Issue: "Firebase not initialized"
**Solution:** Make sure `serviceAccountKey.json` exists in `config/` folder.

### Issue: "Invalid Expo push token"
**Solution:** Verify the token format starts with `ExponentPushToken[...]`

### Issue: "No classes found for tomorrow"
**Solution:** Check that timetable data exists in Firestore for the user.

### Issue: Cron job not running
**Solution:** Ensure timezone is set to `Asia/Kolkata` in environment.

### Issue: Notifications not received on device
**Solution:**
1. Check device has notification permissions enabled
2. Verify app is registered with Expo
3. Check token is saved correctly in Firestore
4. Test with Expo's push notification tool

---

## 📊 Notification Message Logic

The backend generates smart messages based on:

1. **Tomorrow's Schedule:**
   - Fetches timetable entries where `day === tomorrowDayName`
   - Sorts by start time
   - Identifies if there's a lab session

2. **Attendance Calculation:**
   - Sums `totalClasses` and `attendedClasses` across all subjects
   - Calculates percentage: `(attended / total) * 100`
   - Adds warning if < 75%

3. **Message Format:**
   ```
   Lab? → "🔬 You have {subject} Lab Tomorrow!"
   Class? → "📚 You have {subject} Class Tomorrow!"
   None? → "🎉 No Classes Tomorrow!"

   Body: "{subject} {type} at {time}. Your overall attendance is {percentage}%."

   If attendance < 75%: Add "⚠️ Attendance below 75%!"
   ```

---

## 📝 License

MIT License - Free to use and modify

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

---

## 📧 Support

For issues or questions, contact the development team or open a GitHub issue.

---

## ✨ Credits

Built with:
- [Express.js](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Expo Server SDK](https://docs.expo.dev/push-notifications/sending-notifications/)
- [node-cron](https://www.npmjs.com/package/node-cron)

---

**Happy Coding! 🚀**
