import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { View, useColorScheme as useDeviceColorScheme } from 'react-native';
import 'react-native-reanimated';

import { lightTheme, darkTheme } from '@/src/config/theme';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import firestoreService from '@/src/services/firestoreService';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { user, loading, initialized, initializeAuth } = useAuthStore();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, []);

  // Check onboarding status when user changes
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user) {
        try {
          const profile = await firestoreService.getUserProfile(user.uid);
          const isComplete = profile?.onboardingCompleted || false;
          console.log('Onboarding status check:', isComplete);
          setOnboardingComplete(isComplete);
        } catch (error) {
          console.error('Error checking onboarding:', error);
          setOnboardingComplete(false);
        }
      } else {
        setOnboardingComplete(null);
      }
    };

    if (initialized && !loading) {
      checkOnboarding();
    }
  }, [user, initialized, loading]);

  // Handle navigation based on auth state and onboarding
  useEffect(() => {
    if (!initialized || loading || onboardingComplete === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Not logged in -> go to login
      router.replace('/(auth)/login');
    } else if (user && !onboardingComplete && !inOnboardingGroup) {
      // Logged in but onboarding not complete -> go to onboarding
      router.replace('/(onboarding)');
    } else if (user && onboardingComplete && !inTabsGroup) {
      // Logged in and onboarding complete -> go to tabs
      router.replace('/(tabs)');
    }
  }, [user, initialized, loading, onboardingComplete]); // Removed 'segments' to prevent navigation loop

  if (!initialized || loading || (user && onboardingComplete === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const deviceColorScheme = useDeviceColorScheme();
  const { themeMode, initialize } = useThemeStore();
  const [isThemeReady, setIsThemeReady] = useState(false);

  // Initialize theme on app start
  useEffect(() => {
    const initTheme = async () => {
      await initialize();
      setIsThemeReady(true);
    };
    initTheme();
  }, []);

  // Determine effective theme
  const effectiveTheme = themeMode === 'system'
    ? (deviceColorScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  const paperTheme = effectiveTheme === 'dark' ? darkTheme : lightTheme;
  const navigationTheme = effectiveTheme === 'dark' ? DarkTheme : DefaultTheme;

  if (!isThemeReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navigationTheme}>
        <RootLayoutNav />
        <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </PaperProvider>
  );
}
