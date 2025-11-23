import { create } from 'zustand';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  pushToken: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
  refreshUser: () => void;
}

/**
 * Register push notifications with dynamic import
 * This prevents expo-notifications from breaking the app in Expo Go (SDK 53+)
 */
async function registerPushNotifications(userId: string): Promise<string | null> {
  try {
    // Dynamic import to avoid breaking Expo Go
    const notificationService = await import('../services/notificationService');

    console.log('👤 User logged in, registering push notifications...');
    const token = await notificationService.registerForPushNotificationsAsync();

    if (token) {
      await notificationService.savePushToken(userId, token);
      console.log('✅ Push notifications registered successfully');
      return token;
    }
    return null;
  } catch (error) {
    // Silently handle error in Expo Go (SDK 53+ doesn't support push notifications)
    console.log('⚠️ Push notifications not available (use development build for full support)');
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  pushToken: null,

  setUser: (user) => set({ user, loading: false }),

  setLoading: (loading) => set({ loading }),

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      set({ user, loading: false, initialized: true });

      // Register push notifications when user logs in
      if (user) {
        const token = await registerPushNotifications(user.uid);
        if (token) {
          set({ pushToken: token });
        }
      } else {
        console.log('👋 User logged out');
        set({ pushToken: null });
      }
    });

    return unsubscribe;
  },

  refreshUser: () => {
    // Manually update the user state from Firebase
    const currentUser = auth.currentUser;
    set({ user: currentUser });
  },
}));
