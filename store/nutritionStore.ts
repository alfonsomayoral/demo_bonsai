import { create } from 'zustand';
import { supabase, uploadMealImage, analyzeFoodImage } from '@/lib/supabase';

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
  draftId: null,
  draft: null,
  isAnalyzing: false,
  error: null,

  analyzeNewPhoto: async (fileUri) => {
    set({ isAnalyzing: true, error: null });
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      // 1. Subir la imagen
      const imageUrl = await uploadMealImage(user.id, fileUri, 'snack');
      if (!imageUrl) throw new Error('Upload failed');

      // 2. Llamar a la función Edge
      const result = await analyzeFoodImage(imageUrl, user.id);
      if (!result.success) throw new Error(result.error);

      // 3. Guardar draft
      const draftId = crypto.randomUUID();
      set({
        draftId,
        draft: { imageUrl, ...result.analysis },
        isAnalyzing: false,
      });
      return draftId;
    } catch (e: any) {
      set({ isAnalyzing: false, error: e.message });
      return null;
    }
  },

  fixDraft: async (text) => {
    const { draft, draftId } = get();
    if (!draft || !draftId) return;
    set({ isAnalyzing: true, error: null });
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const result = await analyzeFoodImage(draft.imageUrl, user.id, text);
      if (!result.success) throw new Error(result.error);

      set({
        draft: { imageUrl: draft.imageUrl, ...result.analysis },
        isAnalyzing: false,
      });
    } catch (e: any) {
      set({ isAnalyzing: false, error: e.message });
    }
  },

  clearDraft: () => set({ draft: null, draftId: null, error: null }),
}));
