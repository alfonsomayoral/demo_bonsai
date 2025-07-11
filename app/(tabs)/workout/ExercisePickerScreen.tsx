import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search, Info, Plus, Filter } from 'lucide-react-native';

import ExerciseFilter from '@/components/workout/ExerciseFilter';
import { Card } from '@/components/ui/Card';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { Exercise } from '@/lib/supabase';
import colors from '@/theme/colors';

export default function ExercisePickerScreen() {
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const {
    exercises,
    loading,
    searchExercises,
    muscles,
    levels,
  } = useExerciseStore();
  const { createWorkout, addExerciseToWorkout } = useWorkoutStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  /* initial & filter change */
  useEffect(() => {
    searchExercises(query.trim());
  }, [muscles, levels]);

  /* text debounce */
  useEffect(() => {
    const id = setTimeout(() => searchExercises(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const handleAdd = async (ex: Exercise) => {
    setLoadingId(ex.id);
    try {
      if (!useWorkoutStore.getState().workout) await createWorkout();
      const sid = await addExerciseToWorkout({
        id: ex.id,
        name: ex.name,
        muscle_group: ex.muscle_group,
      });
      if (!sid) throw new Error();
      router.replace(`/workout/exercise/session/${sid}`);
    } catch {
      alert('Error adding exercise');
    } finally {
      setLoadingId(null);
    }
  };

  const renderItem = ({ item }: { item: Exercise }) => (
    <Card style={styles.exerciseCard}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMuscle}>{item.muscle_group}</Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={() => router.push(`/workout/exercise/${item.id}`)}
          style={styles.iconBtn}>
          <Info color={colors.primary} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleAdd(item)}
          style={[styles.iconBtn, styles.addBtn]}
          disabled={loadingId === item.id}>
          {loadingId === item.id ? (
            <ActivityIndicator size={16} color="#fff" />
          ) : (
            <Plus color="#fff" size={20} />
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* modal filter */}
      <Modal
        visible={filterOpen}
        animationType="slide"
        transparent
        statusBarTranslucent>
        <Pressable
          style={{ flex: 1, backgroundColor: '#0006' }}
          onPress={() => setFilterOpen(false)}
        />
        <ExerciseFilter onClose={() => setFilterOpen(false)} />
      </Modal>

      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Exercise</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* search row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search color="#8E8E93" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterOpen(true)}>
          <Filter color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

/* styles igual que antes, con filterBtn añadido */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  filterBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },

  list: { paddingHorizontal: 20, paddingVertical: 20 },
  exerciseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#333',
    marginBottom: 12,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
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
