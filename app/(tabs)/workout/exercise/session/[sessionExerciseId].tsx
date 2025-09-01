import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ComparisonCard } from '@/components/workout/ComparisonCard';
import { SetCard } from '@/components/workout/SetCard';
import { SetPad } from '@/components/workout/SetPad';
import { useSetStore } from '@/store/setStore';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { supabase } from '@/lib/supabase';
import colors from '@/theme/colors';

// Charts
import ExerciseVolumeChart from '@/components/charts/ExerciseVolumeChart';
import BrzyckiRMChart from '@/components/charts/BrzyckiRMChart';

type MetricRow = { created_at: string; volume: number };

const { width } = Dimensions.get('window');

/** Promedio de volumen por día (para eje X con días entrenados). */
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

export default function ExerciseSessionScreen() {
  const { sessionExerciseId } =
    useLocalSearchParams<{ sessionExerciseId: string }>();

  const [showPad, setShowPad] = useState(false);

  // NUEVO: modales de análisis
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showRMModal, setShowRMModal] = useState(false);

  const { sets, loadSets, addSet, duplicateSet } = useSetStore();
  const { exercises } = useWorkoutStore();
  const { getExerciseById } = useExerciseStore();

  /* obtener nombre y exercise_id del ejercicio */
  const sessionEx = exercises.find((se) => se.id === sessionExerciseId);
  const exercise = sessionEx ? getExerciseById(sessionEx.exercise_id) : null;

  /* cargar sets una sola vez */
  useEffect(() => {
    if (sessionExerciseId) loadSets(sessionExerciseId);
  }, [sessionExerciseId]);

  /* guardar */
  const handleSave = (reps: number, weight: number) => {
    addSet(sessionExerciseId!, reps, weight);
    setShowPad(false);
  };

  /* sólo sets de este ejercicio en la sesión actual */
  const filtered = useMemo(
    () => sets.filter((s) => s.session_exercise_id === sessionExerciseId),
    [sets, sessionExerciseId]
  );

  // ───────────────────── Datos para los CHARTS ─────────────────────

  // 1) Volumen por día para este ejercicio (de todas las sesiones del usuario)
  const [volumePoints, setVolumePoints] = useState<{ date: Date; value: number }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        setVolumePoints([]);
        if (!sessionEx) return;
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid || !sessionEx.exercise_id) return;

        const { data, error } = await supabase
          .from('exercise_workout_metrics')
          .select('created_at, volume')
          .eq('user_id', uid)
          .eq('exercise_id', sessionEx.exercise_id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setVolumePoints(groupDailyAverage((data ?? []) as MetricRow[]));
      } catch (e) {
        console.error('[sessionExercise] metrics', e);
        setVolumePoints([]);
      }
    })();
  }, [sessionEx?.exercise_id]);

  // 2) 1RM (Brzycki) estimado a partir de los sets de esta sesión (< 10 reps, mayor peso)
  const [rm1, setRm1] = useState<number | null>(null);
  useEffect(() => {
    // calcular 1RM desde sets de la sesión actual
    const eligible = filtered
      .filter((s) => Number(s.reps) > 0 && Number(s.reps) < 10 && Number(s.weight) > 0)
      .sort((a, b) => Number(b.weight) - Number(a.weight));
    if (eligible.length === 0) {
      setRm1(null);
      return;
    }
    const top = eligible[0];
    const w = Number(top.weight);
    const r = Number(top.reps);
    const denom = 1.0278 - 0.0278 * r;
    if (denom <= 0) {
      setRm1(null);
      return;
    }
    setRm1(w / denom);
  }, [filtered]);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Exercise not found</Text>
      </SafeAreaView>
    );
  }

  // Header extra (tarjetas análisis)
  const ListHeader = (
    <>
      {/* Tarjetas de análisis */}
      <View style={styles.analysisRow}>
        <TouchableOpacity style={styles.analysisCard} onPress={() => setShowVolumeModal(true)}>
          <View style={[styles.analysisIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <MaterialCommunityIcons name="chart-line" size={18} color="#ef4444" />
          </View>
          <Text style={styles.analysisTitle}>Progress Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.analysisCard} onPress={() => setShowRMModal(true)}>
          <View style={[styles.analysisIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <MaterialCommunityIcons name="chart-bar" size={18} color="#a855f7" />
          </View>
          <Text style={styles.analysisTitle}>RM Prediction</Text>
        </TouchableOpacity>
      </View>

      {/* Comparativa existente */}
      <ComparisonCard
        exerciseId={exercise.id}
        sessionExerciseId={sessionExerciseId!}
      />
    </>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={colors.primary} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exercise.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={({ item, index }) => (
            <SetCard
              set={item}
              setNumber={index + 1}
              onDuplicate={() => duplicateSet(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
        />
      </SafeAreaView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowPad(true)}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      <SetPad
        visible={showPad}
        onClose={() => setShowPad(false)}
        onSave={handleSave}
      />

      {/* ─────────────── Modal: Progress Analysis (Volumen) ─────────────── */}
      <Modal visible={showVolumeModal} transparent animationType="fade" onRequestClose={() => setShowVolumeModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowVolumeModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <SafeAreaView style={styles.modalSafeTop}>
              <TouchableOpacity onPress={() => setShowVolumeModal(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color="#22c55e" />
              </TouchableOpacity>
            </SafeAreaView>
            <ExerciseVolumeChart
              title={`${exercise.name} • Volume`}
              data={volumePoints}
              height={240}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─────────────── Modal: RM Prediction ─────────────── */}
      <Modal visible={showRMModal} transparent animationType="fade" onRequestClose={() => setShowRMModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowRMModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <SafeAreaView style={styles.modalSafeTop}>
              <TouchableOpacity onPress={() => setShowRMModal(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color="#22c55e" />
              </TouchableOpacity>
            </SafeAreaView>
            {rm1 ? (
              <BrzyckiRMChart
                title={`${exercise.name} • RM (Brzycki's formula)`}
                rm1={rm1}
              />
            ) : (
              <View style={styles.rmEmpty}>
                <Text style={styles.rmEmptyText}>
                  Add a set (&lt; 10 reps) to estimate 1RM
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* styles */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },

  list: { paddingHorizontal: 20, paddingBottom: 100 },

  // Tarjetas de análisis
  analysisRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  analysisCard: {
    flex: 1,
    backgroundColor: '#191B1F',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  analysisTitle: { color: colors.text, fontWeight: '700' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    left: (width - 56) / 2,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal overlay
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#0B0C0F',
    borderRadius: 16,
    padding: 16,
  },
  modalSafeTop: {
    position: 'absolute',
    left: 8,
    top: 8,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    borderRadius: 12,
  },
  rmEmpty: {
    backgroundColor: '#111318',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  rmEmptyText: { color: '#9CA3AF' },
});
