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
          <Text style={styles.value1}>{exercise.sets}</Text>
          <Text style={styles.label}>sets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.value2}>{exercise.reps}</Text>
          <Text style={styles.label}>avg reps</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.value3}>{avgVol} kg</Text>
          <Text style={styles.label}>avg volume</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {  marginBottom: 13, borderWidth: 0, borderColor: colors.primary, borderRadius: 14, backgroundColor: '#666' },
  name: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 6 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', color: '#000' },
  stat: { alignItems: 'center', color: '#000', },
  value1: { fontSize: 18, fontWeight: '700', color: '#FF2D8A', },
  value2: { fontSize: 18, fontWeight: '700', color: '#FFB347', },
  value3: { fontSize: 18, fontWeight: '700', color: colors.primary, },
  label: { fontSize: 12, color: '#FFF', fontWeight: 'bold'  },
})