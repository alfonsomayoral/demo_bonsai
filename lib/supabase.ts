import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as FileSystem from 'expo-file-system';

/*──────────────────────────── ENV ───────────────────────────*/
const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

/*──────────────────────────── TYPES ──────────────────────────*/
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

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
        Insert: Partial<Database['public']['Tables']['users']['Row']> & {
          id: string; email: string; unit_system: 'metric' | 'imperial'; goal_type: 'cut' | 'maintain' | 'bulk';
          gym_sessions_per_week: number; runs_regularly: boolean; meals_per_day: number; kcal_target: number;
        };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
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
        Insert: Omit<Database['public']['Tables']['meals']['Row'], 'id' | 'logged_at'> & { logged_at?: string };
        Update: Partial<Database['public']['Tables']['meals']['Row']>;
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
          confidence: number | null;
          image_path: string | null;
        };
        Insert: Omit<Database['public']['Tables']['meal_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['meal_items']['Row']>;
      };
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
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['exercises']['Row']>;
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          start_time: string;
          duration_sec: number | null;
          total_volume: number;
          finished_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'start_time'> & { start_time?: string };
        Update: Partial<Database['public']['Tables']['workout_sessions']['Row']>;
      };
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          order_idx: number;
          name: string | null;
          muscle_group: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['session_exercises']['Row'], 'id' | 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['session_exercises']['Row']>;
      };
      exercise_sets: {
        Row: {
          id: string;
          session_exercise_id: string;
          weight: number;
          reps: number;
          rpe: number | null;
          created_at: string;
          volume: number | null;
          performed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercise_sets']['Row'], 'id' | 'created_at' | 'volume' | 'performed_at'> & {
          created_at?: string; volume?: number | null; performed_at?: string
        };
        Update: Partial<Database['public']['Tables']['exercise_sets']['Row']>;
      };
      routines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
          updated_at: string;
          last_done: string | null;
        };
        Insert: Omit<Database['public']['Tables']['routines']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          created_at?: string; updated_at?: string
        };
        Update: Partial<Database['public']['Tables']['routines']['Row']>;
      };
      routine_exercises: {
        Row: { id: string; routine_id: string; exercise_id: string; order_idx: number; };
        Insert: Omit<Database['public']['Tables']['routine_exercises']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['routine_exercises']['Row']>;
      };
      exercise_workout_metrics: {
        Row: {
          id: string;
          user_id: string;
          workout_session_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          volume: number;
          kg_per_rep: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercise_workout_metrics']['Row'], 'id' | 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['exercise_workout_metrics']['Row']>;
      };
    };
    Views: never;
    Functions: never;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/*──────────────────────── SUPABASE CLIENT ───────────────────────*/
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = (): boolean => Boolean(supabaseUrl && supabaseAnonKey);

/*──────────────────────── Aliases & mocks (opcionales) ──────────*/
export type Exercise         = Database['public']['Tables']['exercises']['Row'];
export type Routine          = Database['public']['Tables']['routines']['Row'];
export type ExerciseSet      = Database['public']['Tables']['exercise_sets']['Row'];
export type SessionExercise  = Database['public']['Tables']['session_exercises']['Row'];
export type WorkoutSession   = Database['public']['Tables']['workout_sessions']['Row'];

export const mockExercises: Exercise[] = [
  { id: '0001', user_id: null, name: 'Push-Up', muscle_group: 'chest', description: 'Classic body-weight push movement.', image_url: null, difficulty: 'beginner' },
];

export const mockRoutines: Routine[] = [
  { id: 'rt-1', user_id: 'demo', name: 'Push Day', color: '#00E676', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_done: null },
];

export const mockWorkoutSession: WorkoutSession = {
  id: 'ws-1',
  user_id: 'demo',
  start_time: new Date().toISOString(),
  finished_at: null,
  duration_sec: null,
  total_volume: 0,
};

/*──────────────────────── Helpers internos ─────────────────────*/

/**
 * Convierte una cadena base64 a Uint8Array de forma compatible con RN/Expo.
 * Intenta usar atob; si no existe, intenta Buffer; si no, lanza error.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    if (typeof atob === 'function') {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    // @ts-ignore - Buffer puede existir en el runtime sin tipo global
    if (typeof Buffer !== 'undefined') {
      // @ts-ignore
      const buf = Buffer.from(base64, 'base64');
      return new Uint8Array(buf);
    }
    throw new Error('No base64 decoder available in this runtime');
  } catch (e) {
    throw new Error('Failed to decode base64 to bytes');
  }
}

/*──────────────────────── Helpers de Storage/IA ─────────────────*/

/**
 * Sube una imagen al bucket `meal-images` y devuelve la RUTA (path) en Storage.
 * Lee la URI local en base64 (expo-file-system) → convierte a Uint8Array → sube bytes.
 * Valida que el tamaño sea > 0 antes de subir.
 */
export const uploadMealImage = async (
  userId: string,
  imageUri: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<string | null> => {
  try {
    // (0) Info opcional: verificar existencia/tamaño del archivo local
    const info = await FileSystem.getInfoAsync(imageUri, { size: true });
    if (!info.exists) throw new Error('Local image file not found');
    // Nota: algunas plataformas no devuelven size correcto; aun así validaremos después.

    // (1) Leer como base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
    if (!base64 || base64.length < 10) {
      throw new Error('Local image is empty or unreadable');
    }

    // (2) Pasar a bytes
    const bytes = base64ToUint8Array(base64);
    if (!bytes || bytes.byteLength === 0) {
      throw new Error('Image bytes are empty');
    }

    // (3) Nombre único y ruta
    const d = new Date();
    const date = d.toISOString().slice(0, 10);
    const name = `${userId}/${date}-${mealType}-${uuidv4()}.jpg`;

    // (4) Subir a Storage como bytes (Uint8Array)
    const { error } = await supabase
      .storage
      .from('meal-images')
      .upload(name, bytes, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return name; // RUTA en el bucket (no URL)
  } catch (err) {
    console.error('uploadMealImage', err);
    return null;
  }
};

export async function signedImageUrl(path: string, expiresIn = 300) {
  const { data, error } = await supabase
    .storage
    .from('meal-images')
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** Invoca la Edge Function `analyze-food` */
export const analyzeFoodImage = async (storagePath: string, fixPrompt?: string): Promise<any> => {
  const { data, error } = await supabase.functions.invoke('analyze-food', {
    body: { storagePath, fixPrompt },
  });
  if (error) throw error;
  return data;
};
