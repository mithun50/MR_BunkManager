# MR BunkManager - Complete Codebase Documentation

> Attendance tracking & class notification app for students

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│                    (React Native/Expo)                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  Auth   │  │ Dashboard │  │Timetable │  │   Attendance    │  │
│  │ Screens │  │  Screen   │  │  Screen  │  │    Tracking     │  │
│  └────┬────┘  └─────┬─────┘  └────┬─────┘  └───────┬─────────┘  │
│       │             │             │                │             │
│       └─────────────┴─────────────┴────────────────┘             │
│                            │                                     │
│                    ┌───────┴───────┐                            │
│                    │  Zustand      │                            │
│                    │  State Store  │                            │
│                    └───────┬───────┘                            │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   Firebase SDK  │
                    │ (Auth/Firestore)│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────────┐
│   Firebase      │  │  Firestore  │  │   Backend API       │
│ Authentication  │  │  Database   │  │    (Vercel)         │
└─────────────────┘  └─────────────┘  └──────────┬──────────┘
                                                  │
                                      ┌───────────┴───────────┐
                                      │                       │
                                      ▼                       ▼
                            ┌─────────────────┐    ┌─────────────────┐
                            │  Cron Service   │    │  FCM (Firebase  │
                            │   (Render)      │───▶│ Cloud Messaging)│
                            └─────────────────┘    └─────────────────┘
```

---

## Deployment Architecture

| Service | Platform | URL |
|---------|----------|-----|
| Mobile App | Expo/EAS | Play Store / APK |
| Backend API | Vercel | https://mr-bunk-manager.vercel.app |
| Cron Service | Render | Web Service (port 5000) |
| Database | Firebase | Firestore |
| Auth | Firebase | Firebase Auth |
| Push Notifications | Firebase | FCM |

---

## Project Structure

```
MR_BunkManager/
├── app/                          # Expo Router (File-based routing)
│   ├── (auth)/                   # Auth screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── email-verification.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx             # Dashboard
│   │   ├── attendance.tsx        # Attendance tracking
│   │   ├── timetable.tsx         # Class schedule
│   │   ├── groups.tsx            # Student groups
│   │   └── profile.tsx           # User profile
│   ├── (onboarding)/             # First-time setup
│   │   └── index.tsx
│   └── _layout.tsx               # Root navigation
│
├── src/                          # Core application logic
│   ├── config/
│   │   ├── firebase.ts           # Firebase SDK setup
│   │   └── theme.ts              # App theme config
│   ├── screens/                  # Screen components
│   │   ├── auth/
│   │   └── onboarding/
│   ├── services/                 # Business logic
│   │   ├── authService.ts        # Auth operations
│   │   ├── notificationService.ts# Push notifications
│   │   ├── firestoreService.ts   # Database operations
│   │   ├── cacheService.ts       # Offline caching
│   │   └── geminiService.ts      # AI timetable parsing
│   ├── store/                    # State management (Zustand)
│   │   ├── authStore.ts          # User state
│   │   ├── networkStore.ts       # Connectivity
│   │   └── themeStore.ts         # Theme preference
│   ├── components/               # Reusable UI
│   ├── types/                    # TypeScript types
│   └── utils/                    # Helper functions
│
├── backend/                      # Node.js Backend
│   ├── src/
│   │   ├── index.js              # Express API server
│   │   └── sendNotification.js   # FCM notification logic
│   ├── config/
│   │   └── firebase.js           # Firebase Admin SDK
│   ├── cron-service/             # Standalone scheduler
│   │   ├── index.js              # Cron jobs
│   │   └── package.json
│   ├── vercel.json               # Vercel config
│   └── package.json
│
├── app.config.js                 # Expo configuration
├── eas.json                      # EAS Build config
└── package.json                  # Frontend dependencies
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Mobile framework |
| Expo | 54.0.23 | Development platform |
| Expo Router | 5.x | File-based navigation |
| TypeScript | 5.9.2 | Type safety |
| Zustand | 5.x | State management |
| Firebase SDK | 12.6.0 | Auth, Firestore, Storage |
| React Native Paper | 5.x | UI components |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.18.2 | API framework |
| Firebase Admin | 12.0.0 | Server-side Firebase |
| node-cron | 3.0.3 | Job scheduling |
| Helmet | 7.x | Security headers |

