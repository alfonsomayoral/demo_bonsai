import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Card } from '@/components/ui/Card';

export function MuscleAvatar() {
  // This would render an SVG muscle avatar with recovery colors
  // For now, showing a placeholder
  return (
    <Card style={styles.container}>
      <View style={styles.placeholder}>
        {/* Muscle avatar SVG would go here */}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 120,
    height: 160,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
});