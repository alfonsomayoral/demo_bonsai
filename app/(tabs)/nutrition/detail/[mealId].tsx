// app/(tabs)/nutrition/detail/[mealId].tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { supabase, signedImageUrl } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Circle } from 'react-native-svg';

type MealItem = {
  id: string;
  name: string;
  weight_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  image_path?: string | null;
  confidence?: number | null;
};

type Meal = {
  id: string;
  logged_at: string;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_items?: MealItem[];
};

const CARD_BG = '#191B1F';
const TEXT_MID = '#9CA3AF';

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${date} ${time}`;
  } catch {
    return iso;
  }
}

/** Ring segmentado por macros (protein / carbs / fat) */
function SegmentedRing({
  size,
  stroke,
  protein,
  carbs,
  fat,
  trackColor = 'rgba(255,255,255,0.12)',
  colors = { protein: '#ef4444', carbs: '#eab308', fat: '#f97316' },
}: {
  size: number;
  stroke: number;
  protein: number;
  carbs: number;
  fat: number;
  trackColor?: string;
  colors?: { protein: string; carbs: string; fat: string };
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = Math.max(0, protein) + Math.max(0, carbs) + Math.max(0, fat);

  const pPct = total > 0 ? Math.max(0, protein) / total : 0;
  const cPct = total > 0 ? Math.max(0, carbs) / total : 0;
  const fPct = total > 0 ? Math.max(0, fat) / total : 0;

  // longitudes (strokeDasharray) de cada segmento
  const pLen = pPct * c;
  const cLen = cPct * c;
  const fLen = fPct * c;

  // offsets para encadenar segmentos en el sentido horario empezando arriba (-90º)
  const startOffset = c * 0.25; // convierte el 0 en la parte superior (por defecto empieza a la derecha)
  const pOff = startOffset;
  const cOff = startOffset + pLen;
  const fOff = startOffset + pLen + cLen;

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* track */}
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      {/* protein */}
      {pLen > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.protein}
          strokeWidth={stroke}
          strokeDasharray={`${pLen},${c - pLen}`}
          strokeDashoffset={pOff}
          strokeLinecap="butt"
          fill="none"
        />
      )}
      {/* carbs */}
      {cLen > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.carbs}
          strokeWidth={stroke}
          strokeDasharray={`${cLen},${c - cLen}`}
          strokeDashoffset={cOff}
          strokeLinecap="butt"
          fill="none"
        />
      )}
      {/* fat */}
      {fLen > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.fat}
          strokeWidth={stroke}
          strokeDasharray={`${fLen},${c - fLen}`}
          strokeDashoffset={fOff}
          strokeLinecap="butt"
          fill="none"
        />
      )}
    </Svg>
  );
}

/** Mini ring para cada alimento */
function MiniSegmentedRing({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <SegmentedRing size={56} stroke={8} protein={protein} carbs={carbs} fat={fat} />
    </View>
  );
}

/** Tarjeta de macro/energía con estilo similar a review (draft) */
function MacroCard({
  icon,
  label,
  value,
  unit,
  iconColor = '#fff',
  borderColor,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  unit: string;
  iconColor?: string;
  borderColor?: string;
}) {
  return (
    <View style={[styles.macroCard, borderColor && { borderWidth: 1, borderColor }]}>
      <View style={styles.macroIconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>
        {label} {unit}
      </Text>
    </View>
  );
}

export default function MealDetailScreen() {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);

  // Cargar datos del meal
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('meals')
          .select('*, meal_items(*)')
          .eq('id', mealId)
          .single();

        if (error) throw error;
        setMeal(data as unknown as Meal);
      } catch (e) {
        console.error('Meal detail error', e);
      } finally {
        setLoading(false);
      }
    };
    if (mealId) load();
  }, [mealId]);

  // Resolver banner firmado (sin imágenes de relleno)
  useEffect(() => {
    let live = true;
    (async () => {
      const path = meal?.meal_items?.find((i) => !!i.image_path)?.image_path ?? null;
      if (!path) {
        setBanner(null);
        return;
      }
      const url = await signedImageUrl(path, 1000);
      if (live) setBanner(url ?? null);
    })();
    return () => {
      live = false;
    };
  }, [meal?.meal_items]);

  // Título de la comida (primer ítem + “+n more”)
  const title = useMemo(() => {
    const items = meal?.meal_items ?? [];
    if (items.length === 0) return 'Meal';
    if (items.length === 1) return items[0].name;
    return `${items[0].name} + ${items.length - 1} more`;
  }, [meal?.meal_items]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#10B981" size="large" />
      </SafeAreaView>
    );
  }

  if (!meal) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Meal not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Header superior: título izquierda, fecha+hora derecha */}
        <View style={styles.topHeader}>
          <Text style={styles.topTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.topDate}>{formatDateTime(meal.logged_at)}</Text>
        </View>

        {/* Banner de imagen (centrada, tap -> fullscreen) */}
        <View style={styles.bannerWrap}>
          {banner ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setShowFull(true)}>
              <Image source={{ uri: banner }} style={styles.banner} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.banner, styles.center]}>
              <ActivityIndicator />
            </View>
          )}
        </View>

        {/* Modal fullscreen image */}
        <Modal visible={showFull} transparent animationType="fade" onRequestClose={() => setShowFull(false)}>
          <TouchableWithoutFeedback onPress={() => setShowFull(false)}>
            <View style={styles.fullOverlay}>
              <TouchableWithoutFeedback>
                <Image source={{ uri: banner ?? undefined }} style={styles.fullImage} resizeMode="contain" />
              </TouchableWithoutFeedback>

              <TouchableOpacity style={styles.fullClose} onPress={() => setShowFull(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#22c55e" />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Fila: ring (2/3) + 4 macro cards (1/3) */}
        <View style={styles.summaryRow}>
          {/* 2/3 — ring segmentado */}
          <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.bigRingWrap}>
              <SegmentedRing
                size={220}
                stroke={16}
                protein={meal.total_protein}
                carbs={meal.total_carbs}
                fat={meal.total_fat}
              />
              <View style={styles.bigRingCenter}>
                <MaterialCommunityIcons name="fire-circle" size={28} color="#22c55e" />
                <Text style={styles.kcalText}>{meal.total_kcal} kcal</Text>
              </View>
            </View>

            {/* Leyenda de colores */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>Protein</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
                <Text style={styles.legendText}>Carbs</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                <Text style={styles.legendText}>Fats</Text>
              </View>
            </View>
          </View>

          {/* 1/3 — columna con 4 cards */}
          <View style={styles.macroCol}>
            <MacroCard icon="fire" label="Calories" value={meal.total_kcal} unit="(kcal)" iconColor="#22c55e" borderColor="#22c55e" />
            <MacroCard icon="food-drumstick" label="Protein" value={meal.total_protein} unit="(g)" iconColor="#ef4444" borderColor="#ef4444" />
            <MacroCard icon="rice" label="Carbs" value={meal.total_carbs} unit="(g)" iconColor="#eab308" borderColor="#eab308" />
            <MacroCard icon="cheese" label="Fat" value={meal.total_fat} unit="(g)" iconColor="#f97316" borderColor="#f97316" />
          </View>
        </View>

        {/* Items */}
        <Text style={styles.section}>Items</Text>
        {(meal.meal_items ?? []).map((it) => (
          <View key={it.id} style={styles.itemCard}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.itemTitle}>{it.name}</Text>

              {/* fila: peso + kcal */}
              <View style={styles.foodRow}>
                <MaterialCommunityIcons name="weight" size={16} color="#68b6ef" />
                <Text style={styles.foodSub}>{it.weight_g} g</Text>

                <MaterialCommunityIcons name="fire-circle" size={16} color="#22c55e" style={{ marginLeft: 12 }} />
                <Text style={styles.foodSub}>{it.kcal} kcal</Text>
              </View>

              {/* fila: macros */}
              <View style={[styles.foodRow, { marginTop: 6 }]}>
                <MaterialCommunityIcons name="food-drumstick" size={16} color="#ef4444" />
                <Text style={styles.foodSub}>{it.protein} g</Text>

                <MaterialCommunityIcons name="rice" size={16} color="#eab308" style={{ marginLeft: 12 }} />
                <Text style={styles.foodSub}>{it.carbs} g</Text>

                <MaterialCommunityIcons name="cheese" size={16} color="#f97316" style={{ marginLeft: 12 }} />
                <Text style={styles.foodSub}>{it.fat} g</Text>
              </View>

              {typeof it.confidence === 'number' && (
                <Text style={styles.itemConf}>conf: {Math.round((it.confidence ?? 0) * 100)}%</Text>
              )}
            </View>

            {/* mini ring por alimento */}
            <MiniSegmentedRing protein={it.protein} carbs={it.carbs} fat={it.fat} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },

  /* header superior */
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, paddingRight: 12 },
  topDate: { color: TEXT_MID, fontSize: 13 },

  /* banner */
  bannerWrap: { width: '100%', overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  banner: { width: '100%', height: 260, resizeMode: 'cover' },

  /* modal fullscreen image */
  fullOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  fullImage: { width: '100%', height: '88%' },
  fullClose: {
    position: 'absolute',
    top: 24,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    padding: 8,
  },

  /* resumen fila */
  summaryRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 16 },
  bigRingWrap: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigRingCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  kcalText: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 6 },

  legendRow: { flexDirection: 'row', marginTop: 10, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { color: TEXT_MID, fontSize: 12 },

  macroCol: { flex: 1, marginLeft: 8, justifyContent: 'space-between' },
  macroCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginVertical: 4,
  },
  macroIconWrap: {
    width: 32, height: 32, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 4,
  },
  macroValue: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  macroLabel: { color: '#FFF', marginTop: 2, fontSize: 13 },

  /* sección items */
  section: { color: '#fff', fontSize: 18, fontWeight: '600', paddingHorizontal: 16, marginTop: 18, marginBottom: 8 },

  itemCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: { color: '#fff', fontWeight: '700', marginBottom: 6, fontSize: 14 },
  foodRow: { flexDirection: 'row', alignItems: 'center' },
  foodSub: { color: TEXT_MID, fontSize: 12, marginLeft: 6 },
  itemConf: { color: TEXT_MID, marginTop: 6, fontSize: 12 },

  error: { color: '#fff', textAlign: 'center', marginTop: 20 },
});
