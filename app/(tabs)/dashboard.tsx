import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Activity, Target, Calendar, Award } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';

const { width } = Dimensions.get('window');

const weeklyData = [
  { day: 'Mon', calories: 2100, burned: 450, weight: 75.2 },
  { day: 'Tue', calories: 2050, burned: 520, weight: 75.1 },
  { day: 'Wed', calories: 2200, burned: 480, weight: 75.0 },
  { day: 'Thu', calories: 1950, burned: 600, weight: 74.9 },
  { day: 'Fri', calories: 2150, burned: 420, weight: 74.8 },
  { day: 'Sat', calories: 2300, burned: 380, weight: 74.9 },
  { day: 'Sun', calories: 2000, burned: 500, weight: 75.0 },
];

const achievements = [
  { id: 1, title: '7-Day Streak', description: 'Logged meals for 7 days', icon: '🔥', unlocked: true },
  { id: 2, title: 'Protein Goal', description: 'Hit protein target 5 days', icon: '💪', unlocked: true },
  { id: 3, title: 'Workout Warrior', description: 'Complete 10 workouts', icon: '⚡', unlocked: false },
];

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const currentStats = {
    weight: 75.0,
    weightChange: -0.2,
    calorieBalance: -150,
    weeklyVolume: 12500,
    consistency: 85,
  };

  const renderChart = () => {
    const maxCalories = Math.max(...weeklyData.map(d => d.calories));
    const maxBurned = Math.max(...weeklyData.map(d => d.burned));

    return (
      <Card variant="dark" style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Calories In vs Out</Text>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Consumed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Burned</Text>
          </View>
        </View>
        
        <View style={styles.chart}>
          {weeklyData.map((data, index) => {
            const consumedHeight = (data.calories / maxCalories) * 120;
            const burnedHeight = (data.burned / maxBurned) * 120;
            
            return (
              <View key={data.day} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: consumedHeight, 
                        backgroundColor: '#10B981',
                        marginRight: 2,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: burnedHeight, 
                        backgroundColor: '#EF4444',
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartLabel}>{data.day}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  const renderWeightTrend = () => {
    const minWeight = Math.min(...weeklyData.map(d => d.weight));
    const maxWeight = Math.max(...weeklyData.map(d => d.weight));
    const range = maxWeight - minWeight || 1;
    const chartWidth = width - 100;
    const pointWidth = (chartWidth - 40) / (weeklyData.length - 1);

    return (
      <Card variant="dark" style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weight Trend</Text>
        <View style={styles.weightChart}>
          <View style={styles.weightLine}>
            {weeklyData.map((data, index) => {
              const y = ((maxWeight - data.weight) / range) * 80;
              const x = index * pointWidth;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.weightPoint,
                    {
                      left: x,
                      top: y,
                    }
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.weightLabels}>
            {weeklyData.map((data, index) => (
              <Text key={index} style={styles.weightLabel}>
                {data.day}
              </Text>
            ))}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <Card variant="dark" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Current Weight</Text>
              <TrendingDown size={16} color="#10B981" />
            </View>
            <Text style={styles.metricValue}>{currentStats.weight} kg</Text>
            <Text style={styles.metricChange}>
              {currentStats.weightChange > 0 ? '+' : ''}{currentStats.weightChange} kg this week
            </Text>
          </Card>

          <Card variant="dark" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Calorie Balance</Text>
              <Activity size={16} color="#EF4444" />
            </View>
            <Text style={[styles.metricValue, { color: currentStats.calorieBalance < 0 ? '#EF4444' : '#10B981' }]}>
              {currentStats.calorieBalance > 0 ? '+' : ''}{currentStats.calorieBalance}
            </Text>
            <Text style={styles.metricChange}>Daily average</Text>
          </Card>

          <Card variant="dark" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Training Volume</Text>
              <Target size={16} color="#3B82F6" />
            </View>
            <Text style={styles.metricValue}>{currentStats.weeklyVolume.toLocaleString()}</Text>
            <Text style={styles.metricChange}>kg this week</Text>
          </Card>

          <Card variant="dark" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Consistency</Text>
              <Award size={16} color="#F59E0B" />
            </View>
            <Text style={styles.metricValue}>{currentStats.consistency}%</Text>
            <Text style={styles.metricChange}>Tracking rate</Text>
          </Card>
        </View>

        {/* Charts */}
        {renderChart()}
        {renderWeightTrend()}

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {achievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              variant="dark"
              style={[
                styles.achievementCard,
                !achievement.unlocked && styles.achievementCardLocked
              ].filter(Boolean) as import('react-native').ViewStyle[]}
            >
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <View style={styles.achievementInfo}>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.achievementTitleLocked
                ]}>
                  {achievement.title}
                </Text>
                <Text style={[
                  styles.achievementDescription,
                  !achievement.unlocked && styles.achievementDescriptionLocked
                ]}>
                  {achievement.description}
                </Text>
              </View>
              {achievement.unlocked && (
                <View style={styles.achievementBadge}>
                  <Text style={styles.achievementBadgeText}>✓</Text>
                </View>
              )}
            </Card>
          ))}
        </View>

        {/* Weekly Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This Week's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>5</Text>
              <Text style={styles.summaryLabel}>Workouts</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>14,850</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>98%</Text>
              <Text style={styles.summaryLabel}>Goal Achievement</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#10B981',
  },
  periodText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: (width - 52) / 2,
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
  },
  chartBar: {
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 8,
  },
  bar: {
    width: 12,
    borderRadius: 6,
  },
  chartLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  weightChart: {
    height: 120,
    position: 'relative',
  },
  weightLine: {
    flex: 1,
    position: 'relative',
  },
  weightPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  weightLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  weightLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: '#9CA3AF',
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  achievementDescriptionLocked: {
    color: '#6B7280',
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  summaryCard: {
    backgroundColor: '#10B981',
    padding: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#D1FAE5',
    textAlign: 'center',
  },
});