---

## Database Schema (Firestore)

### Collections

```
Firestore Database
│
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── photoURL: string
│       ├── createdAt: timestamp
│       └── settings: object
│
├── pushTokens/                   # Flat collection (Reshme_Info pattern)
│   └── {token}/                  # Token as document ID
│       ├── token: string
│       ├── userId: string
│       ├── tokenType: "fcm" | "expo"
│       ├── platform: "android" | "ios"
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       └── active: boolean
│
├── users/{userId}/timetable/
│   └── {entryId}/
│       ├── day: string           # "Monday", "Tuesday", etc.
│       ├── startTime: string     # "09:00 AM"
│       ├── endTime: string       # "10:00 AM"
│       ├── subject: string
│       ├── type: string          # "lecture", "lab"
│       └── room: string
│
└── users/{userId}/subjects/
    └── {subjectId}/
        ├── name: string
        ├── totalClasses: number
        ├── attendedClasses: number
        └── attendancePercentage: number
```

---

## API Endpoints (Backend)

### Base URL: `https://mr-bunk-manager.vercel.app`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/save-token` | Save push token |
| DELETE | `/delete-token` | Remove push token |
| POST | `/send-notification` | Send to one user |
| POST | `/send-notification-all` | Broadcast to all |
| POST | `/send-daily-reminders` | Trigger daily reminders |
| POST | `/send-class-reminders` | Trigger class alerts |
| GET | `/tokens/:userId` | Get user's tokens |
| GET | `/tokens` | Get all tokens |

### Example Requests

```bash
# Health check
curl https://mr-bunk-manager.vercel.app/health

# Save token
curl -X POST https://mr-bunk-manager.vercel.app/save-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","token":"FCM_TOKEN_HERE"}'

# Send notification to all
curl -s --location 'https://mr-bunk-manager.vercel.app/send-notification-all' \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello from MR BunkManager!"}'

# Trigger daily reminders
curl -s --location 'https://mr-bunk-manager.vercel.app/send-daily-reminders' \
  -H "Content-Type: application/json" \
  -d '{}'

# Trigger class reminders (30 min before)
curl -s --location 'https://mr-bunk-manager.vercel.app/send-class-reminders' \
  -H "Content-Type: application/json" \
  -d '{"minutesBefore":30}'
```

---

## Cron Service (Render)

### Scheduled Jobs (IST Timezone)

| Schedule | Cron Expression | Endpoint | Description |
|----------|-----------------|----------|-------------|
| 8:00 PM daily | `0 20 * * *` | `/send-daily-reminders` | Tomorrow's class info |
| Every minute | `* * * * *` | `/send-class-reminders` | 30-min before alert |
| Every minute | `* * * * *` | `/send-class-reminders` | 10-min before alert |

### How It Works

```
Cron Service (Render:5000)
         │
         │  HTTP POST (every schedule trigger)
         ▼
Backend API (Vercel)
         │
         │  Query Firestore for timetables
         │  Query pushTokens collection
         ▼
FCM (Firebase Cloud Messaging)
         │
         │  Push notification
         ▼
User's Mobile Device
```

### Cron Service Code Structure

```javascript
// cron-service/index.js
import cron from 'node-cron';

// Daily reminders at 8:00 PM IST
cron.schedule('0 20 * * *', async () => {
  await fetch(`${BACKEND_URL}/send-daily-reminders`, { method: 'POST' });
}, { timezone: 'Asia/Kolkata' });

// Class reminders every minute
cron.schedule('* * * * *', async () => {
  await fetch(`${BACKEND_URL}/send-class-reminders`, {
    method: 'POST',
    body: JSON.stringify({ minutesBefore: 30 })
  });
}, { timezone: 'Asia/Kolkata' });

// Health check server for Render (port 5000)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end(JSON.stringify({ status: 'healthy' }));
}).listen(5000);
```

---

## Push Notification Flow

### Token Registration (App → Backend)

