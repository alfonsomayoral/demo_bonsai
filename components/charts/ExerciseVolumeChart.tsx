import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type Point = { date: Date; value: number };

interface Props {
  /** (Ignorado) El título siempre será "Volume Progress" */
  title?: string;
  data: Point[];
  height?: number;
  accentColor?: string;
  trendColor?: string;

  actionLabel?: string;
  onPressAction?: () => void;
  actionDisabled?: boolean;
}

const { width: SCREEN_W } = Dimensions.get('window');

function linearRegression(y: number[]) {
  const n = y.length;
  if (n === 0) return { m: 0, b: 0 };
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const denom = n * sumXX - sumX * sumX || 1;
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

const formatDay = (d: Date) => d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

export default function ExerciseVolumeChart({
  // title,  // ignorado
  data,
  height = 220,
  accentColor = '#10B981',
  trendColor = '#a855f7',
  actionLabel = 'Select exercise',
  onPressAction,
  actionDisabled = false,
}: Props) {
  const displayedTitle = 'Volume Progress';

  const labels = useMemo(() => data.map(p => formatDay(p.date)), [data]);
  const yValues = useMemo(() => data.map(p => p.value), [data]);

  const trend = useMemo(() => {
    if (yValues.length === 0) return [];
    if (yValues.length === 1) return [yValues[0]];
    const { m, b } = linearRegression(yValues);
    return yValues.map((_, i) => m * i + b);
  }, [yValues]);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: yValues,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 3,
        },
        ...(trend.length
          ? [
              {
                data: trend,
                color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                strokeWidth: 2,
              },
            ]
          : []),
      ],
    }),
    [labels, yValues, trend]
  );

  const chartConfig = {
    backgroundColor: '#191B1F',
    backgroundGradientFrom: '#191B1F',
    backgroundGradientTo: '#191B1F',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    labelColor: (opacity = 1) => `rgba(156,163,175,${opacity})`,
    propsForDots: { r: '4' },
    propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.08)' },
  };

  const [chartW, setChartW] = useState<number>(SCREEN_W - 40 - 16);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - chartW) > 1) setChartW(w);
  };

  const expandedWidth = Math.max(120, chartW + 24);
  const horizontalComp = -12;

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
              {actionLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chart */}
      {data.length === 0 ? (
        <View style={[styles.empty, { height }]}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      ) : (
        <>
          <View
            style={[styles.chartWrap, { marginLeft: horizontalComp, marginRight: horizontalComp }]}
            onLayout={onLayout}
          >
            <LineChart
              data={chartData}
              width={expandedWidth}
              height={height}
              chartConfig={chartConfig}
              withShadow
              withInnerLines
              withOuterLines={false}
              withDots
              bezier
              yLabelsOffset={10}
              xLabelsOffset={-4}
              style={styles.chart}
              segments={6}
              formatYLabel={(v: string) => `${Math.round(Number(v))}`}
            />
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: accentColor }]} />
              <Text style={styles.legendText}>Volume</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: trendColor }]} />
              <Text style={styles.legendText}>Trend</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#191B1F', borderRadius: 12, padding: 16 },

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

  empty: {
    backgroundColor: '#111318',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: '#9CA3AF' },

  chartWrap: { width: '100%' },
  chart: { borderRadius: 12 },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 7,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendSwatch: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { color: '#E5E7EB', fontSize: 12 },
});
