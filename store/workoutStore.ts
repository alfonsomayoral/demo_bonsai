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

/* ---------- Tipos auxiliares ---------- */
interface WorkoutSummary {
  duration: number;      // segundos
  totalVolume: number;   // Σ (reps·kg)
  totalSets: number;
  totalReps: number;
  exercises: ExerciseSet[];
}

interface WorkoutState {
  /* Estado */
  workout: WorkoutSession | null;
  exercises: SessionExercise[];
  elapsedSec: number;
  running: boolean;
  workoutSummary: WorkoutSummary | null;

  /* Acciones */
  createWorkout: (userId?: string) => Promise<void>;
  /** Devuelve el id de la fila `session_exercises` (o null si no hay sesión) */
  addExerciseToWorkout: (exerciseId: string) => Promise<string | null>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: () => Promise<void>;
}

let timer: number | null = null;

/* ---------- STORE ---------- */
export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workout: null,
  exercises: [],
  elapsedSec: 0,
  running: false,
  workoutSummary: null,

  /* 1. Crear sesión ---------------------------------------------------- */
  async createWorkout(userId) {
    if (get().workout) return;

    let uid = userId;
    if (!uid && isSupabaseConfigured()) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id;
    }

    /* Modo offline */
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

  /* 2. Añadir ejercicio a la sesión ----------------------------------- */
  async addExerciseToWorkout(exerciseId) {
    const { workout, exercises } = get();
    if (!workout) return null;
  
    const baseRow = {
      session_id: workout.id,
      exercise_id: exerciseId,
      order_idx: exercises.length,
    };
  
    /* ---------- OFFLINE ---------- */
    if (!isSupabaseConfigured()) {
      const row: SessionExercise = {
        id: crypto.randomUUID(),
        ...baseRow,
        user_id: workout.user_id ?? 'offline',
        created_at: new Date().toISOString(),
      };
      set({ exercises: [...exercises, row] });
      return row.id;
    }
  
    /* ---------- ONLINE ----------- */
    const { data, error } = await supabase
      .from('session_exercises')
      .insert(baseRow)
      .select()
      .single();
    if (error) throw error;
  
    const row: SessionExercise = {
      ...data,
      user_id: workout.user_id,                // aseguramos la clave
      created_at: new Date().toISOString(),
    };
    set({ exercises: [...exercises, row] });
    return row.id;
  },

  /* 3. Cronómetro ------------------------------------------------------ */
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

  /* 4. Finalizar sesión ------------------------------------------------ */
  async finishWorkout() {
    const { workout, elapsedSec, exercises } = get();
    if (!workout) return;

    if (isSupabaseConfigured()) {
      await supabase
        .from('workout_sessions')
        .update({
          duration_sec: elapsedSec,
          finished_at: new Date().toISOString(),
        })
        .eq('id', workout.id);
    }

    const summary: WorkoutSummary = {
      duration: elapsedSec,
      totalVolume: 0,
      totalSets: exercises.length,
      totalReps: 0,
      exercises: [],
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
