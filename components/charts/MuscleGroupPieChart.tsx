import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import colors from '@/theme/colors';

type Slice = { key: string; label: string; value: number; pct: number; color: string };

const PALETTE = [
  '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#A855F7',
  '#14B8A6', '#7C3AED', '#10B981', '#F97316', '#E11D48',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export default function MuscleGroupPieChart() {
  const [slices, setSlices] = useState<Slice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) {
          setSlices([]);
          return;
        }

        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceIso = since.toISOString();

        // Contamos cuántas veces aparece cada grupo muscular en las session_exercises de los últimos 30 días
        const { data, error } = await supabase
          .from('session_exercises')
          .select('id, created_at, exercises(muscle_group)')
          .eq('user_id', uid)
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const counts = new Map<string, number>();
        for (const row of (data ?? []) as any[]) {
          const mg = Array.isArray(row.exercises)
            ? (row.exercises[0]?.muscle_group ?? 'Other')
            : (row.exercises?.muscle_group ?? 'Other');
          const key = String((mg || 'Other').trim());
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }

        const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
        if (total === 0) {
          setSlices([]);
          return;
        }

        const result = Array.from(counts.entries())
          .map(([label, value], i) => ({
            key: `${label}-${i}`,
            label,
            value,
            pct: (value / total) * 100,
            color: PALETTE[i % PALETTE.length],
          }))
          .sort((a, b) => b.value - a.value);

        setSlices(result);
      } catch (e) {
        console.error('[MuscleGroupPieChart] load error', e);
        setSlices([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const arcs = useMemo(() => {
    const out: { d: string; fill: string }[] = [];
    if (slices.length === 0) return out;

    const cx = 70, cy = 70, r = 60;
    const total = slices.reduce((acc, s) => acc + s.value, 0);
    let angle = 0;

    for (const s of slices) {
      const start = angle;
      const end = angle + (360 * s.value) / Math.max(1, total);
      out.push({ d: describeArc(cx, cy, r, start, end), fill: s.color });
      angle = end;
    }
    return out;
  }, [slices]);

  if (loading) return <Text style={styles.info}>Loading…</Text>;
  if (slices.length === 0) return <Text style={styles.info}>No data in last 30 days</Text>;

  return (
    <View style={styles.row}>
      <Svg width={140} height={140}>
        <G>
          {arcs.map((a, i) => <Path key={`arc-${i}`} d={a.d} fill={a.fill} />)}
        </G>
      </Svg>

      <View style={styles.legend}>
        {slices.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>
              {s.label} — {s.pct.toFixed(2)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  legend: { marginLeft: 16, gap: 6, flexShrink: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: colors.text, fontSize: 13 },
  info: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
