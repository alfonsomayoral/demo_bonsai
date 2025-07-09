import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
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
import colors from '@/theme/colors';

export default function ExerciseSessionScreen() {
  const { sessionExerciseId } =
    useLocalSearchParams<{ sessionExerciseId: string }>();

  const [showPad, setShowPad] = useState(false);

  const { sets, loadSets, addSet, duplicateSet } = useSetStore();
  const { exercises } = useWorkoutStore();
  const { getExerciseById } = useExerciseStore();

  /* obtener nombre del ejercicio */
  const sessionEx = exercises.find((se) => se.id === sessionExerciseId);
  const exercise = sessionEx ? getExerciseById(sessionEx.exercise_id) : null;

  /* cargar sets una sola vez */
  useEffect(() => {
    if (sessionExerciseId) loadSets(sessionExerciseId);
  }, [sessionExerciseId]);

  /* guardar */
  const handleSave = (reps: number, weight: number) => {
    addSet(sessionExerciseId!, reps, weight);
    setShowPad(false);
  };

  /* sólo sets de este ejercicio */
  const filtered = sets.filter(
    (s) => s.session_exercise_id === sessionExerciseId,
  );

  if (!exercise) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Exercise not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={colors.primary} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exercise.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={({ item, index }) => (
            <SetCard
              set={item}
              setNumber={index + 1}
              onDuplicate={() => duplicateSet(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <ComparisonCard 
              exerciseId={exercise.id}
              sessionExerciseId={sessionExerciseId!} 
            />
          }
        />
      </SafeAreaView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowPad(true)}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      <SetPad
        visible={showPad}
        onClose={() => setShowPad(false)}
        onSave={handleSave}
      />
    </View>
  );
}

/* styles */
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
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
    left: (width - 56) / 2,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
