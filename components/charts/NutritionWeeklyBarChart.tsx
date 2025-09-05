// components/charts/NutritionWeeklyBarChart.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { supabase } from '@/lib/supabase';

type MealRow = {
  logged_at: string;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
};

type MetricKey = 'calories' | 'protein' | 'carbs' | 'fats';

const METRICS: Readonly<
  Record<
    MetricKey,
    { label: string; field: keyof MealRow; color: string; suffix: string }
  >
> = {
  calories: { label: 'Calories', field: 'total_kcal',   color: '#10B981', suffix: 'kcal' }, // verde
  protein:  { label: 'Protein',  field: 'total_protein', color: '#EF4444', suffix: 'g'    }, // rojo
  carbs:    { label: 'Carbs',    field: 'total_carbs',   color: '#EAB308', suffix: 'g'    }, // amarillo
  fats:     { label: 'Fats',     field: 'total_fat',     color: '#F97316', suffix: 'g'    }, // naranja
};

const SCREEN_W = Dimensions.get('window').width;

/** Normaliza YYYY-MM-DD en zona LOCAL (no UTC) */
function toYMDLocal(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const mm = m < 10 ? `0${m}` : `${m}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${y}-${mm}-${dd}`;
}

/** Etiqueta cortita tipo 10/7 */
function shortDM(d: Date) {
  const day = d.getDate();
  const m = d.getMonth() + 1;
  return `${day}/${m}`;
}

/** Construye el array de fechas desde hace 6 días hasta hoy (hoy al final) */
function last7Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // 00:00 local
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

/** Helpers color → rgba */
function rgba(hex: string, opacity = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${opacity})`;
}
function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

export default function NutritionWeeklyBarChart({
  height = 220,
  title = 'Weekly Intake',
}: {
  height?: number;
  title?: string;
}) {
  const [metric, setMetric] = useState<MetricKey>('calories');
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dataMap, setDataMap] = useState<Record<string, MealRow[]>>({}); // ymd -> meals[]
  const [containerW, setContainerW] = useState<number>(Math.min(SCREEN_W - 40, 360));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - containerW) > 1) setContainerW(w);
  };

  // cargar datos 7 días
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) {
          setDataMap({});
          setLoading(false);
          return;
        }

        const days = last7Days();
        const start = new Date(days[0].getFullYear(), days[0].getMonth(), days[0].getDate(), 0, 0, 0, 0);
        const startIso = start.toISOString();

        const { data, error } = await supabase
          .from('meals')
          .select('logged_at,total_kcal,total_protein,total_carbs,total_fat')
          .eq('user_id', userId)
          .gte('logged_at', startIso)
          .order('logged_at', { ascending: true });

        if (error) throw error;

        const map: Record<string, MealRow[]> = {};
        for (const row of (data ?? []) as MealRow[]) {
          const d = new Date(row.logged_at);
          const ymd = toYMDLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
          if (!map[ymd]) map[ymd] = [];
          map[ymd].push(row);
        }
        setDataMap(map);
      } catch (e) {
        console.error('[NutritionWeeklyBarChart] load error', e);
        setDataMap({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // construir labels (7 días) y valores según métrica
  const { labels, values, color, suffix } = useMemo(() => {
    const days = last7Days();
    const metricInfo = METRICS[metric];
    const vals: number[] = [];
    const labs: string[] = [];

    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const ymd = toYMDLocal(d);
      const rows = dataMap[ymd] ?? [];
      let sum = 0;
      for (const r of rows) {
        const v = Number(r[metricInfo.field] ?? 0);
        if (Number.isFinite(v)) sum += v;
      }
      // etiqueta: “Today” para el último
      labs.push(i === days.length - 1 ? 'Today' : shortDM(d));
      vals.push(Math.round(sum));
    }

    return {
      labels: labs,
      values: vals,
      color: metricInfo.color,
      suffix: metricInfo.suffix,
    };
  }, [dataMap, metric]);

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: '#15171A',
      backgroundGradientTo: '#15171A',
      decimalPlaces: 0,
      color: (opacity = 1) => rgba(color, opacity),
      labelColor: (opacity = 1) => rgba('#D1D5DB', opacity),
      fillShadowGradientFrom: color,
      fillShadowGradientTo: color,
      fillShadowGradientOpacity: 0.7,
      barPercentage: 0.5,
      propsForBackgroundLines: {
        stroke: 'rgba(148, 163, 184, 0.25)',
        strokeDasharray: '4 6',
      },
      propsForLabels: {
        fontSize: 12,
      },
    }),
    [color]
  );

  const data = useMemo(
    () => ({
      labels,
      datasets: [{ data: values }],
    }),
    [labels, values]
  );

  const handlePick = (key: MetricKey) => {
    setMetric(key);
    setPickerOpen(false);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.metricBtn} onPress={() => setPickerOpen(true)}>
          <Text style={styles.metricBtnText}>{METRICS[metric].label}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#10B981" />
        </View>
      ) : (
        <BarChart
          style={styles.chart}
          data={data}
          width={containerW}
          height={height}
          yAxisLabel=""                 // ← requerido por tus typings
          yAxisSuffix={` ${suffix}`}
          chartConfig={chartConfig as any}
          fromZero
          withInnerLines
          showBarTops={false}
          withCustomBarColorFromData={false}
        />
      )}

      {/* Modal selector de métrica */}
      <Modal
        visible={pickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose metric</Text>
            <FlatList
              data={(Object.keys(METRICS) as MetricKey[]).map((k) => ({
                key: k,
                label: METRICS[k].label,
              }))}
              keyExtractor={(it) => it.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handlePick(item.key as MetricKey)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  title: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },

  metricBtn: {
    backgroundColor: '#191B1F',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricBtnText: { color: '#D1D5DB', fontFamily: 'Inter-SemiBold' },

  loadingBox: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15171A',
    borderRadius: 12,
  },
  chart: {
    borderRadius: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: Math.min(SCREEN_W - 40, 360),
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
