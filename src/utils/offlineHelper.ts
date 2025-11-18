import { Alert } from 'react-native';
import { useNetworkStore } from '../store/networkStore';

/**
 * Check if the device is online
 */
export function isOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkStore.getState();
  return isConnected && isInternetReachable !== false;
}

/**
 * Show an offline alert
 */
export function showOfflineAlert(
  title: string = "No Internet Connection",
  message: string = "Please check your internet connection and try again."
): void {
  Alert.alert(title, message, [{ text: 'OK' }]);
}

/**
 * Execute a function only if online, otherwise show offline alert
 * @param action - Function to execute if online
 * @param customMessage - Custom offline message (optional)
 * @returns true if action was executed, false if offline
 */
export async function executeIfOnline<T>(
  action: () => Promise<T> | T,
  customMessage?: string
): Promise<T | null> {
  if (!isOnline()) {
    showOfflineAlert(
      "Cannot Proceed Offline",
      customMessage || "This action requires an internet connection. Please check your connection and try again."
    );
    return null;
  }

  return await action();
}

/**
 * Check if online before executing, useful for button handlers
 * @param callback - Function to run if online
 * @param options - Configuration options
 */
export function withOnlineCheck(
  callback: () => void | Promise<void>,
  options?: {
    title?: string;
    message?: string;
    allowOffline?: boolean; // If true, executes anyway but shows warning
  }
) {
  return async () => {
    if (!isOnline()) {
      if (options?.allowOffline) {
        Alert.alert(
          options.title || "You're Offline",
          options.message || "This action may not work properly without internet.",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue Anyway',
              onPress: () => callback(),
            },
          ]
        );
      } else {
        showOfflineAlert(
          options?.title || "Cannot Proceed Offline",
          options?.message || "Please check your internet connection and try again."
        );
      }
      return;
    }

    await callback();
  };
}

/**
 * Higher-order function to wrap async operations with offline check
 */
export function requiresOnline<T extends (...args: any[]) => any>(
  fn: T,
  errorMessage?: string
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return async (...args: Parameters<T>) => {
    if (!isOnline()) {
      showOfflineAlert(
        "Cannot Proceed Offline",
        errorMessage || "This operation requires an internet connection."
      );
      return null;
    }

    return await fn(...args);
  };
}
