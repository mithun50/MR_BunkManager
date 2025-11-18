# Offline Handling Guide

This app includes comprehensive offline support with caching, queuing, and user feedback.

## Architecture

### 1. Network Store (`src/store/networkStore.ts`)
Centralized network state management using Zustand and NetInfo.

```typescript
import { useNetworkStore } from '@/src/store/networkStore';

// In a component
function MyComponent() {
  const { isConnected, isInternetReachable } = useNetworkStore();
  const isOffline = !isConnected || isInternetReachable === false;

  return <Text>{isOffline ? 'Offline' : 'Online'}</Text>;
}
```

### 2. Cache Service (`src/services/cacheService.ts`)
Local AsyncStorage caching for user data.

**What's cached:**
- User profile (7 days expiry)
- Onboarding status (never expires)
- Subjects (7 days expiry)
- Timetable (7 days expiry)
- Attendance records (1 day expiry)

**Usage:**
```typescript
import cacheService from '@/src/services/cacheService';

// Cache is automatic in firestoreService
// Manual usage:
await cacheService.cacheUserProfile(uid, profile);
const cached = await cacheService.getCachedUserProfile(uid);
```

### 3. Offline Queue (`src/services/offlineQueueService.ts`)
Queues write operations when offline for automatic sync when online.

**Supported operations:**
- Attendance updates
- Profile updates
- Subject additions/deletions
- Timetable updates

**Usage:**
```typescript
import offlineQueueService from '@/src/services/offlineQueueService';

// Queue is automatic in firestoreService
// Check queue length:
const length = await offlineQueueService.getQueueLength();
```

### 4. Network Monitor (`src/components/NetworkMonitor.tsx`)
Visual feedback for offline status and sync progress.

**Features:**
- Top banner when offline (dismissable)
- Shows number of pending changes
- Automatic sync progress indicator
- Non-intrusive UI

## How to Use in Your Code

### Method 1: Using OnlineButton Component (Recommended)

```tsx
import OnlineButton from '@/src/components/OnlineButton';

function MyScreen() {
  const handleSubmit = async () => {
    // This will only run if online
    await saveData();
  };

  return (
    <OnlineButton
      mode="contained"
      onPress={handleSubmit}
      requiresOnline={true}
      offlineMessage="You need internet to submit this form"
    >
      Submit
    </OnlineButton>
  );
}
```

### Method 2: Using Offline Helpers

```tsx
import { withOnlineCheck, executeIfOnline, isOnline } from '@/src/utils/offlineHelper';

function MyScreen() {
  // Option A: Wrap button handler
  const handleSubmit = withOnlineCheck(async () => {
    await saveData();
  }, {
    message: "Cannot submit while offline"
  });

  // Option B: Check inline
  const handleAction = async () => {
    const result = await executeIfOnline(async () => {
      return await saveData();
    }, "This action requires internet");

    if (result) {
      console.log('Success:', result);
    }
  };

  // Option C: Manual check
  const handleManual = () => {
    if (!isOnline()) {
      Alert.alert('Offline', 'Please connect to internet');
      return;
    }
    saveData();
  };

  return (
    <Button onPress={handleSubmit}>Submit</Button>
  );
}
```

### Method 3: Allow Offline with Warning

```tsx
import OnlineButton from '@/src/components/OnlineButton';

function MyScreen() {
  const handleSubmit = async () => {
    // Will queue if offline, but user gets to confirm
    await saveData();
  };

  return (
    <OnlineButton
      mode="contained"
      onPress={handleSubmit}
      requiresOnline={true}
      allowOfflineWithWarning={true}
      offlineMessage="This action will be queued and synced when online"
    >
      Submit
    </OnlineButton>
  );
}
```

## When to Require Online Connection

### ❌ DON'T require online for:
- Viewing cached data (dashboard, subjects, attendance history)
- Navigation between screens
- Marking attendance (it queues automatically)
- Editing subjects locally

### ✅ DO require online for:
- Authentication (login, signup, password reset)
- Email verification
- Uploading images/files
- Initial onboarding (though it should queue)
- Real-time features

## Testing Offline Functionality

### 1. Test Offline Mode
1. Open app with internet
2. Login and use app normally
3. Turn off WiFi/mobile data
4. Reopen app
5. **Expected:** App loads with cached data, shows offline banner