```
1. User logs in
         │
         ▼
2. App requests notification permission
         │
         ▼
3. Get FCM token from Firebase
         │
         ▼
4. Save to Firestore (pushTokens collection)
   └── Document ID = token itself
   └── Fields: userId, tokenType, platform, active
```

### Sending Notification (Backend → Device)

```
1. Backend receives trigger (API call or cron)
         │
         ▼
2. Query pushTokens where userId = target
         │
         ▼
3. For each token:
   ├── Build notification payload
   ├── Send via FCM
   └── If failed → delete invalid token
         │
         ▼
4. Return results { sent, failed }
```

### Notification Types

| Type | Title | Body |
|------|-------|------|
| Lab Session | 🔬 You have {subject} Lab Tomorrow! | {subject} lab at {time}. Attendance: {%} |
| Regular Class | 📚 You have {subject} Class Tomorrow! | {subject} class at {time}. Attendance: {%} |
| Low Attendance | ⚠️ Warning | Attendance below 75%! |
| No Classes | 🎉 No Classes Tomorrow! | Enjoy your day off! |
| 30-min Reminder | ⏰ Class in 30 minutes | {subject} at {time} in {room} |
| 10-min Reminder | 🔔 Class starting soon! | {subject} starts in 10 minutes |

---

## Environment Variables

### Frontend (.env)
```env
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx
EXPO_PUBLIC_BACKEND_URL=https://mr-bunk-manager.vercel.app
```

### Backend (Vercel Environment Variables)
```env
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
APP_ENV=production
TIMEZONE=Asia/Kolkata
```

### Cron Service (Render Environment Variables)
```env
BACKEND_URL=https://mr-bunk-manager.vercel.app
PORT=5000
```

---

## Key Services Explained

### 1. authService.ts
Handles all authentication operations:
- `signUp()` - Create new user
- `signIn()` - Email/password login
- `signInWithGoogle()` - Google OAuth
- `signOut()` - Logout
- `sendPasswordReset()` - Password recovery
- `sendEmailVerification()` - Email verification

### 2. notificationService.ts
Manages push notifications:
- `registerForPushNotifications()` - Get FCM token
- `savePushToken()` - Store token in Firestore
- `setupNotificationListeners()` - Handle incoming notifications

### 3. firestoreService.ts
Database operations:
- User profile CRUD
- Timetable management
- Attendance tracking
- Subject management

### 4. authStore.ts (Zustand)
State management for auth:
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  pushToken: string | null;
  setUser: (user: User | null) => void;
  registerPushNotifications: () => Promise<void>;
}
```

---

## Offline Support

The app supports offline mode with:

1. **Firestore Offline Persistence**
   ```typescript
   initializeFirestore(app, {
     localCache: persistentLocalCache({
       tabManager: persistentMultipleTabManager()
     })
   });
   ```

2. **Offline Queue Service**
   - Buffers actions when offline
   - Syncs when connection restored

3. **Cache Service**
   - Local data caching
   - Reduces API calls

4. **Network Monitor**
   - Tracks connectivity status
   - Updates UI accordingly

---

## Build & Deploy

### Mobile App (EAS Build)
```bash
# Development build
eas build --profile development --platform android

# Production build
eas build --profile production --platform android

# Submit to Play Store
eas submit --platform android
```

### Backend (Vercel)
```bash
# Deploy via Git push (auto-deploy enabled)
git push origin main

# Or manual deploy
vercel --prod
```

### Cron Service (Render)
1. Connect GitHub repo to Render
2. Set root directory: `backend/cron-service`
3. Set environment variables
4. Deploy as Web Service

---

## Testing

### Test Notification (curl)
```bash
# Send test notification to all users
curl -s --location 'https://mr-bunk-manager.vercel.app/send-notification-all' \
  --header 'Content-Type: application/json' \
  --data '{"title":"Test Notification","body":"Hello from MR BunkManager!"}'
