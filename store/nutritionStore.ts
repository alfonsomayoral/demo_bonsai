import { create } from 'zustand';
import { supabase, uploadMealImage, analyzeFoodImage } from '@/lib/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

/** Totales que usamos en UI y en el draft de IA */
type Totals = { calories: number; protein: number; carbs: number; fat: number };

/** Item que se muestra en la UI (normalizado) */
interface FoodItem {
  name: string;
  weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

/** Análisis actual (draft) que se muestra en la pantalla de review (normalizado) */
interface Analysis {
  imagePath: string;     // ruta en Storage (no URL pública)
  confidence: number;    // 0..1 ó 0..10
  healthScore?: number;  // 1..10
  items: FoodItem[];
  totals: Totals;
}

/** Fila mínima de BD para mostrar comidas reales del día */
type Meal = {
  id: string;
  logged_at: string;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_items?: Array<{
    id: string;
    name: string;
    weight_g: number;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    image_path?: string | null;
    confidence?: number | null;
  }>;
};

interface NutritionState {
  // Draft de análisis en memoria
  draftId: string | null;
  draft: Analysis | null;
  isAnalyzing: boolean;
  error: string | null;

  // Datos reales del día (para Home)
  todayMeals: Meal[];
  todayTotals: Totals;

  // Acciones
  analyzeNewPhoto: (fileUri: string) => Promise<string | null>;
  fixDraft: (text: string) => Promise<void>;
  saveDraft: () => Promise<string | null>;
  loadTodayData: () => Promise<void>;
  clearDraft: () => void;
}

/** ---- Helpers de normalización IA ---- */
function normalizeAnalysis(raw: any): Omit<Analysis, 'imagePath'> {
  // Totales
  const totalsRaw = raw?.totals ?? {};
  const totals: Totals = {
    calories: Math.round(Number(totalsRaw.calories ?? totalsRaw.kcal ?? 0)),
    protein:  Math.round(Number(totalsRaw.protein ?? 0)),
    carbs:    Math.round(Number(totalsRaw.carbs ?? 0)),
    fat:      Math.round(Number(totalsRaw.fat ?? 0)),
  };

  // Items
  const itemsRaw: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const items: FoodItem[] = itemsRaw.map((it) => ({
    name: String(it?.name ?? ''),
    weight_g: Math.round(Number(it?.weight_g ?? 0)),
    calories: Math.round(Number(it?.calories ?? it?.kcal ?? 0)),
    protein:  Math.round(Number(it?.protein ?? 0)),
    carbs:    Math.round(Number(it?.carbs ?? 0)),
    fat:      Math.round(Number(it?.fat ?? 0)),
    confidence: Number(it?.confidence ?? raw?.confidence ?? 1),
  }));

  // Confianza general
  const confidence = Number(raw?.confidence ?? 1);

  // Health score (1..10), si no llega lo aproximamos rápido (neutro=5)
  const healthRaw  = Number(raw?.health_score ?? raw?.healthScore ?? NaN);
  const healthScore = Number.isFinite(healthRaw) ? Math.max(1, Math.min(10, Math.round(healthRaw))) : undefined;

  return { confidence, healthScore, items, totals };
}

/** Generar un UUID robusto */
function genId() {
  try {
    // @ts-ignore
    const rnd = (globalThis as any)?.crypto?.randomUUID?.();
    return rnd || uuidv4();
  } catch {
    return uuidv4();
  }
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  /* ---------------------- estado inicial ---------------------- */
  draftId: null,
  draft: null,
  isAnalyzing: false,
  error: null,

  todayMeals: [],
  todayTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },

