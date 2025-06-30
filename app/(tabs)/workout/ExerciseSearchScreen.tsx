import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, ArrowLeft } from 'lucide-react-native';

import { useExerciseStore } from '@/store/exerciseStore';
import { useRoutineStore } from '@/store/routineStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { Exercise } from '@/lib/supabase';
import colors from '@/theme/colors';

export default function ExerciseSearchScreen() {
  const [query, setQuery] = useState('');

  const {
    exercises,
    loading,
    searchExercises,
    addExerciseToRoutine,
  } = useExerciseStore();
  const { routines } = useRoutineStore();
  const { workout, addExerciseToWorkout } = useWorkoutStore();

  /* primera carga */
  useEffect(() => {
    searchExercises('');
  }, []);

  /* debounce búsqueda */
  useEffect(() => {
    const id = setTimeout(() => searchExercises(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  /*──────── handlers ────────*/
  const goToExerciseDetail = (ex: Exercise) =>
    router.push(`/workout/exercise/${ex.id}`);

  const handleAddToRoutine = (ex: Exercise) => {
    if (!routines.length) {
      Alert.alert('No routines yet', 'Create a routine first.');
      return;
    }
    Alert.alert(
      'Add to routine',
      `Choose a routine for "${ex.name}"`,
      routines.map((rt) => ({
        text: rt.name,
        onPress: async () => {
          try {
            await addExerciseToRoutine(rt.id, ex.id);
            Alert.alert('Added', `${ex.name} added to ${rt.name}`);
          } catch (err) {
            Alert.alert('Error', 'Could not add exercise.');
          }
        },
      })),
      { cancelable: true },
    );
  };

  /*──────── item ────────*/
  const renderItem = ({ item }: { item: Exercise }) => (
    <View style={styles.item}>
      <Pressable onPress={() => goToExerciseDetail(item)} style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMuscle}>{item.muscle_group}</Text>
      </Pressable>

      <Pressable onPress={() => handleAddToRoutine(item)} style={styles.addBtn}>
        <Text style={styles.addBtnTxt}>Add to Routine</Text>
      </Pressable>
    </View>
  );

  /*──────── render ────────*/
  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Search Exercise</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search color="#8E8E93" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

/*──────── styles ────────*/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: colors.text },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 12,
  },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemMuscle: { fontSize: 13, fontStyle: 'italic', color: colors.textSecondary },
  addBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  addBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