```

### Check Registered Tokens
```bash
curl https://mr-bunk-manager.vercel.app/tokens
```

### Health Check
```bash
curl https://mr-bunk-manager.vercel.app/health
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Notifications not received | Check FCM token in Firestore, verify app permissions |
| "Bad Request" from API | Use `-L` flag in curl for redirects |
| Intermittent API failures | Vercel cold start issue - add delay between requests |
| Cron not triggering | Check Render logs, verify BACKEND_URL env var |
| Firebase init error | Verify all FIREBASE_* env vars are set |
| Offline data not syncing | Check network connectivity, restart app |

### Vercel Serverless Behavior (Important)

**Issue:** Rapid successive API calls may return empty responses or "Bad Request"

**Root Cause:**
- Vercel serverless functions have **cold starts** (function spins down when idle)
- Rapid requests during function scaling can fail
- In-memory rate limiter (`requestCounts` Map) resets on each cold start

**Pattern Observed:**
```
Request 1: ✅ Success (wakes function)
Request 2: ✅ Success (function warm)
Request 3: ❌ Empty/Failed (scaling issue)
After 3s delay: ✅ Success (stabilized)
```

**Solutions:**
1. **Use `-L` flag** with curl (handles redirects)
2. **Add delays** between rapid requests (2-3 seconds)
3. **Cron service** naturally spaces requests (no issue in production)

**Recommended curl format:**
```bash
curl -s -L -X POST "https://mr-bunk-manager.vercel.app/endpoint" \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

---

## Security Notes

1. **Firebase credentials** - Never commit `serviceAccountKey.json`
2. **Environment variables** - Use platform secrets (Vercel, Render, EAS)
3. **Rate limiting** - Backend limits 100 requests per 15 minutes per IP
4. **Token cleanup** - Invalid tokens auto-deleted on failed sends
5. **CORS** - Enabled for mobile app access

---

## Contributing

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npx expo start`
5. For backend: `cd backend && npm start`

---

## Credits

Built with:
- [Expo](https://expo.dev)
- [Firebase](https://firebase.google.com)
- [Express.js](https://expressjs.com)
- [Zustand](https://github.com/pmndrs/zustand)

---

---

## Latest Test Results

**Test Date:** 23/11/2025, 10:40 PM IST

### Health Check
```bash
$ curl -s -L "https://mr-bunk-manager.vercel.app/health"
```
```json
{
  "status": "healthy",
  "message": "MR BunkManager Notification Server (Vercel Serverless)",
  "timestamp": "23/11/2025, 10:37:50 pm",
  "timezone": "Asia/Kolkata (IST)",
  "pattern": "Reshme_Info (flat pushTokens collection)"
}
```

### Registered Tokens
```bash
$ curl -s -L "https://mr-bunk-manager.vercel.app/tokens"
```
```json
{
  "success": true,
  "count": 1,
  "tokens": [
    {
      "token": "cTsp9gDkQnO...XqY",
      "userId": "XahOaNG7LDdWEG4XBMdYSZxkKDC2",
      "tokenType": "fcm",
      "platform": "android",
      "active": true
    }
  ]
}
```

### Send Test Notification
```bash
$ curl -s -L -X POST "https://mr-bunk-manager.vercel.app/send-notification-all" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello"}'
```
```json
{
  "success": true,
  "message": "Notifications sent to all users",
  "result": {
    "totalTokens": 1,
    "sent": 1,
    "failed": 0,
    "invalidTokensRemoved": 0
  }
}
```

### Daily Reminders Test
```bash
$ curl -s -L -X POST "https://mr-bunk-manager.vercel.app/send-daily-reminders" \
  -H "Content-Type: application/json" -d '{}'
```
```json
{
  "success": true,
  "message": "Daily reminders sent",
  "result": {
    "sent": 1,
    "failed": 0,
    "details": [
      { "userId": "XahOaNG7LDdWEG4XBMdYSZxkKDC2", "sent": 1, "failed": 0 }
    ]
  }
}
```

### Test Summary
| Endpoint | Status | Result |
|----------|--------|--------|
| `/health` | ✅ Working | Server healthy |
| `/tokens` | ✅ Working | 1 FCM token registered |
| `/send-notification-all` | ✅ Working | 1 notification sent |
| `/send-daily-reminders` | ✅ Working | 1 reminder sent |

---

**Last Updated:** November 2025
