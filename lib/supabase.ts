/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/*───────────────────────────────────────────────────────────────────────────
  Tipado de la base de datos: tablas, vistas y funciones
───────────────────────────────────────────────────────────────────────────*/
export type Database = {
  public: {
    /*---------------------------------------------------------------------*/
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
          description: string | null;
          image_url: string | null;
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
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
          started_at: string;
          finished_at: string | null;
          duration_sec: number | null;
          total_volume: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          finished_at?: string | null;
          duration_sec?: number | null;
          total_volume?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          finished_at?: string | null;
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
    user_id: string;
    order_idx: number;          //  ←  RESTAURADO
    created_at: string;
  };
  Insert: {
    id?: string;
    session_id: string;
    exercise_id: string;
    user_id: string;
    order_idx: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    session_id?: string;
    exercise_id?: string;
    user_id?: string;
    order_idx?: number;
    created_at?: string;
  };
};


      /*──────────────────────────── exercise_sets ─────────────────────────*/
      exercise_sets: {
        Row: {
          id: string;
          session_exercise_id: string;
          user_id: string;
          weight: number;
          reps: number;
          performed_at: string;
          rpe: number | null;
          volume: number | null;
        };
        Insert: {
          id?: string;
          session_exercise_id: string;
          user_id: string;
          weight: number;
          reps: number;
          performed_at?: string;
          rpe?: number | null;
          volume?: number | null;
        };
        Update: {
          id?: string;
          session_exercise_id?: string;
          user_id?: string;
          weight?: number;
          reps?: number;
          performed_at?: string;
          rpe?: number | null;
          volume?: number | null;
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
          last_done: string | null;
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

    /*---------------------------------------------------------------------*/
    Views: {
      exercise_daily_volume: {
        Row: {
          exercise_id: string;
          work_date: string;       // YYYY-MM-DD
          total_volume: number;
          user_id: string;
        };
      };
    };

    /*---------------------------------------------------------------------*/
    Functions: {
      get_last_worked_at: {
        Args: { p_muscle: string };
        Returns: string | null;    // timestamptz ISO
      };
    };

    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/*──────────────────────────── SUPABASE CLIENT ───────────────────────────*/
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = (): boolean =>
  Boolean(supabaseUrl && supabaseAnonKey);

/*──────────────────────── Alias usados por el front ─────────────────────*/
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type Routine = Database['public']['Tables']['routines']['Row'];
export type ExerciseSet = Database['public']['Tables']['exercise_sets']['Row'];
export type SessionExercise = Database['public']['Tables']['session_exercises']['Row'];
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
export type DailyVolume = Database['public']['Views']['exercise_daily_volume']['Row'];

/*─────────────────── Datos mock para dev/offline ─────────────────────────*/
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
  started_at: new Date().toISOString(),
  finished_at: null,
  duration_sec: null,
  total_volume: 0,
};
