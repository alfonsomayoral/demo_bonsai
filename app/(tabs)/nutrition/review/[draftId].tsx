import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { signedImageUrl } from '@/lib/supabase';
import { useNutritionStore } from '@/store/nutritionStore';

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

  // Selectores estables (sin objetos literales) para Zustand v5
  const storeDraftId = useNutritionStore((s) => s.draftId);
  const draft        = useNutritionStore((s) => s.draft) as FoodAnalysisResult | null;
  const isAnalyzing  = useNutritionStore((s) => s.isAnalyzing);
  const clearDraft   = useNutritionStore((s) => s.clearDraft);
  const saveDraft    = useNutritionStore((s) => s.saveDraft);

  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [servings, setServings]   = useState<number>(1);
  const [saving, setSaving]       = useState(false);

  const activeDraft = storeDraftId === draftId ? draft : null;
  if (!activeDraft) {
    return (
      <View style={[styles.flex1, styles.center, styles.bgBlack]}>
        <Text style={styles.textWhite}>Draft not found</Text>
      </View>
    );
  }

  const { imagePath, totals, confidence, healthScore, items } = activeDraft;

  useEffect(() => {
    let live = true;
    (async () => {
      const url = await signedImageUrl(imagePath, 300);
      if (live) setBannerUrl(url);
    })();
    return () => { live = false; };
  }, [imagePath]);

  // Normalizaciones (kcal vs calories; confidence 0–1 vs 1–10)
  const baseKcal = totals.kcal ?? (totals as any).calories ?? 0;
  const conf0to1 = confidence <= 1 ? Math.max(0, Math.min(1, confidence)) : Math.max(0, Math.min(10, confidence)) / 10;
  const conf10   = Math.round(conf0to1 * 10);
  const health10 = typeof healthScore === 'number' && !Number.isNaN(healthScore) ? Math.max(0, Math.min(10, Math.round(healthScore))) : 5;

  // Totales mostrados con multiplicador
  const shown = useMemo(() => {
    const mul = Math.max(1, servings);
    return {
      kcal: Math.round(baseKcal * mul),
      protein: Math.round(totals.protein * mul),
      carbs: Math.round(totals.carbs * mul),
      fat: Math.round(totals.fat * mul),
    };
  }, [baseKcal, totals, servings]);

  // Nombre de la comida (título): usa el primer item; si hay muchos, indica “+n more”
  const title = useMemo(() => {
    if (!items || items.length === 0) return 'Meal';
    if (items.length === 1) return items[0].name;
    const others = items.length - 1;
    return `${items[0].name} + ${others} more`;
  }, [items]);

  const inc = () => setServings((n) => Math.min(10, n + 1));
  const dec = () => setServings((n) => Math.max(1, n - 1));

  const handleFix = () => router.push('/(tabs)/nutrition/fix-modal');

  const handleSave = async () => {
    try {
      setSaving(true);
      const mealId = await saveDraft(servings); // ⟵ guarda aplicando multiplicador
      if (!mealId) {
        setSaving(false);
        return;
      }
      clearDraft();
      router.replace(`/(tabs)/nutrition/detail/${mealId}`);
    } finally {
      setSaving(false);
    }
  };

  // UI helpers ──────────────────────────────────────────────────
  const MacroCard = ({
    icon,
    label,
    value,
    unit,
    iconColor = "#fff",
    borderColor,
  }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: number; unit: string; iconColor?: string; borderColor?: string }) => (
    <View style={[styles.macroCard, borderColor && { borderWidth: 1, borderColor }]}>
      <View style={styles.macroIconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label} {unit}</Text>
    </View>
  );

  const ScoreCard = ({
    icon,
    label,
    score10,
    color,
  }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; score10: number; color: string }) => (
    <View style={[styles.scoreCard, { borderWidth: 2, borderColor: color }]}>
      <View style={styles.scoreHeader}>
        <MaterialCommunityIcons name={icon} size={18} color="#fff" />
        <Text style={styles.scoreTitle}>{label}: {score10}/10</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(score10 / 10) * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  const scaledItems = useMemo(() => {
    const mul = Math.max(1, servings);
    return items.map((it, idx) => ({
      key: `${it.name}-${idx}`,
      name: it.name,
      grams: Math.round(it.weight_g * mul),
    }));
  }, [items, servings]);

  return (
    <ScrollView style={styles.bgBlack} contentContainerStyle={styles.scrollContent}>
      {/* Banner de imagen */}
      <View style={styles.bannerWrapper}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={styles.bannerImage} />
        ) : (
          <View style={[styles.bannerImage, styles.center]}>
            <ActivityIndicator />
          </View>
        )}
      </View>

      {/* Título + stepper de raciones */}
      <View style={styles.headerRow}>
        <Text numberOfLines={2} style={styles.titleText}>{title}</Text>

        <View style={styles.stepper}>
          <TouchableOpacity style={[styles.stepBtn, servings <= 1 && styles.stepBtnDisabled]} onPress={dec} disabled={servings <= 1}>
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
        <MacroCard icon="fire" label="Calories" value={shown.kcal} unit="(kcal)" iconColor="#22c55e" borderColor="#22c55e" />
        <MacroCard icon="food-drumstick" label="Protein" value={shown.protein} unit="(g)" iconColor="#ef4444" borderColor="#ef4444" />
      </View>
      <View style={styles.row}>
        <MacroCard icon="rice" label="Carbs" value={shown.carbs} unit="(g)" iconColor="#eab308" borderColor="#eab308" />
        <MacroCard icon="cheese" label="Fat" value={shown.fat} unit="(g)" iconColor="#f97316" borderColor="#f97316" />
      </View>

      {/* Health score & Confidence */}
      <ScoreCard icon="heart-circle" label="Health Score" score10={health10} color="#FF4D8D" />
      <ScoreCard icon="star-circle" label="Confidence Level" score10={conf10} color="#87CEEB" />

      {/* Detected foods */}
      <View style={styles.detectedCard}>
        <Text style={styles.detectedTitle}>Detected foods</Text>
        <View style={styles.separator} />
        {scaledItems.map((it, i) => (
          <View key={it.key} style={styles.itemRow}>
            <Text style={styles.itemName}>{it.name}</Text>
            <Text style={styles.itemGrams}>{it.grams} g</Text>
          </View>
        ))}
      </View>

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

const CARD_BG = 'rgba(255,255,255,0.06)';
const TEXT_MID = '#D1D5DB';

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  bgBlack: { backgroundColor: '#000' },
  textWhite: { color: '#fff' },
  scrollContent: { paddingBottom: 48 },

  bannerWrapper: { width: '100%', overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  bannerImage: { width: '100%', height: 260 },

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
    paddingBottom: 6,
  },
  detectedTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 10 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  itemName: { color: '#fff' },
  itemGrams: { color: TEXT_MID },

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
