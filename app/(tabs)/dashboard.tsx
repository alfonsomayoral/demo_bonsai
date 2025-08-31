import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

// Gráficas (repo: JesperLekland/react-native-svg-charts)
import { LineChart, XAxis, YAxis, Grid } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import * as scale from 'd3-scale';
import { Path } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');

type ExerciseRow = { id: string; name: string };
type MetricRow = { created_at: string; kg_per_rep: number };

function formatDayLabel(d: Date) {
  // mmm-dd (o dd/mm)
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

function groupDailyAverage(rows: MetricRow[]) {
  // agrupa por YYYY-MM-DD y saca promedio de kg_per_rep
  const map: Record<string, { sum: number; n: number; date: Date }> = {};
  for (const r of rows) {
    const d = new Date(r.created_at);
    const ymd = d.toISOString().slice(0, 10);
    if (!map[ymd]) map[ymd] = { sum: 0, n: 0, date: new Date(d.getFullYear(), d.getMonth(), d.getDate()) };
    map[ymd].sum += Number(r.kg_per_rep || 0);
    map[ymd].n += 1;
  }
  const arr = Object.values(map)
    .map((v) => ({ date: v.date, value: v.n > 0 ? v.sum / v.n : 0 }))
    .sort((a, b) => +a.date - +b.date);
  return arr;
}

function linearRegression(y: number[]) {
  // x = 0..n-1
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

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [selected, setSelected] = useState<ExerciseRow | null>(null);
  const [dataPoints, setDataPoints] = useState<{ date: Date; value: number }[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Carga lista de ejercicios a partir de métricas del usuario
  useEffect(() => {
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) {
          setExercises([]);
          setSelected(null);
          setDataPoints([]);
          setLoading(false);
          return;
        }

        // Traemos métricas con join al ejercicio para deduplicar en cliente
        const { data: metrics, error } = await supabase
          .from('exercise_workout_metrics')
          .select('exercise_id, exercises(name)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(500);
        if (error) throw error;

        const map = new Map<string, string>();
        for (const row of (metrics ?? []) as any[]) {
          if (row.exercise_id && row.exercises?.name) {
            if (!map.has(row.exercise_id)) map.set(row.exercise_id, row.exercises.name as string);
          }
        }
        // Si no hay métricas, intenta cargar ejercicios del usuario (o globales)
        if (map.size === 0) {
          const { data: ex, error: exErr } = await supabase
            .from('exercises')
            .select('id, name')
            .or(`user_id.eq.${userId},user_id.is.null`)
            .limit(50);
          if (exErr || !ex) {
            setExercises([]);
            setSelected(null);
          } else {
            setExercises(ex as ExerciseRow[]);
            setSelected(ex[0] ?? null);
          }
        } else {
          const list: ExerciseRow[] = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
          setExercises(list);
          setSelected(list[0] ?? null);
        }
      } catch (e) {
        console.error('Load exercises error', e);
        setExercises([]);
        setSelected(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Carga de series para el ejercicio elegido
  useEffect(() => {
    (async () => {
      try {
        setDataPoints([]);
        if (!selected) return;
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from('exercise_workout_metrics')
          .select('created_at, kg_per_rep')
          .eq('user_id', userId)
          .eq('exercise_id', selected.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const daily = groupDailyAverage((data ?? []) as MetricRow[]);
        setDataPoints(daily);
      } catch (e) {
        console.error('Load metrics error', e);
        setDataPoints([]);
      }
    })();
  }, [selected?.id]);

  const yValues = useMemo(() => dataPoints.map((p) => p.value), [dataPoints]);
  const dates = useMemo(() => dataPoints.map((p) => p.date), [dataPoints]);

  // Línea de tendencia sobre los yValues
  const trend = useMemo(() => {
    if (yValues.length === 0) return [];
    if (yValues.length === 1) return [yValues[0], yValues[0]];
    const { m, b } = linearRegression(yValues);
    // valores predichos en x=0..n-1
    return yValues.map((_, i) => m * i + b);
  }, [yValues]);

  const contentInset = { top: 20, bottom: 20 };
  const chartWidth = SCREEN_W - 40; // padding lateral

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>

          {/* Selector de ejercicio (abre modal) */}
          <TouchableOpacity
            style={styles.exerciseBtn}
            onPress={() => setPickerOpen(true)}
            disabled={loading || exercises.length === 0}
          >
            <Text style={styles.exerciseBtnText}>
              {loading ? 'Loading…' : selected?.name ?? 'Select exercise'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal selector */}
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Choose exercise</Text>
              {loading ? (
                <ActivityIndicator color="#10B981" />
              ) : (
                <FlatList
                  data={exercises}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setSelected(item);
                        setPickerOpen(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  ListEmptyComponent={<Text style={styles.emptyText}>No exercises found</Text>}
                />
              )}
              <TouchableOpacity style={styles.modalClose} onPress={() => setPickerOpen(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Bezier Line Chart + Trend line */}
        <Card variant="dark" style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {selected ? `${selected.name} • kg/rep` : 'Exercise • kg/rep'}
          </Text>

          {dataPoints.length === 0 ? (
            <View style={[styles.chartEmpty, styles.center]}>
              <Text style={styles.emptyText}>No data yet for this exercise</Text>
            </View>
          ) : (
            <View style={{ paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', height: 220 }}>
                {/* Y axis */}
                <YAxis
                  data={yValues}
                  contentInset={contentInset}
                  svg={{ fill: '#9CA3AF', fontSize: 10 }}
                  numberOfTicks={6}
                  formatLabel={(value: number) => `${Math.round(value)}`}
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  {/* Serie principal suavizada (bezier) */}
                  <LineChart
                    style={{ flex: 1 }}
                    data={yValues}
                    svg={{ stroke: '#10B981', strokeWidth: 3 }}
                    contentInset={contentInset}
                    curve={shape.curveNatural} // suavizado tipo "bezier"
                  >
                    <Grid svg={{ stroke: 'rgba(255,255,255,0.08)' }} />
                  </LineChart>

                  {/* Línea de tendencia superpuesta (misma escala) */}
                  {trend.length >= 2 && (
                    <LineChart
                      style={StyleSheet.absoluteFill}
                      data={trend}
                      svg={{ stroke: '#60A5FA', strokeWidth: 2, strokeDasharray: [6, 6] }}
                      contentInset={contentInset}
                      curve={shape.curveLinear}
                    />
                  )}
                </View>
              </View>

              {/* X axis: sólo días con entreno (sin días vacíos) */}
              <XAxis
                style={{ marginTop: 8, marginLeft: 28 }}
                data={dates}
                scale={scale.scaleTime}
                formatLabel={(value: Date, index: number) => formatDayLabel(dates[index])}
                svg={{ fill: '#9CA3AF', fontSize: 10 }}
                contentInset={{ left: 10, right: 10 }}
              />
            </View>
          )}

          {/* Leyenda simple */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>kg/rep (daily avg)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: '#60A5FA' }]} />
              <Text style={styles.legendText}>Trend</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────────── estilos ───────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 28, color: '#fff', fontFamily: 'Inter-Bold' },

  exerciseBtn: {
    backgroundColor: '#191B1F',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exerciseBtnText: { color: '#D1D5DB', fontFamily: 'Inter-SemiBold' },

  chartCard: { padding: 16, marginTop: 8 },
  chartTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold', marginBottom: 8 },

  chartEmpty: { height: 220, backgroundColor: '#111318', borderRadius: 12 },
  center: { alignItems: 'center', justifyContent: 'center' },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendSwatch: { width: 10, height: 10, borderRadius: 2, marginRight: 6 },
  legendText: { color: '#9CA3AF', fontSize: 12 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: SCREEN_W - 40,
    backgroundColor: '#141518',
    borderRadius: 14,
    padding: 14,
    maxHeight: 420,
  },
  modalTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold', marginBottom: 10 },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#191B1F',
    borderRadius: 10,
  },
  modalItemText: { color: '#E5E7EB', fontSize: 14 },
  separator: { height: 8 },
  emptyText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center' },

  modalClose: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
  },
  modalCloseText: { color: '#fff', fontFamily: 'Inter-SemiBold' },
});
