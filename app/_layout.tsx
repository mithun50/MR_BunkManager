import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect, useSegments, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { View, useColorScheme as useDeviceColorScheme } from 'react-native';
import 'react-native-reanimated';

import { lightTheme, darkTheme } from '@/src/config/theme';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import firestoreService from '@/src/services/firestoreService';
import VideoLoadingScreen from '@/src/components/VideoLoadingScreen';
import NetworkMonitor from '@/src/components/NetworkMonitor';

// Removed unstable_settings - it doesn't work reliably in production
// Expo Router uses alphabetical ordering: (auth) < (onboarding) < (tabs)

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { user, loading, initialized, initializeAuth } = useAuthStore();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  // Initialize auth listener
  useEffect(() => {
    console.log('🔑 Initializing auth listener...');
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, []);

  // Check onboarding status when user changes
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user) {
        try {
          console.log('📋 Checking onboarding status for user:', user.uid);
          const profile = await firestoreService.getUserProfile(user.uid);
          const isComplete = profile?.onboardingCompleted || false;
          console.log('✅ Onboarding status:', isComplete);
          setOnboardingComplete(isComplete);
        } catch (error) {
          console.error('❌ Error checking onboarding:', error);
          setOnboardingComplete(false);
        }
      } else {
        console.log('👤 No user - setting onboarding to null');
        setOnboardingComplete(null);
      }
    };

    if (initialized && !loading) {
      checkOnboarding();
    }
  }, [user, initialized, loading]);

  // Handle navigation based on auth state and onboarding
  useEffect(() => {
    // Wait for navigation to be ready
    if (!navigationState?.key || !initialized || loading) {
      console.log('⏸️ Waiting for navigation/auth initialization...');
      return;
    }

    // If user exists but onboarding status not loaded yet, wait
    if (user && onboardingComplete === null) {
      console.log('⏸️ Waiting for onboarding status...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('🧭 Navigation check:', {
      hasUser: !!user,
      onboardingComplete,
      currentSegment: segments[0],
      navigationReady: !!navigationState?.key,
    });

    if (!user && !inAuthGroup) {
      // Not logged in -> go to login
      console.log('➡️ Redirecting to login (no user)');
      router.replace('/(auth)/login');
    } else if (user && !onboardingComplete && !inOnboardingGroup) {
      // Logged in but onboarding not complete -> go to onboarding
      console.log('➡️ Redirecting to onboarding (incomplete)');
      router.replace('/(onboarding)');
    } else if (user && onboardingComplete && !inTabsGroup) {
      // Logged in and onboarding complete -> go to tabs
      console.log('➡️ Redirecting to tabs (complete)');
      router.replace('/(tabs)');
    }
  }, [user, initialized, loading, onboardingComplete, navigationState?.key]);

  // Show loading screen while initializing
  if (!navigationState?.key || !initialized || loading || (user && onboardingComplete === null)) {
    return <VideoLoadingScreen onFinish={() => {}} />;
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

  // Show loading while theme initializes
  if (!isThemeReady) {
    return <VideoLoadingScreen onFinish={() => setIsThemeReady(true)} />;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navigationTheme}>
        <RootLayoutNav />
        <NetworkMonitor />
        <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </PaperProvider>
  );
}
