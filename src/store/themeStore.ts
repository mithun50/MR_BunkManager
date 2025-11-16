import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  getEffectiveTheme: () => 'light' | 'dark';
  initialize: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@bunk_manager_theme';

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themeMode: 'system',

  setThemeMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      set({ themeMode: mode });
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  },

  getEffectiveTheme: () => {
    const { themeMode } = get();
    if (themeMode === 'system') {
      // Get device color scheme
      const deviceScheme = useDeviceColorScheme();
      return deviceScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  },

  initialize: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        set({ themeMode: savedTheme });
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  },
}));
