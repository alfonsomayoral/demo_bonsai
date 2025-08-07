import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  name:  string;
  value: number;
  left:  number;
  color: string;
}

export const MacroCard: React.FC<Props> = ({ name, value, left, color }) => (
  <View style={[styles.card, { borderColor: color }]}>
    <Text style={styles.left}>{left}g</Text>
    <Text style={styles.label}>{name} left</Text>
    <View style={[styles.dot, { backgroundColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: 100,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  left:  { fontSize: 20, color: '#FFFFFF', fontFamily: 'Inter-Bold' },
  label: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter-Regular' },
  dot:   { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
});
