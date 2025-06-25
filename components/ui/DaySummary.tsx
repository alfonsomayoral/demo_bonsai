import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KcalCircle } from './KcalCircle';
import { MacroChart } from './MacroChart';
import { ExerciseList } from './ExerciseList';

interface Meal {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  volume: number;
}

interface DaySummaryProps {
  kcal: number;
  kcalTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
  meals: Meal[];
  exercises: Exercise[];
}

export const DaySummary: React.FC<DaySummaryProps> = ({
  kcal, kcalTarget, protein, proteinTarget, carbs, carbsTarget, fat, fatTarget, meals, exercises
}) => {
  return (
    <View style={styles.container}>
      <KcalCircle value={kcal} target={kcalTarget} />
      <MacroChart
        protein={protein}
        proteinTarget={proteinTarget}
        carbs={carbs}
        carbsTarget={carbsTarget}
        fat={fat}
        fatTarget={fatTarget}
      />
      <Text style={styles.sectionTitle}>Meals</Text>
      {meals.length ? meals.map((meal, idx) => (
        <View key={idx} style={styles.mealCard}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <Text style={styles.mealMacros}>{meal.kcal} kcal • {meal.protein}g P • {meal.carbs}g C • {meal.fat}g F</Text>
        </View>
      )) : (
        <Text style={styles.emptyText}>No meals logged</Text>
      )}
      <Text style={styles.sectionTitle}>Exercises</Text>
      <ExerciseList exercises={exercises} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginTop: 18,
    marginBottom: 8,
  },
  mealCard: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  mealName: {
    color: '#10B981',
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    marginBottom: 2,
  },
  mealMacros: {
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  emptyText: {
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    marginBottom: 8,
  },
}); 