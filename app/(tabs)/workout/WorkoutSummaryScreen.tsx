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
              <Text style={styles.statValue}>
                {formatDuration(workoutSummary.duration)}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {workoutSummary.totalVolume} kg
              </Text>
              <Text style={styles.statLabel}>Total Volume</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{workoutSummary.totalSets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{workoutSummary.totalReps}</Text>
              <Text style={styles.statLabel}>Reps</Text>
            </View>
          </View>
        </Card>

        {/* exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {workoutSummary.exercises.map((ex: SummaryExercise) => (
            <WorkoutSummaryCard key={ex.id} exercise={ex} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingBottom: 40, color: '#FFF' },

  statsCard: { padding: 20, marginBottom: 24 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: { alignItems: 'center' },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: { fontSize: 14, color: colors.textSecondary },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
});
