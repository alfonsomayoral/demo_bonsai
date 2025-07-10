import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import {
  supabase,
  isSupabaseConfigured,
  mockWorkoutSession,
  WorkoutSession,
  SessionExercise,
  ExerciseSet,
  ExerciseWorkoutMetricsInsert,
} from '@/lib/supabase';
import { useSetStore } from '@/store/setStore';

/* helper */
const hasAuthSession = async () =>
  isSupabaseConfigured() &&
  (await supabase.auth.getSession()).data.session !== null;

/* tipos para el resumen in-app */
export interface SummaryExercise {
  sessionExerciseId: string;
  exerciseId: string;
  name: string;
  volume: number; /* avg vol / set */
  sets: number;
  reps: number;   /* total reps */
}
interface WorkoutSummary {
  duration: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  totalExercises: number;
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
  addExerciseToWorkout: (ex: {
    id: string;
    name: string | null;
    muscle_group: string | null;
  }) => Promise<string | null>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: () => Promise<void>;
}

let timer: ReturnType<typeof setInterval> | null = null;

/*────────────────── STORE ──────────────────*/
export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workout: null,
  exercises: [],
  elapsedSec: 0,
  running: false,
  workoutSummary: null,

  /* 1 ─ crear sesión */
  async createWorkout(userId) {
    if (get().workout) return;

    const online = await hasAuthSession();
    let uid = userId;

    if (online && !uid) {
      const { data } = await supabase.auth.getUser();
      uid = data.user!.id;
    }

    if (!online || !uid) {
      /* OFF-LINE: mock */
      set({ workout: mockWorkoutSession, running: true, elapsedSec: 0 });
    } else {
      /* ON-LINE: insertar sesión */
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

    const online = await hasAuthSession();

    if (!online) {
      /* OFF-LINE */
      const row: ExtendedSessionExercise = {
        id: uuidv4(),
        session_id: workout.id,
        exercise_id: ex.id,
        user_id: workout.user_id ?? 'offline',
        order_idx: exercises.length,
        created_at: new Date().toISOString(),
        name: ex.name,
        muscle_group: ex.muscle_group,
      };
      set((s) => ({ exercises: [...s.exercises, row] }));
      return row.id;
    }

    /* ON-LINE */
    const { data, error } = await supabase
      .from('session_exercises')
      .insert({
        session_id: workout.id,
        exercise_id: ex.id,
        user_id: workout.user_id,
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
    set((s) => ({ exercises: [...s.exercises, row] }));
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

  /* detener cronómetro */
  if (timer) clearInterval(timer);
  timer = null;

  const session = await supabase.auth.getSession();
  const online  = isSupabaseConfigured() && !!session.data.session;
  const userId  = workout.user_id ?? session.data.session?.user.id ?? null;

  /* guardar duración si estamos on-line */
  if (online && workout.id) {
    await supabase
      .from('workout_sessions')
      .update({ duration_sec: elapsedSec })
      .eq('id', workout.id);
  }

  /* ---------------- resumen por ejercicio ---------------- */
  const allSets = useSetStore.getState().sets;

  let totalVol = 0,
      totalSets = 0,
      totalReps = 0;

  const summaryExercises: SummaryExercise[] = exercises.map((se) => {
    const sets = allSets.filter((s) => s.session_exercise_id === se.id);

    const volTotal = sets.reduce(
      (a, s) => a + (s.volume ?? s.reps * s.weight),
      0,
    );
    const repsTotal = sets.reduce((a, s) => a + s.reps, 0);

    totalVol  += volTotal;
    totalSets += sets.length;
    totalReps += repsTotal;

    return {
      sessionExerciseId: se.id,
      exerciseId: se.exercise_id,
      name: se.name ?? 'Exercise',
      volume: sets.length ? volTotal / sets.length : 0,   // avg vol/set
      sets: sets.length,
      reps: repsTotal,
    };
  });

  /* ------------- INSERT en exercise_workout_metrics ------------- */
  if (online && userId && summaryExercises.length) {
    const rows: ExerciseWorkoutMetricsInsert[] = summaryExercises.map((ex) => ({
      user_id:            userId,
      workout_session_id: workout.id,
      exercise_id:        ex.exerciseId,
      sets:               ex.sets,
      reps:               ex.reps,
      volume:             Math.round(ex.volume * ex.sets),        // total INT
      kg_per_rep:         ex.reps ? (ex.volume * ex.sets) / ex.reps : 0,
    }));

    const { error } = await supabase
      .from('exercise_workout_metrics')
      .insert(rows);
    if (error) console.error('[finishWorkout] insert metrics', error);
  }

  /* ---------------- resumen global ---------------- */
  const summary: WorkoutSummary = {
    duration: elapsedSec,
    totalVolume: totalVol,
    totalSets,
    totalReps,
    totalExercises: exercises.length,
    exercises: summaryExercises,
  };

  /* reset de estado */
  set({
    workout: null,
    exercises: [],
    elapsedSec: 0,
    running: false,
    workoutSummary: summary,
  });
}
}));