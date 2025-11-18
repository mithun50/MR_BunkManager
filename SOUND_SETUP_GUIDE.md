# 🔊 Notification Sound Setup Guide

## ✅ Sound Configuration Status

All sound settings are **properly configured**! Here's what's already set up:

### Backend Configuration ✅
```javascript
// backend/src/sendNotification.js (line 163)
{
  to: token,
  sound: 'default',  // ✅ Sound enabled
  title: message.title,
  body: message.body,
  priority: 'high',
  channelId: 'default'
}
```

### Frontend Configuration ✅
```typescript
// src/services/notificationService.ts (line 73-79)
await Notifications.setNotificationChannelAsync('default', {
  name: 'Default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF6B6B',
  sound: 'default',  // ✅ Sound enabled
});
```

### App Configuration ✅
```json
// app.json
{
  "notification": {
    "icon": "./assets/images/icon.png",
    "color": "#FF6B6B",
    "androidMode": "default"
  }
}
```

---

## 🔧 Troubleshooting: If You Don't Hear Sound

### 1. Check Device Settings

**Android:**
```
Settings → Apps → MR BunkManager → Notifications
  ✓ Allow notifications: ON
  ✓ Default channel: ON
  ✓ Sound: Enabled (should show default notification sound)
```

**iOS:**
```
Settings → Notifications → MR BunkManager
  ✓ Allow Notifications: ON
  ✓ Sounds: ON
  ✓ Critical Alerts: ON (if available)
```

### 2. Check Do Not Disturb / Silent Mode

- Make sure your phone is **not in silent mode**
- Turn off **Do Not Disturb** mode
- Check **volume level** for notifications (separate from media volume)

### 3. Test Notification Sound

Run this test to confirm sound works:

```bash
# Send test notification with explicit sound
curl -X POST http://localhost:3000/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "🔊 Sound Test",
    "body": "If you hear this, sound is working!"
  }'
```

### 4. Rebuild App (If Sound Still Missing)

If you made changes to app.json, you need to rebuild:

```bash
# Clear cache and rebuild
npx expo start --clear

# Or rebuild native code
npx expo run:android
```

---

## 🎵 Adding Custom Sound (Optional)

If you want a **custom notification sound** instead of default:

### Step 1: Add Sound File

Create the sounds directory and add your sound file:
```bash
mkdir -p assets/sounds
# Add your notification.wav or notification.mp3 file here
```

Sound requirements:
- **Format**: WAV or MP3
- **Duration**: 1-2 seconds recommended
- **Sample rate**: 44.1kHz
- **Channels**: Mono or Stereo

### Step 2: Update app.json

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/images/icon.png",
      "color": "#FF6B6B",
      "sound": "./assets/sounds/notification.wav"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#FF6B6B",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ]
  }
}
```

### Step 3: Update Notification Service

Modify `src/services/notificationService.ts`:

```typescript
// Change from 'default' to your custom sound name
await Notifications.setNotificationChannelAsync('default', {
  name: 'Default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF6B6B',
  sound: 'notification.wav',  // Your custom sound
});
```

### Step 4: Rebuild App

```bash
npx expo prebuild --clean
npx expo run:android
```

---

## 🔍 Common Sound Issues & Solutions

### Issue: No sound on Android

**Solution 1: Check Notification Channel**
```typescript
// Test if channel is configured
import * as Notifications from 'expo-notifications';

const channel = await Notifications.getNotificationChannelAsync('default');
console.log('Channel settings:', channel);
```

**Solution 2: Recreate Channel**
```typescript
// Delete and recreate the channel
await Notifications.deleteNotificationChannelAsync('default');
await Notifications.setNotificationChannelAsync('default', {
  name: 'Default',
  importance: Notifications.AndroidImportance.MAX,
  sound: 'default',
  vibrationPattern: [0, 250, 250, 250],
});
```

### Issue: Sound works on some devices but not others

This is normal! Different Android manufacturers handle notifications differently:
- **Samsung**: May have extra notification settings
- **Xiaomi**: Check MIUI notification permissions
- **OnePlus**: Check battery optimization settings
- **Huawei**: Check "App Launch" settings

**Solution:** Check device-specific notification settings.

### Issue: Sound only works when app is open

**Solution:** This is expected behavior for iOS. On Android, sound should work even when app is closed.

For iOS, you need:
- Apple Developer account
- Push notification certificate
- App Store distribution

---

## 📱 Sound Behavior by App State

### Android
| App State | Sound | Vibration | Visual |
|-----------|-------|-----------|--------|
| Foreground | ✅ Yes | ✅ Yes | ✅ Yes |
| Background | ✅ Yes | ✅ Yes | ✅ Yes |
| Killed | ✅ Yes | ✅ Yes | ✅ Yes |

### iOS
| App State | Sound | Vibration | Visual |
|-----------|-------|-----------|--------|
| Foreground | ⚠️ Custom | ⚠️ Custom | ✅ Yes |
| Background | ✅ Yes | ✅ Yes | ✅ Yes |
| Killed | ✅ Yes | ✅ Yes | ✅ Yes |

---

## ✅ Quick Checklist

Before reporting sound issues, verify:

- [ ] Phone is NOT in silent mode
- [ ] Phone is NOT in Do Not Disturb mode
- [ ] Notification volume is turned up
- [ ] App has notification permissions
- [ ] Notification sound is enabled in app settings
- [ ] Testing on physical device (not emulator)
- [ ] App is properly rebuilt after config changes

---

## 🎯 Current Setup Summary

**Your app is configured to use:**
- ✅ **Default system notification sound**
- ✅ **Vibration pattern**: 0ms, 250ms, 250ms, 250ms
- ✅ **High priority** notifications
- ✅ **LED light** color: #FF6B6B (red)
- ✅ **Sound enabled** in backend and frontend

**This is the recommended setup** and should work on all devices!

---

## 🧪 Test Sound Now

1. **Make sure your phone volume is UP**
2. **Turn off silent mode**
3. **Start backend**: `cd backend && npm start`
4. **Send test notification**:
```bash
curl -X POST http://localhost:3000/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "🔊 Sound Test",
    "body": "Listen for the notification sound!"
  }'
```

**You should hear:**
- Default notification sound ✅
- Vibration pattern ✅
- See notification ✅

---

**Sound is properly configured! If you still don't hear it, check your device settings.** 🔊
