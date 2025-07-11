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

import { supabase, Exercise } from '@/lib/supabase';
import { useExerciseStore } from '@/store/exerciseStore';
import { useRoutineStore } from '@/store/routineStore';
import { useWorkoutStore } from '@/store/workoutStore';
import colors from '@/theme/colors';

export default function ExerciseInfoScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  /* stores */
  const { getExerciseById, addExerciseToRoutine } = useExerciseStore();
  const { routines } = useRoutineStore();
  const { createWorkout, addExerciseToWorkout } = useWorkoutStore();

  /* local UI state */
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  /* ───── carga del ejercicio (caché → Supabase) ───── */
  useEffect(() => {
    const cached = getExerciseById(exerciseId);
    if (cached) {
      setExercise(cached);
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();
      if (error) Alert.alert('Error', 'Could not load exercise.');
      setExercise(data as Exercise | null);
      setLoading(false);
    })();
  }, [exerciseId]);

  /* ───── acciones ───── */
  const handleAddToRoutine = () => {
    if (!exercise || !routines.length) {
      Alert.alert('No routines', 'Create a routine first.');
      return;
    }

    Alert.alert(
      'Add to routine',
      `Choose a routine for "${exercise.name}"`,
      routines.map((rt) => ({
        text: rt.name,
        onPress: async () => {
          try {
            await addExerciseToRoutine(rt.id, exercise.id);
            Alert.alert('Success', 'Exercise added to routine.');
          } catch {
            Alert.alert('Error', 'Could not add exercise.');
          }
        },
      })),
      { cancelable: true },
    );
  };

  const handleAddToWorkout = async () => {
    if (!exercise) return;
    setAdding(true);

    /* Aseguramos que hay workout */
    if (!useWorkoutStore.getState().workout) {
      try {
        await createWorkout();
      } catch {
        setAdding(false);
        Alert.alert('Error', 'Could not start workout.');
        return;
      }
    }

    /* Añadimos / recuperamos ejercicio en la sesión */
    const sessId = await addExerciseToWorkout({
      id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
    });

    if (!sessId) {
      setAdding(false);
      Alert.alert('Error', 'Could not add exercise.');
      return;
    }

    setAdding(false);
    router.replace(`/workout/exercise/session/${sessId}`);
  };

  /* ───── render ───── */
  if (loading || !exercise) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

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

      {/* info */}
      <View style={styles.info}>
        <Text style={styles.label}>Muscle group:</Text>
        <Text style={styles.value}>{exercise.muscle_group}</Text>

        {!!exercise.description && (
          <>
            <Text style={[styles.label, { marginTop: 12 }]}>Description:</Text>
            <Text style={styles.value}>{exercise.description}</Text>
          </>
        )}
      </View>

      {/* actions */}
      <View style={styles.actions}>
        <Pressable style={styles.btn} onPress={handleAddToRoutine}>
          <Text style={styles.btnTxt}>Add to Routine</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={handleAddToWorkout}
          disabled={adding}
        >
          <Text style={styles.btnTxt}>Add to Workout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ───── estilos ───── */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  info: { paddingHorizontal: 20, marginTop: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  value: { fontSize: 15, color: colors.text, marginTop: 2 },
  actions: { marginTop: 32, paddingHorizontal: 20, gap: 12 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
