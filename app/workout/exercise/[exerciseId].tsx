import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { ComparisonCard } from '@/components/workout/ComparisonCard';
import { SetCard } from '@/components/workout/SetCard';
import { SetPad } from '@/components/workout/SetPad';

import { useSetStore } from '@/app/_store/setStore';
import { useExerciseStore } from '@/app/_store/exerciseStore';
import { ExerciseSet } from '@/lib/supabase';

export default function ExerciseDetailScreen() {
  /** en realidad recibimos el ID de session_exercises */
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  const [showSetPad, setShowSetPad] = useState(false);

  const {
    sets,
    loadSetsForExercise,
    addSet,
    duplicateSet,
  } = useSetStore();

  const { getExerciseById } = useExerciseStore();
  const exercise = getExerciseById(exerciseId!); // puede ser null offline

  /* carga de sets */
  useEffect(() => {
    if (exerciseId) loadSetsForExercise(exerciseId);
  }, [exerciseId]);

  const handleAddSet = (reps: number, weight: number) => {
    addSet(exerciseId!, reps, weight);
    setShowSetPad(false);
  };

  const handleDuplicateSet = (set: ExerciseSet) => duplicateSet(set.id);

  const renderSetItem = ({
    item,
    index,
  }: {
    item: ExerciseSet;
    index: number;
  }) => (
    <SetCard
      set={item}
      setNumber={index + 1}
      onDuplicate={() => handleDuplicateSet(item)}
    />
  );

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Exercise not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#007AFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{exercise.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <FlatList
        data={sets}
        renderItem={renderSetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<ComparisonCard exerciseId={exerciseId!} />}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowSetPad(true)}>
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>

      {/* Set Pad Modal */}
      <SetPad
        visible={showSetPad}
        onClose={() => setShowSetPad(false)}
        onSave={handleAddSet}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#000' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#007AFF', // cámbialo a tu color primario
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});
