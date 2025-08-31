import React, { PropsWithChildren, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';

interface Props extends PropsWithChildren {
  size?: number;
  stroke?: number;
  /** Progreso 0–1 */
  progress: number;
  /** Color del anillo activo */
  color?: string;
  /** Track (inactivo) */
  trackColor?: string;
  /** Duración de la animación (ms) */
  duration?: number;
  /** Clave para reanimar cuando cambie (por ejemplo, la página visible) */
  playKey?: any;
}

/**
 * Progress ring animado usando `react-native-circular-progress-indicator`.
 * Cada vez que cambia `progress` o `playKey`, el anillo se reinicia (0%)
 * y se anima hasta el valor objetivo.
 */
export const ProgressRing: React.FC<Props> = ({
  size = 120,
  stroke = 10,
  progress,
  color = '#10B981',
  trackColor = '#2A2D33',
  duration = 900,
  playKey,
  children,
}) => {
  const [display, setDisplay] = useState(0); // 0..100

  // Normaliza 0..1 → 0..100
  const target = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  useEffect(() => {
    // Reinicia a 0 y anima hacia el objetivo
    setDisplay(0);
    const id = setTimeout(() => setDisplay(target), 20);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, playKey]);

  const radius = (size - stroke) / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <CircularProgressBase
        value={display}
        maxValue={100}
        radius={radius}
        duration={duration}
        activeStrokeWidth={stroke}
        inActiveStrokeWidth={stroke}
        activeStrokeColor={color}
        inActiveStrokeColor={trackColor}
        inActiveStrokeOpacity={0.45}
        strokeLinecap="round"
      >
        <View style={styles.center}>{children}</View>
      </CircularProgressBase>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
