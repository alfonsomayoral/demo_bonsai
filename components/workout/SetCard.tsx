import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ExerciseSet as Set } from '@/lib/supabase';
import { formatTime } from '@/utils/timeUtils';

interface SetCardProps {
  set: Set;
  setNumber: number;
  onDuplicate: () => void;
}

export function SetCard({ set, setNumber }: SetCardProps) {
  return (
    <Card style={styles.container}>
      {/* cabecera opcional */}
      <Text style={styles.title}>
        Set {setNumber} – {formatTime(set.created_at)}
      </Text>

      {/* fila principal */}
      <View style={styles.row}>
        <Text style={styles.reps}>{set.reps} reps</Text>
        <Text style={styles.weight}>{set.weight} kg</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },

  /* nueva distribución: izquierda / derecha */
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reps: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500', // naranja ≙ reps
  },
  weight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759', // verde ≙ peso
  },
});
