import React, { PropsWithChildren } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props extends PropsWithChildren {
  size?: number;
  stroke?: number;
  progress: number;       // 0 – 1
  color?:   string;       // color del anillo
  trackColor?: string;    // color del track
}

/**
 * Anillo de progreso sin contenido textual.
 * El centro queda libre: lo que pongas como children se renderiza centrado.
 */
export const ProgressRing: React.FC<Props> = ({
  size = 120,
  stroke = 10,
  progress,
  color = '#10B981',
  trackColor = '#2A2D33',
  children,
}) => {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={dash}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
