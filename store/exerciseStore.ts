import { create } from 'zustand';
import {
  supabase,
  isSupabaseConfigured,
  Exercise,
} from '@/lib/supabase';
import { useWorkoutStore } from '@/store/workoutStore';

/* helper */
const toTitle = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface ExerciseState {
  exercises: Exercise[];
  loading: boolean;

  muscles: Set<string>;
  levels: Set<string>;

  searchExercises: (q?: string) => Promise<void>;
  toggleMuscle: (m: string) => void;
  toggleLevel: (l: string) => void;
  clearFilters: () => void;

  getExerciseById: (id: string) => Exercise | undefined;
  getExerciseBySessionId: (sid: string) => Exercise | null;
  addExerciseToRoutine: (rid: string, eid: string) => Promise<void>;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  loading: false,

  muscles: new Set<string>(),
  levels: new Set<string>(),

  /*──────────────────── búsqueda ────────────────────*/
  async searchExercises(q = '') {
    if (!isSupabaseConfigured()) return;
    set({ loading: true });

    const { muscles, levels } = get();

    const req = supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true })
      .limit(250);

    /* texto libre */
    if (q.trim()) req.ilike('name', `%${q}%`);

    /* filtros */
    if (muscles.size) {
      const norm = Array.from(muscles).map(toTitle);
      req.in('muscle_group', norm);
    }
    if (levels.size) {
      req.in('difficulty', Array.from(levels));
    }

    const { data, error } = await req;
    if (error) console.error('[exerciseStore] searchExercises', error);

    set({ exercises: (data as Exercise[]) ?? [], loading: false });
  },

  /*──────────────────── filtros ────────────────────*/
  toggleMuscle(m) {
    set((s) => {
      const next = new Set(s.muscles);
      next.has(m) ? next.delete(m) : next.add(m);
      return { muscles: next };
    });
  },
  toggleLevel(l) {
    set((s) => {
      const next = new Set(s.levels);
      next.has(l) ? next.delete(l) : next.add(l);
      return { levels: next };
    });
  },
  clearFilters() {
    set({ muscles: new Set(), levels: new Set() });
  },

  /*──────────────────── helpers ────────────────────*/
  getExerciseById(id) {
    return get().exercises.find((e) => e.id === id);
  },

  getExerciseBySessionId(sessionId) {
    const se = useWorkoutStore
      .getState()
      .exercises.find((e) => e.id === sessionId);
    if (!se) return null;

    const cached = get().exercises.find((e) => e.id === se.exercise_id);
    if (cached) return cached;

    (async () => {
      if (!isSupabaseConfigured()) return;
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', se.exercise_id)
        .single();
      if (data)
        set((s) => ({ exercises: [...s.exercises, data as Exercise] }));
    })();
    return null;
  },

  async addExerciseToRoutine(routineId, exerciseId) {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.from('routine_exercises').insert({
      routine_id: routineId,
      exercise_id: exerciseId,
      order_idx: 999,
    });
    if (error && error.code !== '23505') throw error;
  },
}));
