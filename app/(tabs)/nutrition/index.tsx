import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ProgressRing } from '@/components/nutrition/ProgressRing';
import { MealCard } from '@/components/nutrition/MealCard';
import { FloatingCameraButton } from '@/components/nutrition/FloatingCameraButton';
import { WaterCard } from '@/components/nutrition/WaterCard';
import { useNutritionStore } from '@/store/nutritionStore';
import { supabase } from '@/lib/supabase';
import ConcentricMacroRings from '@/components/nutrition/ConcentricMacroRings';

const { width: SCREEN_W } = Dimensions.get('window');

const TARGETS = {
  calories: 2200,
  protein: 165,
  carbs: 275,
  fat: 73,
};

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

function MacroRing({
  label,
  iconName,
  value,
  target,
  color,
  playKey,
}: {
  label: 'Protein' | 'Carbs' | 'Fats';
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  target: number;
  color: string;
  /** Clave para reanimar al cambiar página */
  playKey?: any;
}) {
  const progress = clamp01(value / target);
  return (
    <View style={styles.macroCard}>
      <Text style={[styles.macroTitle, { color }]}>{label}</Text>
      <View style={styles.macroRingWrapper}>
        <ProgressRing
          size={84}
          stroke={8}
          progress={progress}
          color={color}
          trackColor="#1F2937"
          duration={800}
          playKey={playKey}
        >
          <MaterialCommunityIcons name={iconName} size={28} color={color} />
        </ProgressRing>
      </View>
      <Text style={styles.macroBottom}>
        {Math.round(value)}g / {target}g
      </Text>
    </View>
  );
}

function StatsPager({
  consumed,
}: {
  consumed: { calories: number; protein: number; carbs: number; fat: number };
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [viewportW, setViewportW] = useState<number>(SCREEN_W);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== viewportW) setViewportW(w);
  };

  const kcalProgress = clamp01(consumed.calories / TARGETS.calories);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, viewportW));
    setPage(p);
  };

  return (
    <View style={styles.pagerContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={handleLayout}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={{ width: viewportW * 2 }}
        style={styles.pagerScroll}
      >
        {/* Página 1 */}
        <View style={[styles.pagerPage, { width: viewportW }]}>
          <View style={[styles.pageContent, { width: viewportW }]}>
            <View style={styles.cardSurface}>
              <Text style={styles.kcalTitle}>Calories Target</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kcalBig}>
                    {Math.round(consumed.calories)}/{TARGETS.calories} kcal
                  </Text>
                </View>
                <View style={styles.kcalRing}>
                  <ProgressRing
                    size={110}
                    stroke={12}
                    progress={kcalProgress}
                    color="#10B981"
                    trackColor="#1F2937"
                    duration={900}
                    playKey={page}
                  >
                    <MaterialCommunityIcons name="fire-circle" size={30} color="#10B981" />
                  </ProgressRing>
                </View>
              </View>
            </View>

            {/* Tres cards de macros */}
            <View style={styles.macroRow}>
              <MacroRing
                label="Protein"
                iconName="food-drumstick"
                value={consumed.protein}
                target={TARGETS.protein}
                color="#FF6B6B"
                playKey={page}
              />
              <MacroRing
                label="Carbs"
                iconName="rice"
                value={consumed.carbs}
                target={TARGETS.carbs}
                color="#FFD93D"
                playKey={page}
              />
              <MacroRing
                label="Fats"
                iconName="cheese"
                value={consumed.fat}
                target={TARGETS.fat}
                color="#FF8E53"
                playKey={page}
              />
            </View>
          </View>
        </View>

        {/* Página 2 */}
        <View style={[styles.pagerPage, { width: viewportW }]}>
          <View style={[styles.pageContent, { width: viewportW }]}>
            <View style={styles.cardSurface}>
              <Text style={styles.kcalTitle}>Progress Rings</Text>

              <ConcentricMacroRings
                calories={consumed.calories}
                caloriesTarget={TARGETS.calories}
                protein={consumed.protein}
                proteinTarget={TARGETS.protein}
                carbs={consumed.carbs}
                carbsTarget={TARGETS.carbs}
                fat={consumed.fat}
                fatTarget={TARGETS.fat}
                playKey={page}
              />

              <View className="legendRow" style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="food-drumstick" size={16} color="#FF6B6B" />
                  <Text style={styles.legendText}>Protein: {Math.round(consumed.protein)} g</Text>
                </View>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="rice" size={16} color="#FFD93D" />
                  <Text style={styles.legendText}>Carbs: {Math.round(consumed.carbs)} g</Text>
                </View>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="cheese" size={16} color="#FF8E53" />
                  <Text style={styles.legendText}>Fats: {Math.round(consumed.fat)} g</Text>
                </View>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="fire" size={16} color="#10B981" />
                  <Text style={styles.legendText}>
                    Calories: {Math.round(consumed.calories)} kcal
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* bullets */}
      <View style={styles.pagerDots}>
        <View style={[styles.dot, page === 0 ? styles.dotActive : styles.dotInactive]} />
        <View style={[styles.dot, page === 1 ? styles.dotActive : styles.dotInactive]} />
      </View>
    </View>
  );
}

