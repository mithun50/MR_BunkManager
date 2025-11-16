import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useThemeStore } from '../store/themeStore';

export function ThemeSwitcher() {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Determine if current theme is dark
    const isCurrentlyDark = themeMode === 'dark' ||
      (themeMode === 'system' && theme.dark);
    setIsDark(isCurrentlyDark);
  }, [themeMode, theme.dark]);

  if (!mounted) {
    return null;
  }

  const handleToggle = () => {
    // Animate transition
    Animated.parallel([
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: isDark ? 0 : 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Toggle theme
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
        },
      ]}
      onPress={handleToggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <Animated.View
        style={{
          transform: [{ rotate }, { scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        <MaterialCommunityIcons
          name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
          size={24}
          color={theme.colors.onSurface}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
