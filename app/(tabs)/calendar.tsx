import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { supabase } from '@/lib/supabase';
import { CalendarView } from '@/components/ui/CalendarView';
import { MealCard } from '@/components/nutrition/MealCard';
import { ProgressRing } from '@/components/nutrition/ProgressRing';

/* -------------------------- helpers fecha -------------------------- */
function ymdFromParts(year: number, monthIndex: number, day: number) {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}
function todayYmd() {
  const d = new Date();
  return ymdFromParts(d.getFullYear(), d.getMonth(), d.getDate());
}
function monthRangeYmd(year: number, monthIndex: number) {
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const start = ymdFromParts(year, monthIndex, 1);
  const end = ymdFromParts(year, monthIndex, days);
  return { start, end, daysInMonth: days };
}

/* --------------------------- tipos locales ------------------------- */
type MealItem = {
  id: string;
  name: string;
  weight_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  image_path?: string | null;
  confidence?: number | null;
};
type Meal = {
  id: string;
  logged_at: string;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_items?: MealItem[];
};

/* ------------------------- mini componentes ------------------------ */
function StatRing({
  label,
  icon,
  value,
  target,
  color,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  target: number;
  color: string;
}) {
  const progress = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statTitle, { color }]}>{label}</Text>
      <View style={styles.statRing}>
        <ProgressRing size={74} stroke={8} progress={progress} color={color} trackColor="#1F2937">
          <MaterialCommunityIcons name={icon} size={26} color={color} />
        </ProgressRing>
      </View>
      <Text style={styles.statValue}>
        {Math.round(value)} / {Math.round(target)}
      </Text>
    </View>
  );
}

function SmallMetric({
  label,
  value,
}: { label: string; value: string }) {
  return (
    <View style={styles.smallMetric}>
      <Text style={styles.smallMetricLabel}>{label}</Text>
      <Text style={styles.smallMetricValue}>{value}</Text>
    </View>
  );
}

