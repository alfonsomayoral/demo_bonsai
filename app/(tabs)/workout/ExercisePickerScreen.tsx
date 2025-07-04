/* filename: app/(tabs)/workout/ExercisePickerScreen.tsx */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search, Info, Plus } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { Exercise } from '@/lib/supabase';
import colors from '@/theme/colors';

export default function ExercisePickerScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { exercises, searchExercises } = useExerciseStore();
  const { addExerciseToWorkout } = useWorkoutStore();

  /* búsqueda */
  useEffect(() => {
    const id = setTimeout(() => searchExercises(searchQuery), 250);
    return () => clearTimeout(id);
  }, [searchQuery]);

  /* ------------ handlers ------------ */
  const handleAdd = async (exercise: Exercise) => {
    const sessionExerciseId = await addExerciseToWorkout(exercise.id);
    if (sessionExerciseId) {
      router.replace(`/workout/exercise/${sessionExerciseId}`); // TRACK
    }
  };

  const handleInfo = (exercise: Exercise) =>
    router.push(`/workout/exercise/${exercise.id}`); // INFO

  /* ------------ render item ------------ */
  const renderItem = ({ item }: { item: Exercise }) => (
    <Card style={styles.exerciseCard}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMuscle}>{item.muscle_group}</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={() => handleInfo(item)} style={styles.iconBtn}>
          <Info color={colors.primary} size={20} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleAdd(item)} style={[styles.iconBtn, styles.addBtn]}>
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  /* ------------ UI ------------ */
  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Exercise</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color="#8E8E93" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises…"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      </View>

      {/* list */}
      <FlatList
        data={exercises}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

/* ------------ styles ------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },

  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },

  list: { paddingHorizontal: 20, paddingBottom: 20 },

  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.card,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  exerciseMuscle: { fontSize: 14, fontStyle: 'italic', color: colors.textSecondary },

  buttons: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: { backgroundColor: colors.primary },
});
