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

/**
 * Ring segmentado por macros SIN huecos:
 * - Periodo del patrón = C (circunferencia) usando [len, C - len].
 * - Offsets normalizados a [0, C) para evitar “wraps” raros en iOS.
 * - El último segmento es el resto exacto + epsilon para tapar cualquier redondeo.
 */
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
  const C = 2 * Math.PI * r;

  const pRaw = Math.max(0, protein);
  const cRaw = Math.max(0, carbs);
  const fRaw = Math.max(0, fat);
  const total = pRaw + cRaw + fRaw;

  // Porcentajes (si total=0, todo 0)
  const pPct = total > 0 ? pRaw / total : 0;
  const cPct = total > 0 ? cRaw / total : 0;
  // El último segmento como resto exacto para cerrar el círculo
  let fPct = 1 - pPct - cPct;
  if (fPct < 0) fPct = 0;

  // Longitudes
  const pLen = pPct * C;
  const cLen = cPct * C;
  // Sumar epsilon al último para cubrir antialias/rounding (no pasa nada si solapa levemente)
  const EPS = 0.75; // px a lo largo de la circunferencia
  const fLen = Math.min(C, Math.max(0, C - (pLen + cLen)) + EPS);

  // Normalizador de offset a [0, C)
  const norm = (v: number) => {
    const m = v % C;
    return m < 0 ? m + C : m;
    };

  // Empezar en la parte superior (12:00)
  const start = C * 0.25;

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* track */}
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />

      {/* Protein */}
      {pLen > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.protein}
          strokeWidth={stroke}
          strokeDasharray={[pLen, Math.max(0, C - pLen)]} // periodo = C
          strokeDashoffset={norm(start)}
          strokeLinecap="butt"
          fill="none"
        />
      )}
      {/* Carbs */}
      {cLen > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.carbs}
          strokeWidth={stroke}
          strokeDasharray={[cLen, Math.max(0, C - cLen)]}
          strokeDashoffset={norm(start + pLen)}
          strokeLinecap="butt"
          fill="none"
        />
      )}
      {/* Fat (resto exacto + EPS) */}
      {fLen > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.fat}
          strokeWidth={stroke}
          strokeDasharray={[fLen, Math.max(0, C - fLen)]}
          strokeDashoffset={norm(start + pLen + cLen)}
          strokeLinecap="butt"
          fill="none"
        />
      )}
    </Svg>
  );
}

/** Mini ring para cada alimento (usa el mismo algoritmo sin huecos) */
function MiniSegmentedRing({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <SegmentedRing size={56} stroke={8} protein={protein} carbs={carbs} fat={fat} />
    </View>
  );
}

/** Tarjeta macro con estilo consistente con draftId */
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

