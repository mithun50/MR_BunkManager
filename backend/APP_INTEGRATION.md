# 📱 Expo App Integration Guide

Complete guide to integrate the backend with your existing MR BunkManager app.

---

## ✅ What I Analyzed From Your App

### Discovered Data Structures

From `/src/types/user.ts`:
```typescript
✅ UserProfile - college, course, department, semester, rollNumber
✅ TimetableEntry - day, startTime, endTime, subject, type, room, faculty
✅ Subject - name, code, totalClasses, attendedClasses, attendancePercentage
✅ AttendanceRecord - subjectId, date, status, type, remarks
```

### Discovered Firestore Structure

From `/src/services/firestoreService.ts`:
```
users/{userId}/
  ├─ profile data (email, displayName, college, etc.)
  ├─ timetable/ collection
  │    └─ {entryId} - day, startTime, subject, type, etc.
  ├─ subjects/ collection
  │    └─ {subjectId} - name, totalClasses, attendedClasses, etc.
  └─ attendance/ collection
       └─ {recordId} - subjectId, date, status, type
```

### Discovered App Screens

From `/app/(tabs)/`:
```
✅ timetable.tsx - Shows weekly schedule
✅ attendance.tsx - Tracks class attendance
✅ profile.tsx - User profile management
✅ index.tsx - Dashboard
✅ groups.tsx - Group features
```

### Discovered Dependencies

From `package.json`:
```
✅ expo-notifications - NOT INSTALLED YET (we'll add this)
✅ @react-native-firebase/auth - Already installed
✅ @react-native-firebase/firestore - Already installed
✅ firebase (web SDK) - Already installed
✅ zustand - For state management
```

---

## 🎯 Backend Compatibility

**✅ The backend I created is 100% compatible with your app structure!**

It reads from:
- `users/{userId}/timetable/` - Your existing timetable data
- `users/{userId}/subjects/` - Your existing subjects data

It writes to:
- `users/{userId}/deviceTokens/` - NEW collection for push tokens

**No changes needed to your existing Firestore data!**

---

## 📦 Step-by-Step Integration

### Step 1: Install Expo Notifications

```bash
cd /data/data/com.termux/files/home/MR_BunkManager
npx expo install expo-notifications expo-device expo-constants
```

### Step 2: Update app.json

Add notification configuration to your `app.json`:

```json
{
  "expo": {
    "name": "mr_bunkmanager",
    "notification": {
      "icon": "./assets/images/icon.png",
      "color": "#ffffff",
      "androidMode": "default",
      "androidCollapsedTitle": "MR BunkManager"
    },
    "android": {
      "useNextNotificationsApi": true,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.POST_NOTIFICATIONS"
      ]
    },
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### Step 3: Create Notification Service

Create new file: `/src/services/notificationService.ts`

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Backend API URL - CHANGE THIS TO YOUR DEPLOYED BACKEND URL
const BACKEND_URL = __DEV__
  ? 'http://localhost:3000'  // Development (use your local IP for real device)
  : 'https://your-backend-url.com'; // Production

/**
 * Configure how notifications are displayed when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  // Only works on physical devices
  if (Device.isDevice) {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Return if permission denied
    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permission denied');
      return;
    }

    // Get push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;

      console.log('✅ Push token obtained:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    console.log('⚠️ Must use physical device for push notifications');
  }

  // Configure Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

/**
 * Save push token to backend
 */
export async function savePushToken(userId: string, token: string): Promise<boolean> {
  try {
    const deviceId = Constants.deviceId || `device_${Date.now()}`;

    const response = await fetch(`${BACKEND_URL}/save-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        token,
        deviceId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Push token saved to backend');
      return true;
    } else {
      console.error('❌ Failed to save push token:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving push token:', error);
    return false;
  }
}

/**
 * Delete push token from backend
 */
