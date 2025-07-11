import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search, Filter } from 'lucide-react-native';

import ExerciseFilter from '@/components/workout/ExerciseFilter';
import { Exercise } from '@/lib/supabase';
import { useExerciseStore } from '@/store/exerciseStore';
import colors from '@/theme/colors';

export default function ExerciseSearchScreen() {
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const {
    exercises,
    loading,
    searchExercises,
    muscles,
    levels,
  } = useExerciseStore();

  /* load & respond to filters */
  useEffect(() => {
    searchExercises(query.trim());
  }, [muscles, levels]);

  /* debounce text */
  useEffect(() => {
    const id = setTimeout(() => searchExercises(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const renderItem = ({ item }: { item: Exercise }) => (
    <Pressable
      onPress={() => router.push(`/workout/exercise/${item.id}`)}
      style={styles.item}>
      <View>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSub}>{item.muscle_group}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* filter modal */}
      <Modal
        visible={filterOpen}
        animationType="slide"
        transparent
        statusBarTranslucent>
        <Pressable
          style={{ flex: 1, backgroundColor: '#0006' }}
          onPress={() => setFilterOpen(false)}
        />
        <ExerciseFilter onClose={() => setFilterOpen(false)} />
      </Modal>

      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Search Exercise</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* search row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#8E8E93" size={18} />
          <TextInput
            style={styles.input}
            placeholder="Search exercises…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <Pressable
          style={styles.filterBtn}
          onPress={() => setFilterOpen(true)}>
          <Filter color={colors.primary} size={20} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

/*──────── styles ────────*/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: { flex: 1, marginLeft: 6, color: colors.text, fontSize: 15 },
  filterBtn: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#1b1b1b',
    borderRadius: 10,
  },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  item: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemName: { color: colors.text, fontWeight: '600', fontSize: 16 },
  itemSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
