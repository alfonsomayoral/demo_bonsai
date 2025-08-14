import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type Meal = Database['public']['Tables']['meals']['Row'];

type Totals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const useMealsToday = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<Totals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // Inicio y fin del día local (00:00:00.000 → 23:59:59.999) convertidos a ISO (UTC) para la query
  const getTodayRangeISO = (): [string, string] => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return [start.toISOString(), end.toISOString()];
  };

  // Cálculo de totales a partir de la lista de comidas
  const computeTotals = (list: Pick<
    Meal,
    'total_kcal' | 'total_protein' | 'total_carbs' | 'total_fat'
  >[]): Totals => {
    return {
      calories: list.reduce((a, m) => a + (m.total_kcal ?? 0), 0),
      protein:  list.reduce((a, m) => a + (m.total_protein ?? 0), 0),
      carbs:    list.reduce((a, m) => a + (m.total_carbs ?? 0), 0),
      fat:      list.reduce((a, m) => a + (m.total_fat ?? 0), 0),
    };
  };

  useEffect(() => {
    let channel: any | null = null;
    let mounted = true;

    const fetchToday = async (uid: string) => {
      try {
        const [startISO, endISO] = getTodayRangeISO();
        const { data, error } = await supabase
          .from('meals')
          .select(
            'id, user_id, logged_at, total_kcal, total_protein, total_carbs, total_fat, source_method'
          )
          .eq('user_id', uid)
          .gte('logged_at', startISO)
          .lte('logged_at', endISO)
          .order('logged_at', { ascending: false });

        if (error) {
          console.warn('meals today error', error);
          if (!mounted) return;
          setMeals([]);
          setTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
          return;
        }

        const list = (data ?? []) as Meal[];
        if (!mounted) return;
        setMeals(list);
        setTotals(computeTotals(list));
      } catch (err) {
        console.warn('meals today unexpected error', err);
        if (!mounted) return;
        setMeals([]);
        setTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      }
    };

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        setMeals([]);
        setTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        return;
      }

      await fetchToday(user.id);

      channel = supabase
        .channel('meals-today')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meals',
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchToday(user.id)
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { meals, totals };
};
