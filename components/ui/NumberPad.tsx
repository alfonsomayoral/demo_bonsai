import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';

interface NumberPadProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (weight: number, reps: number) => void;
  initialWeight?: number;
  initialReps?: number;
  exerciseName: string;
}

export function NumberPad({
  visible,
  onClose,
  onConfirm,
  initialWeight = 0,
  initialReps = 0,
  exerciseName,
}: NumberPadProps) {
  const [weight, setWeight] = React.useState(initialWeight.toString());
  const [reps, setReps] = React.useState(initialReps.toString());
  const [activeField, setActiveField] = React.useState<'weight' | 'reps'>('weight');

  React.useEffect(() => {
    if (visible) {
      setWeight(initialWeight.toString());
      setReps(initialReps.toString());
      setActiveField('weight');
    }
  }, [visible, initialWeight, initialReps]);

  const handleNumberPress = (num: string) => {
    if (activeField === 'weight') {
      setWeight(prev => prev === '0' ? num : prev + num);
    } else {
      setReps(prev => prev === '0' ? num : prev + num);
    }
  };

  const handleBackspace = () => {
    if (activeField === 'weight') {
      setWeight(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setReps(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    }
  };

  const handleConfirm = () => {
    const weightNum = parseFloat(weight) || 0;
    const repsNum = parseInt(reps) || 0;
    if (weightNum > 0 && repsNum > 0) {
      onConfirm(weightNum, repsNum);
    }
  };

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫'],
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <Text style={styles.title}>{exerciseName}</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Check size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <TouchableOpacity
            style={[styles.inputField, activeField === 'weight' && styles.activeField]}
            onPress={() => setActiveField('weight')}
          >
            <Text style={styles.inputLabel}>Weight</Text>
            <Text style={styles.inputValue}>{weight} kg</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inputField, activeField === 'reps' && styles.activeField]}
            onPress={() => setActiveField('reps')}
          >
            <Text style={styles.inputLabel}>Reps</Text>
            <Text style={styles.inputValue}>{reps}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.numberPad}>
          {numbers.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.numberRow}>
              {row.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.numberButton}
                  onPress={() => {
                    if (num === '⌫') {
                      handleBackspace();
                    } else if (num === '.' && activeField === 'reps') {
                      // Don't allow decimal for reps
                      return;
                    } else {
                      handleNumberPress(num);
                    }
                  }}
                >
                  <Text style={styles.numberText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  confirmButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeField: {
    borderColor: '#10B981',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  inputValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  numberPad: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  numberButton: {
    flex: 1,
    height: 60,
    backgroundColor: '#374151',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});