import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { SessionExercise } from '@/lib/supabase';
import { useSetStore } from '@/app/store/setStore';

interface Props {
  exercise: SessionExercise;
  onPress: () => void;
}

export function ActiveExerciseCard({ exercise, onPress }: Props) {
  const setCount = useSetStore((s) =>
    s.getSetCountForExercise(exercise.id),
  );

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{exercise.name ?? 'Exercise'}</Text>
          <Text style={styles.setCount}>{setCount} sets</Text>
        </View>
        <Text style={styles.muscle}>{exercise.muscle_group ?? '-'}</Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000', // ajusta al tema si lo deseas
    flex: 1,
  },
  setCount: {
    fontSize: 14,
    color: '#007AFF', // cambia al verde primario si has creado el hook de tema
    fontWeight: '500',
  },
  muscle: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
