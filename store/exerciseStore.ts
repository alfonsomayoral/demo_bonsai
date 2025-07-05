import { create } from 'zustand';
import { supabase, isSupabaseConfigured, Exercise } from '@/lib/supabase';
import { useWorkoutStore } from '@/store/workoutStore';

interface ExerciseState {
  exercises: Exercise[];
  loading: boolean;

  /* búsquedas / helpers */
  searchExercises: (q: string, group?: string) => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  /** Devuelve el ejercicio asociado a sessionExerciseId, asegurándose de cargarlo */
  getExerciseBySessionId: (sessionId: string) => Exercise | null;
  addExerciseToRoutine: (routineId: string, exerciseId: string) => Promise<void>;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  loading: false,

  /*───────── 1. búsqueda ─────────*/
  async searchExercises(q = '', group) {
    if (!isSupabaseConfigured()) return;
    set({ loading: true });
  
    const req = supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true })
      .limit(100);
  
    /* sin texto ⇒ no aplicar filtro de nombre */
    if (q.trim()) req.ilike('name', `%${q}%`);
    if (group && group !== 'All') req.eq('muscle_group', group);
  
    const { data, error } = await req;
    if (error) console.error('[exerciseStore] searchExercises', error);
  
    set({ exercises: (data as Exercise[]) ?? [], loading: false });
  },

  /*───────── 2. helpers ─────────*/
  getExerciseById(id) {
    return get().exercises.find((e) => e.id === id);
  },

  getExerciseBySessionId(sessionId) {
    const se = useWorkoutStore.getState().exercises.find((e) => e.id === sessionId);
    if (!se) return null;

    /* ¿lo tengo en cache? */
    const cached = get().exercises.find((ex) => ex.id === se.exercise_id);
    if (cached) return cached;

    /* ——— no está: lo cargo una vez y lo meto en el estado ——— */
    (async () => {
      if (!isSupabaseConfigured()) return;
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', se.exercise_id)
        .single();
      if (data) set({ exercises: [...get().exercises, data as Exercise] });
    })();

    return null;
  },

  /*───────── 3. rutina ─────────*/
  async addExerciseToRoutine(routineId, exerciseId) {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('routine_exercises')
      .insert({
        routine_id: routineId,
        exercise_id: exerciseId,
        order_idx: 999,
      });

    /* ignoramos duplicados */
    if (error && error.code !== '23505') throw error;
  },
}));
