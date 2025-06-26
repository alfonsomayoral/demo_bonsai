import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { Routine } from '@/lib/supabase';
import { formatDuration } from '@/utils/timeUtils';

interface RoutineCarouselCardProps {
  routine: Routine;
  onPress: () => void;
}

export function RoutineCarouselCard({ routine, onPress }: RoutineCarouselCardProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={[styles.card, { backgroundColor: routine.color || '#007AFF' }]}>
        <Text style={styles.name}>{routine.name}</Text>
        {routine.last_done && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
             {formatDuration(
                (Date.now() - new Date(routine.last_done).getTime()) / 1000,
             )}{' '}
             ago
          </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 120,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});