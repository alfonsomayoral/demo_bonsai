import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SummaryExercise } from '@/store/workoutStore';
import colors from '@/theme/colors';

export function WorkoutSummaryCard({ exercise }: { exercise: SummaryExercise }) {
  const avgVol =
    exercise.reps > 0 ? Math.round(exercise.volume / exercise.reps) : 0;
  return (
    <Card style={styles.container}>
      <Text style={styles.name}>{exercise.name}</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.value}>{exercise.sets}</Text>
          <Text style={styles.label}>sets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.value}>{exercise.reps}</Text>
          <Text style={styles.label}>avg reps</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.value}>{avgVol} kg</Text>
          <Text style={styles.label}>avg volume</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', color: '#000' },
  stat: { alignItems: 'center', color: '#000', },
  value: { fontSize: 18, fontWeight: '700', color: '#000', },
  label: { fontSize: 12, color: colors.textSecondary },
});