/* ------------------------------ pantalla --------------------------- */
export default function CalendarScreen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayYmd());
  const [markedDates, setMarkedDates] = useState<{ [date: string]: 'green' | 'gray' }>({});
  const [userId, setUserId] = useState<string | null>(null);

  // Datos del día seleccionado
  const [loadingDay, setLoadingDay] = useState(false);
  const [dayMeals, setDayMeals] = useState<Meal[]>([]);
  const [dayTotals, setDayTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const [dayWorkoutStats, setDayWorkoutStats] = useState({ duration: 0, volume: 0, sets: 0, exercises: 0 });
  const [dayExercises, setDayExercises] = useState<{ name: string; sets: number; reps: number; volume: number }[]>([]);
  const [targets, setTargets] = useState({ kcal: 2000, protein: 150, carbs: 200, fat: 60 });

  // Obtener user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Marcar días del mes (comidas / workouts)
  useEffect(() => {
    if (!userId) return;
    const { start, end, daysInMonth } = monthRangeYmd(currentYear, currentMonth);

    Promise.all([
      supabase.from('meals').select('id, logged_at').eq('user_id', userId).gte('logged_at', start).lte('logged_at', end),
      supabase.from('workout_sessions').select('id, start_time').eq('user_id', userId).gte('start_time', start).lte('start_time', end),
    ]).then(([mealsRes, workoutsRes]) => {
      const meals = mealsRes.data || [];
      const workouts = workoutsRes.data || [];
      const map: { [d: string]: 'green' | 'gray' } = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const date = ymdFromParts(currentYear, currentMonth, d);
        const hasMeal = meals.some(m => (m.logged_at || '').slice(0, 10) === date);
        const hasWorkout = workouts.some(w => (w.start_time || '').slice(0, 10) === date);
        map[date] = hasMeal || hasWorkout ? 'green' : 'gray';
      }
      setMarkedDates(map);
    });
  }, [userId, currentMonth, currentYear]);

  // Cargar resumen del día seleccionado
  useEffect(() => {
    if (!userId || !selectedDate) return;

    const start = `${selectedDate}T00:00:00`;
    const end   = `${selectedDate}T23:59:59`;

    const load = async () => {
      setLoadingDay(true);
      try {
        // Objetivos del usuario
        const u = await supabase.from('users').select('kcal_target, protein_target, carbs_target, fat_target').eq('id', userId).single();
        const t = u.data;
        setTargets({
          kcal: t?.kcal_target ?? 2000,
          protein: t?.protein_target ?? 150,
          carbs: t?.carbs_target ?? 200,
          fat: t?.fat_target ?? 60,
        });

        // Comidas del día (con items)
        const mealsRes = await supabase
          .from('meals')
          .select('id, logged_at, total_kcal, total_protein, total_carbs, total_fat, meal_items(*)')
          .eq('user_id', userId)
          .gte('logged_at', start)
          .lte('logged_at', end)
          .order('logged_at', { ascending: false });

        const meals: Meal[] = (mealsRes.data as any) ?? [];
        setDayMeals(meals);

        // Totales del día
        const totals = meals.reduce(
          (acc, m) => {
            acc.kcal    += m.total_kcal || 0;
            acc.protein += m.total_protein || 0;
            acc.carbs   += m.total_carbs || 0;
            acc.fat     += m.total_fat || 0;
            return acc;
          },
          { kcal: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setDayTotals(totals);

        // Workouts del día
        const wres = await supabase
          .from('workout_sessions')
          .select('id, start_time, duration_sec, total_volume')
          .eq('user_id', userId)
          .gte('start_time', start)
          .lte('start_time', end);

        const workouts = wres.data || [];
        const sessionIds = workouts.map((w: any) => w.id);

        const seRes = sessionIds.length
          ? await supabase.from('session_exercises').select('id, session_id, exercise_id').in('session_id', sessionIds)
          : { data: [] as any[] };

        const seIds = (seRes.data || []).map((x: any) => x.id);

        const setsRes = seIds.length
          ? await supabase.from('exercise_sets').select('id, session_exercise_id, reps, weight')
              .in('session_exercise_id', seIds)
          : { data: [] as any[] };

        const exIds = (seRes.data || []).map((x: any) => x.exercise_id);
        const exRes = exIds.length
          ? await supabase.from('exercises').select('id, name').in('id', exIds)
          : { data: [] as any[] };

        // Agregados de workout
        const totalDuration = workouts.reduce((s: number, w: any) => s + (w.duration_sec || 0), 0);
        const totalVolume   = workouts.reduce((s: number, w: any) => s + (w.total_volume || 0), 0);

        const byExercise: Record<string, { name: string; sets: number; reps: number; volume: number }> = {};
        (seRes.data || []).forEach((se: any) => {
          const name = (exRes.data || []).find((e: any) => e.id === se.exercise_id)?.name || 'Exercise';
          const sets = (setsRes.data || []).filter((s: any) => s.session_exercise_id === se.id);
          if (!byExercise[name]) byExercise[name] = { name, sets: 0, reps: 0, volume: 0 };
          byExercise[name].sets   += sets.length;
          byExercise[name].reps   += sets.reduce((acc: number, s: any) => acc + (s.reps || 0), 0);
          byExercise[name].volume += sets.reduce((acc: number, s: any) => acc + ((s.weight || 0) * (s.reps || 0)), 0);
        });

        setDayExercises(Object.values(byExercise));
        setDayWorkoutStats({
          duration: totalDuration,
          volume: totalVolume,
          sets: (setsRes.data || []).length,
          exercises: Object.keys(byExercise).length,
        });
      } finally {
        setLoadingDay(false);
      }
    };

    load();
  }, [userId, selectedDate]);

  /* --------------------------- UI helpers --------------------------- */
  const sectionDate = useMemo(() => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      return d.toLocaleDateString();
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 10, paddingBottom: 32 }}>
        <CalendarView
          markedDates={markedDates}
          selectedDate={selectedDate}
          onDaySelect={setSelectedDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
        />

        {/* ------------------------ Calorie Track ------------------------ */}
        <Text style={styles.sectionTitle}>Calorie Track — {sectionDate}</Text>

        {loadingDay ? (
          <ActivityIndicator color="#10B981" style={{ marginVertical: 12 }} />
        ) : (
          <>
            {/* Rings fila */}
            <View style={styles.ringsRow}>
              <StatRing label="Calories" icon="fire"         value={dayTotals.kcal}    target={targets.kcal}    color="#10B981" />
              <StatRing label="Protein"  icon="food-drumstick" value={dayTotals.protein} target={targets.protein} color="#ef4444" />
              <StatRing label="Carbs"    icon="rice"          value={dayTotals.carbs}   target={targets.carbs}   color="#eab308" />
              <StatRing label="Fats"     icon="cheese"        value={dayTotals.fat}     target={targets.fat}     color="#f97316" />
            </View>

            {/* Meals del día */}
            <View style={styles.cardsColumn}>
              {dayMeals.length === 0 ? (
                <Text style={styles.emptyText}>No meals logged this day</Text>
              ) : (
                dayMeals.map((m) => (
                  <MealCard
                    key={m.id}
                    mealId={m.id}
                    title={(m.meal_items?.[0]?.name ?? 'Meal') + (m.meal_items && m.meal_items.length > 1 ? ` + ${m.meal_items.length - 1} more` : '')}
                    time={new Date(m.logged_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    kcal={m.total_kcal}
                    protein={m.total_protein}
                    carbs={m.total_carbs}
                    fat={m.total_fat}
                    imagePath={m.meal_items?.find(it => !!it.image_path)?.image_path ?? null}
                  />
                ))
              )}
            </View>
          </>
        )}

        {/* ----------------------- Workouts Track ----------------------- */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Workouts Track — {sectionDate}</Text>

        {loadingDay ? (
          <ActivityIndicator color="#10B981" style={{ marginVertical: 12 }} />
        ) : (
          <>
            <View style={styles.workoutStatsRow}>
              <SmallMetric label="Duration"  value={`${Math.round(dayWorkoutStats.duration / 60)} min`} />
              <SmallMetric label="Volume"    value={`${dayWorkoutStats.volume} kg`} />
              <SmallMetric label="Sets"      value={`${dayWorkoutStats.sets}`} />
              <SmallMetric label="Exercises" value={`${dayWorkoutStats.exercises}`} />
            </View>

            <View style={styles.workoutList}>
              {dayExercises.length === 0 ? (
                <Text style={styles.emptyText}>No workouts logged this day</Text>
              ) : (
                dayExercises.map((ex, i) => (
                  <View key={`${ex.name}-${i}`} style={styles.exerciseCard}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseLine}>Sets: {ex.sets}   Reps: {ex.reps}   Volume: {Math.round(ex.volume)} kg</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },

  /* Calorie Track */
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#0B0F14',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '24%',
    alignItems: 'center',
  },
  statTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 6 },
  statRing: { marginBottom: 6 },
  statValue: { color: '#E5E7EB', fontSize: 12, fontWeight: '600' },

  cardsColumn: { marginTop: 10, gap: 10 },

  /* Workouts Track */
  workoutStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  smallMetric: {
    backgroundColor: '#0B0F14',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '24%',
  },
  smallMetricLabel: { color: '#10B981', fontSize: 14, fontWeight: '700' },
  smallMetricValue: { color: '#E5E7EB', fontSize: 14, marginTop: 6, fontWeight: '700' },

  workoutList: { gap: 10 },
  exerciseCard: {
    backgroundColor: '#0B0F14',
    borderRadius: 14,
    padding: 12,
  },
  exerciseName: { color: '#E5E7EB', fontWeight: '800', marginBottom: 6 },
  exerciseLine: { color: '#9CA3AF' },

  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
