import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { useSetStore } from '@/store/setStore';
import { supabase, isSupabaseConfigured, ExerciseSet } from '@/lib/supabase';
import colors from '@/theme/colors';

interface Props {
  exerciseId: string;
  sessionExerciseId: string;
}

type MetricKey = 'volume' | 'sets' | 'reps' | 'kgPerRep';

interface Metric {
  label: string;
  color: string;
  value: number;
  diff: number;
  pct: number;
}

const metricColors: Record<MetricKey, string> = {
  sets: '#FF2D8A',         // magenta
  reps: '#00FF61',         // green
  volume: '#32C5FF',       // cyan
  kgPerRep: '#B37A00',     // orange/brown
};

export function ComparisonCard({ exerciseId, sessionExerciseId }: Props) {
  /* ---------- estado ---------- */
  const sets = useSetStore((s) => s.sets);
  const [prevMetrics, setPrevMetrics] = useState<{
    sets: number;
    reps: number;
    volume: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- fetch sesión previa ---------- */
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

      /* 1- obtener el último session_exercise distinto al actual */
      const { data: seRows } = await supabase
        .from('session_exercises')
        .select('id, session_id, created_at')
        .eq('exercise_id', exerciseId)
        .eq('user_id', uid)
        .neq('id', sessionExerciseId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!seRows || !seRows.length) {
        setLoading(false);
        return;
      }
      const prevSE = seRows[0];

      /* 2- sets de esa sesión */
      const { data: prevSets } = await supabase
        .from('exercise_sets')
        .select('*')
        .eq('session_exercise_id', prevSE.id);

      if (!prevSets || !prevSets.length) {
        setLoading(false);
        return;
      }

      const setsCount = prevSets.length;
      const repsTotal = prevSets.reduce((a, s: any) => a + s.reps, 0);
      const volumeTotal = prevSets.reduce(
        (a, s: any) => a + (s.volume ?? s.reps * s.weight),
        0,
      );

      setPrevMetrics({
        sets: setsCount,
        reps: Math.round(repsTotal / setsCount), // avg reps / set
        volume: Math.round(volumeTotal / setsCount), // avg vol / set
      });
      setLoading(false);
    })();
  }, [exerciseId]);

  /* ---------- métricas actuales (reactivo) ---------- */
  const currentMetrics = useMemo(() => {
    const curSets = sets.filter(
      (s) => s.session_exercise_id === sessionExerciseId,
    );
    const setCount = curSets.length;
    const repsTot = curSets.reduce((a, s) => a + s.reps, 0);
    const volTot = curSets.reduce(
      (a, s) => a + (s.volume ?? s.reps * s.weight),
      0,
    );

    const avgReps = setCount ? repsTot / setCount : 0;
    const avgVol = setCount ? volTot / setCount : 0;
    const kgPerRep = avgReps ? avgVol / avgReps : 0;

    return {
      sets: setCount,
      reps: Math.round(avgReps),
      volume: Math.round(avgVol),
      kgPerRep: Math.round(kgPerRep),
    };
  }, [sets, sessionExerciseId]);

  /* ---------- diffs ---------- */
  const metrics: Metric[] = (['sets', 'reps', 'volume', 'kgPerRep'] as MetricKey[]).map(
    (key) => {
      const curVal = currentMetrics[key];
      const prevVal = prevMetrics ? prevMetrics[key as keyof typeof prevMetrics] ?? 0 : 0;
      const diff = curVal - prevVal;
      const pct = prevVal ? (diff / prevVal) * 100 : 100;
      return {
        label:
          key === 'kgPerRep' ? 'kg/rep' : key.charAt(0).toUpperCase() + key.slice(1),
        color: metricColors[key],
        value: curVal,
        diff,
        pct,
      };
    },
  );

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <Card style={styles.loadingCard}>
        <ActivityIndicator />
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Compared to Previous</Text>

      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.cell}>
            {/* barra vertical */}
            <View style={[styles.bar, { backgroundColor: m.color }]} />

            {/* textos */}
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.label}>{m.label}</Text>
              <Text style={styles.value}>{m.value}</Text>
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
                {m.diff >= 0 ? '▲' : '▼'} {Math.abs(m.diff)} ({Math.abs(m.pct).toFixed(1)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  loadingCard: { padding: 20, alignItems: 'center' },
  container: { marginBottom: 16, padding: 16 },
  title: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
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
  value: { fontSize: 16, fontWeight: '600', color: colors.text },
  diff: { fontSize: 12 },
});
