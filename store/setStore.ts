import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
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
  sets: [],
  loading: false,

  /* ────── cargar ────── */
  async loadSets(sessionExerciseId) {
    if (!isSupabaseConfigured()) return;
    set({ loading: true });

    const { data, error } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('session_exercise_id', sessionExerciseId)
      .order('performed_at');

    if (error) console.error('[setStore] loadSets', error);

    set((s) => {
      const map = new Map<string, ExerciseSet>();
      s.sets.forEach((row) => map.set(row.id, row));
      (data as ExerciseSet[]).forEach((row) => map.set(row.id, row));
      return { sets: Array.from(map.values()), loading: false };
    });
  },

  /* ────── añadir ────── */
  async addSet(sessionExerciseId, reps, weight, rpe) {
    const now = new Date().toISOString();

    const local: ExerciseSet = {
      id: uuidv4(),                       // UUID v4 válido
      session_exercise_id: sessionExerciseId,
      reps,
      weight,
      rpe: rpe ?? null,
      performed_at: now,
      created_at: now,
      volume: reps * weight,              // solo para la UI offline
    };

    /* pinta inmediatamente */
    set((s) => ({ sets: [...s.sets, local] }));

    /* sincronizar si hay sesión */
    if (
      isSupabaseConfigured() &&
      (await supabase.auth.getSession()).data.session
    ) {
      const { error } = await supabase.from('exercise_sets').insert({
        id: local.id,                      // mismo UUID
        session_exercise_id: local.session_exercise_id,
        reps: local.reps,
        weight: local.weight,
        rpe: local.rpe,
        performed_at: local.performed_at,
        created_at: local.created_at,
        /* volume OMITIDO – columna generada */
      });

      if (error) {
        console.error('[setStore] addSet (sync)', error);
      } else {
        /* recargar para traer la fila con volume calculado */
        void get().loadSets(sessionExerciseId);
      }
    }
  },

  /* ────── duplicar ────── */
  duplicateSet(id) {
    const src = get().sets.find((s) => s.id === id);
    if (src)
      get().addSet(src.session_exercise_id, src.reps, src.weight, src.rpe);
  },

  /* ────── helper ────── */
  getSetCountForExercise(id) {
    return get().sets.filter((s) => s.session_exercise_id === id).length;
  },
}));
