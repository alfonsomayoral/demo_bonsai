// components/charts/TopRMImprovementChart.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart, Grid, XAxis } from 'react-native-svg-charts';
import { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { supabase } from '@/lib/supabase';

type SetRow = {
  id: string;
  weight: number;
  reps: number;
  created_at?: string | null;
  performed_at?: string | null;
};
type SessionExerciseRow = {
  id: string;
  exercise_id: string;
  created_at: string;
  exercises: { name: string } | { name: string }[] | null;
  exercise_sets: SetRow[] | null;
};
type TopEntry = {
  exerciseId: string;
  name: string;
  baseline: number;
  current: number;
  improvementPct: number;
};

const PALETTE = [
  '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#A855F7',
  '#14B8A6', '#E11D48', '#7C3AED', '#10B981', '#F97316',
];

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const isFiniteNum = (n: unknown) => typeof n === 'number' && Number.isFinite(n);

/** e1RM (Brzycki), limitamos reps al rango 1–12 */
function e1rmBrzycki(weight: number, reps: number): number {
  const r = clamp(Math.round(reps), 1, 12);
  return (weight * 36) / (37 - r);
}
function shortName(name: string) {
  return name.length <= 14 ? name : name.slice(0, 12).trim() + '…';
}

/** Mejor set pesado de un día: mayor peso y, a igualdad, menor reps; reps 1–9, peso > 0 */
function bestSetPerDay(sets: SetRow[]): SetRow | null {
  const cand = sets.filter(
    s => isFiniteNum(s.weight) && isFiniteNum(s.reps) && Number(s.weight) > 0 && Number(s.reps) >= 1 && Number(s.reps) <= 9
  );
  if (cand.length === 0) return null;
  cand.sort((a, b) => (b.weight !== a.weight ? b.weight - a.weight : a.reps - b.reps));
  return cand[0] ?? null;
}

/** Agrupa sets por día (YYYY-MM-DD) */
function groupSetsByDay(rows: { ts: number; set: SetRow }[]) {
  const map = new Map<string, SetRow[]>();
  for (const { ts, set } of rows) {
    const d = new Date(ts);
    const ymd = d.toISOString().slice(0, 10);
    if (!map.has(ymd)) map.set(ymd, []);
    map.get(ymd)!.push(set);
  }
  return map;
}

/** Defs de gradientes por barra */
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

/** Etiquetas sobre barras: props OPCIONALES (las inyecta BarChart en runtime) */
function Labels(props: {
  x?: (index: number) => number;
  y?: (value: number) => number;
  bandwidth?: number;
  data?: Array<{ value?: number }>;
}) {
  const { x, y, bandwidth, data } = props;
  if (!x || !y || !bandwidth || !data) return null;

  return (
    <>
      {data.map((d, i) => {
        const val = Number(d?.value ?? 0);
        const pct = `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
        const cx = x(i) + bandwidth / 2;
        const cy = y(Math.max(val, 0)) - 6;
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
        if (!userId) {
          setTop([]);
          setLoading(false);
          return;
        }

        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceIso = since.toISOString();

        // Traemos sesiones con sets y nombre del ejercicio en los últimos 30 días
        const { data, error } = await supabase
          .from('session_exercises')
          .select(
            'id, exercise_id, created_at, exercises(name), exercise_sets(id, weight, reps, performed_at, created_at)'
          )
          .eq('user_id', userId)
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: true });

        if (error) throw error;
        const rows = (data ?? []) as SessionExerciseRow[];

        // Recolectamos sets válidos por ejercicio con su timestamp
        type ByExercise = Map<string, { name: string; items: { ts: number; set: SetRow }[] }>;
        const byExercise: ByExercise = new Map();

        for (const r of rows) {
          const name = Array.isArray(r.exercises)
            ? r.exercises[0]?.name ?? 'Unknown'
            : r.exercises?.name ?? 'Unknown';

          for (const s of (r.exercise_sets ?? [])) {
            const dateStr = s.performed_at || s.created_at || r.created_at;
            const ts = new Date(dateStr ?? r.created_at).getTime();
            if (!Number.isFinite(ts)) continue;

            const reps = Number(s.reps);
            const weight = Number(s.weight);
            if (!(weight > 0 && reps >= 1 && reps <= 9)) continue; // < 10 reps

            if (!byExercise.has(r.exercise_id)) byExercise.set(r.exercise_id, { name, items: [] });
            byExercise.get(r.exercise_id)!.items.push({ ts, set: s });
          }
        }

        const entries: TopEntry[] = [];

        for (const [exerciseId, { name, items }] of byExercise.entries()) {
          if (items.length === 0) continue;

          // Agrupamos por día y elegimos el mejor set de cada día
          const grouped = groupSetsByDay(items);
          const days = Array.from(grouped.keys()).sort(); // YYYY-MM-DD ascendente
          if (days.length < 2) continue; // necesitamos al menos 2 días distintos

          const firstDay = days[0];
          const lastDay = days[days.length - 1];

          const bestFirst = bestSetPerDay(grouped.get(firstDay)!);
          const bestLast = bestSetPerDay(grouped.get(lastDay)!);
          if (!bestFirst || !bestLast) continue;

          const base = e1rmBrzycki(Number(bestFirst.weight), Number(bestFirst.reps));
          const curr = e1rmBrzycki(Number(bestLast.weight), Number(bestLast.reps));
          if (!(isFiniteNum(base) && isFiniteNum(curr))) continue;

          const denom = Math.max(Number(base), 1e-6);
          const improvementPct = ((Number(curr) - Number(base)) / denom) * 100;

          entries.push({
            exerciseId,
            name,
            baseline: Number(base),
            current: Number(curr),
            improvementPct,
          });
        }

        // Top-5 por % mejora (desc) y luego invertimos para que Top1 quede a la derecha
        entries.sort((a, b) => b.improvementPct - a.improvementPct);
        const top5 = entries.slice(0, 5).reverse();

        setTop(top5);
      } catch (e) {
        console.error('[TopRMImprovementChart] load error', e);
        setTop([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Datos del chart
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

  const xLabels = chartData.map((d) => d.label);

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
            svg={{}} // cada item aporta su fill con url(#grad_i)
            spacingInner={0.3}
            contentInset={{ top: 16, bottom: 16 }}
          >
            <Gradients
              ids={chartData.map((d) => d.gradientId)}
              baseColors={chartData.map((d) => d.baseColor)}
            />
            <Grid />
            {/* BarChart clona a sus hijos inyectando x, y, bandwidth, data */}
            <Labels />
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
  chart: { height: 270 },
  empty: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
