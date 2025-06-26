import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { ExerciseSet as Set } from '@/lib/supabase';
import { formatTime } from '@/utils/timeUtils';

interface SetCardProps {
  set: Set;
  setNumber: number;
  onDuplicate: () => void;
}

export function SetCard({ set, setNumber, onDuplicate }: SetCardProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Set {setNumber} - {formatTime(set.created_at)}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.stat}>
          <Text style={[styles.value, styles.repsValue]}>{set.reps}</Text>
          <Text style={styles.label}>reps</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.value, styles.weightValue]}>{set.weight}kg</Text>
          <Text style={styles.label}>weight</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  repsValue: {
    color: '#FF9500',
  },
  weightValue: {
    color: '#34C759',
  },
  label: {
    fontSize: 12,
    color: '#8E8E93',
  },
});