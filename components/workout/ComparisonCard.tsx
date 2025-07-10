import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { useSetStore } from '@/store/setStore';
import {
  supabase,
  isSupabaseConfigured,
  ExerciseSet,
  ExerciseWorkoutMetricsRow,
} from '@/lib/supabase';
import colors from '@/theme/colors';

interface Props {
  exerciseId: string;
  sessionExerciseId: string;
}

/* métrica → etiqueta + color */
const cfg = {
  sets:      { label: 'Sets',          color: '#FF2D8A' },
  reps:      { label: 'Repetitions',   color: '#00FF61' },
  volume:    { label: 'Volume (kg)',   color: '#32C5FF' },
  kgPerRep:  { label: 'kg/rep',        color: '#FFCA1A' },
} as const;
type MetricKey = keyof typeof cfg;
type Metric = { key: MetricKey; value: number; diff: number; pct: number };

export function ComparisonCard({ exerciseId, sessionExerciseId }: Props) {
  const sets = useSetStore((s) => s.sets);

  const [prev, setPrev] = useState<
    | {
        sets: number;
        reps: number;
        volume: number;
        kgPerRep: number;
      }
    | null
  >(null);
  const [loading, setLoading] = useState(true);

  /* ─── obtén la última métrica guardada (tabla nueva) ─── */
  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('exercise_workout_metrics')
        .select('sets,reps,volume,kg_per_rep')
        .eq('user_id', uid)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) console.error('[ComparisonCard] prev', error);

      if (data && data.length) {
        const row = data[0] as ExerciseWorkoutMetricsRow;
        setPrev({
          sets: row.sets,
          reps: row.reps,
          volume: row.volume,
          kgPerRep: Number(row.kg_per_rep),
        });
      }
      setLoading(false);
    })();
  }, [exerciseId]);

  /* ─── métricas actuales en tiempo real ─── */
  const cur = useMemo(() => {
    const curSets = sets.filter(
      (s) => s.session_exercise_id === sessionExerciseId,
    );
    const setCount = curSets.length;
    const repsTot = curSets.reduce((a, s) => a + s.reps, 0);
    const volTot = curSets.reduce(
      (a, s) => a + (s.volume ?? s.reps * s.weight),
      0,
    );

    return {
      sets: setCount,
      reps: repsTot,
      volume: volTot,
      kgPerRep: repsTot ? volTot / repsTot : 0,
    };
  }, [sets, sessionExerciseId]);

  /* ─── difs para UI ─── */
  const metrics: Metric[] = (Object.keys(cfg) as MetricKey[]).map((key) => {
    const curVal = cur[key];
    const prevVal = prev ? prev[key] : 0;
    const diff = curVal - prevVal;
    const pct = prevVal ? (diff / prevVal) * 100 : 100;
    return { key, value: curVal, diff, pct };
  });

  /* ─── loading ─── */
  if (loading) {
    return (
      <Card style={styles.loading}>
        <ActivityIndicator />
      </Card>
    );
  }

  /* ─── render ─── */
  return (
    <Card style={styles.container}>
      <Text style={styles.title}>COMPARED TO PREVIOUS</Text>

      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.key} style={styles.cell}>
            <View
              style={[styles.bar, { backgroundColor: cfg[m.key].color }]}
            />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.label}>{cfg[m.key].label}</Text>
              <Text style={styles.value}>
                {m.key === 'kgPerRep' ? m.value.toFixed(2) : m.value}
              </Text>
              <Text
                style={[
                  styles.diff,
                  {
                    color:
                      m.diff === 0
                        ? colors.textSecondary
                        : m.diff > 0
                        ? '#34C759'
                        : '#FF3B30',
                  },
                ]}>
                {m.diff === 0
                  ? '—'
                  : `${m.diff > 0 ? '▲' : '▼'} ${Math.abs(
                      m.diff,
                    ).toFixed(m.key === 'kgPerRep' ? 2 : 0)} (${Math.abs(
                      m.pct,
                    ).toFixed(1)}%)`}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

/* ─── estilos ─── */
const styles = StyleSheet.create({
  loading: { padding: 20, alignItems: 'center' },
  container: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 12,
  },
  title: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bar: { width: 6, height: 60, borderRadius: 3 },
  label: { fontSize: 12, color: colors.textSecondary },
  value: { fontSize: 16, fontWeight: '600', color: '#fff' },
  diff: { fontSize: 12 },
});
