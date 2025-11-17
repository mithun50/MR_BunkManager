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

// Material Design 3 Dark Theme - Professional dark grays
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors with proper contrast
    primary: '#BB86FC', // Material purple
    secondary: '#03DAC6', // Material teal
    tertiary: '#4CAF50', // Green for success
    error: '#CF6679', // Soft red for errors

    // Background and surfaces - Material Design recommended
    background: '#121212', // Material dark background
    surface: '#1E1E1E', // Slightly elevated from background
    surfaceVariant: '#2C2C2C', // More elevated surfaces
    surfaceDisabled: '#1A1A1A', // Disabled state

    // Container colors for cards and components
    primaryContainer: '#3700B3',
    secondaryContainer: '#018786',
    tertiaryContainer: '#2E7D32',
    errorContainer: '#B00020',

    // Text colors on backgrounds
    onPrimary: '#000000', // Black text on primary
    onSecondary: '#000000', // Black text on secondary
    onTertiary: '#FFFFFF', // White text on tertiary
    onError: '#000000', // Black text on error
    onBackground: '#E1E1E1', // Light gray text on dark background
    onSurface: '#E1E1E1', // Light gray text on surfaces
    onSurfaceVariant: '#BEBEBE', // Medium gray for secondary text

    // Outline and borders
    outline: '#424242', // Medium dark gray for borders
    outlineVariant: '#2C2C2C', // Darker variant

    // Elevation levels - subtle differences for depth
    elevation: {
      level0: '#121212', // Background level
      level1: '#1E1E1E', // 1dp elevation
      level2: '#232323', // 2dp elevation
      level3: '#252525', // 3dp elevation
      level4: '#272727', // 4dp elevation
      level5: '#2C2C2C', // 6dp elevation
    },
  },
};
