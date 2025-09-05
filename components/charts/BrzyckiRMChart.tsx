import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, LayoutChangeEvent, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  /** (Ignorado) El título siempre será "RM Prediction" */
  title?: string;
  rm1: number;

  actionLabel?: string;
  onPressAction?: () => void;
  actionDisabled?: boolean;
}

const to2Dec = (n: number) => Math.round(n * 100) / 100;

export default function BrzyckiRMChart({
  // title, // ignorado
  rm1,
  actionLabel,
  onPressAction,
  actionDisabled,
}: Props) {
  const displayedTitle = 'RM Prediction';

  const reps = [6, 5, 4, 3, 2, 1];
  const weightsRaw = reps.map((r) => Math.max(0, rm1 * (1.0278 - 0.0278 * r)));
  const weights = weightsRaw.map(to2Dec);
  const lastIdx = reps.length - 1;

  const data = {
    labels: reps.map(String),
    datasets: [
      {
        data: weights,
        colors: weights.map((_, i) => (opacity = 0.1) =>
          i === lastIdx ? `rgba(34, 197, 94, ${opacity})` : `rgba(168, 85, 247, ${opacity})`
        ),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#191B1F',
    backgroundGradientFrom: '#191B1F',
    backgroundGradientTo: '#191B1F',
    decimalPlaces: 2,
    color: (opacity = 0.5) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 0.5) => `rgba(156, 163, 175, ${opacity})`,
    propsForLabels: { fontSize: 10 },
    barPercentage: 0.5,
  };

  const [chartW, setChartW] = useState<number>(SCREEN_W - 40 - 32);
  const onLayoutWidth = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - chartW) > 1) setChartW(w);
  };

  return (
    <View style={styles.card}>
      {/* Fila única: título (izq) + botón (der) */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{displayedTitle}</Text>
        {onPressAction && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Choose exercise"
            onPress={onPressAction}
            disabled={actionDisabled}
            style={[styles.actionBtn, actionDisabled && styles.actionBtnDisabled]}
          >
            <Text style={styles.actionBtnText} numberOfLines={1}>
              {actionLabel ?? 'Select exercise'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartBox} onLayout={onLayoutWidth}>
        <BarChart
          style={styles.chart}
          width={Math.max(100, chartW)}
          height={220}
          data={data}
          chartConfig={chartConfig}
          fromZero
          withInnerLines
          showValuesOnTopOfBars
          withCustomBarColorFromData
          yAxisLabel=""
          yAxisSuffix=" kg"
        />
      </View>

      <Text style={styles.rmText}>1RM: {to2Dec(rm1)} kg</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#191B1F', borderRadius: 12, padding: 10 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', flexShrink: 1 },

  actionBtn: {
    backgroundColor: '#191B1F',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    maxWidth: 220,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#D1D5DB', fontWeight: '700' },

  chartBox: { width: '100%' },
  chart: { borderRadius: 12 },
  rmText: { marginTop: 10, color: '#22c55e', fontSize: 16, fontWeight: '800' },
});
