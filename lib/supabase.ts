import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
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
      exercises: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          muscle_group: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          muscle_group: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          muscle_group?: string;
        };
      };
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
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          order_idx: number;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          order_idx: number;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string;
          order_idx?: number;
        };
      };
      exercise_sets: {
        Row: {
          id: string;
          session_exercise_id: string;
          weight: number;
          reps: number;
          rpe: number | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          session_exercise_id: string;
          weight: number;
          reps: number;
          rpe?: number | null;
          logged_at?: string;
        };
        Update: {
          id?: string;
          session_exercise_id?: string;
          weight?: number;
          reps?: number;
          rpe?: number | null;
          logged_at?: string;
        };
      };
    };
  };
};