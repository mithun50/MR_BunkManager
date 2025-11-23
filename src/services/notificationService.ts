/**
 * Push Notification Service
 *
 * Pattern: Same as Reshme_Info project
 * - Flat token storage in pushTokens collection (token as document ID)
 * - FCM token first, Expo token fallback
 * - Direct Firestore storage (no backend call needed for token save)
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Get backend URL from environment variable
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

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
 * Register for push notifications and get FCM/Expo push token
 * Pattern: Same as Reshme_Info App.tsx
 *
 * @returns {Promise<string | undefined>} Push token or undefined if failed
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('⚠️  Must use physical device for push notifications');
    return undefined;
  }

  try {
    // Configure Android notification channel FIRST (before getting token)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MR BunkManager',
        description: 'MR BunkManager - Class & Attendance Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Return early if permission denied
    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permission denied');
      return undefined;
    }

    // Get device-specific FCM token for production (works in standalone APK)
    // Falls back to Expo token for development in Expo Go
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      token = deviceToken.data;
      console.log('✅ FCM Push Token (Production):', token);
    } catch (deviceTokenError) {
      console.log('⚠️  Could not get FCM token, falling back to Expo token (Development)');
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = expoPushToken.data;
        console.log('✅ Expo Push Token (Development):', token);
      } catch (error) {
        console.error('❌ Error getting push token:', error);
      }
    }

    return token;
  } catch (error) {
    console.error('❌ Error in registerForPushNotificationsAsync:', error);
    return undefined;
  }
}

/**
 * Save push token directly to Firestore (Reshme_Info pattern)
 * Uses token as document ID in flat pushTokens collection
 *
 * @param {string} userId - Firebase user ID
 * @param {string} token - Push token (FCM or Expo)
 * @returns {Promise<boolean>} True if saved successfully
 */
export async function savePushToken(userId: string, token: string): Promise<boolean> {
  try {
    const tokenType = token.startsWith('ExponentPushToken') ? 'expo' : 'fcm';

    console.log(`📤 Saving ${tokenType} token to Firestore pushTokens collection...`);

    // Save directly to Firestore using token as document ID (Reshme_Info pattern)
    await setDoc(doc(db, 'pushTokens', token), {
      token: token,
      userId: userId,
      tokenType: tokenType,
      createdAt: new Date(),
      updatedAt: new Date(),
      platform: Platform.OS,
      active: true,
      deviceInfo: {
        os: Platform.OS,
        version: Platform.Version,
        deviceId: Constants.deviceId || `device_${Date.now()}`,
      },
    });

    console.log('✅ Push token saved to Firestore successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving push token to Firestore:', error);
    return false;
  }
}

/**
 * Delete push token from Firestore (called on logout)
 *
 * @param {string} token - Push token to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deletePushToken(token: string): Promise<boolean> {
  try {
    console.log('📤 Deleting push token from Firestore...');

    // Delete from Firestore using token as document ID
    await deleteDoc(doc(db, 'pushTokens', token));

    console.log('✅ Push token deleted from Firestore');
    return true;
  } catch (error) {
    console.error('❌ Error deleting push token:', error);
    return false;
  }
}

/**
 * Delete push token by userId (alternative method for logout)
 * Note: This requires querying first, so prefer deletePushToken(token) if token is available
 *
 * @param {string} userId - Firebase user ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deletePushTokenByUserId(userId: string): Promise<boolean> {
  try {
    console.log(`📤 Deleting push token for user ${userId} via backend...`);

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
 * Setup notification listeners for when notifications are received or tapped
 *
 * @param {Function} onNotificationReceived - Callback when notification received (app in foreground)
 * @param {Function} onNotificationTapped - Callback when notification tapped
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    notification => {
      console.log('📩 Notification received:', notification.request.content);
      onNotificationReceived?.(notification);
    }
  );

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    response => {
      console.log('👆 Notification tapped:', response.notification.request.content);
      onNotificationTapped?.(response);
    }
  );

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Get the last notification response (if user tapped notification to open app)
 *
 * @returns {Promise<Notifications.NotificationResponse | null>}
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Clear all notifications from notification tray
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get notification permissions status
 *
 * @returns {Promise<boolean>} True if permissions granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Register and save push token in one call (convenience function)
 *
 * @param {string} userId - Firebase user ID
 * @returns {Promise<string | undefined>} Token if successful
 */
export async function registerAndSavePushToken(userId: string): Promise<string | undefined> {
  const token = await registerForPushNotificationsAsync();

  if (token) {
    await savePushToken(userId, token);
  }

  return token;
}
