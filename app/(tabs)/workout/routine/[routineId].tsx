import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { supabase, Exercise } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import colors from '@/theme/colors';

export default function RoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();

  const [routineName, setRoutineName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  /* ─────── fetch rutina + ejercicios ─────── */
  useEffect(() => {
    (async () => {
      /* nombre rutina */
      const { data: routineData } = await supabase
        .from('routines')
        .select('name')
        .eq('id', routineId)
        .single();
      if (routineData) setRoutineName(routineData.name);

      /* ejercicios */
      const { data: exRows } = await supabase
        .from('routine_exercises')
        .select('order_idx, exercise:exercises(*)')
        .eq('routine_id', routineId)
        .order('order_idx');

      if (exRows) {
        const parsed: Exercise[] = exRows.map(
          (row: any) => row.exercise as Exercise,
        );
        setExercises(parsed);
      }
      setLoading(false);
    })();
  }, [routineId]);

  /* ─────── render card ─────── */
  const renderItem = ({ item }: { item: Exercise }) => (
    <Pressable onPress={() => router.push(`/workout/exercise/${item.id}`)}>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>{item.muscle_group}</Text>
      </Card>
    </Pressable>
  );

  const handleAddExercise = () =>
    router.push({
      pathname: '/workout/ExerciseSearchScreen',
      params: { routineId },
    });

  /* ─────── UI ─────── */
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>{routineName}</Text>
        <View style={{ width: 24 }} /> {/* placeholder para centrar */}
      </View>

      {/* ── lista de ejercicios ── */}
      <FlatList
        data={exercises}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {/* ── botón añadir ── */}
      <Pressable style={styles.addBtn} onPress={handleAddExercise}>
        <Text style={styles.addBtnTxt}>Add Exercise</Text>
      </Pressable>
    </SafeAreaView>
  );
}

/*────────────────── styles ──────────────────*/
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },

  list: { paddingHorizontal: 20, paddingBottom: 20 },

  /* tarjeta */
  card: {
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#666',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff', },
  cardSubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.primary,
    marginTop: 2,
  },

  /* botón add */
  addBtn: {
    backgroundColor: colors.success,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnTxt: { color: '#fff', fontWeight: '800' },
});
