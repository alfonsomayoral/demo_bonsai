import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { WorkoutSummaryCard } from '@/components/workout/WorkoutSummaryCard';
import { useWorkoutStore, SummaryExercise } from '@/store/workoutStore';
import { formatDuration } from '@/utils/timeUtils';
import colors from '@/theme/colors';

export default function WorkoutSummaryScreen() {
  const { workoutSummary } = useWorkoutStore();

  const handleClose = () => router.back();

  if (!workoutSummary) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No workout data available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workout Complete</Text>
        <TouchableOpacity onPress={handleClose}>
          <X color="#8E8E93" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* summary stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue1}>
                {formatDuration(workoutSummary.duration)}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue2}>
                {workoutSummary.totalVolume} kg
              </Text>
              <Text style={styles.statLabel}>Total Volume</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue3}>{workoutSummary.totalSets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue4}>
                {workoutSummary.totalExercises}
              </Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
          </View>
        </Card>

        {/* exercises list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {workoutSummary.exercises.map((ex: SummaryExercise) => (
            <WorkoutSummaryCard key={ex.sessionExerciseId} exercise={ex} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  statsCard: { padding: 20, marginBottom: 24, borderWidth: 2, borderColor: colors.primary, borderRadius: 16, backgroundColor: '#444' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: { alignItems: 'center' },
  statValue1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#32C5FF',
    marginBottom: 4,
  },
  statValue2: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.primary,
  },
  statValue3: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF2D8A',
    marginBottom: 4,
  },
  statValue4: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 4,
  },
  statLabel: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
});
