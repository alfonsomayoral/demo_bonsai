/* components/workout/SetCard.tsx */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card } from '@/components/ui/Card';
import { ExerciseSet as Set } from '@/lib/supabase';
import { formatTime } from '@/utils/timeUtils';
import { useSetStore } from '@/store/setStore';

interface SetCardProps {
  set: Set;
  setNumber: number;
  onDuplicate: () => void;
}

export function SetCard({ set, setNumber }: SetCardProps) {
  const toggleSetFailure = useSetStore((s) => s.toggleSetFailure);
  const isFailed = !!set.failure;

  return (
    <Card
      style={[
        styles.container,
        isFailed ? styles.failedBorder : ({} as ViewStyle), // ← evita `undefined` en el array
      ]}
    >
      {/* cabecera */}
      <Text style={styles.title}>
        Set {setNumber} – {formatTime(set.created_at)}
      </Text>

      {/* fila principal */}
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.reps}>{set.reps} reps</Text>
          <Text style={styles.weight}>{set.weight} kg</Text>
        </View>

        {/* botón de fallo */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isFailed ? 'Unmark failure' : 'Mark as failure'}
          onPress={() => toggleSetFailure(set.id)}
          style={[
            styles.failButton,
            { backgroundColor: isFailed ? '#FF3B30' : '#000000' },
          ]}
        >
          <MaterialCommunityIcons name="weight-lifter" size={20} color="#fff" />
        </TouchableOpacity>
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
  failedBorder: {
    borderWidth: 3,
    borderColor: '#FF3B30',
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  reps: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500',
  },
  weight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  failButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