export default function NutritionHome() {
  const meals = useNutritionStore((s: any) => s.todayMeals || []);
  const totals = useNutritionStore(
    (s: any) => s.todayTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const loadTodayData = useNutritionStore((s: any) => s.loadTodayData);

  const [streak, setStreak] = useState<number>(0);
  const [recentMeals, setRecentMeals] = useState<any[]>([]);

  useEffect(() => {
    if (typeof loadTodayData === 'function') loadTodayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setRecentMeals([]); return; }
        const { data, error } = await supabase
          .from('meals')
          .select('id, logged_at, total_kcal, total_protein, total_carbs, total_fat, meal_items(name, image_path)')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(3);
        if (error || !data) { setRecentMeals([]); return; }
        setRecentMeals(data);
      } catch {
        setRecentMeals([]);
      }
    })();
  }, [meals]);

  useEffect(() => {
    (async () => {
      try {
        const key = 'nutrition_streak';
        const raw = await AsyncStorage.getItem(key);
        const parsed: { count: number; lastDate: string } | null = raw ? JSON.parse(raw) : null;

        const today = todayYmd();
        const yest = yesterdayYmd();
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
        // ignore
      }
    })();
  }, [meals]);

  const consumed = useMemo(
    () => ({
      calories: totals?.calories ?? 0,
      protein: totals?.protein ?? 0,
      carbs: totals?.carbs ?? 0,
      fat: totals?.fat ?? 0,
    }),
    [totals]
  );

  const listMeals = recentMeals.map((m: any) => {
    const imagePath = m.meal_items?.find((it: any) => !!it.image_path)?.image_path ?? null;
    return {
      id: m.id,
      imagePath,
      title:
        (m.meal_items?.[0]?.name ?? 'Logged meal') +
        (m.meal_items && m.meal_items.length > 1 ? ` + ${m.meal_items.length - 1} more` : ''),
      kcal: m.total_kcal ?? 0,
      protein: m.total_protein ?? 0,
      carbs: m.total_carbs ?? 0,
      fat: m.total_fat ?? 0,
      time: formatDateTime(m.logged_at),
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.streakPill}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{streak}</Text>
        </View>

        <StatsPager consumed={consumed} />

        <WaterCard />

        <Text style={styles.sectionTitle}>Recently uploaded</Text>
        {listMeals.map((m: any) => (
          <MealCard
            key={m.id}
            mealId={m.id}
            title={m.title}
            time={m.time}
            kcal={m.kcal}
            protein={m.protein}
            carbs={m.carbs}
            fat={m.fat}
            imagePath={m.imagePath ?? null}
          />
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <FloatingCameraButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0D' },
  scroll: { padding: 20, paddingBottom: 60 },

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

  pagerContainer: { marginBottom: 20 },
  pagerScroll: { alignSelf: 'stretch' },
  pagerPage: { justifyContent: 'center', alignItems: 'center' },
  pageContent: {},
  pagerDots: {
    marginTop: 6,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#10B981' },
  dotInactive: { backgroundColor: '#374151' },

  cardSurface: {
    backgroundColor: '#191B1F',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  kcalTitle: { color: '#10B981', fontSize: 24, fontFamily: 'Inter-Bold' },
  kcalBig: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Inter-Bold' },
  kcalRing: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },

  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#191B1F',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  macroTitle: { fontFamily: 'Inter-Bold', fontSize: 15, marginBottom: 4, textAlign: 'center' },
  macroRingWrapper: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  macroBottom: { color: '#9CA3AF', fontSize: 13, marginTop: 8 },

  legendRow: {
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  legendText: { color: '#D1D5DB', marginLeft: 8, fontSize: 14 },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginTop: 8,
    marginBottom: 12,
  },
});
