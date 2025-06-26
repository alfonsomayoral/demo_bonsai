import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedMuscles: string[];
  onMusclesChange: (muscles: string[]) => void;
}

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes', 'Cardio'
];

export function FilterBottomSheet({
  visible,
  onClose,
  selectedMuscles,
  onMusclesChange,
}: FilterBottomSheetProps) {
  const toggleMuscle = (muscle: string) => {
    const newSelection = selectedMuscles.includes(muscle)
      ? selectedMuscles.filter(m => m !== muscle)
      : [...selectedMuscles, muscle];
    onMusclesChange(newSelection);
  };

  const renderMuscleItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.muscleItem,
        selectedMuscles.includes(item) && styles.selectedMuscleItem,
      ]}
      onPress={() => toggleMuscle(item)}
    >
      <Text
        style={[
          styles.muscleText,
          selectedMuscles.includes(item) && styles.selectedMuscleText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter by Muscle Group</Text>
          <TouchableOpacity onPress={onClose}>
            <X color="#8E8E93" size={24} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={MUSCLE_GROUPS}
          renderItem={renderMuscleItem}
          keyExtractor={(item) => item}
          numColumns={2}
          contentContainerStyle={styles.list}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onMusclesChange([])}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={onClose}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  muscleItem: {
    flex: 1,
    margin: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedMuscleItem: {
    backgroundColor: '#007AFF',
  },
  muscleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  selectedMuscleText: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8E8E93',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});