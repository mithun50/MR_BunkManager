import { Tabs } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { Image, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { HapticTab } from '@/components/haptic-tab';
import { useAuthStore } from '@/src/store/authStore';
import firestoreService from '@/src/services/firestoreService';

export default function TabLayout() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [profilePhotoURL, setProfilePhotoURL] = useState<string | null>(null);

  // Load user profile photo
  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      const profile = await firestoreService.getUserProfile(user.uid);
      setProfilePhotoURL(profile?.photoURL || null);
    } catch (error) {
      console.error('Error loading profile photo:', error);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Reload when tab comes into focus (updates when photo changes)
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-check" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="timetable" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => {
            if (profilePhotoURL) {
              return (
                <View
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    overflow: 'hidden',
                    borderWidth: focused ? 2 : 0,
                    borderColor: color,
                  }}
                >
                  <Image
                    source={{ uri: profilePhotoURL }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              );
            }
            return <MaterialCommunityIcons name="account-circle" size={size} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
