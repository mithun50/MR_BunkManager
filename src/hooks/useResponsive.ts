import { useWindowDimensions, Platform } from 'react-native';

// Breakpoint values
export const BREAKPOINTS = {
  xs: 0,      // Extra small phones
  sm: 375,    // Small phones
  md: 768,    // Tablets
  lg: 1024,   // Small laptops/large tablets
  xl: 1280,   // Desktops
  xxl: 1536,  // Large desktops
} as const;

// Responsive hook return type
interface ResponsiveValues {
  // Screen dimensions
  width: number;
  height: number;

  // Platform
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;

  // Breakpoint booleans
  isXs: boolean;      // < 375px
  isSm: boolean;      // 375-767px
  isMd: boolean;      // 768-1023px
  isLg: boolean;      // 1024-1279px
  isXl: boolean;      // 1280-1535px
  isXxl: boolean;     // >= 1536px

  // Common queries
  isMobile: boolean;      // < 768px
  isTablet: boolean;      // 768-1023px
  isDesktop: boolean;     // >= 1024px
  isLargeDesktop: boolean; // >= 1280px

  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;

  // Utility functions
  responsive: <T>(mobile: T, tablet?: T, desktop?: T, largeDesktop?: T) => T;
  spacing: (base: number) => number;
  fontSize: (base: number) => number;

  // Common responsive values
  containerPadding: number;
  contentMaxWidth: number;
  modalWidth: string | number;
  cardColumns: number;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  // Platform detection
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  // Breakpoint detection
  const isXs = width < BREAKPOINTS.sm;
  const isSm = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
  const isMd = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isLg = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
  const isXl = width >= BREAKPOINTS.xl && width < BREAKPOINTS.xxl;
  const isXxl = width >= BREAKPOINTS.xxl;

  // Common queries
  const isMobile = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;
  const isLargeDesktop = width >= BREAKPOINTS.xl;

  // Orientation
  const isPortrait = height > width;
  const isLandscape = width > height;

  // Responsive value picker
  const responsive = <T,>(mobile: T, tablet?: T, desktop?: T, largeDesktop?: T): T => {
    if (isLargeDesktop && largeDesktop !== undefined) return largeDesktop;
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  };

  // Spacing multiplier based on screen size
  const spacing = (base: number): number => {
    if (isXs) return base * 0.75;
    if (isSm) return base;
    if (isMd) return base * 1.25;
    if (isLg) return base * 1.5;
    return base * 1.75;
  };

  // Font size scaler
  const fontSize = (base: number): number => {
    if (isXs) return Math.max(base - 2, 10);
    if (isSm) return base;
    if (isMd) return base + 1;
    if (isLg) return base + 2;
    return base + 3;
  };

  // Common responsive values
  const containerPadding = responsive(12, 20, 32, 48);
  const contentMaxWidth = responsive(width, 720, 960, 1200);
  const modalWidth = responsive('95%', '80%', '60%', '50%');
  const cardColumns = responsive(1, 2, 3, 4);

  return {
    width,
    height,
    isWeb,
    isIOS,
    isAndroid,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isPortrait,
    isLandscape,
    responsive,
    spacing,
    fontSize,
    containerPadding,
    contentMaxWidth,
    modalWidth,
    cardColumns,
  };
}

// Export breakpoint constants for use in StyleSheet
export const getResponsiveStyles = (width: number) => ({
  isMobile: width < BREAKPOINTS.md,
  isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
  isDesktop: width >= BREAKPOINTS.lg,
});

export default useResponsive;
