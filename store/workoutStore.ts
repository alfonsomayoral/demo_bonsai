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

/* helpers */
const hasAuthSession = async () =>
  isSupabaseConfigured() &&
  (await supabase.auth.getSession()).data.session !== null;

/** UUID v4 simple check (para detectar sesión mock/offline) */
const isUuidV4 = (s?: string | null): boolean =>
  !!s &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );

/* tipos para el resumen in-app */
export interface SummaryExercise {
  sessionExerciseId: string;
  exerciseId: string;
  name: string;
  volume: number; /* avg vol / set */
  sets: number;
  reps: number; /* total reps */
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
      /* ON-LINE: insertar sesión real */
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

    /* detener cronómetro SIEMPRE */
    if (timer) clearInterval(timer);
    timer = null;

    /* ---------------- resumen por ejercicio (a partir de sets en memory) ---------------- */
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

      totalVol += volTotal;
      totalSets += sets.length;
      totalReps += repsTotal;

      return {
        sessionExerciseId: se.id,
        exerciseId: se.exercise_id,
        name: se.name ?? 'Exercise',
        volume: sets.length ? volTotal / sets.length : 0, // avg vol/set
        sets: sets.length,
        reps: repsTotal,
      };
    });

    /* ---------------- si no hay sesión/auth → sólo deja resumen local ---------------- */
    const sessionRes = await supabase.auth.getSession();
    const online = isSupabaseConfigured() && !!sessionRes.data.session;
    const uid = sessionRes.data.session?.user?.id ?? null;

    /* resumen global para la pantalla de fin */
    const summary: WorkoutSummary = {
      duration: elapsedSec,
      totalVolume: totalVol,
      totalSets,
      totalReps,
      totalExercises: exercises.length,
      exercises: summaryExercises,
    };

    if (!online || !uid || summaryExercises.length === 0) {
      // reset de estado y salir (no intentamos DB sin auth)
      set({
        workout: null,
        exercises: [],
        elapsedSec: 0,
        running: false,
        workoutSummary: summary,
      });
      return;
    }

    /* ---------------- asegurar workout_session REAL (para RLS y FK) ---------------- */
    let sessionId = workout.id;

    // Si el id no es UUID v4, asumimos sesión mock (offline) → creamos una real
    if (!isUuidV4(sessionId)) {
      const start = new Date(Date.now() - elapsedSec * 1000).toISOString();
      const { data: ws, error: wsErr } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: uid,
          start_time: start,
          duration_sec: elapsedSec,
          total_volume: Math.round(totalVol),
          finished_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (wsErr) {
        console.error('[finishWorkout] create real session', wsErr);
      } else {
        sessionId = (ws as WorkoutSession).id;
      }
    } else {
      // sesión ya real → actualizar duración/volumen
      const { error: updErr } = await supabase
        .from('workout_sessions')
        .update({
          duration_sec: elapsedSec,
          total_volume: Math.round(totalVol),
          finished_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
      if (updErr) console.error('[finishWorkout] update session', updErr);
    }

    /* si no logramos un sessionId real, terminamos con el resumen local */
    if (!isUuidV4(sessionId)) {
      set({
        workout: null,
        exercises: [],
        elapsedSec: 0,
        running: false,
        workoutSummary: summary,
      });
      return;
    }

    /* ---------------- INSERT en exercise_workout_metrics (cumpliendo RLS) ---------------- */
    const rows: ExerciseWorkoutMetricsInsert[] = summaryExercises
      .filter((ex) => ex.sets > 0 && ex.reps >= 0)
      .map((ex) => {
        const totalExVol = Math.round(ex.volume * ex.sets); // total (avg * sets)
        return {
          user_id: uid, // ← SIEMPRE el del token
          workout_session_id: sessionId,
          exercise_id: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          volume: totalExVol,
          kg_per_rep: ex.reps ? totalExVol / ex.reps : 0,
        };
      });

    if (rows.length) {
      const { error } = await supabase
        .from('exercise_workout_metrics')
        .insert(rows);
      if (error) console.error('[finishWorkout] insert metrics', error);
    }

    /* ---------------- reset de estado + dejar resumen para UI ---------------- */
    set({
      workout: null,
      exercises: [],
      elapsedSec: 0,
      running: false,
      workoutSummary: summary,
    });
  },
}));
