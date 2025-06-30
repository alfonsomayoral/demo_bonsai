import { create } from 'zustand';
import { supabase, isSupabaseConfigured, Exercise } from '@/lib/supabase';

interface ExerciseState {
  exercises: Exercise[];
  loading: boolean;

  searchExercises: (q: string, group?: string) => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  addExerciseToRoutine: (routineId: string, exerciseId: string) => Promise<void>;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  loading: false,

  /*───────── búsqueda por nombre ─────────*/
  async searchExercises(q, group) {
    if (!isSupabaseConfigured()) return;
    set({ loading: true });

    const req = supabase
      .from('exercises')
      .select('*')
      .ilike('name', `%${q}%`)
      .order('name', { ascending: true })
      .limit(50);

    if (group && group !== 'All') req.eq('muscle_group', group);

    const { data, error } = await req;
    if (error) console.error('[exerciseStore] searchExercises', error);

    set({ exercises: (data as Exercise[]) ?? [], loading: false });
  },

  /*───────── helper get-by-id ─────────*/
  getExerciseById(id) {
    return get().exercises.find((e) => e.id === id);
  },

  /*────── añadir ejercicio a rutina ─────*/
  async addExerciseToRoutine(routineId, exerciseId) {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('routine_exercises')
      .insert({
        routine_id: routineId,
        exercise_id: exerciseId,
        order_idx: 999,
      });

    // si ya existía, ignoramos el UNIQUE-violation (23505)
    if (error && error.code !== '23505') throw error;
  },
}));
