import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { ExerciseSet as ExerciseSummary } from '@/lib/supabase';

interface WorkoutSummaryCardProps {
  exercise: ExerciseSummary;
}

export function WorkoutSummaryCard({ exercise }: WorkoutSummaryCardProps) {
  return (
    <Card style={styles.container}>
      <Text style={styles.name}>{exercise.name}</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{exercise.sets}</Text>
          <Text style={styles.statLabel}>sets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{exercise.reps}</Text>
          <Text style={styles.statLabel}>reps</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{exercise.volume}kg</Text>
          <Text style={styles.statLabel}>volume</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
});