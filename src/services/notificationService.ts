/**
 * Push Notification Service
 *
 * Handles Expo push notification registration and communication with backend
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
 * Register for push notifications and get Expo push token
 *
 * @returns {Promise<string | undefined>} Expo push token or undefined if failed
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  // Push notifications only work on physical devices
  if (Device.isDevice) {
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
      alert('Failed to get push notification permissions. Please enable notifications in settings.');
      return;
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
        alert('Failed to get push notification token. Please try again.');
      }
    }
  } else {
    console.log('⚠️  Must use physical device for push notifications');
    alert('Push notifications only work on physical devices, not emulators.');
  }

  return token;
}

/**
 * Save push token to backend server
 *
 * @param {string} userId - Firebase user ID
 * @param {string} token - Expo push token
 * @returns {Promise<boolean>} True if saved successfully
 */
export async function savePushToken(userId: string, token: string): Promise<boolean> {
  try {
    const deviceId = Constants.deviceId || `device_${Date.now()}`;

    console.log(`📤 Saving push token to backend: ${BACKEND_URL}/save-token`);

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
      console.log('✅ Push token saved to backend successfully');
      return true;
    } else {
      console.error('❌ Failed to save push token:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving push token to backend:', error);
    console.error('Make sure backend server is running at:', BACKEND_URL);
    return false;
  }
}

/**
 * Delete push token from backend server (called on logout)
 *
 * @param {string} userId - Firebase user ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deletePushToken(userId: string): Promise<boolean> {
  try {
    const deviceId = Constants.deviceId || '';

    console.log(`📤 Deleting push token from backend: ${BACKEND_URL}/delete-token`);

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
