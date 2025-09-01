import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, XAxis, YAxis, Grid } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import * as scale from 'd3-scale';

type Point = { date: Date; value: number };

interface Props {
  title?: string;
  data: Point[];                 // ya agrupado por día
  height?: number;
  accentColor?: string;          // línea principal
  trendColor?: string;           // línea tendencia
}

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

const formatDay = (d: Date) =>
  d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

export default function ExerciseVolumeChart({
  title,
  data,
  height = 220,
  accentColor = '#10B981',
  trendColor = '#60A5FA',
}: Props) {
  const yValues = useMemo(() => data.map(p => p.value), [data]);
  const dates   = useMemo(() => data.map(p => p.date),  [data]);

  const trend = useMemo(() => {
    if (yValues.length === 0) return [];
    if (yValues.length === 1) return [yValues[0], yValues[0]];
    const { m, b } = linearRegression(yValues);
    return yValues.map((_, i) => m * i + b);
  }, [yValues]);

  const contentInset = { top: 20, bottom: 20 };

  return (
    <View style={styles.card}>
      {!!title && <Text style={styles.title}>{title}</Text>}

      {data.length === 0 ? (
        <View style={[styles.empty, { height }]}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      ) : (
        <View style={{ paddingRight: 8 }}>
          <View style={{ flexDirection: 'row', height }}>
            <YAxis
              data={yValues}
              contentInset={contentInset}
              svg={{ fill: '#9CA3AF', fontSize: 10 }}
              numberOfTicks={6}
              formatLabel={(value: number) => `${Math.round(value)}`}
            />

            <View style={{ flex: 1, marginLeft: 8 }}>
              <LineChart
                style={{ flex: 1 }}
                data={yValues}
                svg={{ stroke: accentColor, strokeWidth: 3 }}
                contentInset={contentInset}
                curve={shape.curveNatural}
              >
                <Grid svg={{ stroke: 'rgba(255,255,255,0.08)' }} />
              </LineChart>

              {trend.length >= 2 && (
                <LineChart
                  style={StyleSheet.absoluteFill}
                  data={trend}
                  svg={{ stroke: trendColor, strokeWidth: 2, strokeDasharray: [6, 6] }}
                  contentInset={contentInset}
                  curve={shape.curveLinear}
                />
              )}
            </View>
          </View>

          <XAxis
            style={{ marginTop: 8, marginLeft: 28 }}
            data={dates}
            scale={scale.scaleTime}
            formatLabel={(value: Date, index: number) => formatDay(dates[index])}
            svg={{ fill: '#9CA3AF', fontSize: 10 }}
            contentInset={{ left: 10, right: 10 }}
          />
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#191B1F', borderRadius: 12, padding: 16 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  empty: { backgroundColor: '#111318', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9CA3AF' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendSwatch: { width: 10, height: 10, borderRadius: 2, marginRight: 6 },
  legendText: { color: '#9CA3AF', fontSize: 12 },
});
