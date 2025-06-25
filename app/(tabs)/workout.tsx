import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Timer, Dumbbell, TrendingUp, Play, Pause, Square, ChevronRight, RotateCcw } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NumberPad } from '@/components/ui/NumberPad';

const workoutTemplates = [
  { id: 1, name: 'Push Day', exercises: ['Bench Press', 'Shoulder Press', 'Tricep Dips'], duration: '45 min' },
  { id: 2, name: 'Pull Day', exercises: ['Pull-ups', 'Deadlifts', 'Bicep Curls'], duration: '50 min' },
  { id: 3, name: 'Leg Day', exercises: ['Squats', 'Leg Press', 'Calf Raises'], duration: '40 min' },
];

const recentExercises = [
  { id: 1, name: 'Bench Press', lastWeight: 80, lastReps: 8, lastSets: 3, sets: [
    { weight: 80, reps: 8, timestamp: '12:40 PM' },
    { weight: 80, reps: 8, timestamp: '12:38 PM' },
    { weight: 80, reps: 6, timestamp: '12:34 PM' },
  ]},
  { id: 2, name: 'Squats', lastWeight: 100, lastReps: 10, lastSets: 4, sets: [
    { weight: 100, reps: 10, timestamp: '12:28 PM' },
    { weight: 100, reps: 8, timestamp: '12:25 PM' },
    { weight: 100, reps: 8, timestamp: '12:21 PM' },
  ]},
  { id: 3, name: 'Deadlifts', lastWeight: 120, lastReps: 6, lastSets: 3, sets: [
    { weight: 120, reps: 6, timestamp: '12:31 PM' },
    { weight: 120, reps: 6, timestamp: '12:29 PM' },
  ]},
];

export default function Workout() {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  const todayStats = {
    workouts: 1,
    exercises: 6,
    volume: 2450, // kg
    duration: 52, // minutes
  };

  const startWorkout = (template) => {
    setActiveWorkout({
      ...template,
      startTime: new Date(),
      completedExercises: [],
    });
  };

  const startRestTimer = (seconds = 90) => {
    setRestTimer(seconds);
    setIsResting(true);
    
    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetLog = (weight: number, reps: number) => {
    console.log('Logged set:', { exercise: selectedExercise, weight, reps });
    setShowNumberPad(false);
    startRestTimer();
  };

  const handleRepeatSet = (exercise) => {
    const lastSet = exercise.sets[0];
    if (lastSet) {
      console.log('Repeated set:', { exercise: exercise.name, weight: lastSet.weight, reps: lastSet.reps });
      startRestTimer();
    }
  };

  if (activeWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutTitle}>{activeWorkout.name}</Text>
            <Text style={styles.workoutTime}>
              {Math.floor((new Date() - activeWorkout.startTime) / 60000)} minutes
            </Text>
          </View>
          <TouchableOpacity
            style={styles.endWorkoutButton}
            onPress={() => setActiveWorkout(null)}
          >
            <Square size={20} color="#EF4444" />
            <Text style={styles.endWorkoutText}>End</Text>
          </TouchableOpacity>
        </View>

        {isResting && (
          <View style={styles.restTimer}>
            <Timer size={24} color="#F59E0B" />
            <Text style={styles.restTimerText}>Rest: {formatTime(restTimer)}</Text>
          </View>
        )}

        <ScrollView style={styles.workoutContent}>
          {recentExercises.map((exercise) => (
            <Card key={exercise.id} variant="dark" style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.exerciseStats}>
                  <Text style={styles.statText}>Sets: {exercise.sets.length}</Text>
                  <Text style={styles.statText}>Volume: {exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0)} kg</Text>
                </View>
              </View>

              <View style={styles.setsContainer}>
                {exercise.sets.map((set, index) => (
                  <View key={index} style={styles.setRow}>
                    <Text style={styles.setTime}>{set.timestamp}</Text>
                    <Text style={styles.setReps}>{set.reps} rep</Text>
                    <Text style={styles.setWeight}>{set.weight} kg</Text>
                    <TouchableOpacity 
                      style={styles.repeatButton}
                      onPress={() => handleRepeatSet(exercise)}
                    >
                      <RotateCcw size={16} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.exerciseActions}>
                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => {
                    setSelectedExercise(exercise.name);
                    setShowNumberPad(true);
                  }}
                >
                  <Plus size={20} color="#10B981" />
                  <Text style={styles.addSetText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScrollView>

        <NumberPad
          visible={showNumberPad}
          onClose={() => setShowNumberPad(false)}
          onConfirm={handleSetLog}
          exerciseName={selectedExercise}
          initialWeight={80}
          initialReps={8}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workout</Text>
          <Text style={styles.headerDate}>Today, March 15</Text>
        </View>

        {/* Today's Stats */}
        <Card variant="dark" style={styles.statsCard}>
          <Text style={styles.statsTitle}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.workouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.exercises}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.volume}</Text>
              <Text style={styles.statLabel}>Volume (kg)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.duration}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Workout</Text>
          <View style={styles.quickActions}>
            <Button
              title="Quick Log"
              onPress={() => {
                setSelectedExercise('');
                setShowNumberPad(true);
              }}
              style={styles.quickLogButton}
            />
            <Button
              title="Empty Workout"
              onPress={() => setActiveWorkout({ name: 'Custom Workout', exercises: [], startTime: new Date() })}
              variant="outline"
              style={styles.emptyWorkoutButton}
            />
          </View>
        </View>

        {/* Templates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Templates</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {workoutTemplates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateCard}
              onPress={() => startWorkout(template)}
            >
              <Card variant="dark" style={styles.templateCardInner}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateExercises}>
                    {template.exercises.join(' • ')}
                  </Text>
                  <Text style={styles.templateDuration}>{template.duration}</Text>
                </View>
                <Play size={20} color="#10B981" />
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Exercises</Text>
          
          {recentExercises.map((exercise) => (
            <TouchableOpacity key={exercise.id} style={styles.exerciseItem}>
              <Card variant="dark" style={styles.exerciseItemInner}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseStats}>
                    Last: {exercise.lastWeight}kg × {exercise.lastReps} × {exercise.lastSets} sets
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setSelectedExercise(exercise.name);
                    setShowNumberPad(true);
                  }}
                >
                  <Plus size={20} color="#10B981" />
                </TouchableOpacity>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <NumberPad
        visible={showNumberPad}
        onClose={() => setShowNumberPad(false)}
        onConfirm={handleSetLog}
        exerciseName={selectedExercise}
        initialWeight={80}
        initialReps={8}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  statsCard: {
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLogButton: {
    flex: 1,
  },
  emptyWorkoutButton: {
    flex: 1,
  },
  templateCard: {
    marginBottom: 12,
  },
  templateCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  templateExercises: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  templateDuration: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  exerciseItem: {
    marginBottom: 12,
  },
  exerciseItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseStats: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  endWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7F1D1D',
    padding: 12,
    borderRadius: 8,
  },
  endWorkoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  restTimer: {
    backgroundColor: '#92400E',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  restTimerText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#F59E0B',
  },
  workoutContent: {
    flex: 1,
    padding: 20,
  },
  exerciseCard: {
    marginBottom: 16,
    padding: 16,
  },
  exerciseHeader: {
    marginBottom: 16,
  },
  setsContainer: {
    marginBottom: 16,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  setTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    flex: 1,
  },
  setReps: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginRight: 16,
  },
  setWeight: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
    marginRight: 16,
  },
  repeatButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseActions: {
    alignItems: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#064E3B',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  addSetText: {
    color: '#10B981',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
});