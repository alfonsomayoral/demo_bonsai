/* filename: app/store/workoutStore.ts
   Maneja el entrenamiento activo: cronómetro, ejercicios añadidos y resumen.
*/
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
  duration: number;       // segundos
  totalVolume: number;    // Σ volume de todos los sets
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
  createWorkout: (userId?: string) => Promise<void>;
  addExerciseToWorkout: (exerciseId: string) => Promise<void>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: () => Promise<void>;
}

/* Cronómetro global (1 seg) */
let timer: number | null = null;

/*───────────────────────────  Store  ───────────────────────────*/
export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workout: null,
  exercises: [],
  elapsedSec: 0,
  running: false,
  workoutSummary: null,

  /*─────────────────────── 1. Crear nuevo entrenamiento ──────────────────*/
  async createWorkout(userId) {
    if (get().workout) return; // ya existe uno activo

    /* uid explícito ► o bien sacarlo de auth */
    let uid = userId;
    if (!uid && isSupabaseConfigured()) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id ?? undefined;
    }

    /* modo OFFLINE */
    if (!isSupabaseConfigured() || !uid) {
      set({ workout: mockWorkoutSession, running: true, elapsedSec: 0 });
    } else {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: uid,
          started_at: new Date().toISOString(),
          total_volume: 0,
        })
        .select()
        .single();

      if (error) throw error;
      set({ workout: data as WorkoutSession, running: true, elapsedSec: 0 });
    }

    /* arrancar cronómetro */
    timer = setInterval(
      () => set((s) => ({ elapsedSec: s.elapsedSec + 1 })),
      1_000,
    );
  },

  /*─────────────────────── 2. Añadir ejercicio a la sesión ───────────────*/
  async addExerciseToWorkout(exerciseId) {
    const { workout, exercises } = get();
    if (!workout) return;

    /* uid cuando estamos online */
    let uid: string | null = null;
    if (isSupabaseConfigured()) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id ?? null;
      if (!uid) {
        console.warn('[workoutStore] addExercise: usuario no autenticado');
        return;
      }
    }

    const newEx: SessionExercise = {
      id: crypto.randomUUID(),
      session_id: workout.id,
      exercise_id: exerciseId,
      user_id: uid ?? 'offline',
      order_idx: exercises.length,
      created_at: new Date().toISOString(),
    };

    /* ► OFFLINE: solo local */
    if (!isSupabaseConfigured()) {
      set({ exercises: [...exercises, newEx] });
      return;
    }

    /* ► ONLINE: insertar en Supabase */
    const { data, error } = await supabase
      .from('session_exercises')
      .insert(newEx)
      .select()
      .single();

    if (error) throw error;
    set({ exercises: [...exercises, data as SessionExercise] });
  },

  /*─────────────────────── 3. Control del cronómetro ─────────────────────*/
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

  /*─────────────────────── 4. Finalizar entrenamiento ────────────────────*/
  async finishWorkout() {
    const { workout, elapsedSec, exercises } = get();
    if (!workout) return;

    /* actualizar duración + finished_at en BD */
    if (isSupabaseConfigured()) {
      await supabase
        .from('workout_sessions')
        .update({
          duration_sec: elapsedSec,
          finished_at: new Date().toISOString(),
        })
        .eq('id', workout.id);
    }

    /* resumen minimal */
    const summary: WorkoutSummary = {
      duration: elapsedSec,
      totalVolume: 0,
      totalSets: exercises.length,
      totalReps: 0,
      exercises: [], // puedes hydratearlo con una consulta extra
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
