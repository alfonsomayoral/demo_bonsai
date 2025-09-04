import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart, Grid, XAxis } from 'react-native-svg-charts';
import { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { supabase } from '@/lib/supabase';

type SetRow = { id: string; weight: number; reps: number; created_at?: string | null; performed_at?: string | null; };
type SessionExerciseRow = {
  id: string; exercise_id: string; created_at: string;
  exercises: { name: string } | { name: string }[] | null;
  exercise_sets: SetRow[] | null;
};
type SeriePoint = { date: number; e1rm: number };
type ExerciseSeries = { exerciseId: string; name: string; points: SeriePoint[]; };
type TopEntry = { exerciseId: string; name: string; baseline: number; current: number; improvementPct: number; };

const PALETTE = ['#0EA5E9','#22C55E','#F59E0B','#EF4444','#A855F7','#14B8A6','#E11D48','#7C3AED','#10B981','#F97316'];
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const isFiniteNum = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
function e1rmBrzycki(weight: number, reps: number): number { const r = clamp(Math.round(reps), 1, 12); return (weight * 36) / (37 - r); }
function median(nums: number[]): number { const arr = nums.slice().sort((a, b) => a - b); const m = Math.floor(arr.length / 2); return arr.length % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2; }
function shortName(name: string) { return name.length <= 14 ? name : name.slice(0, 12).trim() + '…'; }

function bestHeavyLowRepSet(sets: SetRow[] | null | undefined): SetRow | null {
  if (!sets || sets.length === 0) return null;
  const cand = sets.filter(s => isFiniteNum(s.weight) && isFiniteNum(s.reps) && s.weight! >= 0);
  if (cand.length === 0) return null;
  cand.sort((a, b) => (b.weight !== a.weight ? b.weight - a.weight : a.reps - b.reps));
  return cand[0] ?? null;
}

function Gradients({ ids, baseColors }: { ids: string[]; baseColors: string[] }) {
  return (
    <Defs>
      {ids.map((id, i) => (
        <LinearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={baseColors[i]} stopOpacity={0.9} />
          <Stop offset="100%" stopColor={baseColors[i]} stopOpacity={0.55} />
        </LinearGradient>
      ))}
    </Defs>
  );
}

function Labels({
  x, y, bandwidth, data,
}: {
  x: (index: number) => number;
  y: (value: number) => number;
  bandwidth: number;
  data: { value: number }[];
}) {
  return (
    <>
      {data.map((d, i) => {
        const pct = `${d.value >= 0 ? '+' : ''}${d.value.toFixed(1)}%`;
        const cx = x(i) + bandwidth / 2;
        const cy = y(Math.max(d.value, 0)) - 6;
        return (
          <SvgText
            key={`lbl-${i}`}
            x={cx}
            y={cy}
            fontSize={11}
            fill="#E5E7EB"
            textAnchor="middle"
            fontWeight="bold"
          >
            {pct}
          </SvgText>
        );
      })}
    </>
  );
}

export default function TopRMImprovementChart() {
  const [top, setTop] = useState<TopEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) { setTop([]); setLoading(false); return; }

        const since = new Date(); since.setDate(since.getDate() - 30);
        const sinceIso = since.toISOString();

        const { data, error } = await supabase
          .from('session_exercises')
          .select('id, exercise_id, created_at, exercises(name), exercise_sets(id, weight, reps, performed_at, created_at)')
          .eq('user_id', userId)
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: true });
        if (error) throw error;

        const rows = (data ?? []) as SessionExerciseRow[];
        const byExercise = new Map<string, ExerciseSeries>();

        for (const r of rows) {
          const name = Array.isArray(r.exercises) ? (r.exercises[0]?.name ?? 'Unknown') : (r.exercises?.name ?? 'Unknown');
          const best = bestHeavyLowRepSet(r.exercise_sets);
          if (!best) continue;

          const dateStr = best.performed_at || best.created_at || r.created_at;
          const ts = new Date(dateStr ?? r.created_at).getTime();
          if (!Number.isFinite(ts)) continue;

          const e1rm = e1rmBrzycki(Number(best.weight), Number(best.reps));
          if (!isFiniteNum(e1rm)) continue;

          if (!byExercise.has(r.exercise_id)) byExercise.set(r.exercise_id, { exerciseId: r.exercise_id, name, points: [] });
          byExercise.get(r.exercise_id)!.points.push({ date: ts, e1rm });
        }

        const entries: TopEntry[] = [];
        for (const { exerciseId, name, points } of byExercise.values()) {
          if (points.length < 3) continue;
          const ordered = points.slice().sort((a, b) => a.date - b.date);
          const n = ordered.length;
          const k = Math.min(3, Math.floor(n / 2));
          if (k < 1) continue;

          const baseline = median(ordered.slice(0, k).map(p => p.e1rm));
          const current  = median(ordered.slice(n - k).map(p => p.e1rm));
          const denom = Math.max(baseline, 1e-6);
          const improvementPct = ((current - baseline) / denom) * 100;
          if (!Number.isFinite(improvementPct)) continue;

          entries.push({ exerciseId, name, baseline, current, improvementPct });
        }

        entries.sort((a, b) => b.improvementPct - a.improvementPct);
        setTop(entries.slice(0, 5));
      } catch (e) {
        console.error('[TopRMImprovementChart] load error', e);
        setTop([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = useMemo(() => {
    return top.map((t, i) => ({
      key: t.exerciseId,
      label: shortName(t.name),
      value: Number(t.improvementPct.toFixed(1)),
      gradientId: `grad_${i}`,
      baseColor: PALETTE[i % PALETTE.length],
      svg: { fill: `url(#grad_${i})` },
    }));
  }, [top]);

  const xLabels = chartData.map(d => d.label);
  const yMin = Math.min(0, ...chartData.map(d => d.value));
  const yMax = Math.max(0, ...chartData.map(d => d.value));

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : chartData.length === 0 ? (
        <Text style={styles.empty}>No eligible exercises in last 30 days</Text>
      ) : (
        <>
          <BarChart
            style={styles.chart}
            data={chartData as any}
            yAccessor={({ item }) => item.value}
            svg={{}}
            spacingInner={0.3}
            contentInset={{ top: 16, bottom: 16 }}
            yMin={yMin}
            yMax={yMax}
            extras={[
              ({}) => (
                <Gradients
                  ids={chartData.map(d => d.gradientId)}
                  baseColors={chartData.map(d => d.baseColor)}
                />
              ),
              ({ x, y, bandwidth, data }) => (
                <Labels
                  x={x as any}
                  y={y as any}
                  bandwidth={bandwidth as any}
                  data={(data as any[]).map((it) => ({ value: it.value as number }))}
                />
              ),
            ]}
          >
            <Grid />
          </BarChart>

          <XAxis
            style={{ marginTop: 8 }}
            data={chartData}
            formatLabel={(_val: unknown, index: number) => xLabels[index]}
            contentInset={{ left: 12, right: 12 }}
            svg={{ fill: '#D1D5DB', fontSize: 12, fontWeight: '600' }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  chart: { height: 240 },
  empty: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
