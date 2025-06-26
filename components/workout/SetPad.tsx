import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import {WorkoutNumberPad as NumberPad } from '@/components/workout/WorkoutNumberPad';

interface SetPadProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reps: number, weight: number) => void;
}

export function SetPad({ visible, onClose, onSave }: SetPadProps) {
  const [activeField, setActiveField] = useState<'reps' | 'weight'>('reps');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const handleNumberPress = (number: string) => {
    if (activeField === 'reps') {
      setReps(prev => prev + number);
    } else {
      setWeight(prev => prev + number);
    }
  };

  const handleBackspace = () => {
    if (activeField === 'reps') {
      setReps(prev => prev.slice(0, -1));
    } else {
      setWeight(prev => prev.slice(0, -1));
    }
  };

  const handleDecimal = () => {
    if (activeField === 'weight' && !weight.includes('.')) {
      setWeight(prev => prev + '.');
    }
  };

  const handleSave = () => {
    const repsNum = parseInt(reps) || 0;
    const weightNum = parseFloat(weight) || 0;
    if (repsNum > 0) {
      onSave(repsNum, weightNum);
      setReps('');
      setWeight('');
    }
  };

  const canSave = parseInt(reps) > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Set</Text>
          <TouchableOpacity onPress={onClose}>
            <X color="#8E8E93" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputs}>
          <TouchableOpacity
            style={[
              styles.inputButton,
              activeField === 'reps' && styles.activeInput,
            ]}
            onPress={() => setActiveField('reps')}
          >
            <Text style={styles.inputLabel}>Reps</Text>
            <Text style={styles.inputValue}>{reps || '0'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.inputButton,
              activeField === 'weight' && styles.activeInput,
            ]}
            onPress={() => setActiveField('weight')}
          >
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <Text style={styles.inputValue}>{weight || '0'}</Text>
          </TouchableOpacity>
        </View>

        <NumberPad
          onNumberPress={handleNumberPress}
          onBackspace={handleBackspace}
          onDecimal={handleDecimal}
        />

        <TouchableOpacity
          style={[
            styles.saveButton,
            !canSave && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={[
            styles.saveButtonText,
            !canSave && styles.disabledButtonText,
          ]}>
            Save Set
          </Text>
        </TouchableOpacity>
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
  inputs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  inputButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeInput: {
    borderColor: '#007AFF',
  },
  inputLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  inputValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  saveButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#8E8E93',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#C7C7CC',
  },
});