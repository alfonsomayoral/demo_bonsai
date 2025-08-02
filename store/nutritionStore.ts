import { create } from 'zustand';
import {supabase, uploadMealImage, analyzeFoodImage } from '@/lib/supabase';

type Totals = { calories: number; protein: number; carbs: number; fat: number };

interface FoodItem { name: string; weight_g: number; calories: number; protein: number; carbs: number; fat: number; confidence: number }
interface Analysis { imageUrl: string; confidence: number; items: FoodItem[]; totals: Totals }

interface NutritionState {
  isAnalyzing: boolean;
  analysisError: string | null;
  draftId: string | null;
  current: Analysis | null;
  analyzeFood: (fileUri: string) => Promise<void>;
  fixAnalysis: (text: string) => Promise<void>;
  clear: () => void;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  isAnalyzing: false,
  analysisError: null,
  draftId: null,
  current: null,

  analyzeFood: async (fileUri) => {
    set({ isAnalyzing: true, analysisError: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const imageUrl = await uploadMealImage(user.id, fileUri, 'snack');
      if (!imageUrl) throw new Error('Upload failed');

      const result = await analyzeFoodImage(imageUrl, user.id);
      if (!result.success) throw new Error(result.error);

      set({
        isAnalyzing: false,
        draftId: crypto.randomUUID(),
        current: { imageUrl, ...result.analysis },
      });
    } catch (e: any) {
      set({ isAnalyzing: false, analysisError: e.message });
    }
  },

  fixAnalysis: async (text) => {
    const { current, draftId } = get();
    if (!current || !draftId) return;
    set({ isAnalyzing: true, analysisError: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result = await analyzeFoodImage(current.imageUrl, user.id, text);
      if (!result.success) throw new Error(result.error);

      set({
        isAnalyzing: false,
        current: { imageUrl: current.imageUrl, ...result.analysis },
      });
    } catch (e: any) {
      set({ isAnalyzing: false, analysisError: e.message });
    }
  },

  clear: () => set({ current: null, draftId: null, analysisError: null }),
}));
