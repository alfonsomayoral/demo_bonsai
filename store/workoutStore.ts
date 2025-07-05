/* Maneja el entrenamiento activo: cronómetro, ejercicios y resumen */
import { create } from 'zustand';
import {
  supabase,
  isSupabaseConfigured,
  mockWorkoutSession,
  WorkoutSession,
  SessionExercise,
  ExerciseSet,
} from '@/lib/supabase';

/*──────────────────────── tipos auxiliares ───────────────────────*/
export interface SummaryExercise {
  id: string;
  name: string;
  volume: number;
  sets: number;
  reps: number;
}

interface WorkoutSummary {
  duration: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  exercises: SummaryExercise[];
}

export type ExtendedSessionExercise = SessionExercise & {
  name: string | null;
  muscle_group: string | null;
};

interface WorkoutState {
  workout: WorkoutSession | null;
  exercises: ExtendedSessionExercise[];
  elapsedSec: number;
  running: boolean;
  workoutSummary: WorkoutSummary | null;

  createWorkout: (userId?: string) => Promise<void>;
  /** Devuelve id de session_exercises */
  addExerciseToWorkout: (ex: {
    id: string;
    name: string | null;
    muscle_group: string | null;
  }) => Promise<string | null>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: () => Promise<void>;
}

/* setInterval en RN devuelve number (web) o Timeout (node) */
let timer: ReturnType<typeof setInterval> | null = null;

/*──────────────────────── STORE ───────────────────────────────*/
export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workout: null,
  exercises: [],
  elapsedSec: 0,
  running: false,
  workoutSummary: null,

  /* 1 ─ crear sesión */
  async createWorkout(userId) {
    if (get().workout) return;

    let uid = userId;
    if (!uid && isSupabaseConfigured()) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id ?? undefined;
    }

    if (!isSupabaseConfigured() || !uid) {
      set({ workout: mockWorkoutSession, running: true, elapsedSec: 0 });
    } else {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: uid,
          start_time: new Date().toISOString(),
          total_volume: 0,
        })
        .select()
        .single();
      if (error) throw error;
      set({ workout: data as WorkoutSession, running: true, elapsedSec: 0 });
    }

    timer = setInterval(
      () => set((s) => ({ elapsedSec: s.elapsedSec + 1 })),
      1_000,
    );
  },

  /* 2 ─ añadir ejercicio */
  async addExerciseToWorkout(ex) {
    const { workout, exercises } = get();
    if (!workout) return null;

    const dup = exercises.find((se) => se.exercise_id === ex.id);
    if (dup) return dup.id;

    /* OFF-LINE */
    if (!isSupabaseConfigured()) {
      const row: ExtendedSessionExercise = {
        id: crypto.randomUUID(),
        session_id: workout.id,
        exercise_id: ex.id,
        user_id: workout.user_id ?? 'offline',
        order_idx: exercises.length,
        created_at: new Date().toISOString(),
        name: ex.name,
        muscle_group: ex.muscle_group,
      };
      set({ exercises: [...exercises, row] });
      return row.id;
    }

    /* ON-LINE */
    const { data, error } = await supabase
      .from('session_exercises')
      .insert({
        session_id: workout.id,
        exercise_id: ex.id,
        user_id: workout.user_id,          // ← NECESARIO (NOT NULL)
        order_idx: exercises.length,
      })
      .select()
      .single();
    if (error) throw error;

    const row: ExtendedSessionExercise = {
      ...(data as SessionExercise),
      name: ex.name,
      muscle_group: ex.muscle_group,
    };
    set({ exercises: [...exercises, row] });
    return row.id;
  },

  /* 3 ─ cronómetro */
  pauseWorkout() {
    if (timer) clearInterval(timer);
    timer = null;
    set({ running: false });
  },
  resumeWorkout() {
    if (timer || !get().workout) return;
    timer = setInterval(
      () => set((s) => ({ elapsedSec: s.elapsedSec + 1 })),
      1_000,
    );
    set({ running: true });
  },

  /* 4 ─ finalizar */
  async finishWorkout() {
    const { workout, elapsedSec, exercises } = get();
    if (!workout) return;

    /* actualizar duración en BBDD si estamos online */
    if (isSupabaseConfigured()) {
      await supabase
        .from('workout_sessions')
        .update({ duration_sec: elapsedSec })
        .eq('id', workout.id);
    }

    /* resumen mínimo (solo títulos; volumen real vendrá del setStore) */
    const summaryExercises: SummaryExercise[] = exercises.map((se) => ({
      id: se.id,
      name: se.name ?? 'Exercise',
      volume: 0,
      sets: 0,
      reps: 0,
    }));

    const summary: WorkoutSummary = {
      duration: elapsedSec,
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
      exercises: summaryExercises,
    };

    if (timer) clearInterval(timer);
    timer = null;

    set({
      workout: null,
      exercises: [],
      elapsedSec: 0,
      running: false,
      workoutSummary: summary,
    });
  },
}));
