import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Search, Filter } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { RoutineCarouselCard } from '@/components/workout/RoutineCarouselCard';
import { MuscleAvatar } from '@/components/workout/MuscleAvatar';
import { useWorkoutStore } from '@/store/workoutStore';
import { useRoutineStore } from '@/store/routineStore';
import { formatDuration } from '@/utils/timeUtils';
import colors from '@/theme/colors';

export default function WorkoutTab() {
  const { workout, createWorkout, elapsedSec } = useWorkoutStore();
  const { routines, loadRoutines } = useRoutineStore();

  /* ───── Cargar rutinas una sola vez ───── */
  useEffect(() => {
    loadRoutines();
  }, []);

  /* ───── Fab main ───── */
  const handleFabPress = () => {
    if (workout) {
      router.push('/workout/ActiveWorkoutScreen');
    } else {
      createWorkout();
      router.push('/workout/ActiveWorkoutScreen');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Workout</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => router.push('/workout/ExerciseSearchScreen')}
          >
            <Search color="#8E8E93" size={20} />
            <Text style={styles.searchPlaceholder}>Search exercises...</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Filter color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Routine Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Routines</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {routines.map((routine) => (
              <RoutineCarouselCard
                key={routine.id}
                routine={routine}
                onPress={() =>
                  router.push(`/workout/routine/${routine.id}`)
                }
              />
            ))}

            <TouchableOpacity
              style={styles.addRoutineCard}
              onPress={() => router.push('/workout/routine/create')}
            >
              <Plus color={colors.primary} size={24} />
              <Text style={styles.addRoutineText}>Add Routine</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Muscle Avatar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recovery</Text>
          <MuscleAvatar />
        </View>

        {/* Progress Analysis */}
        <View style={styles.section}>
          <Card style={styles.progressCard}>
            <Text style={styles.cardTitle}>Progress Analysis</Text>
            <Text style={styles.cardSubtitle}>Coming soon...</Text>
          </Card>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, workout && styles.fabActive]}
        onPress={handleFabPress}
      >
        {workout ? (
          <View style={styles.fabContent}>
            <Text style={styles.fabTimer}>{formatDuration(elapsedSec)}</Text>
            <Text style={styles.fabLabel}>Resume</Text>
          </View>
        ) : (
          <Plus color="#FFFFFF" size={24} />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  title: { fontSize: 34, fontWeight: 'bold', color: colors.text },

  /* Search */
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchPlaceholder: { color: colors.textSecondary, fontSize: 16 },
  filterButton: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Sections */
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 22, fontWeight: '600', color: colors.text, marginBottom: 16 },
  carousel: { paddingRight: 20, gap: 16 },

  /* Routine addition */
  addRoutineCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    height: 120,
    gap: 8,
  },
  addRoutineText: { color: colors.primary, fontSize: 14, fontWeight: '500' },

  /* Placeholder card */
  progressCard: { height: 120, justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabActive: { width: 120, height: 60, borderRadius: 30 },
  fabContent: { alignItems: 'center' },
  fabTimer: { color: colors.text, fontSize: 16, fontWeight: '600' },
  fabLabel: { color: colors.text, fontSize: 12 },
});
