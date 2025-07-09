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
} from '@/lib/supabase';
import colors from '@/theme/colors';

interface Props {
  exerciseId: string;
  sessionExerciseId: string;
}

/* ────────── configuración de métricas ────────── */
type MetricKey = 'volume' | 'sets' | 'reps' | 'kgPerRep';

const metricCfg: Record<
  MetricKey,
  { label: string; color: string }
> = {
  sets: { label: 'Sets', color: '#FF2D8A' },
  reps: { label: 'Repetitions', color: '#00FF61' },
  volume: { label: 'Volume (kg)', color: '#32C5FF' },
  kgPerRep: { label: 'kg/rep', color: '#FFCA1A' },
};

interface Metric {
  key: MetricKey;
  value: number;
  diff: number;
  pct: number;
}

export function ComparisonCard({
  exerciseId,
  sessionExerciseId,
}: Props) {
  const sets = useSetStore((s) => s.sets);

  const [prev, setPrev] = useState<{
    sets: number;
    reps: number;
    volume: number;
    kgPerRep: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  /* ────── cargar última sesión previa ────── */
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

      /* último session_exercise distinto al actual */
      const { data: seRows } = await supabase
        .from('session_exercises')
        .select('id, created_at')
        .eq('exercise_id', exerciseId)
        .eq('user_id', uid)
        .neq('id', sessionExerciseId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!seRows?.length) {
        setLoading(false);
        return;
      }
      const prevSE = seRows[0];

      /* sets de esa sesión previa */
      const { data: prevSets } = await supabase
        .from('exercise_sets')
        .select('*')
        .eq('session_exercise_id', prevSE.id);

      if (!prevSets?.length) {
        setLoading(false);
        return;
      }

      const setsCount = prevSets.length;
      const repsTotal = prevSets.reduce(
        (a, s: any) => a + s.reps,
        0,
      );
      const volumeTotal = prevSets.reduce(
        (a, s: any) => a + (s.volume ?? s.reps * s.weight),
        0,
      );

      setPrev({
        sets: setsCount,
        reps: repsTotal,
        volume: volumeTotal,
        kgPerRep: repsTotal ? volumeTotal / repsTotal : 0,
      });
      setLoading(false);
    })();
  }, [exerciseId, sessionExerciseId]);

  /* ────── métricas actuales en tiempo real ────── */
  const cur = useMemo(() => {
    const curSets = sets.filter(
      (s) => s.session_exercise_id === sessionExerciseId,
    );

    const setsCount = curSets.length;
    const repsTot = curSets.reduce((a, s) => a + s.reps, 0);
    const volTot = curSets.reduce(
      (a, s) => a + (s.volume ?? s.reps * s.weight),
      0,
    );

    return {
      sets: setsCount,
      reps: repsTot,
      volume: volTot,
      kgPerRep: repsTot ? volTot / repsTot : 0,
    };
  }, [sets, sessionExerciseId]);

  /* ────── preparar datos para UI ────── */
  const metrics: Metric[] = ([
    'sets',
    'reps',
    'volume',
    'kgPerRep',
  ] as MetricKey[]).map((key) => {
    const curVal = cur[key];
    const prevVal = prev ? prev[key] : 0;
    const diff = curVal - prevVal;
    const pct = prevVal ? (diff / prevVal) * 100 : 100;
    return { key, value: curVal, diff, pct };
  });

  /* ────── UI Loading ────── */
  if (loading) {
    return (
      <Card style={styles.loadingCard}>
        <ActivityIndicator />
      </Card>
    );
  }

  /* ────── UI Métricas ────── */
  return (
    <Card style={styles.container}>
      <Text style={styles.title}>COMPARED TO PREVIOUS</Text>

      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.key} style={styles.cell}>
            {/* barra vertical */}
            <View
              style={[
                styles.bar,
                { backgroundColor: metricCfg[m.key].color },
              ]}
            />

            {/* textos */}
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.label}>{metricCfg[m.key].label}</Text>
              <Text style={styles.value}>
                {m.key === 'kgPerRep'
                  ? m.value.toFixed(2)
                  : m.value}
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
                    ).toFixed(
                      m.key === 'kgPerRep' ? 2 : 0,
                    )} (${Math.abs(m.pct).toFixed(1)}%)`}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

/* ────────── estilos ────────── */
const styles = StyleSheet.create({
  loadingCard: { padding: 20, alignItems: 'center' },
  container: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
  },
  title: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: 1,
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
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 16, fontWeight: '600', color: '#fff' },
  diff: { fontSize: 12 },
});
