import { create } from 'zustand';
import {
  supabase,
  mockExercises,
  isSupabaseConfigured,
  Exercise,
} from '@/lib/supabase';

interface ExerciseState {
  exercises: Exercise[];
  loading: boolean;
  searchExercises: (query: string, muscles: string[]) => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  loading: false,

  searchExercises: async (query: string, muscles: string[]) => {
    set({ loading: true });
    
    try {
      if (!isSupabaseConfigured()) {
        // Use mock data when Supabase is not configured
        let filteredExercises = mockExercises;
        
        if (query) {
          filteredExercises = filteredExercises.filter(exercise =>
            exercise.name.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        if (muscles.length > 0) {
          filteredExercises = filteredExercises.filter(exercise =>
            muscles.includes(exercise.muscle_group)
          );
        }
        
        set({ exercises: filteredExercises, loading: false });
        return;
      }

      let queryBuilder = supabase
        .from('exercises')
        .select('*');

      if (query) {
        queryBuilder = queryBuilder.ilike('name', `%${query}%`);
      }

      if (muscles.length > 0) {
        queryBuilder = queryBuilder.in('muscle_group', muscles);
      }

      const { data, error } = await queryBuilder.limit(50);

      if (error) throw error;

      set({ exercises: data || [], loading: false });
    } catch (error) {
      console.error('Error searching exercises:', error);
      // Fallback to mock data on error
      set({ exercises: mockExercises, loading: false });
    }
  },

  getExerciseById: (id: string) => {
    return get().exercises.find(exercise => exercise.id === id);
  },
}));