/** Card de score reutilizable */
function ScoreCard({
  icon,
  label,
  score10,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  score10: number;
  color: string;
}) {
  return (
    <View style={[styles.scoreCard, { borderWidth: 2, borderColor: color }]}>
      <View style={styles.scoreHeader}>
        <MaterialCommunityIcons name={icon} size={18} color="#fff" />
        <Text style={styles.scoreTitle}>
          {label}: {score10}/10
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(score10 / 10) * 100}%`, backgroundColor: color }]} />
      </View>
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

  // Resolver banner firmado (si existe imagen en algún item)
  useEffect(() => {
    let live = true;
    (async () => {
      const path = meal?.meal_items?.find((i) => !!i.image_path)?.image_path ?? null;
      if (!path) {
        setBanner(null);
        return;
      }
      const url = await signedImageUrl(path, 1200);
      if (live) setBanner(url ?? null);
    })();
    return () => {
      live = false;
    };
  }, [meal?.meal_items]);

  // Título de la comida
  const title = useMemo(() => {
    const items = meal?.meal_items ?? [];
    if (items.length === 0) return 'Meal';
    if (items.length === 1) return items[0].name;
    return `${items[0].name} + ${items.length - 1} more`;
  }, [meal?.meal_items]);

  // Scores (confianza y health simples)
  const confidence10 = useMemo(() => {
    const arr = (meal?.meal_items ?? []).map((i) =>
      typeof i.confidence === 'number' ? Math.max(0, Math.min(1, i.confidence)) : 0.8
    );
    if (!arr.length) return 7;
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10);
  }, [meal?.meal_items]);

  const health10 = useMemo(() => {
    const p = meal?.total_protein ?? 0;
    const c = meal?.total_carbs ?? 0;
    const f = meal?.total_fat ?? 0;
    const sum = p + c + f;
    if (sum <= 0) return 5;
    const pp = p / sum;
    const cp = c / sum;
    const fp = f / sum;
    const score = pp * 10 * 0.6 + (1 - Math.min(fp, 0.5)) * 10 * 0.25 + (1 - Math.min(cp, 0.7)) * 10 * 0.15;
    return Math.max(0, Math.min(10, Math.round(score)));
  }, [meal?.total_protein, meal?.total_carbs, meal?.total_fat]);

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
        {/* Banner arriba */}
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

        {/* Título izquierda – fecha derecha */}
        <View style={styles.topHeader}>
          <Text style={styles.topTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.topDate}>{formatDateTime(meal.logged_at)}</Text>
        </View>

        {/* Ring + macros */}
        <View style={styles.summaryRow}>
          <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.bigRingWrap}>
              <SegmentedRing
                size={240}
                stroke={16}
                protein={meal.total_protein}
                carbs={meal.total_carbs}
                fat={meal.total_fat}
              />
              <View style={styles.bigRingCenter}>
                <MaterialCommunityIcons name="google-analytics" size={36} color="#ffffff" />
                <Text style={styles.centerNote}>Macro-Analysis</Text>
              </View>
            </View>
          </View>

          <View style={styles.macroCol}>
            <MacroCard icon="fire" label="Calories" value={meal.total_kcal} unit="(kcal)" iconColor="#22c55e" borderColor="#22c55e" />
            <MacroCard icon="food-drumstick" label="Protein" value={meal.total_protein} unit="(g)" iconColor="#ef4444" borderColor="#ef4444" />
            <MacroCard icon="rice" label="Carbs" value={meal.total_carbs} unit="(g)" iconColor="#eab308" borderColor="#eab308" />
            <MacroCard icon="cheese" label="Fat" value={meal.total_fat} unit="(g)" iconColor="#f97316" borderColor="#f97316" />
          </View>
        </View>

        {/* Scores */}
        <ScoreCard icon="heart-circle" label="Health Score" score10={health10} color="#FF4D8D" />
        <ScoreCard icon="star-circle" label="Confidence Level" score10={confidence10} color="#68b6ef" />

        {/* Items */}
        <Text style={styles.section}>Items</Text>
        {(meal.meal_items ?? []).map((it) => (
          <View key={it.id} style={styles.itemCard}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.itemTitle}>{it.name}</Text>

              <View style={styles.foodRow}>
                <MaterialCommunityIcons name="weight" size={16} color="#68b6ef" />
                <Text style={styles.foodSub}>{it.weight_g} g</Text>

                <MaterialCommunityIcons name="fire-circle" size={16} color="#22c55e" style={{ marginLeft: 12 }} />
                <Text style={styles.foodSub}>{it.kcal} kcal</Text>
              </View>

              <View style={[styles.foodRow, { marginTop: 6 }]}>
                <MaterialCommunityIcons name="food-drumstick" size={16} color="#ef4444" />
                <Text style={styles.foodSub}>{it.protein} g</Text>

                <MaterialCommunityIcons name="rice" size={16} color="#eab308" style={{ marginLeft: 12 }} />
                <Text style={styles.foodSub}>{it.carbs} g</Text>

                <MaterialCommunityIcons name="cheese" size={16} color="#f97316" style={{ marginLeft: 12 }} />
                <Text style={styles.foodSub}>{it.fat} g</Text>
              </View>

              {typeof it.confidence === 'number' && <Text style={styles.itemConf}>conf: {Math.round((it.confidence ?? 0) * 100)}%</Text>}
            </View>

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

  bannerWrap: { width: '100%', overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  banner: { width: '100%', height: 260, resizeMode: 'cover', backgroundColor: '#000' },

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

  summaryRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8 },
  bigRingWrap: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  bigRingCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerNote: { color: '#fff', marginTop: 6, fontWeight: '700' },

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

  scoreCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 12,
    marginTop: 14,
  },
  scoreHeader: { flexDirection: 'row', alignItems: 'center' },
  scoreTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  progressTrack: { height: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 6 },

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
