import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNutritionStore } from '@/store/nutritionStore';
import { ProgressRing } from '@/components/nutrition/ProgressRing';
import { MealCard } from '@/components/nutrition/MealCard';
import { FloatingCameraButton } from '@/components/nutrition/FloatingCameraButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/* --------------------- objetivos por defecto ---------------------- */
const TARGETS = {
  calories: 2200,
  protein: 165,
  carbs: 275,
  fat: 73,
};

/* ------------------------- helpers varios ------------------------- */
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const todayYmd = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const ymdOf = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const yesterdayYmd = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

/* ------------------------- componente macro ------------------------ */
function MacroRing({
  label,
  icon,
  value,
  target,
  color,
}: {
  label: 'Protein' | 'Carbs' | 'Fats';
  icon: React.ReactNode;
  value: number;
  target: number;
  color: string;
}) {
  const left = Math.max(0, target - value);
  const progress = clamp01(value / target);

  return (
    <View style={styles.macroCard}>
      <View style={styles.macroRingWrapper}>
        <ProgressRing progress={progress} value={left} label={`${label} left`} size={84} color={color} />
        <View style={styles.macroIcon}>{icon}</View>
      </View>
      <Text style={styles.macroBottom}>
        {Math.round(value)}g / {target}g
      </Text>
    </View>
  );
}

/* --------------------------- pantalla home -------------------------- */
export default function NutritionHome() {
  const loadTodayData = useNutritionStore((s) => s.loadTodayData);
  const meals = useNutritionStore((s) => s.todayMeals);
  const totals = useNutritionStore((s) => s.todayTotals);
  const [streak, setStreak] = useState<number>(0);

  /* cargar comidas del día */
  useEffect(() => {
    loadTodayData?.();
  }, [loadTodayData]);

  /* actualizar racha cuando cambien las comidas del día */
  const updateStreak = useCallback(async () => {
    try {
      const key = 'nutrition_streak';
      const raw = await AsyncStorage.getItem(key);
      const parsed: { count: number; lastDate: string } | null = raw ? JSON.parse(raw) : null;

      const today = todayYmd();
      const yesterday = yesterdayYmd();
      const hasMealsToday = (meals?.length ?? 0) > 0;

      if (hasMealsToday) {
        if (!parsed) {
          const data = { count: 1, lastDate: today };
          await AsyncStorage.setItem(key, JSON.stringify(data));
          setStreak(1);
        } else if (parsed.lastDate === today) {
          setStreak(parsed.count); // ya contamos hoy
        } else if (parsed.lastDate === yesterday) {
          const data = { count: parsed.count + 1, lastDate: today };
          await AsyncStorage.setItem(key, JSON.stringify(data));
          setStreak(data.count);
        } else {
          const data = { count: 1, lastDate: today };
          await AsyncStorage.setItem(key, JSON.stringify(data));
          setStreak(1);
        }
      } else {
        // si no hay comidas hoy y la última vez no fue ayer ni hoy, reseteamos
        if (parsed && parsed.lastDate !== today && parsed.lastDate !== yesterday) {
          const data = { count: 0, lastDate: parsed.lastDate };
          await AsyncStorage.setItem(key, JSON.stringify(data));
          setStreak(0);
        } else {
          setStreak(parsed?.count ?? 0);
        }
      }
    } catch {
      // si falla storage, no rompemos la UI
    }
  }, [meals]);

  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  /* consumido y progreso */
  const consumed = useMemo(
    () => ({
      calories: totals.calories ?? 0,
      protein: totals.protein ?? 0,
      carbs: totals.carbs ?? 0,
      fat: totals.fat ?? 0,
    }),
    [totals]
  );

  const kcalLeft = Math.max(0, TARGETS.calories - consumed.calories);
  const kcalProgress = clamp01(consumed.calories / TARGETS.calories);

  /* lista mostrable */
  const listMeals =
    meals && meals.length
      ? meals.map((m) => ({
          id: m.id,
          image:
            m.meal_items?.find((it) => !!it.image_path)?.image_path ??
            'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1200&q=60',
          title: m.meal_items?.[0]?.name ?? 'Logged meal',
          kcal: m.total_kcal ?? 0,
          protein: m.total_protein ?? 0,
          carbs: m.total_carbs ?? 0,
          fat: m.total_fat ?? 0,
          time: formatTime(m.logged_at),
        }))
      : [
          {
            id: 'demo1',
            image:
              'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            title: 'Caesar Salad',
            kcal: 133,
            protein: 12,
            carbs: 8,
            fat: 5,
            time: '9:00am',
          },
          {
            id: 'demo2',
            image:
              'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            title: 'Sweet Corn',
            kcal: 456,
            protein: 18,
            carbs: 60,
            fat: 19,
            time: '9:00am',
          },
        ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* --------- Card principal con anillo de calorías --------- */}
        <View style={styles.kcalCard}>
          {/* racha (esquina sup-izq) */}
          <View style={styles.streakPill}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streak}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.kcalBig}>{kcalLeft}</Text>
            <Text style={styles.kcalSub}>Calories left</Text>
          </View>

          <View style={styles.kcalRing}>
            <ProgressRing progress={kcalProgress} value={kcalLeft} label="" size={110} />
            <MaterialCommunityIcons
              name="fire"
              size={24}
              color="#FFFFFF"
              style={styles.kcalIcon}
            />
          </View>
        </View>

        {/* ------------------------- Macro rings ------------------------- */}
        <View style={styles.macroRow}>
          <MacroRing
            label="Protein"
            icon={<MaterialCommunityIcons name="food-drumstick" size={20} color="#fff" />}
            value={consumed.protein}
            target={TARGETS.protein}
            color="#EF4444"
          />
          <MacroRing
            label="Carbs"
            icon={<MaterialCommunityIcons name="bread-slice" size={20} color="#fff" />}
            value={consumed.carbs}
            target={TARGETS.carbs}
            color="#F59E0B"
          />
          <MacroRing
            label="Fats"
            icon={<Text style={{ fontSize: 18 }}>🥑</Text>}
            value={consumed.fat}
            target={TARGETS.fat}
            color="#8B5CF6"
          />
        </View>

        {/* ---------------------- Recientes ---------------------- */}
        <Text style={styles.sectionTitle}>Recently uploaded</Text>
        {listMeals.map((m) => (
          <MealCard
            key={m.id}
            mealId={m.id}
            image={m.image}
            title={m.title}
            kcal={m.kcal}
            protein={m.protein}
            carbs={m.carbs}
            fat={m.fat}
            time={m.time}
          />
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* botón flotante cámara (centro-inferior) */}
      <FloatingCameraButton />
    </SafeAreaView>
  );
}

/* ----------------------------- estilos ----------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0D' },
  scroll: { padding: 20, paddingBottom: 60 },

  /* card principal kcal */
  kcalCard: {
    backgroundColor: '#191B1F',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#111317',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: { fontSize: 14, marginRight: 4 },
  streakText: { color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 13 },

  kcalBig: { color: '#FFFFFF', fontSize: 36, fontFamily: 'Inter-Bold' },
  kcalSub: { color: '#9CA3AF', marginTop: 2 },

  kcalRing: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  kcalIcon: { position: 'absolute' },

  /* macro grid */
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#191B1F',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  macroRingWrapper: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  macroIcon: { position: 'absolute' },
  macroBottom: { color: '#9CA3AF', fontSize: 12, marginTop: 8 },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
});
