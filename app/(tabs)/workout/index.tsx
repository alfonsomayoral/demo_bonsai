import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Search, Filter } from 'lucide-react-native';

import ExerciseFilter from '@/components/workout/ExerciseFilter';
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
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    loadRoutines();
  }, []);

  const handleFabPress = () => {
    if (!workout) createWorkout();
    router.push('./workout/ActiveWorkoutScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* filter modal */}
      <Modal
        visible={filterOpen}
        animationType="slide"
        transparent
        statusBarTranslucent>
        <Pressable
          style={{ flex: 1, backgroundColor: '#0006' }}
          onPress={() => setFilterOpen(false)}
        />
        <ExerciseFilter
          onClose={() => {
            setFilterOpen(false);
            router.push('./workout/ExerciseSearchScreen');
          }}
        />
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* search + filter */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => router.push('./workout/ExerciseSearchScreen')}>
            <Search color="#8E8E93" size={20} />
            <Text style={styles.searchPlaceholder}>
              Search exercises...
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterOpen(true)}>
            <Filter color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* routines, recovery, progress (sin cambios) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Routines</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}>
            {routines.map((rt) => (
              <RoutineCarouselCard
                key={rt.id}
                routine={rt}
                onPress={() => router.push(`./workout/routine/${rt.id}`)}
              />
            ))}
            <TouchableOpacity
              style={styles.addRoutineCard}
              onPress={() => router.push('./workout/routine/create')}>
              <Plus color={colors.primary} size={24} />
              <Text style={styles.addRoutineText}>Add Routine</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recovery</Text>
          <MuscleAvatar />
        </View>

        <View style={styles.section}>
          <Card style={styles.progressCard}>
            <Text style={styles.cardTitle}>Progress Analysis</Text>
            <Text style={styles.cardSubtitle}>Coming soon...</Text>
          </Card>
        </View>
      </ScrollView>

      {/* fab */}
      <TouchableOpacity
        style={[styles.fab, workout && styles.fabActive]}
        onPress={handleFabPress}>
        {workout ? (
          <View style={styles.fabContent}>
            <Text style={styles.fabTimer}>
              {formatDuration(elapsedSec)}
            </Text>
            <Text style={styles.fabLabel}>Resume</Text>
          </View>
        ) : (
          <Plus color="#FFFFFF" size={24} />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/*──────── styles ────────*/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 20 },
  title: { fontSize: 34, fontWeight: 'bold', color: colors.text },

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

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  carousel: { paddingRight: 16, gap: 14 },

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
  addRoutineText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },

  progressCard: { height: 120, justifyContent: 'center' },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary },

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
  },
  fabActive: { width: 120, height: 60, borderRadius: 30 },
  fabContent: { alignItems: 'center' },
  fabTimer: { color: colors.text, fontSize: 16, fontWeight: '600' },
  fabLabel: { color: colors.text, fontSize: 12 },
});
