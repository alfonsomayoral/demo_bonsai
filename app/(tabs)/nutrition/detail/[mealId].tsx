import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { signedImageUrl } from '@/lib/supabase';

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
  const [banner, setBanner] = useState<string | null>(null);

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

  // Resolver banner firmado si el bucket es privado
  useEffect(() => {
    let live = true;
    (async () => {
      const path = meal?.meal_items?.find((i) => !!i.image_path)?.image_path ?? null;
      if (!path) {
        setBanner('https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1200&q=60');
        return;
      }
      const url = await signedImageUrl(path, 300);
      if (live) setBanner(url ?? null);
    })();
    return () => { live = false; };
  }, [meal?.meal_items]);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Banner */}
        {banner ? <Image source={{ uri: banner }} style={styles.banner} /> : <View style={[styles.banner, styles.center]}><ActivityIndicator/></View>}

        <View style={styles.header}>
          <Text style={styles.title}>Meal summary</Text>
          <Text style={styles.date}>{new Date(meal.logged_at).toLocaleString()}</Text>
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
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  banner: { width: '100%', height: 220 },
  header: { padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  date: { color: '#9CA3AF', marginTop: 4 },
  totals: { marginHorizontal: 16, padding: 16, borderRadius: 16, marginBottom: 16, backgroundColor: '#191B1F' },
  totalBox: { alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  totalValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  totalLabel: { color: '#9CA3AF', marginTop: 4 },
  sep: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12, marginRight: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowText: { color: '#9CA3AF' },
  rowValue: { color: '#fff', fontWeight: '600' },
  section: { color: '#fff', fontSize: 18, fontWeight: '600', paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
  item: { marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 14, backgroundColor: '#191B1F' },
  itemTitle: { color: '#fff', fontWeight: '600', marginBottom: 4 },
  itemSub: { color: '#9CA3AF' },
  itemConf: { color: '#9CA3AF', marginTop: 4, fontSize: 12 },
  error: { color: '#fff', textAlign: 'center', marginTop: 20 },
  link: { color: '#10B981', textAlign: 'center', marginTop: 8 },
});
