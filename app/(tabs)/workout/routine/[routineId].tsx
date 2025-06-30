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

import { supabase } from '@/lib/supabase';
import { Exercise } from '@/lib/supabase';
import colors from '@/theme/colors';

export default function RoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();

  const [routineName, setRoutineName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  /* fetch */
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

  const renderItem = ({ item }: { item: Exercise }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/workout/exercise/${item.id}`)}
    >
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>{item.muscle_group}</Text>
    </Pressable>
  );

  const handleAddExercise = () =>
    router.push({ pathname: './workout/ExerciseSearch', params: { routineId } });

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>{routineName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <Pressable style={styles.addBtn} onPress={handleAddExercise}>
        <Text style={styles.addBtnTxt}>Add Exercise</Text>
      </Pressable>
    </SafeAreaView>
  );
}

/*──────── styles ────────*/
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardSubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  addBtn: {
    backgroundColor: colors.success,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnTxt: { color: '#fff', fontWeight: '600' },
});
