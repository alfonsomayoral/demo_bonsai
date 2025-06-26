import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Trash } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { useRoutineStore } from '@/app/store/routineStore';

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

export default function EditRoutineScreen() {
  /* params */
  const { routineId } = useLocalSearchParams<{ routineId: string }>();

  /* stores */
  const {
    getRoutineById,
    updateRoutine,
    deleteRoutine,
  } = useRoutineStore();

  /* initial data */
  const routine = getRoutineById(routineId!);

  /* local state */
  const [name, setName] = useState(routine?.name ?? '');
  const [selectedColor, setSelectedColor] = useState(
    routine?.color ?? ROUTINE_COLORS[0],
  );

  /* guard */
  useEffect(() => {
    if (!routine) {
      Alert.alert('Error', 'Routine not found', [{ onPress: () => router.back() }]);
    }
  }, [routine]);

  /*───────────────────── handlers ─────────────────────*/
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    try {
      await updateRoutine(routineId!, name.trim(), selectedColor);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not save routine.');
      console.error(e);
    }
  };

  const handleDelete = () =>
    Alert.alert('Delete Routine', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRoutine(routineId!);
            router.back();
          } catch (e) {
            Alert.alert('Error', 'Could not delete routine.');
            console.error(e);
          }
        },
      },
    ]);

  /*────────────────────── UI ──────────────────────────*/
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#007AFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Routine</Text>
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

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash color="#FFFFFF" size={20} />
          <Text style={styles.deleteText}>Delete Routine</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#000' },
  content: { flex: 1, paddingHorizontal: 20 },
  formCard: { marginBottom: 20, padding: 20 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    fontSize: 16,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 8,
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
    marginBottom: 40,
  },
  previewText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  deleteButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});