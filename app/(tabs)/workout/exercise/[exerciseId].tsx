import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { supabase, Exercise } from '@/lib/supabase';
import { useExerciseStore } from '@/store/exerciseStore';
import { useRoutineStore } from '@/store/routineStore';
import { useWorkoutStore } from '@/store/workoutStore';
import colors from '@/theme/colors';

// Charts
import ExerciseVolumeChart from '@/components/charts/ExerciseVolumeChart';
import BrzyckiRMChart from '@/components/charts/BrzyckiRMChart';

type MetricRow = { created_at: string; volume: number };

const { width: SCREEN_W } = Dimensions.get('window');

/** Agrupa por día y saca promedio del volumen por sesión del mismo día (x-eje con días entrenados). */
function groupDailyAverage(rows: MetricRow[]) {
  const map: Record<string, { sum: number; n: number; date: Date }> = {};
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = d.toISOString().slice(0, 10);
    if (!map[key]) {
      map[key] = {
        sum: 0,
        n: 0,
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      };
    }
    map[key].sum += Number(r.volume || 0);
    map[key].n += 1;
  }
  return Object.values(map)
    .map((v) => ({ date: v.date, value: v.n ? v.sum / v.n : 0 }))
    .sort((a, b) => +a.date - +b.date);
}

export default function ExerciseInfoScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  /* stores */
  const { getExerciseById, addExerciseToRoutine } = useExerciseStore();
  const { routines } = useRoutineStore();
  const { createWorkout, addExerciseToWorkout } = useWorkoutStore();

  /* local UI state */
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // charts data
  const [volumePoints, setVolumePoints] = useState<{ date: Date; value: number }[]>([]);
  const [rm1, setRm1] = useState<number | null>(null);

  /* ───── carga del ejercicio (caché → Supabase) ───── */
  useEffect(() => {
    const cached = getExerciseById(exerciseId);
    if (cached) {
      setExercise(cached);
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();
      if (error) Alert.alert('Error', 'Could not load exercise.');
      setExercise(data as Exercise | null);
      setLoading(false);
    })();
  }, [exerciseId]);

  /* ───── métricas para gráfico de volumen (línea) ───── */
  useEffect(() => {
    (async () => {
      try {
        setVolumePoints([]);
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid || !exerciseId) return;

        const { data, error } = await supabase
          .from('exercise_workout_metrics')
          .select('created_at, volume')
          .eq('user_id', uid)
          .eq('exercise_id', exerciseId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setVolumePoints(groupDailyAverage((data ?? []) as MetricRow[]));
      } catch (e) {
        console.error('[exercise screen] metrics', e);
        setVolumePoints([]);
      }
    })();
  }, [exerciseId]);

  /* ───── cálculo 1RM (Brzycki) usando la última serie elegible global ───── */
  useEffect(() => {
    (async () => {
      try {
        setRm1(null);
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid || !exerciseId) return;

        // 1) obtenemos últimas session_exercises para este user+exercise
        const { data: sessions, error: seErr } = await supabase
          .from('session_exercises')
          .select('id, created_at')
          .eq('user_id', uid)
          .eq('exercise_id', exerciseId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (seErr || !sessions?.length) return;

        const ids = sessions.map((s) => s.id);

        // 2) buscamos la última serie elegible (<10 reps) global, priorizando fecha y, en empate, mayor peso
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
        console.error('[exercise screen] rm global', e);
        setRm1(null);
      }
    })();
  }, [exerciseId]);

  /* ───── acciones ───── */
  const handleAddToRoutine = () => {
    if (!exercise || !routines.length) {
      Alert.alert('No routines', 'Create a routine first.');
      return;
    }

    Alert.alert(
      'Add to routine',
      `Choose a routine for "${exercise.name}"`,
      routines.map((rt) => ({
        text: rt.name,
        onPress: async () => {
          try {
            await addExerciseToRoutine(rt.id, exercise.id);
            Alert.alert('Success', 'Exercise added to routine.');
          } catch {
            Alert.alert('Error', 'Could not add exercise.');
          }
        },
      })),
      { cancelable: true },
    );
  };

  const handleAddToWorkout = async () => {
    if (!exercise) return;
    setAdding(true);

    /* Aseguramos que hay workout */
    if (!useWorkoutStore.getState().workout) {
      try {
        await createWorkout();
      } catch {
        setAdding(false);
        Alert.alert('Error', 'Could not start workout.');
        return;
      }
    }

    /* Añadimos / recuperamos ejercicio en la sesión */
    const sessId = await addExerciseToWorkout({
      id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
    });

    if (!sessId) {
      setAdding(false);
      Alert.alert('Error', 'Could not add exercise.');
      return;
    }

    setAdding(false);
    router.replace(`/workout/exercise/session/${sessId}`);
  };

  /* ───── layout para el carrusel + página activa (dots) ───── */
  const [viewportW, setViewportW] = useState<number>(SCREEN_W);
  const [page, setPage] = useState<number>(0);

  const onPagerLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - viewportW) > 1) setViewportW(w);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x || 0;
    const p = Math.round(x / Math.max(1, viewportW));
    if (p !== page) setPage(p);
  };

  /* ───── render ───── */
  if (loading || !exercise) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Header simple con nombre */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <ArrowLeft color={colors.primary} size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>{exercise.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Muscle group + Description */}
        <View style={styles.info}>
          <Text style={styles.label}>Muscle group:</Text>
          <Text style={styles.value}>{exercise.muscle_group}</Text>

          {!!exercise.description && (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Description:</Text>
              <Text style={styles.value}>{exercise.description}</Text>
            </>
          )}
        </View>

        {/* ───────── Charts en carrusel (una página por chart) ───────── */}
        <View style={{ marginTop: 16 }}>
          <View onLayout={onPagerLayout}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToAlignment="center"
              onMomentumScrollEnd={onMomentumEnd}
              contentContainerStyle={{ width: viewportW * 2 }}
            >
              {/* Página 1: Volumen */}
              <View style={[styles.page, { width: viewportW }]}>
                <View style={styles.pageInner}>
                  <ExerciseVolumeChart
                    title={`${exercise.name} • volume`}
                    data={volumePoints}
                    height={220}
                  />
                </View>
              </View>

              {/* Página 2: 1RM Brzycki */}
              <View style={[styles.page, { width: viewportW }]}>
                <View style={styles.pageInner}>
                  {rm1 ? (
                    <BrzyckiRMChart
                      title={`${exercise.name} • RM (Brzycki's formula)`}
                      rm1={rm1}
                    />
                  ) : (
                    <View style={styles.rmEmpty}>
                      <Text style={styles.rmEmptyText}>
                        Do a set &lt; 10 reps to estimate 1RM
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Dots (indicador de página) */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, page === 0 ? styles.dotActive : styles.dotInactive]} />
            <View style={[styles.dot, page === 1 ? styles.dotActive : styles.dotInactive]} />
          </View>
        </View>

        {/* Botones */}
        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={handleAddToRoutine}>
            <Text style={styles.btnTxt}>Add to Routine</Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            onPress={handleAddToWorkout}
            disabled={adding}
          >
            <Text style={styles.btnTxt}>Add to Workout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───── estilos ───── */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#000' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },

  info: { marginTop: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  value: { fontSize: 15, color: colors.text, marginTop: 2 },

  /* Carrusel de charts */
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageInner: {
    width: '90%',
    alignSelf: 'center',
  },

  dotsRow: {
    marginTop: 10,
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

  rmEmpty: {
    backgroundColor: '#111318',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  rmEmptyText: { color: '#9CA3AF' },

  actions: { marginTop: 24, gap: 12 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
