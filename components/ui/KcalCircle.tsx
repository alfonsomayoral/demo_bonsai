import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface KcalCircleProps {
  value: number;
  target: number;
}

export const KcalCircle: React.FC<KcalCircleProps> = ({ value, target }) => {
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / target, 1);
  const offset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference},${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.centerContent}>
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.labelText}>/ {target} kcal</Text>
        <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 28,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  labelText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
  },
  percentText: {
    fontSize: 16,
    color: '#10B981',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
}); 