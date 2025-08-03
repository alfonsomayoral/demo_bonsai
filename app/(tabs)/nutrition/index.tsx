import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Scan, Search, Plus } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';

/* --------------------------- Datos de demo --------------------------- */
const recentFoods = [
  { id: 1, name: 'Grilled Chicken Breast', calories: 231, protein: 43.5, carbs: 0, fat: 5 },
  { id: 2, name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8 },
  { id: 3, name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
];

const quickActions = [
  { id: 'photo',  title: 'Take Photo',    subtitle: 'Snap your meal',    icon: Camera, color: '#10B981' },
  { id: 'scan',   title: 'Scan Barcode', subtitle: 'Quick product scan', icon: Scan,   color: '#3B82F6' },
  { id: 'search', title: 'Search Food',  subtitle: 'Find by name',       icon: Search, color: '#F59E0B' },
];

/* ------------------------------ Componente --------------------------- */
export default function Nutrition() {
  const router = useRouter();

  /* Valores mock hasta Fase 3 */
  const [todayIntake] = useState({ calories: 1247, protein: 89, carbs: 156, fat: 34 });
  const targets = { calories: 2200, protein: 165, carbs: 275, fat: 73 };

  const handleQuickAction = (id: string) => {
    if (id === 'photo')  router.push('./nutrition/capture');
    else if (id === 'scan')   console.log('Scan barcode – coming soon');
    else if (id === 'search') console.log('Search food – coming soon');
  };

  /* ------------------------------ UI ------------------------------- */
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <Text style={styles.headerDate}>Today, March 15</Text>
        </View>

        {/* Daily Progress */}
        <Card variant="dark" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily Progress</Text>
            <Text style={styles.caloriesRemaining}>
              {targets.calories - todayIntake.calories} cal remaining
            </Text>
          </View>

          <View style={styles.calorieProgress}>
            <View style={styles.calorieBar}>
              <View
                style={[
                  styles.calorieBarFill,
                  { width: `${(todayIntake.calories / targets.calories) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.calorieText}>
              {todayIntake.calories} / {targets.calories} cal
            </Text>
          </View>

          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{todayIntake.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.macroBar}>
                <View
                  style={[
                    styles.macroBarFill,
                    { width: `${(todayIntake.protein / targets.protein) * 100}%`, backgroundColor: '#EF4444' },
                  ]}
                />
              </View>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{todayIntake.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.macroBar}>
                <View
                  style={[
                    styles.macroBarFill,
                    { width: `${(todayIntake.carbs / targets.carbs) * 100}%`, backgroundColor: '#F59E0B' },
                  ]}
                />
              </View>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{todayIntake.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.macroBar}>
                <View
                  style={[
                    styles.macroBarFill,
                    { width: `${(todayIntake.fat / targets.fat) * 100}%`, backgroundColor: '#8B5CF6' },
                  ]}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Food</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <TouchableOpacity key={a.id} style={styles.quickActionCard} onPress={() => handleQuickAction(a.id)}>
                  <View style={[styles.quickActionIcon, { backgroundColor: a.color }]}>
                    <Icon size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.quickActionTitle}>{a.title}</Text>
                  <Text style={styles.quickActionSubtitle}>{a.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent Foods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Foods</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentFoods.map((food) => (
            <Card key={food.id} variant="dark" style={styles.foodItem}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodMacros}>
                  {food.calories} cal • {food.protein}g protein • {food.carbs}g carbs • {food.fat}g fat
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Plus size={20} color="#10B981" />
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* --------------------------- Estilos --------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter-Bold', color: '#FFFFFF', marginBottom: 4 },
  headerDate: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#9CA3AF' },

  progressCard: { marginBottom: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  caloriesRemaining: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#10B981' },

  calorieProgress: { marginBottom: 20 },
  calorieBar: { height: 8, backgroundColor: '#374151', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  calorieBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  calorieText: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#FFFFFF', textAlign: 'center' },

  macroGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#FFFFFF', marginBottom: 4 },
  macroLabel: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#9CA3AF', marginBottom: 8 },
  macroBar: { width: '80%', height: 4, backgroundColor: '#374151', borderRadius: 2, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 2 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  seeAllText: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#10B981' },

  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickActionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickActionTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', marginBottom: 4, textAlign: 'center' },
  quickActionSubtitle: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#9CA3AF', textAlign: 'center' },

  foodItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 16 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', marginBottom: 4 },
  foodMacros: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#9CA3AF' },
  addButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#064E3B', alignItems: 'center', justifyContent: 'center' },
});
