import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Card } from '@/components/ui/Card';

interface ComparisonCardProps {
  exerciseId: string;
}

export function ComparisonCard({ exerciseId }: ComparisonCardProps) {
  // This would compare with previous workout data
  // For now showing placeholder
  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Compared to Previous Workout</Text>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Volume</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '75%' }]} />
          </View>
          <Text style={styles.metricValue}>+15%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Sets</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '100%' }]} />
          </View>
          <Text style={styles.metricValue}>+20%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Reps</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '90%' }]} />
          </View>
          <Text style={styles.metricValue}>+10%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Weight</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '60%' }]} />
          </View>
          <Text style={styles.metricValue}>+5%</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 60,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    marginBottom: 8,
    justifyContent: 'flex-end',
  },
  progress: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
    minHeight: 4,
  },
  metricValue: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
});