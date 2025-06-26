import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Exercise } from '@/lib/supabase';
import { useWorkoutStore } from '@/app/store/workoutStore';
import { router } from 'expo-router';

interface ExerciseInfoModalProps {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
  canStart: boolean;
}

export function ExerciseInfoModal({
  exercise,
  visible,
  onClose,
  canStart,
}: ExerciseInfoModalProps) {
  const { addExerciseToWorkout } = useWorkoutStore();

  const handleStart = () => {
    if (exercise && canStart) {
      addExerciseToWorkout(exercise.id);
      onClose();
      router.back();
    }
  };

  if (!exercise) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{exercise.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <X color="#8E8E93" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Card style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Muscle Group</Text>
            <Text style={styles.muscleGroup}>{exercise.muscle_group}</Text>
            
            <Text style={styles.sectionTitle}>Difficulty</Text>

            {exercise.description && (
              <>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{exercise.description}</Text>
              </>
            )}
          </Card>
        </ScrollView>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.startButton, !canStart && styles.disabledButton]}
            onPress={handleStart}
            disabled={!canStart}
          >
            <Text style={[styles.buttonText, styles.startButtonText]}>
              {canStart ? 'Start' : 'No Active Workout'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.routineButton]}>
            <Text style={[styles.buttonText, styles.routineButtonText]}>
              Add to Routine
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return '#34C759';
    case 'intermediate': return '#FF9500';
    case 'advanced': return '#FF3B30';
    default: return '#8E8E93';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  muscleGroup: {
    fontSize: 14,
    color: '#8E8E93',
  },
  difficulty: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  routineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  startButtonText: {
    color: '#FFFFFF',
  },
  routineButtonText: {
    color: '#007AFF',
  },
});