import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Filter, Search } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { ExerciseInfoModal } from '@/components/workout/ExerciseInfoModal';
import { FilterBottomSheet } from '@/components/workout/FilterBottomSheet';
import { useExerciseStore } from '@/app/_store/exerciseStore';
import { useWorkoutStore } from '@/app/_store/workoutStore';
import { Exercise } from '@/lib/supabase';

export default function ExerciseSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]); 
  const { exercises, searchExercises, loading } = useExerciseStore();
  const { workout } = useWorkoutStore();

  useEffect(() => {
    searchExercises(searchQuery, selectedMuscles);
  }, [searchQuery, selectedMuscles]);

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity onPress={() => handleExercisePress(item)}>
      <Card style={styles.exerciseCard}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseMuscle}>{item.muscle_group}</Text>
        </View>
        <View style={styles.difficultyContainer}>
          <Text style={[styles.difficulty, { color: getDifficultyColor(item.difficulty) }]}>
            {item.difficulty}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const getDifficultyColor = (difficulty?: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return '#34C759';
      case 'intermediate': return '#FF9500';
      case 'advanced': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#007AFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Exercise Search</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Filter color="#007AFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color="#8E8E93" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      </View>

      {/* Exercise List */}
      <FlatList
        data={exercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Exercise Info Modal */}
      <ExerciseInfoModal
        exercise={selectedExercise}
        visible={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        canStart={!!workout}
      />

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        selectedMuscles={selectedMuscles}
        onMusclesChange={setSelectedMuscles}
      />
    </SafeAreaView>
  );
}

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
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  difficultyContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  difficulty: {
    fontSize: 12,
    fontWeight: '600',
  },
});