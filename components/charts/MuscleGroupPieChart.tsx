// components/charts/MuscleGroupPieChart.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-svg-charts';
import colors from '@/theme/colors';
import { supabase } from '@/lib/supabase';

type CountRowDb = {
  workout_session_id: string;
  created_at: string;
  // en tu build puede venir como objeto, array o null
  exercises: { muscle_group: string } | { muscle_group: string }[] | null;
};

type Slice = {
  key: string;
  value: number;
  color: string;
  label: string;
  percent: number;
};

const PALETTE = [
  '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#A855F7',
  '#14B8A6', '#E11D48', '#7C3AED', '#10B981', '#F97316',
];

function colorForIndex(i: number) {
  return PALETTE[i % PALETTE.length];
}
function shortLabel(name: string) {
  return name || 'Unknown';
}

export default function MuscleGroupPieChart() {
  const [slices, setSlices] = useState<Slice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) {
          setSlices([]);
          setLoading(false);
          return;
        }

        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceIso = since.toISOString();

        const { data, error } = await supabase
          .from('exercise_workout_metrics')
          .select('workout_session_id, created_at, exercises(muscle_group)')
          .eq('user_id', userId)
          .gte('created_at', sinceIso);

        if (error) throw error;

        const rows = (data ?? []) as CountRowDb[];

        // Contar (sesión, grupo muscular) únicos
        const uniquePairs = new Set<string>();
        for (const r of rows) {
          const rel = r.exercises;
          // normaliza: puede ser objeto, array o null
          const mg =
            Array.isArray(rel) ? rel[0]?.muscle_group :
            rel?.muscle_group;

          const muscle = (mg ?? 'Unknown').trim();
          if (!r.workout_session_id) continue;

          uniquePairs.add(`${r.workout_session_id}__${muscle}`);
        }

        const counts: Record<string, number> = {};
        for (const pair of uniquePairs) {
          const muscle = pair.split('__')[1];
          counts[muscle] = (counts[muscle] || 0) + 1;
        }

        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const entries = Object.entries(counts)
          .map(([group, count], idx) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return {
              key: group,
              value: count,
              color: colorForIndex(idx),
              label: shortLabel(group),
              percent: parseFloat(pct.toFixed(2)),
            } as Slice;
          })
          .sort((a, b) => b.percent - a.percent);

        setSlices(entries);
      } catch (e) {
        console.error('[MuscleGroupPieChart] load error', e);
        setSlices([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pieData = useMemo(
    () =>
      slices.map((s) => ({
        key: s.key,
        value: s.value,
        svg: { fill: s.color },
      })),
    [slices]
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : slices.length === 0 ? (
        <Text style={styles.empty}>No data in last 30 days</Text>
      ) : (
        <View style={styles.row}>
          <View style={styles.chartWrap}>
            <PieChart style={styles.chart} data={pieData} />
          </View>

          <View style={styles.legend}>
            {slices.map((s) => (
              <View key={s.key} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <Text style={styles.legendText}>
                  {s.label} — {s.percent.toFixed(2)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', },
  row: { flexDirection: 'row', alignItems: 'center' },
  chartWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chart: { height: 220, width: 220 },
  legend: { flex: 1, paddingLeft: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: colors.text, fontSize: 13 },
  empty: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
