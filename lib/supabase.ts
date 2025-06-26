import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export type Database = {
  public: {
    Tables: {
      /*────────────────────────────── users ───────────────────────────────*/
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          unit_system: 'metric' | 'imperial';
          goal_type: 'cut' | 'maintain' | 'bulk';
          gym_sessions_per_week: number;
          runs_regularly: boolean;
          meals_per_day: number;
          kcal_target: number;
          created_at: string;
          weight: number | null;
          height: number | null;
          age: number | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          unit_system?: 'metric' | 'imperial';
          goal_type?: 'cut' | 'maintain' | 'bulk';
          gym_sessions_per_week?: number;
          runs_regularly?: boolean;
          meals_per_day?: number;
          kcal_target?: number;
          created_at?: string;
          weight?: number | null;
          height?: number | null;
          age?: number | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          unit_system?: 'metric' | 'imperial';
          goal_type?: 'cut' | 'maintain' | 'bulk';
          gym_sessions_per_week?: number;
          runs_regularly?: boolean;
          meals_per_day?: number;
          kcal_target?: number;
          created_at?: string;
          weight?: number | null;
          height?: number | null;
          age?: number | null;
        };
      };

      /*────────────────────────────── meals ───────────────────────────────*/
      meals: {
        Row: {
          id: string;
          user_id: string;
          logged_at: string;
          source_method: 'photo' | 'barcode' | 'manual';
          total_kcal: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_at?: string;
          source_method: 'photo' | 'barcode' | 'manual';
          total_kcal: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_at?: string;
          source_method?: 'photo' | 'barcode' | 'manual';
          total_kcal?: number;
          total_protein?: number;
          total_carbs?: number;
          total_fat?: number;
        };
      };

      /*──────────────────────────── meal_items ────────────────────────────*/
      meal_items: {
        Row: {
          id: string;
          meal_id: string;
          name: string;
          weight_g: number;
          kcal: number;
          protein: number;
          carbs: number;
          fat: number;
          confidence: number;
          image_path: string | null;
        };
        Insert: {
          id?: string;
          meal_id: string;
          name: string;
          weight_g: number;
          kcal: number;
          protein: number;
          carbs: number;
          fat: number;
          confidence?: number;
          image_path?: string | null;
        };
        Update: {
          id?: string;
          meal_id?: string;
          name?: string;
          weight_g?: number;
          kcal?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          confidence?: number;
          image_path?: string | null;
        };
      };

      /*──────────────────────────── exercises ─────────────────────────────*/
      exercises: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          muscle_group: string;
          description: string | null;                          /* NUEVO */
          image_url: string | null;                            /* NUEVO */
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null; /* NUEVO */
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          muscle_group: string;
          description?: string | null;
          image_url?: string | null;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          muscle_group?: string;
          description?: string | null;
          image_url?: string | null;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
        };
      };

      /*────────────────────────── workout_sessions ────────────────────────*/
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          start_time: string;
          duration_sec: number | null;
          total_volume: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_time?: string;
          duration_sec?: number | null;
          total_volume?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_time?: string;
          duration_sec?: number | null;
          total_volume?: number;
        };
      };

      /*────────────────────────── session_exercises ───────────────────────*/
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          order_idx: number;
          name: string | null;             /* NUEVO */
          muscle_group: string | null;     /* NUEVO */
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          order_idx: number;
          name?: string | null;
          muscle_group?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string;
          order_idx?: number;
          name?: string | null;
          muscle_group?: string | null;
        };
      };

      /*──────────────────────────── exercise_sets ─────────────────────────*/
      exercise_sets: {
        Row: {
          id: string;
          session_exercise_id: string;
          weight: number;
          reps: number;
          rpe: number | null;
          created_at: string;               /* <-- antes logged_at */
          volume: number | null;            /* col. almacenada */
          name?: string | null;             /* NUEVO opcional para resúmenes */
          sets?: number | null;             /* NUEVO opcional para resúmenes */
        };
        Insert: {
          id?: string;
          session_exercise_id: string;
          weight: number;
          reps: number;
          rpe?: number | null;
          created_at?: string;
          volume?: number | null;
          name?: string | null;
          sets?: number | null;
        };
        Update: {
          id?: string;
          session_exercise_id?: string;
          weight?: number;
          reps?: number;
          rpe?: number | null;
          created_at?: string;
          volume?: number | null;
          name?: string | null;
          sets?: number | null;
        };
      };

      /*────────────────────────────── routines ────────────────────────────*/
      routines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
          updated_at: string;
          last_done: string | null;        /* NUEVO */
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
          last_done?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
          last_done?: string | null;
        };
      };

      /*────────────────────────── routine_exercises ───────────────────────*/
      routine_exercises: {
        Row: {
          id: string;
          routine_id: string;
          exercise_id: string;
          order_idx: number;
        };
        Insert: {
          id?: string;
          routine_id: string;
          exercise_id: string;
          order_idx: number;
        };
        Update: {
          id?: string;
          routine_id?: string;
          exercise_id?: string;
          order_idx?: number;
        };
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// CLIENTE TIPADO
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = (): boolean => Boolean(supabaseUrl && supabaseAnonKey);

/*────────────────────── Shared interfaces basadas en Database ───────────*/
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type Routine = Database['public']['Tables']['routines']['Row'];
export type ExerciseSet = Database['public']['Tables']['exercise_sets']['Row'];
export type SessionExercise = Database['public']['Tables']['session_exercises']['Row'];
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];

/**
 * Datos mock para dev/offline
 */
export const mockExercises: Exercise[] = [
  {
    id: '0001',
    user_id: null,
    name: 'Push-Up',
    muscle_group: 'chest',
    description: 'Classic body-weight push movement.',
    image_url: null,
    difficulty: 'beginner',
  },
];

export const mockRoutines: Routine[] = [
  {
    id: 'rt-1',
    user_id: 'demo',
    name: 'Push Day',
    color: '#00E676',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_done: null,
  },
];

export const mockWorkoutSession: WorkoutSession = {
  id: 'ws-1',
  user_id: 'demo',
  start_time: new Date().toISOString(),
  duration_sec: null,
  total_volume: 0,
};

/* Aliases usados por algunos componentes */
export type WorkoutExercise = SessionExercise;
export type ExerciseSummary = ExerciseSet;
export type Set = ExerciseSet;
