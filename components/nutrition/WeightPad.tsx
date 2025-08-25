// components/ui/nutrition/WeightPad.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export interface WeightPadProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (grams: number) => void;
  initialGrams?: number;
  foodName?: string;
}

export function WeightPad({
  visible,
  onClose,
  onConfirm,
  initialGrams = 0,
  foodName = 'Food',
}: WeightPadProps) {
  const [grams, setGrams] = React.useState(initialGrams.toString());

  React.useEffect(() => {
    if (visible) {
      setGrams((initialGrams ?? 0).toString());
    }
  }, [visible, initialGrams]);

  const handleNumberPress = (num: string) => {
    setGrams(prev => {
      if (num === '.' && prev.includes('.')) return prev;
      if (prev === '0' && num !== '.') return num; // evitar 0 inicial
      return prev + num;
    });
  };

  const handleBackspace = () => {
    setGrams(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleConfirm = () => {
    const g = Math.max(0, Math.round(parseFloat(grams) || 0));
    if (g > 0) onConfirm(g);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <MaterialCommunityIcons name="close" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {foodName}
          </Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.iconBtn}>
            <MaterialCommunityIcons name="check" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Input card única: Weight (g) */}
        <View style={styles.inputWrap}>
          <View style={[styles.inputField, styles.activeField]}>
            <Text style={styles.inputLabel}>Weight</Text>
            <View style={styles.valueRow}>
              <MaterialCommunityIcons name="weight" size={18} color="#9CA3AF" />
              <Text style={styles.inputValue}>{grams} g</Text>
            </View>
          </View>
        </View>

        {/* Teclado numérico */}
        <View style={styles.pad}>
          {numbers.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map(key => (
                <TouchableOpacity
                  key={key}
                  style={styles.keyBtn}
                  onPress={() => {
                    if (key === '⌫') return handleBackspace();
                    if (key === '.' && grams.includes('.')) return;
                    handleNumberPress(key);
                  }}
                >
                  <Text style={styles.keyText}>{key}</Text>
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
  container: { flex: 1, backgroundColor: '#0B0B0D' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter-SemiBold' },
  separator: { height: 1, backgroundColor: '#1F2937' },

  inputWrap: { padding: 20 },
  inputField: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeField: { borderColor: '#10B981' },
  inputLabel: { color: '#9CA3AF', fontSize: 14, fontFamily: 'Inter-Medium', marginBottom: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputValue: { color: '#FFFFFF', fontSize: 28, fontFamily: 'Inter-Bold' },

  pad: { flex: 1, paddingHorizontal: 20, paddingBottom: 24, justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  keyBtn: {
    flex: 1,
    height: 60,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { color: '#FFFFFF', fontSize: 24, fontFamily: 'Inter-SemiBold' },
});

export default WeightPad;
