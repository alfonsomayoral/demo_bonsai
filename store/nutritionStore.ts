// store/nutritionStore.ts  — fragmento relevante
import { create } from 'zustand';
import { supabase, uploadMealImage, analyzeFoodImage } from '@/lib/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type Totals = { calories: number; protein: number; carbs: number; fat: number };
interface FoodItem { name: string; weight_g: number; calories: number; protein: number; carbs: number; fat: number; confidence: number }
interface Analysis { imageUrl: string; confidence: number; items: FoodItem[]; totals: Totals }

interface NutritionState {
  draftId: string | null;
  draft: Analysis | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeNewPhoto: (fileUri: string) => Promise<string | null>;
  fixDraft: (text: string) => Promise<void>;
  clearDraft: () => void;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  draftId : null,
  draft   : null,
  isAnalyzing : false,
  error   : null,

  /* ---------------------- capturar y analizar ---------------------- */
  analyzeNewPhoto: async (fileUri: string) => {
    set({ isAnalyzing: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      /* 1· subir imagen */
      const imageUrl = await uploadMealImage(user.id, fileUri, 'snack');
      if (!imageUrl) throw new Error('Image upload failed');

      /* 2· llamar función Edge */
      const { success, analysis, error } = await analyzeFoodImage(imageUrl, user.id);
      if (!success) throw new Error(error ?? 'Edge-function error');

      /* 3· guardar en el store */
      const draftId = crypto.randomUUID?.() || uuidv4();
      set({
        draftId,
        draft: { imageUrl, ...analysis },   // ← FIX aquí
        isAnalyzing: false,
      });
      return draftId;
    } catch (e: any) {
      set({ isAnalyzing: false, error: e.message });
      return null;
    }
  },

  /* --------------------------- re-analizar ------------------------- */
  fixDraft: async (text) => {
    const { draft, draftId } = get();
    if (!draft || !draftId) return;

    set({ isAnalyzing: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { success, analysis, error } = await analyzeFoodImage(draft.imageUrl, user.id, text);
      if (!success) throw new Error(error ?? 'Edge-function error');

      set({
        draft: { imageUrl: draft.imageUrl, ...analysis },   // ← y aquí
        isAnalyzing: false,
      });
    } catch (e: any) {
      set({ isAnalyzing: false, error: e.message });
    }
  },

  clearDraft: () => set({ draft: null, draftId: null, error: null }),
}));
