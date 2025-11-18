# ⚡ Quick Start Guide

Get your notification backend running in 5 minutes!

## 🎯 Prerequisites

- Node.js 18+ installed
- Firebase project created
- Your Expo app project ID

---

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
cd backend
npm install
```

### Step 2: Get Firebase Credentials (2 min)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ → **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. **Save it as:** `backend/config/serviceAccountKey.json`

### Step 3: Configure Environment (30 sec)

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
FIREBASE_DATABASE_URL=https://YOUR-PROJECT-ID.firebaseio.com
TZ=Asia/Kolkata
```

Replace `YOUR-PROJECT-ID` with your actual Firebase project ID.

### Step 4: Start Server (10 sec)

```bash
npm start
```

✅ You should see:
```
✅ Server running on port 3000
⏰ Daily reminders scheduled for 8:00 PM IST
```

### Step 5: Test It! (1 min)

Open your browser: [http://localhost:3000/health](http://localhost:3000/health)

You should see:
```json
{
  "status": "healthy",
  "message": "MR BunkManager Notification Server is running",
  "timezone": "Asia/Kolkata (IST)"
}
```

---

## 📱 Connect Your Expo App

### Add to Your App

In your Expo app, add this code to save the push token:

```javascript
// In your main app component or auth flow
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuthStore } from '@/src/store/authStore';

async function registerPushToken() {
  // 1. Get permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  // 2. Get token
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId,
  })).data;

  // 3. Save to backend
  const { user } = useAuthStore.getState();
  if (user && token) {
    await fetch('http://localhost:3000/save-token', {
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

// Call this after user logs in
registerPushToken();
```

---

## 🧪 Test Notifications

### Manual Test via Terminal

```bash
# Send a test notification
curl -X POST http://localhost:3000/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "Test",
    "body": "Hello from backend!"
  }'
```

### Run Test Script

```bash
npm test
```

---

## 📅 Scheduled Notifications

The server **automatically** sends daily reminders at **8:00 PM IST**.

Users receive messages like:
- "🔬 You have Computer Networks Lab Tomorrow! ... Your overall attendance is 78%."
- "📚 You have Mathematics Class Tomorrow at 09:00 AM. Your overall attendance is 85%."
- "🎉 No Classes Tomorrow! Your overall attendance is 92%. Enjoy your day off!"

---

## 🎛️ API Reference (Quick)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check server status |
| `/save-token` | POST | Save user push token |
| `/send-notification` | POST | Send to one user |
| `/send-notification-all` | POST | Send to all users |
| `/send-daily-reminders` | POST | Trigger daily reminders |
| `/tokens/:userId` | GET | Get user's tokens |

Full API docs: [README.md](README.md)

---

## ⚠️ Important Notes

### Security
- **Never commit** `serviceAccountKey.json` (already in `.gitignore`)
- **Never commit** `.env` file
- Use environment variables for production

### Timezone
All times are in **Indian Standard Time (IST)** by default.
The cron job runs at **8:00 PM IST** every day.

### Firestore Structure
The backend reads from:
```
users/{userId}/
  ├── timetable/      # Your app writes this
  ├── subjects/       # Your app writes this
  └── deviceTokens/   # Backend writes this
```

---

## 🐛 Common Issues

**"Firebase not initialized"**
→ Check `config/serviceAccountKey.json` exists

**"No classes found"**
→ Make sure your app has timetable data in Firestore

**"Invalid token"**
→ Token must start with `ExponentPushToken[...]`

**Notifications not received**
→ Check device has notifications enabled for your app

---

## 📚 Next Steps

1. ✅ Complete setup above
2. 📱 Integrate with your Expo app
3. 🧪 Test with real device
4. 🚀 Deploy to production server
5. 📊 Monitor logs and user engagement

For detailed documentation, see [README.md](README.md)

---

**Need help?** Open an issue or contact the team!

**Happy coding! 🚀**
