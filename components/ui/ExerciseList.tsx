import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  volume: number;
}

interface ExerciseListProps {
  exercises: Exercise[];
}

export const ExerciseList: React.FC<ExerciseListProps> = ({ exercises }) => {
  if (!exercises.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No workouts on this day</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {exercises.map((ex, idx) => (
        <View key={idx} style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{ex.name}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.stat}>Sets: <Text style={styles.statValue}>{ex.sets}</Text></Text>
            <Text style={styles.stat}>Reps: <Text style={styles.statValue}>{ex.reps}</Text></Text>
            <Text style={styles.stat}>Volume: <Text style={styles.statValue}>{ex.volume}</Text></Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  exerciseCard: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  exerciseName: {
    color: '#10B981',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  statValue: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  emptyText: {
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
}); 