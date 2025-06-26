import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { useRoutineStore } from '@/store/routineStore';
import colors from '@/theme/colors';

const ROUTINE_COLORS = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#FF2D92',
  '#5AC8FA',
  '#FFCC00',
];

export default function CreateRoutineScreen() {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(ROUTINE_COLORS[0]);

  const { addRoutine } = useRoutineStore();

  /* ───────────── handlers ───────────── */
  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    try {
      await addRoutine(trimmed, selectedColor);
      router.back(); // vuelve al carrusel
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not create routine.');
      console.error('[CreateRoutine]', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#007AFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>New Routine</Text>
        <TouchableOpacity onPress={handleSave}>
          <Check color="#007AFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Card style={styles.formCard}>
          <Text style={styles.label}>Routine Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter routine name"
            autoFocus
          />

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {ROUTINE_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && <Check color="#FFFFFF" size={20} />}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={[styles.previewCard, { backgroundColor: selectedColor }]}>
          <Text style={styles.previewText}>{name || 'Routine Preview'}</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  content: { flex: 1, paddingHorizontal: 20 },
  formCard: { marginBottom: 20, padding: 20, backgroundColor: colors.card },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  previewCard: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  previewText: { fontSize: 18, fontWeight: '600', color: colors.text },
});
