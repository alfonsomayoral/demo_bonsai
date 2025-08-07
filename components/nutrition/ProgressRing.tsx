import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  size?: number;
  stroke?: number;
  progress: number;       // 0 – 1
  label:    string;
  value:    number | string;
}

export const ProgressRing: React.FC<Props> = ({
  size = 120,
  stroke = 10,
  progress,
  label,
  value,
}) => {
  const r   = (size - stroke) / 2;
  const cx  = size / 2;
  const cy  = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#374151" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#10B981"
          strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={dash}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={styles.labelBox}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  labelBox:  { position: 'absolute', alignItems: 'center' },
  value:     { fontSize: 28, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  label:     { fontSize: 14, fontFamily: 'Inter-Regular', color: '#9CA3AF' },
});
