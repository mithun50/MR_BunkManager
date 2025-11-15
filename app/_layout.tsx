import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { lightTheme, darkTheme } from '@/src/config/theme';
import { useAuthStore } from '@/src/store/authStore';
import firestoreService from '@/src/services/firestoreService';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { user, loading, initialized, initializeAuth } = useAuthStore();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, []);

  // Check onboarding status when user changes or when navigating
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
  }, [user, initialized, loading, segments]);

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
  }, [user, segments, initialized, loading, onboardingComplete]);

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
  // Always use light theme (white background with black text)
  const paperTheme = lightTheme;
  const navigationTheme = DefaultTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navigationTheme}>
        <RootLayoutNav />
        <StatusBar style="dark" />
      </ThemeProvider>
    </PaperProvider>
  );
}
