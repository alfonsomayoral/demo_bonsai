// app/(tabs)/nutrition/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ProgressRing } from '@/components/nutrition/ProgressRing';
import { MealCard } from '@/components/nutrition/MealCard';
import { FloatingCameraButton } from '@/components/nutrition/FloatingCameraButton';
import { WaterCard } from '@/components/nutrition/WaterCard';
import { useNutritionStore } from '@/store/nutritionStore';
import { supabase } from '@/lib/supabase';

/* --------------------- objetivos por defecto ---------------------- */
const TARGETS = {
  calories: 2200,
  protein: 165,
  carbs: 275,
  fat: 73,
};

/* ------------------------- helpers varios ------------------------- */
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const formatDateTime = (iso?: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${date} ${time}`;
  } catch {
    return '';
  }
};

const todayYmd = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};
const yesterdayYmd = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

/* Construye la URL pública del objeto en el bucket meal-images */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const publicMealImageUrl = (path?: string | null) => {
  if (!path || !SUPABASE_URL) return null;
  const base = SUPABASE_URL.replace(/\/+$/, '');
  // Nota: el path de Storage no empieza con '/', así que lo concatenamos tal cual
  return `${base}/storage/v1/object/public/meal-images/${path}`;
};

/* ------------------------- componente macro ------------------------ */
function MacroRing({
  label,
  iconName,
  value,
  target,
  color,
}: {
  label: 'Protein' | 'Carbs' | 'Fats';
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  target: number;
  color: string;
}) {
  const progress = clamp01(value / target);
  return (
    <View style={styles.macroCard}>
      <Text style={[styles.macroTitle, { color }]}>{label}</Text>
      <View style={styles.macroRingWrapper}>
        <ProgressRing size={84} stroke={8} progress={progress} color={color} trackColor="#1F2937">
          <MaterialCommunityIcons name={iconName} size={28} color={color} />
        </ProgressRing>
      </View>
      <Text style={styles.macroBottom}>
        {Math.round(value)}g / {target}g
      </Text>
    </View>
  );
}

/* --------------------------- pantalla home -------------------------- */
export default function NutritionHome() {
  // Selectores separados para Zustand v5 (evita snapshots cambiantes)
  const meals         = useNutritionStore((s: any) => s.todayMeals || []);
  const totals        = useNutritionStore((s: any) => s.todayTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
  const loadTodayData = useNutritionStore((s: any) => s.loadTodayData);

  const [streak, setStreak] = useState<number>(0);
  const [recentMeals, setRecentMeals] = useState<any[]>([]); // ⬅️ últimas 3 comidas (cualquier día)

  // Carga datos del día al montar
  useEffect(() => {
    if (typeof loadTodayData === 'function') loadTodayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar SIEMPRE las 3 últimas comidas del usuario (se refresca cuando cambian las comidas del día)
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRecentMeals([]);
          return;
        }
        const { data, error } = await supabase
          .from('meals')
          .select('id, logged_at, total_kcal, total_protein, total_carbs, total_fat, meal_items(name, image_path)')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(3);

        if (error || !data) {
          setRecentMeals([]);
          return;
        }
        setRecentMeals(data);
      } catch {
        setRecentMeals([]);
      }
    })();
  }, [meals]);

  // Racha basada en si hay comidas hoy
  useEffect(() => {
    (async () => {
      try {
        const key = 'nutrition_streak';
        const raw = await AsyncStorage.getItem(key);
        const parsed: { count: number; lastDate: string } | null = raw ? JSON.parse(raw) : null;

        const today = todayYmd();
        const yest  = yesterdayYmd();
        const hasMealsToday = (meals?.length ?? 0) > 0;

        if (hasMealsToday) {
          if (!parsed) {
            const data = { count: 1, lastDate: today };
            await AsyncStorage.setItem(key, JSON.stringify(data));
            setStreak(1);
          } else if (parsed.lastDate === today) {
            setStreak(parsed.count);
          } else if (parsed.lastDate === yest) {
            const data = { count: parsed.count + 1, lastDate: today };
            await AsyncStorage.setItem(key, JSON.stringify(data));
            setStreak(data.count);
          } else {
            const data = { count: 1, lastDate: today };
            await AsyncStorage.setItem(key, JSON.stringify(data));
            setStreak(1);
          }
        } else {
          if (parsed && parsed.lastDate !== today && parsed.lastDate !== yest) {
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
    })();
  }, [meals]);

  /* consumido y progreso (para los anillos objetivo del día) */
  const consumed = useMemo(
    () => ({
      calories: totals?.calories ?? 0,
      protein : totals?.protein  ?? 0,
      carbs   : totals?.carbs    ?? 0,
      fat     : totals?.fat      ?? 0,
    }),
    [totals]
  );

  const kcalProgress = clamp01(consumed.calories / TARGETS.calories);

  /* lista mostrable: SIEMPRE las 3 últimas comidas registradas (sin demos) */
  const listMeals = recentMeals.map((m: any) => {
    const imagePath = m.meal_items?.find((it: any) => !!it.image_path)?.image_path ?? null;
    const imageUrl  = publicMealImageUrl(imagePath) ??
      'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1200&q=60';
    return {
      id: m.id,
      image: imageUrl,
      title: m.meal_items?.[0]?.name ?? 'Logged meal',
      kcal: m.total_kcal ?? 0,
      protein: m.total_protein ?? 0,
      carbs: m.total_carbs ?? 0,
      fat: m.total_fat ?? 0,
      // ⬇️ ahora fecha + hora (antes solo hora)
      time: formatDateTime(m.logged_at),
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Streak pill (dentro del área segura) */}
        <View style={styles.streakPill}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{streak}</Text>
        </View>

        {/* --------- Card principal con anillo de calorías --------- */}
        <View style={styles.kcalCard}>
          <Text style={styles.kcalTitle}>Calories Target</Text>
          
          <View style={{ flex: 1 }}>
            <Text style={styles.kcalBig}>{Math.round(consumed.calories)}/{TARGETS.calories} kcal</Text>
          </View>

          <View style={styles.kcalRing}>
            <ProgressRing size={110} stroke={12} progress={kcalProgress} color="#10B981" trackColor="#1F2937">
              <MaterialCommunityIcons name="fire-circle" size={30} color="#10B981" />
            </ProgressRing>
          </View>
        </View>

        {/* ------------------------- Macro rings ------------------------- */}
        <View style={styles.macroRow}>
          <MacroRing
            label="Protein"
            iconName="food-drumstick"
            value={consumed.protein}
            target={TARGETS.protein}
            color="#FF6B6B"
          />
          <MacroRing
            label="Carbs"
            iconName="rice"
            value={consumed.carbs}
            target={TARGETS.carbs}
            color="#FFD93D"
          />
          <MacroRing
            label="Fats"
            iconName="cheese"
            value={consumed.fat}
            target={TARGETS.fat}
            color="#FF8E53"
          />
        </View>

        {/* --------------------- Agua (3L máx.) --------------------- */}
        <WaterCard />

        {/* ---------------------- Recientes ---------------------- */}
        <Text style={styles.sectionTitle}>Recently uploaded</Text>
        {listMeals.map((m: any) => (
          <MealCard
            key={m.id}
            mealId={m.id}
            image={m.image}
            title={m.title}
            kcal={m.kcal}
            protein={m.protein}
            carbs={m.carbs}
            fat={m.fat}
            time={m.time} // ahora incluye fecha + hora
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

  /* streak pill dentro del área segura */
  streakPill: {
    backgroundColor: '#191B1F',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  streakEmoji: { fontSize: 18, marginRight: 4 },
  streakText: { color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 13 },

  /* card principal kcal */
  kcalCard: {
    backgroundColor: '#191B1F',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  kcalTitle: {
    position: 'absolute',
    top: 16,
    left: 16,
    color: '#10B981',
    fontSize: 26,
    fontFamily: 'Inter-SemiBold',
  },
  kcalBig: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Inter-Bold' },

  kcalRing: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },

  /* macro grid */
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#191B1F',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  macroTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    marginBottom: 4,
    textAlign: 'center',
  },
  macroRingWrapper: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  macroBottom: { color: '#9CA3AF', fontSize: 12, marginTop: 8 },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginTop: 8,
    marginBottom: 12,
  },
});
