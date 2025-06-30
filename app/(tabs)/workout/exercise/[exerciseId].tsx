import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { useExerciseStore } from '@/store/exerciseStore';
import { useRoutineStore } from '@/store/routineStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { Exercise } from '@/lib/supabase';
import colors from '@/theme/colors';

/* «mode» distingue INFO ↔ TRACK */
type Mode = 'INFO' | 'TRACK';

export default function ExerciseDetailScreen() {
  const { exerciseId, mode: routeMode } =
    useLocalSearchParams<{ exerciseId: string; mode?: Mode }>();
  const mode: Mode = routeMode === 'TRACK' ? 'TRACK' : 'INFO';

  const { getExerciseById, addExerciseToRoutine } = useExerciseStore();
  const { routines } = useRoutineStore();
  const { workout, addExerciseToWorkout } = useWorkoutStore();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  /* carga ejercicio */
  useEffect(() => {
    const local = getExerciseById(exerciseId);
    if (local) {
      setExercise(local);
      setLoading(false);
    } else {
      (async () => {
        const { data } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', exerciseId)
          .single();
        setExercise(data as Exercise | null);
        setLoading(false);
      })();
    }
  }, [exerciseId]);

  /*──────── helpers ────────*/
  const addToRoutine = () => {
    if (!routines.length) {
      Alert.alert('No routines yet', 'Create a routine first.');
      return;
    }
    Alert.alert(
      'Add to routine',
      `Choose a routine for "${exercise?.name}"`,
      routines.map((rt) => ({
        text: rt.name,
        onPress: async () => {
          try {
            await addExerciseToRoutine(rt.id, exerciseId);
            Alert.alert('Added', `${exercise?.name} → ${rt.name}`);
          } catch {
            Alert.alert('Error', 'Could not add.');
          }
        },
      })),
    );
  };

  const addToWorkout = async () => {
    if (!workout) {
      Alert.alert('Start a workout first');
      return;
    }
    await addExerciseToWorkout(exerciseId);
    /* Abre la pantalla de tracking (ya existente) */
    router.push(`/workout/ExerciseSessionScreen?exerciseId=${exerciseId}`);
  };

  /*──────── render ────────*/
  if (loading || !exercise) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  /* INFO mode */
  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>{exercise.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* details */}
      <View style={styles.info}>
        <Text style={styles.label}>Muscle group</Text>
        <Text style={styles.value}>{exercise.muscle_group}</Text>

        <Text style={styles.label}>Difficulty</Text>
        <Text style={styles.value}>{exercise.difficulty ?? '—'}</Text>

        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{exercise.description ?? '—'}</Text>
      </View>

      {/* buttons */}
      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={addToRoutine}>
          <Text style={styles.btnTxt}>Add to Routine</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={addToWorkout}>
          <Text style={styles.btnTxt}>Add to Workout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/*──────── styles ────────*/
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  info: { paddingHorizontal: 20, gap: 6 },
  label: { fontSize: 12, color: colors.textSecondary },
  value: { fontSize: 15, color: colors.text, marginBottom: 8 },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  btn: {
    backgroundColor: colors.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnTxt: { color: '#fff', fontWeight: '600' },
});
