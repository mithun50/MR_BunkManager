import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Custom light theme - Pure white and black only
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#000000', // Black
    secondary: '#000000', // Black
    tertiary: '#000000', // Black
    error: '#000000', // Black
    background: '#FFFFFF', // White
    surface: '#FFFFFF', // White
    surfaceVariant: '#FFFFFF', // White
    surfaceDisabled: '#F5F5F5', // Very light gray for disabled
    onPrimary: '#FFFFFF', // White on black
    onSecondary: '#FFFFFF', // White on black
    onTertiary: '#FFFFFF', // White on black
    onBackground: '#000000', // Black on white
    onSurface: '#000000', // Black on white
    onSurfaceVariant: '#000000', // Black on white
    outline: '#E0E0E0', // Light gray for borders
    outlineVariant: '#F0F0F0',
    elevation: {
      level0: '#FFFFFF',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
};

// Custom dark theme - Pure black and white only
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FFFFFF', // White
    secondary: '#FFFFFF', // White
    tertiary: '#FFFFFF', // White
    error: '#FFFFFF', // White
    background: '#000000', // Black
    surface: '#000000', // Black
    surfaceVariant: '#000000', // Black
    surfaceDisabled: '#1A1A1A', // Very dark gray for disabled
    onPrimary: '#000000', // Black on white
    onSecondary: '#000000', // Black on white
    onTertiary: '#000000', // Black on white
    onBackground: '#FFFFFF', // White on black
    onSurface: '#FFFFFF', // White on black
    onSurfaceVariant: '#FFFFFF', // White on black
    outline: '#333333', // Dark gray for borders
    outlineVariant: '#1A1A1A',
    elevation: {
      level0: '#000000',
      level1: '#000000',
      level2: '#000000',
      level3: '#000000',
      level4: '#000000',
      level5: '#000000',
    },
  },
};
