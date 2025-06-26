import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, CreditCard as Edit } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { useRoutineStore } from '@/store/routineStore';
import { useWorkoutStore } from '@/store/workoutStore';
import colors from '@/theme/colors';

export default function RoutineDetailScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const { routines } = useRoutineStore();
  const { createWorkout } = useWorkoutStore();
  
  const routine = routines.find(r => r.id === routineId);

  const handleStartRoutine = async () => {
    await createWorkout();
    router.push('/workout/ActiveWorkoutScreen');
  };

  const handleEditRoutine = () => {
    router.push(`./workout/routine/edit/${routineId}`);
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#007AFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Routine Not Found</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#007AFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{routine.name}</Text>
        <TouchableOpacity onPress={handleEditRoutine}>
          <Edit color="#007AFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Card style={styles.routineCard}>
          <Text style={styles.routineName}>{routine.name}</Text>
          <Text style={styles.routineDescription}>
            This routine contains exercises for a complete workout.
          </Text>
        </Card>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartRoutine}
        >
          <Text style={styles.startButtonText}>Start Routine</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => router.push('/workout/ExerciseSearchScreen')}
        >
          <Plus color="#007AFF" size={20} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  routineCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: colors.card,
  },
  routineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  routineDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    gap: 8,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});