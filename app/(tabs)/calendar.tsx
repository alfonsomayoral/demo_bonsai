import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { CalendarView } from '@/components/ui/CalendarView';
import { DaySummary } from '@/components/ui/DaySummary';

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return [start, end];
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function CalendarScreen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [markedDates, setMarkedDates] = useState<{ [date: string]: 'green' | 'gray' }>({});
  const [summary, setSummary] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Fetch data for the month
  useEffect(() => {
    if (!userId) return;
    const [start, end] = getMonthRange(currentYear, currentMonth);
    const startStr = formatDate(start);
    const endStr = formatDate(end);

    // Fetch meals and workouts for the month
    Promise.all([
      supabase.from('meals').select('*').eq('user_id', userId).gte('logged_at', startStr).lte('logged_at', endStr),
      supabase.from('workout_sessions').select('*').eq('user_id', userId).gte('start_time', startStr).lte('start_time', endStr),
    ]).then(([mealsRes, workoutsRes]) => {
      const meals = mealsRes.data || [];
      const workouts = workoutsRes.data || [];
      // Mark days
      const days: { [date: string]: 'green' | 'gray' } = {};
      for (let d = 1; d <= end.getDate(); d++) {
        const date = formatDate(new Date(currentYear, currentMonth, d));
        const hasMeal = meals.some((m: any) => m.logged_at.slice(0, 10) === date);
        const hasWorkout = workouts.some((w: any) => w.start_time.slice(0, 10) === date);
        days[date] = hasMeal || hasWorkout ? 'green' : 'gray';
      }
      setMarkedDates(days);
    });
  }, [userId, currentMonth, currentYear]);

  // Fetch summary for selected day
  useEffect(() => {
    if (!userId || !selectedDate) return;
    // Fetch meals for the day
    Promise.all([
      supabase.from('meals').select('*').eq('user_id', userId).gte('logged_at', selectedDate).lte('logged_at', selectedDate + 'T23:59:59'),
      supabase.from('meal_items').select('*').in('meal_id', []), // placeholder, will update after meals
      supabase.from('workout_sessions').select('*').eq('user_id', userId).gte('start_time', selectedDate).lte('start_time', selectedDate + 'T23:59:59'),
      supabase.from('session_exercises').select('*').in('session_id', []), // placeholder
      supabase.from('exercise_sets').select('*').in('session_exercise_id', []), // placeholder
      supabase.from('exercises').select('*').eq('user_id', userId),
    ]).then(async ([mealsRes, mealItemsRes, workoutsRes, sessionExRes, setExRes, exercisesRes]) => {
      const meals = mealsRes.data || [];
      // Fetch meal items for these meals
      const mealIds = meals.map((m: any) => m.id);
      const mealItems = mealIds.length
        ? (await supabase.from('meal_items').select('*').in('meal_id', mealIds)).data || []
        : [];
      // Aggregate macros
      let kcal = 0, protein = 0, carbs = 0, fat = 0;
      meals.forEach((m: any) => {
        kcal += m.total_kcal;
        protein += m.total_protein;
        carbs += m.total_carbs;
        fat += m.total_fat;
      });
      // Meals summary
      const mealSummaries = meals.map((m: any) => ({
        name: m.source_method.charAt(0).toUpperCase() + m.source_method.slice(1) + ' meal',
        kcal: m.total_kcal,
        protein: m.total_protein,
        carbs: m.total_carbs,
        fat: m.total_fat,
      }));
      // Fetch workouts for the day
      const workouts = workoutsRes.data || [];
      const sessionIds = workouts.map((w: any) => w.id);
      // Fetch session_exercises and sets
      const sessionExercises = sessionIds.length
        ? (await supabase.from('session_exercises').select('*').in('session_id', sessionIds)).data || []
        : [];
      const sessionExerciseIds = sessionExercises.map((se: any) => se.id);
      const exerciseSets = sessionExerciseIds.length
        ? (await supabase.from('exercise_sets').select('*').in('session_exercise_id', sessionExerciseIds)).data || []
        : [];
      const exercises = exercisesRes.data || [];
      // Aggregate exercises
      const exerciseMap: { [id: string]: any } = {};
      sessionExercises.forEach((se: any) => {
        const ex = exercises.find((e: any) => e.id === se.exercise_id);
        if (!ex) return;
        if (!exerciseMap[ex.name]) exerciseMap[ex.name] = { name: ex.name, sets: 0, reps: 0, volume: 0 };
        const sets = exerciseSets.filter((s: any) => s.session_exercise_id === se.id);
        exerciseMap[ex.name].sets += sets.length;
        exerciseMap[ex.name].reps += sets.reduce((sum: number, s: any) => sum + s.reps, 0);
        exerciseMap[ex.name].volume += sets.reduce((sum: number, s: any) => sum + (s.weight * s.reps), 0);
      });
      const exerciseList = Object.values(exerciseMap);
      // Fetch user targets
      const user = (await supabase.from('users').select('*').eq('id', userId).single()).data;
      setSummary({
        kcal,
        kcalTarget: user?.kcal_target || 2000,
        protein,
        proteinTarget:  user?.protein_target || 150,
        carbs,
        carbsTarget: user?.carbs_target || 200,
        fat,
        fatTarget: user?.fat_target || 60,
        meals: mealSummaries,
        exercises: exerciseList,
      });
    });
  }, [userId, selectedDate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 8 }}>
        <CalendarView
          markedDates={markedDates}
          selectedDate={selectedDate}
          onDaySelect={setSelectedDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
        />
        {summary ? (
          <DaySummary {...summary} />
        ) : (
          <Text style={styles.emptyText}>No data for this day</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  emptyText: {
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
}); 