export async function deletePushToken(userId: string): Promise<boolean> {
  try {
    const deviceId = Constants.deviceId || '';

    const response = await fetch(`${BACKEND_URL}/delete-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        deviceId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Push token deleted from backend');
      return true;
    } else {
      console.error('❌ Failed to delete push token:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting push token:', error);
    return false;
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    notification => {
      console.log('📩 Notification received:', notification);
      onNotificationReceived?.(notification);
    }
  );

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    response => {
      console.log('👆 Notification tapped:', response);
      onNotificationTapped?.(response);
    }
  );

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
```

### Step 4: Update Auth Store

Modify `/src/store/authStore.ts` to register push token on login:

```typescript
import {
  registerForPushNotificationsAsync,
  savePushToken,
  deletePushToken,
} from '../services/notificationService';

// Add to your existing auth store
export const useAuthStore = create<AuthStore>((set, get) => ({
  // ... your existing code ...

  // Modify your signIn function
  signIn: async (email: string, password: string) => {
    try {
      // ... your existing sign-in logic ...

      // After successful sign-in, register push token
      const user = get().user;
      if (user) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushToken(user.uid, token);
        }
      }

    } catch (error) {
      // ... your error handling ...
    }
  },

  // Modify your signOut function
  signOut: async () => {
    try {
      const user = get().user;

      // Delete push token before signing out
      if (user) {
        await deletePushToken(user.uid);
      }

      // ... your existing sign-out logic ...
    } catch (error) {
      // ... your error handling ...
    }
  },

  // ... rest of your code ...
}));
```

### Step 5: Setup in App Root

Modify `/app/_layout.tsx` to initialize notifications:

```typescript
import { useEffect } from 'react';
import { setupNotificationListeners } from '@/src/services/notificationService';

export default function RootLayout() {
  useEffect(() => {
    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      // Handle notification received while app is open
      (notification) => {
        console.log('Notification received:', notification.request.content);
        // You can show an in-app alert or update UI here
      },
      // Handle notification tap
      (response) => {
        console.log('Notification tapped:', response.notification.request.content);
        // Navigate to relevant screen based on notification data
        const data = response.notification.request.content.data;
        // Example: navigation.navigate('Attendance');
      }
    );

    return cleanup;
  }, []);

  // ... rest of your layout code ...
}
```

### Step 6: Add Manual Test Button (Optional)

Add a test button to your profile screen (`/app/(tabs)/profile.tsx`):

```typescript
import { registerForPushNotificationsAsync, savePushToken } from '@/src/services/notificationService';
import { Button } from 'react-native-paper';

// Inside your ProfileScreen component:
const handleTestNotification = async () => {
  try {
    // Register and save token
    const token = await registerForPushNotificationsAsync();
    if (token && user) {
      await savePushToken(user.uid, token);
      alert('✅ Push notifications enabled!');
    }
  } catch (error) {
    alert('❌ Failed to enable notifications');
  }
};

// Add button in your JSX:
<Button mode="outlined" onPress={handleTestNotification}>
  Enable Push Notifications
</Button>
```

---

## 🧪 Testing the Integration

### 1. Start Backend Server

```bash
cd backend
npm start
```

### 2. Update Backend URL for Physical Device

If testing on a real device (not emulator), find your computer's local IP:

**macOS/Linux:**
```bash
ifconfig | grep "inet "
```

**Windows:**
```bash
ipconfig
```

Then update `notificationService.ts`:
```typescript
const BACKEND_URL = __DEV__
  ? 'http://192.168.1.100:3000'  // Your local IP
  : 'https://your-backend-url.com';
```

### 3. Run Your Expo App

```bash
npm start
# Press 'a' for Android or 'i' for iOS
```

### 4. Test the Flow

1. **Login to your app** → Push token automatically registered
2. **Check backend logs** → Should see: "✅ Token saved for user {userId}"
3. **Send test notification via backend:**
   ```bash
   curl -X POST http://localhost:3000/send-notification \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "your-user-id",
       "title": "Test",
       "body": "Hello from backend!"
     }'
   ```
4. **Check your device** → Should receive notification!

### 5. Test Auto-Generated Messages

```bash
curl -X POST http://localhost:3000/send-notification \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id"}'
```

This will generate a message like:
```
🔬 You have Computer Networks Lab Tomorrow!
Computer Networks lab at 02:00 PM. Your overall attendance is 78%.
```

---

## 📊 Firestore Structure After Integration

```
users/
  └── {userId}/
      ├── (existing from your app)
      ├── email: string
      ├── displayName: string
      ├── college: string
      ├── course: string
      ├── department: string
      ├── semester: string
      ├── rollNumber: string
      ├── minimumAttendance: number
      ├── onboardingCompleted: boolean
      │
      ├── timetable/              ← Read by backend
      │   └── {entryId}
      │       ├── day: "Monday"
      │       ├── startTime: "09:00 AM"
      │       ├── endTime: "10:00 AM"
      │       ├── subject: "Mathematics"
      │       ├── type: "lecture"
      │       ├── room: "Room 101"
      │       └── faculty: "Dr. Smith"
      │
      ├── subjects/               ← Read by backend
      │   └── {subjectId}
      │       ├── name: "Mathematics"
      │       ├── code: "MATH101"
      │       ├── type: "lecture"
      │       ├── totalClasses: 50
      │       ├── attendedClasses: 40
      │       ├── attendancePercentage: 80
      │       ├── faculty: "Dr. Smith"
      │       ├── room: "Room 101"
      │       └── deleted: false
      │
      ├── attendance/             ← Not used by backend
      │   └── {recordId}
      │       ├── subjectId: string
      │       ├── date: Timestamp
      │       ├── status: "present"
      │       └── type: "lecture"
      │
      └── deviceTokens/           ← NEW: Written by backend
          └── {deviceId}
              ├── token: "ExponentPushToken[...]"
              ├── deviceId: "unique-device-id"
              ├── createdAt: Timestamp
              ├── updatedAt: Timestamp
              └── active: true
```

---

## 🔔 Notification Examples

Based on your app data, users will receive:

### Example 1: Lab Session
```
Title: 🔬 You have Data Structures Lab Tomorrow!
Body: Data Structures lab at 02:00 PM. Your overall attendance is 82%.
```

### Example 2: Regular Class
```
Title: 📚 You have Operating Systems Class Tomorrow!
Body: Operating Systems class at 10:00 AM. Your overall attendance is 75%.
```

### Example 3: Low Attendance Warning
```
Title: 📚 You have Database Management Class Tomorrow!
Body: Database Management class at 11:00 AM. Your overall attendance is 68%. ⚠️ Attendance below 75%!
```

### Example 4: No Classes
```
Title: 🎉 No Classes Tomorrow!
Body: Your overall attendance is 85%. Enjoy your day off!
```

---

## ⏰ Daily Reminders

Every day at **8:00 PM IST**, all users automatically receive personalized notifications about tomorrow's classes based on:
- Their timetable data
- Current attendance percentage
- Type of class (lab vs lecture)

---

## 🐛 Common Integration Issues

### Issue: "Expo token undefined"
**Solution:** Make sure you're running on a physical device, not an emulator.

### Issue: "Network request failed"
**Solution:**
- Check backend is running
- Update `BACKEND_URL` with correct IP address
- Make sure firewall allows port 3000

### Issue: "No timetable data"
**Solution:** Make sure you've added timetable entries in your app first.

### Issue: "Permission denied"
**Solution:**
- Check app.json has notification permissions
- Manually enable notifications in device settings

### Issue: "Token not saved to Firestore"
**Solution:**
- Check backend logs for errors
- Verify Firebase service account key is correct
- Check Firestore security rules allow writes to deviceTokens

---

## 🔒 Security Considerations

### Production Checklist

1. **Update Backend URL:**
   ```typescript
   const BACKEND_URL = 'https://your-production-backend.com';
   ```

2. **Add API Authentication (Optional):**
   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${apiKey}`
   }
   ```

3. **Firestore Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/deviceTokens/{deviceId} {
         // Only backend can write (using service account)
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if false; // Only backend via admin SDK
       }
     }
   }
   ```

---

## 📱 Testing on Real Device

### Android

1. Build development client:
   ```bash
   npx expo run:android
   ```

2. Update `notificationService.ts` with your computer's IP
3. Make sure device is on same WiFi network
4. Run backend and app
5. Test notifications!

### iOS

1. Need Apple Developer account for push notifications
2. Build development client:
   ```bash
   npx expo run:ios
   ```
3. Follow same steps as Android

---

## 🚀 Deployment

### Backend Deployment

See [README.md](README.md) for backend deployment options (Railway, Render, etc.)

### Update App for Production

After deploying backend, update `notificationService.ts`:
```typescript
const BACKEND_URL = 'https://your-deployed-backend.railway.app';
```

---

## ✅ Integration Checklist

- [ ] Install expo-notifications package
- [ ] Update app.json with notification config
- [ ] Create notificationService.ts
- [ ] Update authStore with push token logic
- [ ] Setup listeners in _layout.tsx
- [ ] Test on physical device
- [ ] Verify backend receives token
- [ ] Test sending notifications
- [ ] Test daily reminders
- [ ] Deploy backend to production
- [ ] Update app with production URL
- [ ] Submit app to stores

---

**Your app is now ready for push notifications! 🎉**

For questions or issues, refer to [README.md](README.md) or open an issue.
