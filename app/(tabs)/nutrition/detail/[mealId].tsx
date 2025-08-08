import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';

type MealItem = {
  id: string;
  name: string;
  weight_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  image_path?: string | null;
  confidence?: number | null;
};

type Meal = {
  id: string;
  logged_at: string;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_items?: MealItem[];
};

export default function MealDetailScreen() {
  const router = useRouter();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('meals')
          .select('*, meal_items(*)')
          .eq('id', mealId)
          .single();

        if (error) throw error;
        setMeal(data as unknown as Meal);
      } catch (e) {
        console.error('Meal detail error', e);
      } finally {
        setLoading(false);
      }
    };
    if (mealId) load();
  }, [mealId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#10B981" size="large" />
      </SafeAreaView>
    );
  }

  if (!meal) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Meal not found</Text>
        <Text style={styles.link} onPress={() => router.back()}>
          Go back
        </Text>
      </SafeAreaView>
    );
  }

  const banner =
    meal.meal_items?.find((i) => !!i.image_path)?.image_path ??
    'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1200&q=60';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Banner */}
        <Image source={{ uri: banner }} style={styles.banner} />
        <View style={styles.header}>
          <Text style={styles.title}>Meal summary</Text>
          <Text style={styles.date}>
            {new Date(meal.logged_at).toLocaleString()}
          </Text>
        </View>

        {/* Totales */}
        <Card variant="dark" style={styles.totals}>
          <View style={styles.totalBox}>
            <Text style={styles.totalValue}>{meal.total_kcal}</Text>
            <Text style={styles.totalLabel}>kcal</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.totalRow}>
            <Text style={styles.rowText}>Protein</Text>
            <Text style={styles.rowValue}>{meal.total_protein} g</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.rowText}>Carbs</Text>
            <Text style={styles.rowValue}>{meal.total_carbs} g</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.rowText}>Fat</Text>
            <Text style={styles.rowValue}>{meal.total_fat} g</Text>
          </View>
        </Card>

        {/* Items */}
        <Text style={styles.section}>Items</Text>
        {meal.meal_items?.map((it) => (
          <Card key={it.id} variant="dark" style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{it.name}</Text>
              <Text style={styles.itemSub}>
                {it.weight_g} g • {it.kcal} kcal
              </Text>
              <Text style={styles.itemSub}>
                P {it.protein}g • C {it.carbs}g • F {it.fat}g
              </Text>
              {typeof it.confidence === 'number' && (
                <Text style={styles.itemConf}>conf: {Math.round(it.confidence * 100)}%</Text>
              )}
            </View>
            {it.image_path ? (
              <Image source={{ uri: it.image_path }} style={styles.itemImg} />
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  banner: { width: '100%', height: 220 },
  header: { padding: 16 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter-SemiBold' },
  date: { color: '#9CA3AF', marginTop: 4 },

  totals: { marginHorizontal: 16, padding: 16, marginBottom: 16 },
  totalBox: { alignItems: 'center', marginBottom: 12 },
  totalValue: { color: '#fff', fontSize: 28, fontFamily: 'Inter-Bold' },
  totalLabel: { color: '#9CA3AF' },
  sep: { height: 1, backgroundColor: '#374151', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowText: { color: '#9CA3AF' },
  rowValue: { color: '#fff' },

  section: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold', marginHorizontal: 16, marginBottom: 8 },
  item: { marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  itemTitle: { color: '#fff', fontFamily: 'Inter-SemiBold' },
  itemSub: { color: '#9CA3AF', fontSize: 12 },
  itemConf: { color: '#10B981', fontSize: 12, marginTop: 2 },
  itemImg: { width: 56, height: 56, borderRadius: 12, marginLeft: 12 },

  error: { color: '#fff', textAlign: 'center', marginTop: 32 },
  link: { color: '#10B981', textAlign: 'center', marginTop: 8 },
});
