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
import ExerciseVolumeChart from '@/components/charts/ExerciseVolumeChart';

const { width: SCREEN_W } = Dimensions.get('window');

type ExerciseRow = { id: string; name: string };
type MetricRow = { created_at: string; volume: number };

function groupDailyAverage(rows: MetricRow[]) {
  const map: Record<string, { sum: number; n: number; date: Date }> = {};
  for (const r of rows) {
    const d = new Date(r.created_at);
    const ymd = d.toISOString().slice(0, 10);
    if (!map[ymd]) map[ymd] = { sum: 0, n: 0, date: new Date(d.getFullYear(), d.getMonth(), d.getDate()) };
    map[ymd].sum += Number(r.volume || 0);
    map[ymd].n += 1;
  }
  return Object.values(map)
    .map((v) => ({ date: v.date, value: v.n > 0 ? v.sum / v.n : 0 }))
    .sort((a, b) => +a.date - +b.date);
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [selected, setSelected] = useState<ExerciseRow | null>(null);
  const [dataPoints, setDataPoints] = useState<{ date: Date; value: number }[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Carga lista de ejercicios (a partir de métricas del usuario)
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
        if (map.size === 0) {
          const { data: ex, error: exErr } = await supabase
            .from('exercises')
            .select('id, name')
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

  // Carga serie para el elegido
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
          .select('created_at, volume')
          .eq('user_id', userId)
          .eq('exercise_id', selected.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setDataPoints(groupDailyAverage((data ?? []) as MetricRow[]));
      } catch (e) {
        console.error('Load metrics error', e);
        setDataPoints([]);
      }
    })();
  }, [selected?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
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

        {/* Chart reutilizando componente */}
        <Card variant="dark" style={styles.chartCard}>
          <ExerciseVolumeChart
            title={selected ? `${selected.name} • volume` : 'Exercise • volume'}
            data={dataPoints}
            height={220}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

/* estilos */
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
