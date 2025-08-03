import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type Meal = Database['public']['Tables']['meals']['Row'];

export const useMealsToday = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    const fetchToday = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date();   end.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', start.toISOString())
        .lte('logged_at', end.toISOString())
        .order('logged_at', { ascending: false });

      setMeals(data || []);

      const sum = (field: keyof Meal) => data?.reduce((acc, m) => acc + (m[field] as number), 0) || 0;
      setTotals({
        calories: sum('total_kcal'),
        protein : sum('total_protein'),
        carbs   : sum('total_carbs'),
        fat     : sum('total_fat'),
      });
    };

    fetchToday();
    const sub = supabase
      .channel('meals-today')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, fetchToday)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  return { meals, totals };
};
