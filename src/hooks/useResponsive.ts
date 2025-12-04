import { useWindowDimensions, Platform, Dimensions } from 'react-native';

// Breakpoint values
export const BREAKPOINTS = {
  xs: 0,      // Extra small phones
  sm: 375,    // Small phones
  md: 768,    // Tablets
  lg: 1024,   // Small laptops/large tablets
  xl: 1280,   // Desktops
  xxl: 1536,  // Large desktops
} as const;

// Detect if device is actually a mobile device (for "Request Desktop Site" handling)
const getIsMobileDevice = (): boolean => {
  if (Platform.OS !== 'web') {
    // Native apps - iOS/Android are mobile devices
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // Web platform - check user agent and touch capability
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent || navigator.vendor || '';

    // Check for mobile user agent patterns
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    const isMobileUA = mobileRegex.test(userAgent);

    // Check for touch capability (most mobile devices have touch)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check actual screen size (not viewport which can be manipulated)
    const screen = typeof window !== 'undefined' ? window.screen : null;
    const actualScreenWidth = screen ? Math.min(screen.width, screen.height) : 1920;
    const isSmallScreen = actualScreenWidth < 768;

    // Device is mobile if: mobile user agent OR (has touch AND small physical screen)
    return isMobileUA || (hasTouch && isSmallScreen);
  }

  return false;
};

// Responsive hook return type
interface ResponsiveValues {
  // Screen dimensions
  width: number;
  height: number;

  // Platform
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;

  // Device type (physical device, not viewport)
  isMobileDevice: boolean;  // Actual mobile device (handles "Request Desktop Site")

  // Breakpoint booleans
  isXs: boolean;      // < 375px
  isSm: boolean;      // 375-767px
  isMd: boolean;      // 768-1023px
  isLg: boolean;      // 1024-1279px
  isXl: boolean;      // 1280-1535px
  isXxl: boolean;     // >= 1536px

  // Common queries (adjusted for mobile device detection)
  isMobile: boolean;      // < 768px OR mobile device in desktop mode
  isTablet: boolean;      // 768-1023px AND not mobile device
  isDesktop: boolean;     // >= 1024px AND not mobile device
  isLargeDesktop: boolean; // >= 1280px AND not mobile device

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

  // Detect actual mobile device (handles "Request Desktop Site" mode)
  const isMobileDevice = getIsMobileDevice();

  // Breakpoint detection (raw, based on viewport)
  const isXs = width < BREAKPOINTS.sm;
  const isSm = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
  const isMd = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isLg = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
  const isXl = width >= BREAKPOINTS.xl && width < BREAKPOINTS.xxl;
  const isXxl = width >= BREAKPOINTS.xxl;

  // Common queries - adjusted for mobile device detection
  // If on mobile device, force mobile layout even if viewport says desktop
  const isMobile = width < BREAKPOINTS.md || isMobileDevice;
  const isTablet = !isMobileDevice && (width >= BREAKPOINTS.md && width < BREAKPOINTS.lg);
  const isDesktop = !isMobileDevice && width >= BREAKPOINTS.lg;
  const isLargeDesktop = !isMobileDevice && width >= BREAKPOINTS.xl;

  // Orientation
  const isPortrait = height > width;
  const isLandscape = width > height;

  // Responsive value picker (respects mobile device detection)
  const responsive = <T,>(mobile: T, tablet?: T, desktop?: T, largeDesktop?: T): T => {
    // Force mobile values on mobile devices regardless of viewport
    if (isMobileDevice) return mobile;
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
    isMobileDevice,
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
