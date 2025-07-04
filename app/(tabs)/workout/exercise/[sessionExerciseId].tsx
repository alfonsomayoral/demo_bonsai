import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';

import { ComparisonCard } from '@/components/workout/ComparisonCard';
import { SetCard } from '@/components/workout/SetCard';
import { SetPad } from '@/components/workout/SetPad';
import { useSetStore } from '@/store/setStore';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { ExerciseSet } from '@/lib/supabase';
import colors from '@/theme/colors';

export default function ExerciseSessionScreen() {
  const { sessionExerciseId } =
    useLocalSearchParams<{ sessionExerciseId: string }>();

  const [showPad, setShowPad] = useState(false);

  /* stores */
  const { sets, loadSets, addSet, duplicateSet } = useSetStore();
  const { exercises: sessionExercises } = useWorkoutStore();
  const { getExerciseById } = useExerciseStore();

  /* localizar la fila session_exercises y luego el ejercicio */
  const sessionEx = sessionExercises.find((se) => se.id === sessionExerciseId);
  const exercise = sessionEx ? getExerciseById(sessionEx.exercise_id) : null;

  /* cargar sets al montar */
  useEffect(() => {
    if (sessionExerciseId) loadSets(sessionExerciseId);
  }, [sessionExerciseId]);

  /*------------- handlers -------------*/
  const handleSaveSet = (reps: number, weight: number) => {
    addSet(sessionExerciseId!, reps, weight);
    setShowPad(false);
  };

  const handleDuplicate = (set: ExerciseSet) => duplicateSet(set.id);

  const renderSet = ({ item, index }: { item: ExerciseSet; index: number }) => (
    <SetCard
      set={item}
      setNumber={index + 1}
      onDuplicate={() => handleDuplicate(item)}
    />
  );

  /*------------- UI -------------*/
  if (!exercise) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Exercise not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={sets}
        renderItem={renderSet}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<ComparisonCard exerciseId={exercise.id} />}
      />

      {/* FAB add set */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowPad(true)}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      {/* número pad */}
      <SetPad
        visible={showPad}
        onClose={() => setShowPad(false)}
        onSave={handleSaveSet}
      />
    </SafeAreaView>
  );
}

/*------------- styles -------------*/
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  list: { paddingHorizontal: 20, paddingBottom: 100 },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
