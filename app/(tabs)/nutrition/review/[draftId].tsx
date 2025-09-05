// app/(tabs)/nutrition/review/[draftId].tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { signedImageUrl } from '@/lib/supabase';
import { useNutritionStore } from '@/store/nutritionStore';
import { WeightPad } from '@/components/nutrition/WeightPad';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FoodItem = {
  name: string;
  weight_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: number;
};

type FoodAnalysisResult = {
  imagePath: string; // ruta en Storage
  totals: { kcal?: number; calories?: number; protein: number; carbs: number; fat: number };
  confidence: number; // 0–1 o 1–10
  healthScore?: number; // 1–10
  items: FoodItem[];
};

export default function MealReviewScreen() {
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Selectores estables (Zustand v5)
  const storeDraftId = useNutritionStore((s) => s.draftId);
  const draft        = useNutritionStore((s) => s.draft) as FoodAnalysisResult | null;
  const isAnalyzing  = useNutritionStore((s) => s.isAnalyzing);
  const clearDraft   = useNutritionStore((s) => s.clearDraft);
  const saveDraft    = useNutritionStore((s) => s.saveDraft);

  const [bannerUrl, setBannerUrl]     = useState<string | null>(null);
  const [servings, setServings]       = useState<number>(1);
  const [saving, setSaving]           = useState(false);

  // Estado para visor a pantalla completa
  const [showFull, setShowFull]       = useState(false);

  // Edición por item
  const [edited, setEdited]           = useState<FoodItem[]>([]);
  const [editingIdx, setEditingIdx]   = useState<number | null>(null);
  const [weightPadVisible, setWPVis]  = useState(false);

  // Evitar early-return para no romper orden de hooks
  const hasDraft    = storeDraftId === draftId && !!draft;
  const imagePath   = hasDraft ? (draft as FoodAnalysisResult).imagePath : '';
  const totals      = hasDraft ? (draft as FoodAnalysisResult).totals : { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const confidence  = hasDraft ? (draft as FoodAnalysisResult).confidence : 0;
  const healthScore = hasDraft ? (draft as FoodAnalysisResult).healthScore : undefined;
  const baseItems   = hasDraft ? (draft as FoodAnalysisResult).items : [];

  // Inicializar "edited" con los items del draft (normalizando kcal/calories y redondeando)
  useEffect(() => {
    // Normalizamos 'kcal' por si el modelo entregó 'calories'
    setEdited(
      baseItems.map((it: any) => ({
        ...it,
        kcal: Math.round(Number((it as any)?.kcal ?? (it as any)?.calories ?? 0)),
        protein: Math.round(Number(it?.protein ?? 0)),
        carbs: Math.round(Number(it?.carbs ?? 0)),
        fat: Math.round(Number(it?.fat ?? 0)),
        weight_g: Math.round(Number(it?.weight_g ?? 0)),
      }))
    );
  }, [baseItems]);

  // Firmar URL del banner
  useEffect(() => {
    let live = true;
    (async () => {
      if (!imagePath) { setBannerUrl(null); return; }
      const url = await signedImageUrl(imagePath, 800);
      if (live) setBannerUrl(url);
    })();
    return () => { live = false; };
  }, [imagePath]);

  // Normalizaciones
  const baseKcal = (totals as any).kcal ?? (totals as any).calories ?? 0;
  const conf0to1 = confidence <= 1 ? Math.max(0, Math.min(1, confidence)) : Math.max(0, Math.min(10, confidence)) / 10;
  const conf10   = Math.round(conf0to1 * 10);
  const health10 = typeof healthScore === 'number' && !Number.isNaN(healthScore)
    ? Math.max(0, Math.min(10, Math.round(healthScore)))
    : 5;

  // Recalcular totales desde items editados; si no hay, usamos los totales del modelo
  const recomputed = useMemo(() => {
    if (!edited.length) {
      return {
        kcal:    baseKcal,
        protein: (totals as any).protein ?? 0,
        carbs:   (totals as any).carbs ?? 0,
        fat:     (totals as any).fat ?? 0,
      };
    }
    return edited.reduce(
      (acc, it) => ({
        kcal:    acc.kcal    + (it.kcal    ?? 0),
        protein: acc.protein + (it.protein ?? 0),
        carbs:   acc.carbs   + (it.carbs   ?? 0),
        fat:     acc.fat     + (it.fat     ?? 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [edited, baseKcal, totals]);

  // Totales mostrados con multiplicador de raciones
  const shown = useMemo(() => {
    const mul = Math.max(1, servings);
    return {
      kcal:    Math.round(recomputed.kcal    * mul),
      protein: Math.round(recomputed.protein * mul),
      carbs:   Math.round(recomputed.carbs   * mul),
      fat:     Math.round(recomputed.fat     * mul),
    };
  }, [recomputed, servings]);

  // Título: primer item + “+n more”
  const title = useMemo(() => {
    if (!edited || edited.length === 0) return 'Meal';
    if (edited.length === 1) return edited[0].name;
    const others = edited.length - 1;
    return `${edited[0].name} + ${others} more`;
  }, [edited]);

  const inc = () => setServings((n) => Math.min(10, n + 1));
  const dec = () => setServings((n) => Math.max(1, n - 1));

  const handleFix = () => router.push('/(tabs)/nutrition/fix-modal');

  const handleSave = async () => {
    try {
      setSaving(true);
      const mealId = await saveDraft(servings);
      if (!mealId) { setSaving(false); return; }
      clearDraft();
      router.replace('/(tabs)/nutrition');
    } finally {
      setSaving(false);
    }
  };

  // UI helpers (sin tocar diseño)
  const MacroCard = ({
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
  }) => (
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

  const ScoreCard = ({
    icon,
    label,
    score10,
    color,
  }: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    score10: number;
    color: string;
  }) => (
    <View style={[styles.scoreCard, { borderWidth: 2, borderColor: color }]}>
      <View style={styles.scoreHeader}>
        <MaterialCommunityIcons name={icon} size={18} color="#fff" />
        <Text style={styles.scoreTitle}>
          {label}: {score10}/10
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(score10 / 10) * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );

  // Lista mostrada (aplica raciones a cada item)
  const scaledItems = useMemo(() => {
    const mul = Math.max(1, servings);
    return edited.map((it, idx) => ({
      key: `${it.name}-${idx}`,
      idx,
      name: it.name,
      grams: Math.round(it.weight_g * mul),
      kcal: Math.round((it.kcal ?? 0) * mul),
      protein: Math.round((it.protein ?? 0) * mul),
      carbs: Math.round((it.carbs ?? 0) * mul),
      fat: Math.round((it.fat     ?? 0) * mul),
    }));
  }, [edited, servings]);

  // Abrir WeightPad para editar gramos del item
  const openEdit = (idx: number) => {
    setEditingIdx(idx);
    setWPVis(true);
  };

  // Confirmar valor de gramos desde WeightPad (reescalado usando el item previo ya normalizado)
  const onWeightPadConfirm = (grams: number) => {
    if (editingIdx === null) return;

    setEdited((prev) => {
      const next = [...prev];
      const prevItem = next[editingIdx];
      if (!prevItem || prevItem.weight_g <= 0) {
        next[editingIdx] = { ...next[editingIdx], weight_g: grams };
        return next;
      }
      const factor = grams / prevItem.weight_g;

      next[editingIdx] = {
        ...next[editingIdx],
        weight_g: grams,
        kcal:    Math.max(0, Math.round((prevItem.kcal    ?? 0) * factor)),
        protein: Math.max(0, Math.round((prevItem.protein ?? 0) * factor)),
        carbs:   Math.max(0, Math.round((prevItem.carbs   ?? 0) * factor)),
        fat:     Math.max(0, Math.round((prevItem.fat     ?? 0) * factor)),
      };
      return next;
    });

    setWPVis(false);
    setEditingIdx(null);
  };

  const onWeightPadClose = () => {
    setWPVis(false);
    setEditingIdx(null);
  };

  return (
    <ScrollView style={styles.bgBlack} contentContainerStyle={styles.scrollContent}>
      {/* Banner de imagen (tap -> pantalla completa) */}
      <View style={styles.bannerWrapper}>
        {bannerUrl ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setShowFull(true)}>
            <Image source={{ uri: bannerUrl }} style={styles.bannerImage} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.bannerImage, styles.center]}>
            <ActivityIndicator />
          </View>
        )}
      </View>

      {/* Modal de imagen casi a pantalla completa */}
      <Modal visible={showFull} transparent animationType="fade" onRequestClose={() => setShowFull(false)}>
        <TouchableWithoutFeedback onPress={() => setShowFull(false)}>
          <View style={styles.fullOverlay}>
            <TouchableWithoutFeedback>
              <Image source={{ uri: bannerUrl ?? undefined }} style={styles.fullImage} resizeMode="contain" />
            </TouchableWithoutFeedback>

            <TouchableOpacity
              style={[styles.fullClose, { top: insets.top + 10 }]}
              onPress={() => setShowFull(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={26} color="#22c55e" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Título + stepper de raciones */}
      <View style={styles.headerRow}>
        <Text numberOfLines={2} style={styles.titleText}>
          {title}
        </Text>

        <View style={styles.stepper}>
          <TouchableOpacity
            style={[styles.stepBtn, servings <= 1 && styles.stepBtnDisabled]}
            onPress={dec}
            disabled={servings <= 1}
          >
            <Ionicons name="remove" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.stepValue}>{servings}</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={inc}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid de macros (2 x 2) */}
      <View style={styles.row}>
        <MacroCard
          icon="fire"
          label="Calories"
          value={shown.kcal}
          unit="(kcal)"
          iconColor="#22c55e"
          borderColor="#22c55e"
        />
        <MacroCard
          icon="food-drumstick"
          label="Protein"
          value={shown.protein}
          unit="(g)"
          iconColor="#ef4444"
          borderColor="#ef4444"
        />
      </View>
      <View style={styles.row}>
        <MacroCard
          icon="rice"
          label="Carbs"
          value={shown.carbs}
          unit="(g)"
          iconColor="#eab308"
          borderColor="#eab308"
        />
        <MacroCard
          icon="cheese"
          label="Fat"
          value={shown.fat}
          unit="(g)"
          iconColor="#f97316"
          borderColor="#f97316"
        />
      </View>

      {/* Health score & Confidence */}
      <ScoreCard icon="heart-circle" label="Health Score" score10={health10} color="#FF4D8D" />
      <ScoreCard icon="star-circle" label="Confidence Level" score10={conf10} color="#87CEEB" />

      {/* Detected foods: tarjetas por item con botón de edición */}
      <View style={styles.detectedCard}>
        <Text style={styles.detectedTitle}>Detected foods</Text>
        <View style={styles.separator} />

        {scaledItems.map((it) => (
          <View key={it.key} style={styles.foodCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{it.name}</Text>
              <View style={styles.separator} />

              {/* fila: peso + calorías */}
              <View style={styles.foodRow}>
                <MaterialCommunityIcons name="weight" size={16} color="#68b6ef" />
                <Text style={styles.foodSub}>{it.grams} g</Text>

                <MaterialCommunityIcons name="fire-circle" size={16} color="#22c55e" style={{ marginLeft: 12 }} />
                <Text style={styles.foodSub}>{it.kcal} kcal</Text>
              </View>

              {/* fila: macros */}
              <View style={[styles.foodRow, { marginTop: 4 }]}>
                <MaterialCommunityIcons name="food-drumstick" size={16} color="#ef4444" />
                <Text style={styles.foodSub}>{it.protein} g</Text>

                <MaterialCommunityIcons name="rice" size={16} color="#eab308" style={{ marginLeft: 12 }} />
                <Text style={styles.foodSub}>{it.carbs} g</Text>

                <MaterialCommunityIcons name="cheese" size={16} color="#f97316" style={{ marginLeft: 12 }} />
                <Text style={styles.foodSub}>{it.fat} g</Text>
              </View>
            </View>

            {/* botón lápiz -> abre WeightPad */}
            <TouchableOpacity style={styles.pencilBtn} onPress={() => openEdit(it.idx)}>
              <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Botón "Add food" (estilo distinto; por ahora sin acción) */}
        <TouchableOpacity activeOpacity={0.8} style={styles.addFoodCard} onPress={() => { /* TODO */ }}>
          <MaterialCommunityIcons name="plus-circle" size={18} color="#22c55e" />
          <Text style={styles.addFoodText}>Add food</Text>
        </TouchableOpacity>
      </View>

      {/* WeightPad en gramos */}
      <WeightPad
        visible={weightPadVisible}
        onClose={onWeightPadClose}
        onConfirm={onWeightPadConfirm}
        initialGrams={editingIdx !== null ? (edited[editingIdx]?.weight_g ?? 0) : 0}
        foodName={editingIdx !== null ? (edited[editingIdx]?.name ?? 'Food') : 'Food'}
      />

      {/* Botones: Fix y Save */}
      <View style={[styles.actionRow]}>
        <TouchableOpacity style={styles.fixBtn} onPress={handleFix}>
          <MaterialCommunityIcons name="square-edit-outline" size={18} color="#fff" />
          <Text style={[styles.textWhite, styles.ml8]}>Fix ⭐</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, (isAnalyzing || saving) && styles.disabledBtn]}
          onPress={handleSave}
          disabled={isAnalyzing || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const CARD_BG = '#191B1F';
const TEXT_MID = '#D1D5DB';

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  bgBlack: { backgroundColor: '#000' },
  textWhite: { color: '#fff' },
  scrollContent: { paddingBottom: 48 },

  bannerWrapper: { width: '100%', overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  bannerImage: { width: '100%', height: 260 },

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
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    padding: 8,
  },

  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, paddingRight: 12 },

  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 6 },
  stepBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  stepBtnDisabled: { opacity: 0.5 },
  stepValue: { color: '#fff', fontSize: 16, fontWeight: '700', paddingHorizontal: 10 },

  row: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 12 },
  macroCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  macroIconWrap: {
    width: 32, height: 32, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 4,
  },
  macroValue: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  macroLabel: { color: '#FFF', marginTop: 2, fontSize: 14 },

  scoreCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 12,
    marginTop: 12,
  },
  scoreHeader: { flexDirection: 'row', alignItems: 'center' },
  scoreTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  progressTrack: { height: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 6 },

  detectedCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    marginHorizontal: 12,
    marginTop: 16,
    paddingBottom: 10,
  },
  detectedTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 6, marginBottom: 6 },

  // Tarjeta por alimento
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141518',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  foodName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  foodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  foodSub: { color: TEXT_MID, fontSize: 12, marginLeft: 6 },

  pencilBtn: { marginLeft: 12, backgroundColor: 'rgba(255,255,255,0.12)', padding: 10, borderRadius: 12 },

  // Botón "Add food" con bordes verdes a rayas
  addFoodCard: {
    marginTop: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#22c55e',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  addFoodText: { color: '#22c55e', marginLeft: 8, fontWeight: '700' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 18, marginBottom: 28 },
  fixBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16,
  },
  ml8: { marginLeft: 8 },
  saveBtn: { backgroundColor: '#22c55e', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16, minWidth: 120, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '700' },
});
