import { create } from 'zustand';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  registerForPushNotificationsAsync,
  savePushToken,
  deletePushToken,
} from '../services/notificationService';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
  refreshUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user, loading: false }),

  setLoading: (loading) => set({ loading }),

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      set({ user, loading: false, initialized: true });

      // Register push notifications when user logs in
      if (user) {
        try {
          console.log('👤 User logged in, registering push notifications...');
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await savePushToken(user.uid, token);
            console.log('✅ Push notifications registered successfully');
          }
        } catch (error) {
          console.error('❌ Error registering push notifications:', error);
        }
      } else {
        console.log('👋 User logged out');
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
