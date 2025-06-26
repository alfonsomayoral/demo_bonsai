// filename: app/store/setStore.ts
import { create } from 'zustand';
import { supabase, isSupabaseConfigured, ExerciseSet } from '@/lib/supabase';

/* ───────────────────────────────
   State & Actions
─────────────────────────────────*/
interface SetState {
  sets: ExerciseSet[];
  loading: boolean;

  /* CRUD */
  loadSets: (sessionExerciseId: string) => Promise<void>;
  addSet: (
    sessionExerciseId: string,
    reps: number,
    weight: number,
    rpe?: number | null,
  ) => Promise<void>;
  duplicateSet: (setId: string) => void;

  /* Aliases / helpers */
  loadSetsForExercise: (sessionExerciseId: string) => Promise<void>;
  getSetCountForExercise: (sessionExerciseId: string) => number;
}

export const useSetStore = create<SetState>((set, get) => ({
  sets: [],
  loading: false,

  /*─────────────────────────────────────────────────────────────
    Cargar todos los sets de un ejercicio dentro de la sesión
  ─────────────────────────────────────────────────────────────*/
  async loadSets(sessionExerciseId) {
    if (!isSupabaseConfigured()) return;
    set({ loading: true });

    const { data, error } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('session_exercise_id', sessionExerciseId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[setStore] loadSets', error);
    }

    set({ sets: (data as ExerciseSet[]) ?? [], loading: false });
  },

  /* Alias para compatibilidad con la pantalla IA */
  loadSetsForExercise: async (sessionExerciseId) =>
    get().loadSets(sessionExerciseId),

  /*─────────────────────────────────────────────────────────────
    Crear un nuevo set
  ─────────────────────────────────────────────────────────────*/
  async addSet(sessionExerciseId, reps, weight, rpe) {
    const newSet: ExerciseSet = {
      id: crypto.randomUUID(),
      session_exercise_id: sessionExerciseId,
      reps,
      weight,
      rpe: rpe ?? null,
      created_at: new Date().toISOString(),
      volume: reps * weight,
    };

    /* Solo estado local en modo offline */
    if (!isSupabaseConfigured()) {
      set({ sets: [...get().sets, newSet] });
      return;
    }

    const { data, error } = await supabase
      .from('exercise_sets')
      .insert(newSet)
      .select()
      .single();
    if (error) throw error;

    set({ sets: [...get().sets, data as ExerciseSet] });
  },

  /*─────────────────────────────────────────────────────────────
    Duplicar un set existente
  ─────────────────────────────────────────────────────────────*/
  duplicateSet(setId) {
    const original = get().sets.find((s) => s.id === setId);
    if (!original) return;

    const copy: ExerciseSet = {
      ...original,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    get().addSet(copy.session_exercise_id, copy.reps, copy.weight, copy.rpe);
  },

  /*─────────────────────────────────────────────────────────────
    Devuelve cuántos sets tiene ese ejercicio dentro de la sesión
  ─────────────────────────────────────────────────────────────*/
  getSetCountForExercise(sessionExerciseId) {
    return get().sets.filter(
      (s) => s.session_exercise_id === sessionExerciseId,
    ).length;
  },
}));