  /* ---------------------- capturar y analizar ---------------------- */
  analyzeNewPhoto: async (fileUri: string) => {
    set({ isAnalyzing: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1) Subir imagen a Storage
      const storagePath = await uploadMealImage(user.id, fileUri, 'snack');
      if (!storagePath) throw new Error('Image upload failed');

      // 2) Llamar a la Edge Function (IA) con { storagePath }
      const resp = await analyzeFoodImage(storagePath);
      if (!resp?.success) throw new Error(resp?.error ?? 'Edge-function error');

      // 3) Normalizar análisis a nuestro formato
      const norm = normalizeAnalysis(resp.analysis);

      // 4) Guardar draft en memoria
      const draftId = genId();
      set({
        draftId,
        draft: { imagePath: storagePath, ...norm },
        isAnalyzing: false,
      });
      return draftId;
    } catch (e: any) {
      set({ isAnalyzing: false, error: e?.message ?? 'Unexpected error' });
      return null;
    }
  },

  /* --------------------------- re-analizar ------------------------- */
  fixDraft: async (text: string) => {
    const { draft, draftId } = get();
    if (!draft || !draftId) return;

    set({ isAnalyzing: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const resp = await analyzeFoodImage(draft.imagePath, text);
      if (!resp?.success) throw new Error(resp?.error ?? 'Edge-function error');

      const norm = normalizeAnalysis(resp.analysis);
      set({ draft: { imagePath: draft.imagePath, ...norm }, isAnalyzing: false });
    } catch (e: any) {
      set({ isAnalyzing: false, error: e?.message ?? 'Unexpected error' });
    }
  },

  /* --------------------------- guardar en BD ------------------------ */
  saveDraft: async () => {
    const { draft } = get();
    if (!draft) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1) Insertar meal
      const { data: mealRow, error: mealErr } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          source_method: 'photo',
          total_kcal: Math.round(draft.totals.calories),
          total_protein: Math.round(draft.totals.protein),
          total_carbs: Math.round(draft.totals.carbs),
          total_fat: Math.round(draft.totals.fat),
        })
        .select()
        .single();

      if (mealErr) throw mealErr;
      const mealId: string = mealRow.id;

      // 2) Insertar items (guardando la RUTA en image_path)
      const itemsPayload = draft.items.map((it) => ({
        meal_id: mealId,
        name: it.name,
        weight_g: Math.round(it.weight_g),
        kcal: Math.round(it.calories),
        protein: Math.round(it.protein),
        carbs: Math.round(it.carbs),
        fat: Math.round(it.fat),
        confidence: it.confidence,
        image_path: draft.imagePath,
      }));

      const { error: itemsErr } = await supabase.from('meal_items').insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      // 3) refrescar “Hoy” y limpiar draft
      await get().loadTodayData();
      set({ draft: null, draftId: null });

      return mealId;
    } catch (e: any) {
      set({ error: e?.message ?? 'Save failed' });
      return null;
    }
  },

  /* --------------------- cargar comidas de hoy ---------------------- */
  loadTodayData: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end   = new Date(); end.setHours(23, 59, 59, 999);

      const { data: meals, error } = await supabase
        .from('meals')
        .select(`
          id,
          user_id,
          logged_at,
          total_kcal,
          total_protein,
          total_carbs,
          total_fat,
          meal_items (
            id, name, weight_g, kcal, protein, carbs, fat, image_path, confidence
          )
        `)
        .eq('user_id', user.id)
        .gte('logged_at', start.toISOString())
        .lte('logged_at', end.toISOString())
        .order('logged_at', { ascending: false });

      if (error) throw error;

      const totals = (meals ?? []).reduce<Totals>((acc, m: any) => ({
        calories: acc.calories + (m.total_kcal ?? 0),
        protein:  acc.protein  + (m.total_protein ?? 0),
        carbs:    acc.carbs    + (m.total_carbs ?? 0),
        fat:      acc.fat      + (m.total_fat ?? 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      set({ todayMeals: (meals as Meal[]) ?? [], todayTotals: totals });
    } catch (e) {
      console.error('loadTodayData error', e);
    }
  },

  /* ----------------------------- util ------------------------------ */
  clearDraft: () => set({ draft: null, draftId: null, error: null }),
}));
