import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Play, Pause, Plus } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSetStore } from '@/store/setStore';
import { useExerciseStore } from '@/store/exerciseStore';
import colors from '@/theme/colors';

const goToPicker = () => router.push('/workout/ExercisePickerScreen');

/* tarjeta de ejercicio */
function ExerciseCard({
  title,
  setCount,
  onPress,
}: {
  title: string;
  setCount: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{setCount} sets</Text>
      </Card>
    </TouchableOpacity>
  );
}

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

  const timeStr = new Date(elapsedSec * 1000)
    .toISOString()
    .substring(11, 19);

  /* finalizar */
  const handleFinish = () => {
    Alert.alert(
      'Finish workout',
      'Are you sure you want to finish?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'destructive',
          onPress: async () => {
            await finishWorkout();
            router.replace('/workout/WorkoutSummaryScreen');
          },
        },
      ],
    );
  };

  /* datos para lista */
  const data = [
    ...sessionExercises.map((se) => ({ ...se, type: 'exercise' as const })),
    { type: 'add' as const },
  ];

  const renderItem = ({ item }: { item: (typeof data)[number] }) => {
    if (item.type === 'add') {
      return (
        <TouchableOpacity onPress={goToPicker}>
          <Card style={[styles.card, styles.addCard]}>
            <Plus color={colors.primary} size={22} />
            <Text style={styles.addTxt}>Add Exercise</Text>
          </Card>
        </TouchableOpacity>
      );
    }

    const ex = getExerciseById(item.exercise_id);
    return (
      <ExerciseCard
        title={ex?.name ?? 'Exercise'}
        setCount={getSetCountForExercise(item.id)}
        onPress={() =>
          router.push(`/workout/exercise/session/${item.id}`)
        }
      />
    );
  };

  const keyExtractor = (it: (typeof data)[number]) =>
    'id' in it ? it.id : 'add';

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
            <Pause size={20} color="#fff" />
          ) : (
            <Play size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {workout && (
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishTxt}>Finish Workout</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

/* estilos */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  timerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  timer: { fontSize: 32, fontWeight: '700', color: colors.text },
  timerBtn: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 50,
  },

  list: { paddingHorizontal: 20, paddingBottom: 80 },

  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderStyle: 'solid',
    borderColor: colors.primary,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#666666',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  cardSubtitle: { fontSize: 14, color: colors.primary, fontWeight: '700' },

  addCard: {
    borderStyle: 'solid',
    borderColor: '#FFF',
    borderWidth: 2,
    backgroundColor: '#FFFFFF'
  },
  addTxt: { fontSize: 16, color: colors.primary, fontWeight: '700' },

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
