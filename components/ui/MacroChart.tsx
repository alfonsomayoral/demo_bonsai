import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MacroChartProps {
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
}

export const MacroChart: React.FC<MacroChartProps> = ({ protein, proteinTarget, carbs, carbsTarget, fat, fatTarget }) => {
  const macros = [
    { label: 'Protein', value: protein, target: proteinTarget, color: '#EF4444' },
    { label: 'Carbs', value: carbs, target: carbsTarget, color: '#F59E0B' },
    { label: 'Fat', value: fat, target: fatTarget, color: '#8B5CF6' },
  ];

  return (
    <View style={styles.container}>
      {macros.map((macro) => {
        const denom = macro.target > 0 ? macro.target : 1;
        const percent = Math.min(macro.value / denom, 1);
        return (
          <View key={macro.label} style={styles.row}>
            <Text style={styles.label}>{macro.label}</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${percent * 100}%`, backgroundColor: macro.color }]} />
            </View>
            <Text style={styles.value}>{macro.value}g / {macro.target}g</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    width: 70,
    color: '#fff',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#374151',
    borderRadius: 5,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  value: {
    width: 80,
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    textAlign: 'right',
  },
}); 