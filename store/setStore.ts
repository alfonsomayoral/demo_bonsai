/* filename: app/store/setStore.ts */
import { create } from 'zustand';
import {
  supabase,
  isSupabaseConfigured,
  ExerciseSet,
} from '@/lib/supabase';

interface SetState {
  sets: ExerciseSet[];
  loading: boolean;

  loadSets: (sessionExerciseId: string) => Promise<void>;
  loadSetsForExercise: (sessionExerciseId: string) => Promise<void>;
  addSet: (
    sessionExerciseId: string,
    reps: number,
    weight: number,
    rpe?: number | null,
  ) => Promise<void>;
  duplicateSet: (setId: string) => void;
  getSetCountForExercise: (sessionExerciseId: string) => number;
}

export const useSetStore = create<SetState>((set, get) => ({
  /* state ---------------------- */
  sets: [],
  loading: false,

  /* 1 ─ cargar sets ------------- */
  async loadSets(sessionExerciseId) {
    if (!isSupabaseConfigured()) return;
    set({ loading: true });

    const { data, error } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('session_exercise_id', sessionExerciseId)
      .order('performed_at', { ascending: true });

    if (error) console.error('[setStore] loadSets', error);
    set({ sets: (data as ExerciseSet[]) ?? [], loading: false });
  },
  loadSetsForExercise: async (id) => get().loadSets(id),

  /* 2 ─ añadir set -------------- */
  async addSet(sessionExerciseId, reps, weight, rpe) {
    /* uid si estamos online */
    let uid: string | null = null;
    if (isSupabaseConfigured()) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id ?? null;
    }

    const newSet: ExerciseSet = {
      id: crypto.randomUUID(),
      session_exercise_id: sessionExerciseId,
      user_id: uid ?? 'offline',
      reps,
      weight,
      rpe: rpe ?? null,
      performed_at: new Date().toISOString(),
      volume: reps * weight,
    };

    /* OFF-LINE */
    if (!isSupabaseConfigured()) {
      set({ sets: [...get().sets, newSet] });
      return;
    }

    /* ON-LINE */
    const { data, error } = await supabase
      .from('exercise_sets')
      .insert(newSet)
      .select()
      .single();

    if (error) {
      console.error('[setStore] addSet (insert)', error);
      return;
    }

    set({ sets: [...get().sets, data as ExerciseSet] });
  },

  /* 3 ─ duplicar set ------------- */
  duplicateSet(setId) {
    const original = get().sets.find((s) => s.id === setId);
    if (!original) return;
    void get().addSet(
      original.session_exercise_id,
      original.reps,
      original.weight,
      original.rpe,
    );
  },

  /* 4 ─ utilidad ----------------- */
  getSetCountForExercise(sessionExerciseId) {
    return get().sets.filter((s) => s.session_exercise_id === sessionExerciseId)
      .length;
  },
}));
