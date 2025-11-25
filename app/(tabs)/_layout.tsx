import { Tabs } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image, View, Modal, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/haptic-tab';
import { useAuthStore } from '@/src/store/authStore';
import firestoreService from '@/src/services/firestoreService';
import ChatBot from '@/src/components/ChatBot';
import { AttendanceContext } from '@/src/services/chatService';
import { Subject } from '@/src/types/user';

const FAB_SIZE = 56;
const FAB_POSITION_KEY = '@fab_position';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TabLayout() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [profilePhotoURL, setProfilePhotoURL] = useState<string | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [attendanceContext, setAttendanceContext] = useState<AttendanceContext | null>(null);

  // Draggable FAB state
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - FAB_SIZE - 16, y: SCREEN_HEIGHT - FAB_SIZE - 80 })).current;
  const lastPosition = useRef({ x: SCREEN_WIDTH - FAB_SIZE - 16, y: SCREEN_HEIGHT - FAB_SIZE - 80 });

  // Load saved FAB position
  useEffect(() => {
    const loadPosition = async () => {
      try {
        const saved = await AsyncStorage.getItem(FAB_POSITION_KEY);
        if (saved) {
          const { x, y } = JSON.parse(saved);
          pan.setValue({ x, y });
          lastPosition.current = { x, y };
        }
      } catch (error) {
        console.error('Error loading FAB position:', error);
      }
    };
    loadPosition();
  }, []);

  // Save FAB position
  const savePosition = async (x: number, y: number) => {
    try {
      await AsyncStorage.setItem(FAB_POSITION_KEY, JSON.stringify({ x, y }));
    } catch (error) {
      console.error('Error saving FAB position:', error);
    }
  };

  // PanResponder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start pan if moved more than 5 pixels (to allow taps)
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Store current position when starting drag
        pan.setOffset({
          x: lastPosition.current.x,
          y: lastPosition.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        // Calculate new position with bounds
        let newX = lastPosition.current.x + gestureState.dx;
        let newY = lastPosition.current.y + gestureState.dy;

        // Keep within screen bounds
        newX = Math.max(0, Math.min(newX, SCREEN_WIDTH - FAB_SIZE));
        newY = Math.max(50, Math.min(newY, SCREEN_HEIGHT - FAB_SIZE - 60)); // 60 for tab bar

        // Snap to nearest edge horizontally
        const snapToLeft = newX < SCREEN_WIDTH / 2;
        const finalX = snapToLeft ? 16 : SCREEN_WIDTH - FAB_SIZE - 16;

        // Animate to snapped position
        Animated.spring(pan, {
          toValue: { x: finalX, y: newY },
          useNativeDriver: false,
          friction: 7,
        }).start();

        lastPosition.current = { x: finalX, y: newY };
        savePosition(finalX, newY);
      },
    })
  ).current;

  // Load user profile and attendance data
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [profile, subjects] = await Promise.all([
        firestoreService.getUserProfile(user.uid),
        firestoreService.getSubjects(user.uid),
      ]);

      setProfilePhotoURL(profile?.photoURL || null);

      // Build attendance context for chatbot
      if (subjects.length > 0) {
        const validSubjects = subjects.filter((s: Subject) => {
          const name = s.name?.toLowerCase()?.trim() || '';
          if (!name || name.length < 2) return false;
          const invalidKeywords = ['break', 'lunch', 'recess', 'free', 'vacant', 'empty', 'no class', 'holiday', 'off'];
          return !invalidKeywords.some(keyword => name.includes(keyword));
        });

        const totalClasses = validSubjects.reduce((sum: number, s: Subject) => sum + (s.totalClasses || 0), 0);
        const attendedClasses = validSubjects.reduce((sum: number, s: Subject) => sum + (s.attendedClasses || 0), 0);
        const overallPercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
        const minimumAttendance = profile?.minimumAttendance || 75;
        const canBunk = totalClasses > 0
          ? Math.floor((attendedClasses - (minimumAttendance / 100) * totalClasses) / (minimumAttendance / 100))
          : 0;
        const mustAttend = totalClasses > 0 && canBunk < 0
          ? Math.ceil(((minimumAttendance / 100) * totalClasses - attendedClasses) / (1 - minimumAttendance / 100))
          : 0;

        setAttendanceContext({
          overallPercentage,
          minimumRequired: minimumAttendance,
          totalClasses,
          attendedClasses,
          canBunk: Math.max(0, canBunk),
          mustAttend,
          subjects: validSubjects.map((s: Subject) => ({
            name: s.name,
            percentage: s.attendancePercentage,
            attended: s.attendedClasses,
            total: s.totalClasses,
          })),
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <View style={styles.container}>
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
          name="timetable"
          options={{
            title: 'Timetable',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="timetable" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Groups',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="forum" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: 'Community',
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

      {/* Global Draggable Floating Chat Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setChatVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="robot-happy"
            size={24}
            color={theme.colors.onPrimary}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        onRequestClose={() => setChatVisible(false)}
        animationType="slide"
        statusBarTranslucent
      >
        <ChatBot
          attendanceContext={attendanceContext}
          onClose={() => setChatVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 100,
    elevation: 8,
  },
  fabButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
});
