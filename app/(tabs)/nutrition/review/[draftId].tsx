import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNutritionStore } from '@/store/nutritionStore';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { signedImageUrl } from '@/lib/supabase';

/* --- Tipos auxiliares — alineados con el store --- */
interface FoodItem {
  name: string;
  weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

interface FoodAnalysisResult {
  imagePath: string; // ruta en Storage (no URL pública)
  totals: { calories: number; protein: number; carbs: number; fat: number };
  confidence: number; // puede venir 0–1 o 0–10
  items: FoodItem[];
}

export default function MealReviewScreen() {
  /* 1 · Tomar el parámetro de la URL */
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const router = useRouter();

  /* 2 · Obtener draft, saveDraft & clearDraft del store */
  const { draft, clearDraft, saveDraft, isAnalyzing } = useNutritionStore((s) => ({
    draft: s.draftId === draftId ? (s.draft as FoodAnalysisResult | null) : null,
    clearDraft: s.clearDraft,
    saveDraft: s.saveDraft,
    isAnalyzing: s.isAnalyzing,
  }));

  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* 3 · Si no hay draft válido mostrar fallback */
  if (!draft) {
    return (
      <View style={[styles.flex1, styles.center, styles.bgBlack]}>
        <Text style={styles.textWhite}>Draft not found</Text>
      </View>
    );
  }

  const { imagePath, totals, confidence, items } = draft;

  // normaliza confidence a barra 0–1 y score 0–10
  const { progress, score10 } = useMemo(() => {
    const isZeroToOne = confidence <= 1;
    const p = isZeroToOne ? confidence : confidence / 10;
    const s = isZeroToOne ? Math.round(confidence * 10) : Math.round(confidence);
    return { progress: Math.max(0, Math.min(1, p)), score10: Math.max(0, Math.min(10, s)) };
  }, [confidence]);

  // Resolver signed URL para el banner
  useEffect(() => {
    let live = true;
    (async () => {
      const url = await signedImageUrl(imagePath, 300);
      if (live) setBannerUrl(url);
    })();
    return () => {
      live = false;
    };
  }, [imagePath]);

  /* Helper para las tarjetas de macros */
  const MacroCard = ({ label, value, unit = 'kcal' }: { label: string; value: number; unit?: string }) => (
    <View style={styles.macroCard}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>
        {label} {unit}
      </Text>
    </View>
  );

  const handleFix = () => {
    router.push('/(tabs)/nutrition/fix-modal');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const mealId = await saveDraft();
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

  return (
    <ScrollView style={styles.bgBlack} contentContainerStyle={styles.scrollContent}>
      {/* Foto/banner */}
      <View style={styles.bannerWrapper}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={styles.bannerImage} />
        ) : (
          <View style={[styles.bannerImage, styles.center]}>
            <ActivityIndicator />
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Macros totales */}
        <View style={styles.row}>
          <MacroCard label="Calories" value={totals.calories} />
          <MacroCard label="Protein" value={totals.protein} unit="g" />
        </View>
        <View style={styles.row}>
          <MacroCard label="Carbs" value={totals.carbs} unit="g" />
          <MacroCard label="Fat" value={totals.fat} unit="g" />
        </View>

        {/* Confianza */}
        <Text style={[styles.textWhite, styles.mt12]}>Confidence: {score10}/10</Text>
        <ProgressBar progress={progress} color="#00E676" style={styles.progressBar} />

        {/* Lista de ítems */}
        <Text style={[styles.textWhite, styles.mt16, styles.mb8, styles.textLg]}>Detected foods</Text>
        {items.map((it, i) => (
          <View key={`${it.name}-${i}`} style={styles.itemRow}>
            <Text style={styles.textWhite}>{it.name}</Text>
            <Text style={styles.textGray}>{it.weight_g} g</Text>
          </View>
        ))}

        {/* Botones Fix & Save */}
        <View style={[styles.row, styles.mt24, styles.spaceBetween]}>
          <TouchableOpacity style={styles.fixBtn} onPress={handleFix} disabled={isAnalyzing || saving}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={[styles.textWhite, styles.ml8]}>Fix ⭐</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, (isAnalyzing || saving) && styles.disabledBtn]}
            onPress={handleSave}
            disabled={isAnalyzing || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  bgBlack: { backgroundColor: '#000' },
  textWhite: { color: '#fff' },
  textGray: { color: '#9CA3AF' },
  textLg: { fontSize: 18, fontWeight: '600' },

  scrollContent: { paddingBottom: 32 },
  bannerWrapper: { width: '100%', overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  bannerImage: { width: '100%', height: 240 },
  body: { marginTop: 16, paddingHorizontal: 16 },

  row: { flexDirection: 'row' },
  spaceBetween: { justifyContent: 'space-between' },

  macroCard: {
    flex: 1,
    margin: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  macroValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  macroLabel: { color: '#D1D5DB', marginTop: 4 },

  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mb8: { marginBottom: 8 },
  mt24: { marginTop: 24 },

  progressBar: { height: 8, borderRadius: 4 },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  fixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  ml8: { marginLeft: 8 },

  saveBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveText: { color: '#fff', fontWeight: '700' },
});
