import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Pause, Play, Square } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { useWorkoutStore } from '@/store/workoutStore';
import { formatDuration } from '@/utils/timeUtils';

interface TimerCardProps {
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  isPaused: boolean;
}

export function TimerCard({ onPause, onResume, onFinish, isPaused }: TimerCardProps) {
  const { elapsedSec } = useWorkoutStore();

  return (
    <Card style={styles.container}>
      <Text style={styles.timer}>{formatDuration(elapsedSec)}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={isPaused ? onResume : onPause}
        >
          {isPaused ? (
            <Play color="#007AFF" size={20} />
          ) : (
            <Pause color="#007AFF" size={20} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          onPress={onFinish}
        >
          <Square color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
});