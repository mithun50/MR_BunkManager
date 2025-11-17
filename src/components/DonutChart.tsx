import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
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
              fontSize="38"
              fontWeight="bold"
              fill={percentageColor}
            >
              {percentage.toFixed(1)}%
            </SvgText>
          </G>
        </Svg>
      </View>

      {showLegend && (
        <View style={styles.legendContainer}>
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
});
