/* filename: app/store/setStore.ts
   Gestiona las series (sets) de un ejercicio dentro de una sesión de workout
   Tipos estrictos y vinculación correcta al user_id autenticado.
*/
import { create } from 'zustand';
import {
  supabase,
  isSupabaseConfigured,
  ExerciseSet,
} from '@/lib/supabase';

/*───────────────────────────────
  State & actions (Zustand)
────────────────────────────────*/
interface SetState {
  /* data */
  sets: ExerciseSet[];
  loading: boolean;

  /* crud / helpers */
  loadSets: (sessionExerciseId: string) => Promise<void>;
  loadSetsForExercise: (sessionExerciseId: string) => Promise<void>; // alias
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
  /*────────────────────────────── initial state ─────────────────────────*/
  sets: [],
  loading: false,

  /*────────────────────────────────────────────────────────────────────────
    1) Cargar sets de un ejercicio concreto
  ────────────────────────────────────────────────────────────────────────*/
  async loadSets(sessionExerciseId) {
    if (!isSupabaseConfigured()) return;

    set({ loading: true });

    const { data, error } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('session_exercise_id', sessionExerciseId)
      .order('performed_at', { ascending: true });

    if (error) console.error('[setStore] loadSets:', error);

    set({ sets: (data as ExerciseSet[]) ?? [], loading: false });
  },

  /* alias: la pantalla IA llama a este nombre */
  loadSetsForExercise: async (sessionExerciseId) =>
    get().loadSets(sessionExerciseId),

  /*────────────────────────────────────────────────────────────────────────
    2) Crear / registrar un nuevo set
  ────────────────────────────────────────────────────────────────────────*/
  async addSet(sessionExerciseId, reps, weight, rpe) {
    /* Obtener UID si estamos online */
    let uid: string | null = null;

    if (isSupabaseConfigured()) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id ?? null;
      if (!uid) {
        console.warn('[setStore] addSet: usuario no autenticado');
        return;
      }
    }

    const newSet: ExerciseSet = {
      id: crypto.randomUUID(),
      session_exercise_id: sessionExerciseId,
      user_id: uid ?? 'offline', // placeholder cuando no hay Supabase
      reps,
      weight,
      rpe: rpe ?? null,
      performed_at: new Date().toISOString(),
      volume: reps * weight,
    };

    /* ─── OFFLINE: mutar solo la store ────────────────────────────────*/
    if (!isSupabaseConfigured()) {
      set({ sets: [...get().sets, newSet] });
      return;
    }

    /* ─── ONLINE: insertar en Supabase y devolver fila con defaults ───*/
    const { data, error } = await supabase
      .from('exercise_sets')
      .insert(newSet)
      .select()
      .single();

    if (error) {
      console.error('[setStore] addSet (insert):', error);
      return;
    }

    set({ sets: [...get().sets, data as ExerciseSet] });
  },

  /*────────────────────────────────────────────────────────────────────────
    3) Duplicar rápidamente un set (swipe→duplicate)
  ────────────────────────────────────────────────────────────────────────*/
  duplicateSet(setId) {
    const original = get().sets.find((s) => s.id === setId);
    if (!original) return;

    /* Reutilizamos addSet para mantener lógica única */
    void get().addSet(
      original.session_exercise_id,
      original.reps,
      original.weight,
      original.rpe,
    );
  },

  /*────────────────────────────────────────────────────────────────────────
    4) Utilidad: número de sets para un ejercicio
  ────────────────────────────────────────────────────────────────────────*/
  getSetCountForExercise(sessionExerciseId) {
    return get().sets.filter(
      (s) => s.session_exercise_id === sessionExerciseId,
    ).length;
  },
}));
