import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import ExerciseVolumeChart from '@/components/charts/ExerciseVolumeChart';
import BrzyckiRMChart from '@/components/charts/BrzyckiRMChart';
import MuscleGroupPieChart from '@/components/charts/MuscleGroupPieChart';
import TopRMImprovementChart from '@/components/charts/TopRMImprovementChart';
import NutritionWeeklyBarChart from '@/components/charts/NutritionWeeklyBarChart'; // ← NUEVO
import colors from '@/theme/colors';

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

  // Pager (3 páginas)
  const [viewportW, setViewportW] = useState<number>(SCREEN_W);
  const [page, setPage] = useState<number>(0);
  const pagerRef = useRef<ScrollView | null>(null);

  const onPagerLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - viewportW) > 1) setViewportW(w);
  };
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x || 0;
    const p = Math.round(x / Math.max(1, viewportW));
    if (p !== page) setPage(p);
  };
  const scrollToPage = (p: number) => {
    setPage(p);
    requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({ x: Math.max(0, p) * viewportW, y: 0, animated: true });
    });
  };

  // 1RM del ejercicio seleccionado (página 2)
  const [rm1, setRm1] = useState<number | null>(null);

  // Carga lista de ejercicios
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

  // Serie de volumen (página 1)
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

  // 1RM (Brzycki) (página 2)
  useEffect(() => {
    (async () => {
      try {
        setRm1(null);
        if (!selected) return;
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;

        const { data: sessions, error: seErr } = await supabase
          .from('session_exercises')
          .select('id, created_at')
          .eq('user_id', uid)
          .eq('exercise_id', selected.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (seErr || !sessions?.length) return;

        const ids = sessions.map((s) => s.id);

        const { data: sets, error: setErr } = await supabase
          .from('exercise_sets')
          .select('weight, reps, performed_at, created_at')
          .in('session_exercise_id', ids)
          .gt('reps', 0)
          .lt('reps', 10)
          .gt('weight', 0)
          .order('performed_at', { ascending: false })
          .order('created_at', { ascending: false })
          .order('weight', { ascending: false })
          .limit(1);
        if (setErr || !sets?.length) return;

        const top = sets[0];
        const w = Number(top.weight);
        const r = Number(top.reps);
        const denom = 1.0278 - 0.0278 * r;
        if (denom <= 0) return;
        setRm1(w / denom);
      } catch (e) {
        console.error('[dashboard] rm1 calc', e);
        setRm1(null);
      }
    })();
  }, [selected?.id]);

  const buttonLabel = loading ? 'Loading…' : selected?.name ?? 'Select exercise';
  const buttonDisabled = loading || exercises.length === 0;

  const handlePickExercise = (item: ExerciseRow) => {
    setSelected(item);
    setPickerOpen(false);
    scrollToPage(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
        </View>

        {/* Carrusel de charts (3 páginas) */}
        <View style={styles.carouselSection}>
          <View onLayout={onPagerLayout}>
            <ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToAlignment="center"
              onMomentumScrollEnd={onMomentumEnd}
              contentContainerStyle={{ width: viewportW * 3 }}
            >
              {/* Página 1: Volume Progress */}
              <View style={[styles.page, { width: viewportW }]}>
                <View style={styles.pageInner}>
                  <Card variant="dark" style={styles.chartCard}>
                    <ExerciseVolumeChart
                      data={dataPoints}
                      height={220}
                      actionLabel={buttonLabel}
                      onPressAction={() => setPickerOpen(true)}
                      actionDisabled={buttonDisabled}
                    />
                  </Card>
                </View>
              </View>

              {/* Página 2: RM Prediction (Brzycki) */}
              <View style={[styles.page, { width: viewportW }]}>
                <View style={styles.pageInner}>
                  <Card variant="dark" style={styles.chartCard}>
                    {rm1 ? (
                      <BrzyckiRMChart
                        rm1={rm1}
                        actionLabel={buttonLabel}
                        onPressAction={() => setPickerOpen(true)}
                        actionDisabled={buttonDisabled}
                      />
                    ) : (
                      <View style={styles.rmEmpty}>
                        <Text style={styles.rmEmptyText}>
                          Do a heavy set (&lt; 10 reps) to estimate 1RM
                        </Text>
                      </View>
                    )}
                  </Card>
                </View>
              </View>

              {/* Página 3: Top % 1RM (30d) */}
              <View style={[styles.page, { width: viewportW }]}>
                <View style={styles.pageInner}>
                  <Card variant="dark" style={styles.chartCard}>
                    <Text style={styles.cardTitle}>Top % 1RM (30d)</Text>
                    <TopRMImprovementChart />
                  </Card>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Dots (indicador de página) */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, page === 0 ? styles.dotActive : styles.dotInactive]} />
            <View style={[styles.dot, page === 1 ? styles.dotActive : styles.dotInactive]} />
            <View style={[styles.dot, page === 2 ? styles.dotActive : styles.dotInactive]} />
          </View>
        </View>

        {/* Pie Chart por grupos musculares (últimos 30 días) */}
        <Card variant="dark" style={styles.chartCard}>
          <Text style={styles.cardTitle}>Muscle Focus (last 30 days)</Text>
          <MuscleGroupPieChart />
        </Card>

        {/* NUEVO: Nutrition (últimos 7 días) */}
        <Card variant="dark" style={styles.nutritionCard}>
          <NutritionWeeklyBarChart height={220} title="Weekly Macros Record" />
        </Card>

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
                      onPress={() => handlePickExercise(item)}
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
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 28, color: '#fff', fontFamily: 'Inter-Bold' },

  // Sección carrusel + dots (añadimos margen inferior extra)
  carouselSection: {
    marginTop: 8,
    marginBottom: 24,
  },

  // Páginas
  page: { justifyContent: 'center', alignItems: 'center' },
  pageInner: { width: '90%', alignSelf: 'center' },

  chartCard: { padding: 16, backgroundColor: '#191B1F' },
  nutritionCard: { marginTop: 20, backgroundColor: '#191B1F'},

  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },

  // Dots
  dotsRow: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: '#374151',
  },

  // Placeholder RM
  rmEmpty: {
    backgroundColor: '#111318',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  rmEmptyText: { color: '#9CA3AF' },

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
