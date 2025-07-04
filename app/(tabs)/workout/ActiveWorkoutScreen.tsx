import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Play, Pause, Plus } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSetStore } from '@/store/setStore';
import { useExerciseStore } from '@/store/exerciseStore';
import { SessionExercise } from '@/lib/supabase';
import colors from '@/theme/colors';

/* ───────────────────────── helpers ───────────────────────── */
const goToPicker = () => router.push('/workout/ExercisePickerScreen');

/* Card que solo necesita título y nº de sets */
const ExerciseCard = ({
  title,
  setCount,
  onPress,
}: {
  title: string;
  setCount: number;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress}>
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{setCount} sets</Text>
    </Card>
  </TouchableOpacity>
);

/* ───────────────────────── component ─────────────────────── */
export default function ActiveWorkoutScreen() {
  const {
    workout,
    exercises: sessionExercises,
    elapsedSec,
    running,
    pauseWorkout,
    resumeWorkout,
    finishWorkout,
  } = useWorkoutStore();

  const { getSetCountForExercise } = useSetStore();
  const { getExerciseById } = useExerciseStore();

  /* limpiar cronómetro al salir */
  useEffect(() => () => pauseWorkout(), []);

  /* hh:mm:ss */
  const timeStr = new Date(elapsedSec * 1000).toISOString().substring(11, 19);

  /* render de cada elemento */
  const renderItem = ({ item }: { item: SessionExercise }) => {
    const exercise = getExerciseById(item.exercise_id);
    const title = exercise?.name ?? 'Exercise';
    return (
      <ExerciseCard
        title={title}
        setCount={getSetCountForExercise(item.id)}
        onPress={() => router.push(`/workout/exercise/${item.id}`)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* cronómetro */}
      <View style={styles.timerWrap}>
        <Text style={styles.timer}>{timeStr}</Text>
        <TouchableOpacity
          style={styles.timerBtn}
          onPress={running ? pauseWorkout : resumeWorkout}
        >
          {running ? (
            <Pause color="#fff" size={18} />
          ) : (
            <Play color="#fff" size={18} />
          )}
        </TouchableOpacity>
      </View>

      {/* lista ejercicios */}
      <FlatList
        data={sessionExercises}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <TouchableOpacity onPress={goToPicker}>
            <Card style={[styles.card, styles.addCard]}>
              <Plus color={colors.primary} size={22} />
              <Text style={styles.addTxt}>Add Exercise</Text>
            </Card>
          </TouchableOpacity>
        }
      />

      {/* terminar */}
      {workout && (
        <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}>
          <Text style={styles.finishTxt}>Finish Workout</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

/* ───────────────────────── styles ───────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  /* timer */
  timerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  timer: { fontSize: 32, fontWeight: '700', color: colors.text },
  timerBtn: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 50,
  },

  /* list */
  list: { paddingHorizontal: 20, paddingBottom: 80 },

  /* card */
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary },

  /* add card */
  addCard: { justifyContent: 'center', gap: 8 },
  addTxt: { fontSize: 15, color: colors.primary, fontWeight: '600' },

  /* finish */
  finishBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
