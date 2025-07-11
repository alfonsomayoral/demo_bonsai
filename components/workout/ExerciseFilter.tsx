import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useExerciseStore } from '@/store/exerciseStore';
import colors from '@/theme/colors';

const MUSCLES = [
  'arms',
  'abs',
  'back',
  'cardio',
  'chest',
  'glutes',
  'legs',
  'shoulders',
] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

interface Props {
  onClose: () => void;
}

export default function ExerciseFilter({ onClose }: Props) {
  const {
    muscles,
    levels,
    toggleMuscle,
    toggleLevel,
    clearFilters,
  } = useExerciseStore();

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: colors.success },
      ]}>
      <Text style={[styles.chipTxt, active && { color: '#000' }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.sheet}>
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={onClose}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Filter</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* muscles */}
        <Text style={styles.section}>Muscle Group</Text>
        <View style={styles.wrap}>
          {MUSCLES.map((m) => (
            <Chip
              key={m}
              label={m}
              active={muscles.has(m)}
              onPress={() => toggleMuscle(m)}
            />
          ))}
        </View>

        {/* levels */}
        <Text style={styles.section}>Difficulty</Text>
        <View style={styles.wrap}>
          {LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={levels.has(l)}
              onPress={() => toggleLevel(l)}
            />
          ))}
        </View>
      </ScrollView>

      {/* clear */}
      <Pressable
        style={styles.clearBtn}
        onPress={() => {
          clearFilters();
          onClose();
        }}>
        <Text style={styles.clearTxt}>Clear</Text>
      </Pressable>
    </View>
  );
}

/*────────────────── styles ──────────────────*/
const styles = StyleSheet.create({
  sheet: {
    height: '50%',
    width: '100%',
    backgroundColor: colors.background,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerTitle: { fontSize: 21, fontWeight: 'bold', color: colors.text },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  section: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 14,
    marginBottom: 8,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#555',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  chipTxt: { color: '#fff', fontSize: 14, fontWeight: 'bold'  },
  clearBtn: {
    backgroundColor: colors.error,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});