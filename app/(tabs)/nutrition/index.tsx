import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNutritionStore } from '@/store/nutritionStore';
import { ProgressRing } from '@/components/nutrition/ProgressRing';
import { MacroCard }   from '@/components/nutrition/MacroCard';
import { MealCard }    from '@/components/nutrition/MealCard';
import { FloatingCameraButton } from '@/components/nutrition/FloatingCameraButton';

/* ----------- selector global (carga comidas reales más adelante) ---------- */
const demoMeals = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    title: 'Caesar Salad',
    kcal: 133,
    protein: 12,
    carbs: 8,
    fat: 5,
    time: '9:00am',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    title: 'Sweet Corn',
    kcal: 456,
    protein: 18,
    carbs: 60,
    fat: 19,
    time: '9:00am',
  },
];

export default function NutritionHome() {
  /* en Fase 3: cargar datos reales */
  const loadToday = useNutritionStore((s) => s.loadTodayData);
  useEffect(() => { loadToday(); }, []);

  /* datos mock */
  const kcalLeft  = 1250;
  const macroLeft = { protein: 45, carbs: 89, fat: 48 };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ----- bloque anillo kcal ----- */}
        <View style={styles.ringWrapper}>
          <ProgressRing
            progress={(2200 - kcalLeft) / 2200}
            value={kcalLeft}
            label="Calories left"
            size={140}
          />
        </View>

        {/* ----- macros ----- */}
        <View style={styles.macroRow}>
          <MacroCard name="Protein" left={macroLeft.protein} value={0} color="#EF4444" />
          <MacroCard name="Carbs"   left={macroLeft.carbs}   value={0} color="#F59E0B" />
          <MacroCard name="Fats"    left={macroLeft.fat}     value={0} color="#3B82F6" />
        </View>

        {/* ----- recientes ----- */}
        <Text style={styles.sectionTitle}>Recently uploaded</Text>
        {demoMeals.map((m) => (
          <MealCard key={m.id} mealId={m.id} {...m} />
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB cámara */}
      <FloatingCameraButton />
    </SafeAreaView>
  );
}

/* ----------------------------- estilos ----------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll:    { padding: 20, paddingBottom: 60 },
  ringWrapper: { alignItems: 'center', marginBottom: 24 },
  macroRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter-SemiBold', marginBottom: 12 },
});
