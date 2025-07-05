import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
  /* ---------- stores ---------- */
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { exercises, loading, searchExercises } = useExerciseStore();
  const { createWorkout, addExerciseToWorkout } = useWorkoutStore();

  const [loadingId, setLoadingId] = useState<string | null>(null);

  /* ---------- efectos ---------- */
  /* 1. traer lista completa al montar */
  useEffect(() => {
    searchExercises('');
  }, []);

  /* 2. filtrar en tiempo real */
  useEffect(() => {
    if (searchQuery.trim()) searchExercises(searchQuery.trim());
    else searchExercises(''); // ← muestra todo si input vacío
  }, [searchQuery]);

  /* ---------- helpers ---------- */
  const handleAdd = async (ex: Exercise) => {
    setLoadingId(ex.id);

    try {
      /* crea sesión si no existe */
      if (!useWorkoutStore.getState().workout) await createWorkout();

      /* inserta / recupera id de session_exercises */
      const sessId = await addExerciseToWorkout({
        id: ex.id,
        name: ex.name,
        muscle_group: ex.muscle_group,
      });

      if (!sessId) throw new Error('Could not add exercise');
      router.replace(`/workout/exercise/session/${sessId}`);
    } catch (e) {
      console.error(e);
      alert('Error adding exercise');
    } finally {
      setLoadingId(null);
    }
  };

  const handleInfo = (ex: Exercise) => router.push(`/workout/exercise/${ex.id}`);

  /* ---------- render ---------- */
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

        <TouchableOpacity
          onPress={() => handleAdd(item)}
          style={[styles.iconBtn, styles.addBtn]}
          disabled={loadingId === item.id}
        >
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
          />
        </View>
      </View>

      {/* list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyTxt}>No exercises found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */
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

  searchContainer: { paddingHorizontal: 20, marginTop: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  list: { paddingHorizontal: 20, paddingVertical: 20 },
  emptyTxt: { textAlign: 'center', marginTop: 24, color: colors.textSecondary },

  exerciseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#333333',
    marginBottom: 12,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  exerciseMuscle: { fontSize: 13, fontStyle: 'italic', color: colors.textSecondary },

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