### 2. Test Offline Queue
1. Go offline
2. Mark attendance or edit subject
3. **Expected:** Action succeeds, offline banner shows "1 change will sync when online"
4. Turn on internet
5. **Expected:** "Syncing..." banner appears briefly, then changes sync

### 3. Test Button Offline Check
1. Go offline
2. Click a button wrapped with `OnlineButton` or `withOnlineCheck`
3. **Expected:** Alert shows "Cannot proceed offline"

## Firestore Integration

The `firestoreService` automatically handles caching and offline queue:

```typescript
// Read operations - automatic cache fallback
const subjects = await firestoreService.getSubjects(uid);
// → Tries Firestore first
// → If offline, returns cached data
// → If no cache, throws error

// Write operations - automatic queue when offline
await firestoreService.updateSubjectAttendance(uid, subjectId, true);
// → If online: executes immediately
// → If offline: queues for later sync
```

## Cache Management

### Clear Cache
```typescript
import cacheService from '@/src/services/cacheService';

// Clear all user caches
await cacheService.clearAllUserCaches(uid);

// Clear specific caches
await cacheService.clearSubjectsCache(uid);
await cacheService.clearAttendanceCache(uid);

// Clear expired caches (automatic cleanup)
await cacheService.clearExpiredCaches();
```

### Clear Queue
```typescript
import offlineQueueService from '@/src/services/offlineQueueService';

// Clear all queued operations (use with caution!)
await offlineQueueService.clearQueue();
```

## Network State Subscription

```typescript
import { useNetworkStore } from '@/src/store/networkStore';
import { useEffect } from 'react';

function MyComponent() {
  const { isConnected, isInternetReachable } = useNetworkStore();

  useEffect(() => {
    if (isConnected && isInternetReachable !== false) {
      console.log('Back online!');
      // Trigger data refresh
    } else {
      console.log('Offline');
    }
  }, [isConnected, isInternetReachable]);

  return null;
}
```

## Best Practices

1. **Always use cache-first approach** - Load cached data immediately, then update from server
2. **Show offline indicators** - Use NetworkMonitor or custom UI to show offline status
3. **Queue write operations** - Don't block users from making changes offline
4. **Handle errors gracefully** - Provide clear feedback when operations fail
5. **Auto-sync when online** - NetworkMonitor handles this automatically
6. **Clear expired caches** - Prevents stale data issues

## Example: Complete Screen Implementation

```tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import OnlineButton from '@/src/components/OnlineButton';
import { useNetworkStore } from '@/src/store/networkStore';
import firestoreService from '@/src/services/firestoreService';
import cacheService from '@/src/services/cacheService';

function AttendanceScreen() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected, isInternetReachable } = useNetworkStore();
  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      // Try cache first for instant load
      const cached = await cacheService.getCachedSubjects(uid);
      if (cached) {
        setSubjects(cached);
        setLoading(false);
      }

      // Then fetch fresh data
      const fresh = await firestoreService.getSubjects(uid);
      setSubjects(fresh);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (subjectId: string, attended: boolean) => {
    // This automatically queues if offline
    await firestoreService.updateSubjectAttendance(uid, subjectId, attended);

    // Update local state immediately for instant feedback
    setSubjects(prev =>
      prev.map(s =>
        s.id === subjectId
          ? {
              ...s,
              totalClasses: s.totalClasses + 1,
              attendedClasses: s.attendedClasses + (attended ? 1 : 0),
            }
          : s
      )
    );
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View>
      {isOffline && (
        <Text>Viewing offline data. Changes will sync when online.</Text>
      )}

      {subjects.map(subject => (
        <View key={subject.id}>
          <Text>{subject.name}</Text>
          <OnlineButton
            mode="outlined"
            onPress={() => handleMarkAttendance(subject.id, true)}
            requiresOnline={false} // Allow offline marking
          >
            Present
          </OnlineButton>
        </View>
      ))}
    </View>
  );
}
```

## Troubleshooting

### App doesn't load offline
- Check if user has used the app online at least once (cache needs initial data)
- Verify Firestore offline persistence is enabled in firebase.ts
- Check cache expiry settings

### Changes don't sync
- Check network connection
- Verify NetworkMonitor is rendered in app root (_layout.tsx)
- Check offline queue with `offlineQueueService.getQueueLength()`
- Look for errors in console logs

### Cache is stale
- Caches expire after 7 days (1 day for attendance)
- Clear cache manually if needed
- Check `CACHE_EXPIRY` constants in cacheService.ts
