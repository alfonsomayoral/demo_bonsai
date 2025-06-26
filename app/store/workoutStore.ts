// filename: app/store/workoutStore.ts
import { create } from 'zustand';
import {
  supabase,
  isSupabaseConfigured,
  mockWorkoutSession,
  WorkoutSession,
  SessionExercise,
  ExerciseSet,
} from '@/lib/supabase';

/*───────────────────────────  Tipos auxiliares  ───────────────────────────*/
interface WorkoutSummary {
  duration: number;    // segundos
  totalVolume: number; // Σ volume de todos los sets
  totalSets: number;
  totalReps: number;
  exercises: ExerciseSet[];
}

interface WorkoutState {
  /* Estado en curso */
  workout: WorkoutSession | null;
  exercises: SessionExercise[];
  elapsedSec: number;
  running: boolean;

  /* Resumen al finalizar */
  workoutSummary: WorkoutSummary | null;

  /* Acciones */
  createWorkout: (userId?: string) => Promise<void>;       // userId opcional
  addExerciseToWorkout: (exerciseId: string) => Promise<void>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: () => Promise<void>;
}

/* Cronómetro */
let timer: number | null = null;

/*───────────────────────────  Store  ───────────────────────────*/
export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workout: null,
  exercises: [],
  elapsedSec: 0,
  running: false,
  workoutSummary: null,

  /* Crear nuevo entrenamiento */
  async createWorkout(userId) {
    if (get().workout) return; // ya hay uno activo

    /* ① Obtener UID si no se pasó explícitamente */
    let uid = userId;
    if (!uid && isSupabaseConfigured()) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id ?? undefined;
    }

    if (!isSupabaseConfigured() || !uid) {
      /* Modo offline o sin sesión */
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

  /* Añadir ejercicio */
  async addExerciseToWorkout(exerciseId) {
    const { workout, exercises } = get();
    if (!workout) return;

    if (!isSupabaseConfigured()) {
      const newEx: SessionExercise = {
        id: crypto.randomUUID(),
        session_id: workout.id,
        exercise_id: exerciseId,
        order_idx: exercises.length,
        name: null,
        muscle_group: null,
      };
      set({ exercises: [...exercises, newEx] });
      return;
    }

    const { data, error } = await supabase
      .from('session_exercises')
      .insert({
        session_id: workout.id,
        exercise_id: exerciseId,
        order_idx: exercises.length,
      })
      .select()
      .single();
    if (error) throw error;

    set({ exercises: [...exercises, data as SessionExercise] });
  },

  /* Pausar / reanudar */
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

  /* Finalizar */
  async finishWorkout() {
    const { workout, elapsedSec, exercises } = get();
    if (!workout) return;

    if (isSupabaseConfigured()) {
      await supabase
        .from('workout_sessions')
        .update({ duration_sec: elapsedSec })
        .eq('id', workout.id);
    }

    const summary: WorkoutSummary = {
      duration: elapsedSec,
      totalVolume: 0,
      totalSets: exercises.length,
      totalReps: 0,
      exercises: [], // rellenar con consulta posterior si se desea
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
