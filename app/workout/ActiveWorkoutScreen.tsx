import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { TimerCard } from '@/components/workout/TimerCard';
import { ActiveExerciseCard } from '@/components/workout/ActiveExerciseCard';
import { useWorkoutStore } from '@/app/store/workoutStore';
import { SessionExercise } from '@/lib/supabase';

export default function ActiveWorkoutScreen() {
  const { 
    workout, 
    exercises, 
    finishWorkout, 
    pauseWorkout,
    resumeWorkout,
    running,
  } = useWorkoutStore();

  const handleFinishWorkout = () => {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'destructive',
          onPress: () => {
            finishWorkout();
            router.push('../WorkoutSummaryScreen');
          },
        },
      ]
    );
  };

  const handleAddExercise = () => {
    router.push('../ExercisePickerScreen');
  };

  const handleExercisePress = (exercise:  SessionExercise ) => {
    router.push(`../exercise/${exercise.id}`);
  };

  const renderExerciseItem = ({ item }: { item: SessionExercise }) => (
    <ActiveExerciseCard
      exercise={item}
      onPress={() => handleExercisePress(item)}
    />
  );

  const renderAddExerciseCard = () => (
    <TouchableOpacity style={styles.addExerciseCard} onPress={handleAddExercise}>
      <Plus color="#007AFF" size={32} />
      <Text style={styles.addExerciseText}>Add Exercise</Text>
      <Text style={styles.addExerciseSubtext}>Start by adding your first exercise</Text>
    </TouchableOpacity>
  );

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No active workout</Text>
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
        <Text style={styles.title}>Active Workout</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <FlatList
        data={exercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderAddExerciseCard}
        ListHeaderComponent={
          exercises.length > 0 ? (
            <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
              <Plus color="#007AFF" size={20} />
              <Text style={styles.addButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Timer Card */}
      <TimerCard
        onPause={pauseWorkout}
        onResume={resumeWorkout}
        onFinish={handleFinishWorkout}
        isPaused={running}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    color: '#000000',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  addExerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  addExerciseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 16,
  },
  addExerciseSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});