import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, G, Text as SvgText, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DonutChartProps {
  attended: number;
  absent: number;
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}

export default function DonutChart({
  attended,
  absent,
  percentage,
  size = 180,
  strokeWidth = 30,
  showLegend = true,
}: DonutChartProps) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = screenWidth > 768;

  const total = attended + absent;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [attended, absent]);

  if (total === 0) return null;

  const radius = (size - strokeWidth) / 2;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const attendedPercentage = (attended / total) * 100;

  // Dynamic font size based on chart size
  const fontSize = Math.max(size * 0.18, 20);

  const getPercentageColor = (pct: number) => {
    if (pct >= 85) return '#4CAF50';
    if (pct >= 75) return '#FF9800';
    return '#F44336';
  };

  const percentageColor = getPercentageColor(percentage);

  const animatedProps = useAnimatedProps(() => {
    const attendedStrokeDashoffset = circumference - (attendedPercentage / 100) * circumference * progress.value;
    return {
      strokeDashoffset: attendedStrokeDashoffset,
    };
  });

  return (
    <View style={[
      styles.container,
      isWeb && isWideScreen && styles.containerWeb
    ]}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Background Track - Light gray */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.dark ? '#2C2C2C' : '#E0E0E0'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Animated Foreground - Solid green */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#4CAF50"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeLinecap="round"
              animatedProps={animatedProps}
            />
          </G>

          {/* Center Content */}
          <G>
            {/* Percentage */}
            <SvgText
              x={size / 2}
              y={size / 2}
              textAnchor="middle"
              dy="0.35em"
              fontSize={fontSize}
              fontWeight="bold"
              fill={percentageColor}
            >
              {percentage.toFixed(1)}%
            </SvgText>
          </G>
        </Svg>
      </View>

      {showLegend && (
        <View style={[
          styles.legendContainer,
          isWeb && isWideScreen && styles.legendContainerWeb
        ]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text variant="bodyMedium">Present: </Text>
            <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
              {attended}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
            <Text variant="bodyMedium">Absent: </Text>
            <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#F44336' }}>
              {absent}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  containerWeb: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'nowrap',
    paddingVertical: 0,
    marginTop: -16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    width: '100%',
  },
  legendContainerWeb: {
    flexDirection: 'column',
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.08)',
    paddingLeft: 20,
    gap: 8,
    width: 'auto',
    minWidth: 120,
    flexShrink: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    flexShrink: 0,
  },
});
