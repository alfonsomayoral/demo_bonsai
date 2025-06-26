// filename: app/store/routineStore.ts
import { create } from 'zustand';
import {
  supabase,
  isSupabaseConfigured,
  Routine,
  mockRoutines,
} from '@/lib/supabase';

/*──────────────────────────────  STATE  ──────────────────────────────*/
interface RoutineState {
  routines: Routine[];
  loading: boolean;

  /* Queries */
  loadRoutines: () => Promise<void>;
  getRoutineById: (id: string) => Routine | undefined;

  /* Mutations */
  addRoutine: (name: string, color: string) => Promise<string>;          // devuelve id
  updateRoutine: (id: string, name: string, color: string) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],
  loading: false,

  /*─────────────────── Fetch todas las rutinas ───────────────────*/
  async loadRoutines() {
    /* OFFLINE */
    if (!isSupabaseConfigured()) {
      set({ routines: mockRoutines, loading: false });
      return;
    }

    set({ loading: true });

    /* ⇒ RLS ya limita por user_id, no hace falta filtrar */
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[routineStore] loadRoutines', error);
      set({ routines: [], loading: false });
      return;
    }

    set({ routines: data as Routine[], loading: false });
  },

  /*─────────────────── Get by ID ───────────────────*/
  getRoutineById(id) {
    return get().routines.find((r) => r.id === id);
  },

  /*─────────────────── Add ─────────────────────────*/
  async addRoutine(name, color) {
    /* Modo OFFLINE → mock local */
    if (!isSupabaseConfigured()) {
      const newRoutine: Routine = {
        id: crypto.randomUUID(),
        user_id: 'offline',
        name,
        color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_done: null,
      };
      set({ routines: [...get().routines, newRoutine] });
      return newRoutine.id;
    }

    /* 1. Obtener UID */
    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData?.user) throw new Error('Not logged in');

    /* 2. Insert con user_id para cumplir RLS */
    const { data, error } = await supabase
      .from('routines')
      .insert({
        user_id: userData.user.id,
        name,
        color,
      })
      .select()
      .single();

    if (error) throw error;

    set({ routines: [...get().routines, data as Routine] });
    return data.id;
  },

  /*─────────────────── Update ──────────────────────*/
  async updateRoutine(id, name, color) {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('routines')
        .update({ name, color, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }
    set({
      routines: get().routines.map((r) =>
        r.id === id ? { ...r, name, color, updated_at: new Date().toISOString() } : r
      ),
    });
  },

  /*─────────────────── Delete ──────────────────────*/
  async deleteRoutine(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw error;
    }
    set({ routines: get().routines.filter((r) => r.id !== id) });
  },
}));
