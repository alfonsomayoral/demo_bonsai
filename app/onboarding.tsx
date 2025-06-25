import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Target, User, Scale, TrendingUp, Dumbbell, Activity, Utensils } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

const goals = [
  { id: 'cut', title: 'Cut', subtitle: 'Lose weight & fat', icon: TrendingUp, multiplier: 0.8 },
  { id: 'maintain', title: 'Maintain', subtitle: 'Stay at current weight', icon: Scale, multiplier: 1.0 },
  { id: 'bulk', title: 'Bulk', subtitle: 'Gain muscle & weight', icon: Target, multiplier: 1.2 },
];

const gymFrequency = [
  { id: 1, label: '1-2 times' },
  { id: 3, label: '3-4 times' },
  { id: 5, label: '5-6 times' },
  { id: 7, label: 'Daily' },
];

const mealOptions = [
  { id: 2, label: '2 meals' },
  { id: 3, label: '3 meals' },
  { id: 4, label: '4 meals' },
  { id: 5, label: '5+ meals' },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    unitSystem: 'metric',
    goal: '',
    gymSessions: 3,
    runsRegularly: false,
    mealsPerDay: 3,
  });

  const calculateCalories = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age);
    
    // Harris-Benedict equation (simplified)
    const bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    const activityMultiplier = 1.3 + (formData.gymSessions * 0.1) + (formData.runsRegularly ? 0.2 : 0);
    const goal = goals.find(g => g.id === formData.goal);
    return Math.round(bmr * activityMultiplier * (goal?.multiplier || 1));
  };

  const handleComplete = async () => {
    const calories = calculateCalories();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('users').upsert({
          id: user.id,
          email: user.email || '',
          full_name: formData.name,
          goal_type: formData.goal as 'cut' | 'maintain' | 'bulk',
          gym_sessions_per_week: formData.gymSessions,
          runs_regularly: formData.runsRegularly,
          meals_per_day: formData.mealsPerDay,
          kcal_target: calories,
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          age: parseInt(formData.age, 10),
          unit_system: formData.unitSystem,
        });
        
        if (error) throw error;
      }
      
      router.replace('/(tabs)/nutrition');
    } catch (error) {
      let errorMsg = 'Unknown error';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMsg = (error as any).message;
      } else {
        errorMsg = String(error);
      }
      alert('Error saving user data: ' + errorMsg);
      router.replace('/(tabs)/nutrition');
    }
  };

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome to Bonsai</Text>
      <Text style={styles.subtitle}>
        Your personal nutrition and fitness companion
      </Text>
      
      <Card variant="dark" style={styles.card}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>What's your name?</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder="25"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={formData.weight}
              onChangeText={(text) => setFormData({ ...formData, weight: text })}
              placeholder="70"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={formData.height}
            onChangeText={(text) => setFormData({ ...formData, height: text })}
            placeholder="175"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </Card>

      <Button
        title="Continue"
        onPress={() => setStep(2)}
        disabled={!formData.name || !formData.age || !formData.weight || !formData.height}
        style={styles.button}
      />
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>What's your goal?</Text>
      <Text style={styles.subtitle}>
        This helps us calculate your daily calorie and macro targets
      </Text>
      
      <View style={styles.goalsContainer}>
        {goals.map((goal) => {
          const IconComponent = goal.icon;
          return (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                formData.goal === goal.id && styles.goalCardSelected
              ]}
              onPress={() => setFormData({ ...formData, goal: goal.id })}
            >
              <IconComponent 
                size={32} 
                color={formData.goal === goal.id ? '#10B981' : '#9CA3AF'} 
              />
              <Text style={[
                styles.goalTitle,
                formData.goal === goal.id && styles.goalTitleSelected
              ]}>
                {goal.title}
              </Text>
              <Text style={styles.goalSubtitle}>{goal.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        title="Continue"
        onPress={() => setStep(3)}
        disabled={!formData.goal}
        style={styles.button}
      />
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fitness Habits</Text>
      <Text style={styles.subtitle}>
        Help us personalize your experience
      </Text>
      <Card variant="dark" style={styles.card}>
        <View style={styles.questionSection}>
          <View style={styles.questionHeader}>
            <Dumbbell size={24} color="#10B981" />
            <Text style={styles.questionTitle}>How often do you lift weights?</Text>
          </View>
          <View style={styles.optionsGrid}>
            {gymFrequency.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  formData.gymSessions === option.id && styles.optionCardSelected
                ]}
                onPress={() => setFormData({ ...formData, gymSessions: option.id })}
              >
                <Text style={[
                  styles.optionText,
                  formData.gymSessions === option.id && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.questionSection}>
          <View style={styles.questionHeader}>
            <Activity size={24} color="#10B981" />
            <Text style={styles.questionTitle}>Do you run regularly?</Text>
          </View>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                !formData.runsRegularly && styles.toggleOptionSelected
              ]}
              onPress={() => setFormData({ ...formData, runsRegularly: false })}
            >
              <Text style={[
                styles.toggleText,
                !formData.runsRegularly && styles.toggleTextSelected
              ]}>
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                formData.runsRegularly && styles.toggleOptionSelected
              ]}
              onPress={() => setFormData({ ...formData, runsRegularly: true })}
            >
              <Text style={[
                styles.toggleText,
                formData.runsRegularly && styles.toggleTextSelected
              ]}>
                Yes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.questionSection}>
          <View style={styles.questionHeader}>
            <Utensils size={24} color="#10B981" />
            <Text style={styles.questionTitle}>How many meals per day?</Text>
          </View>
          <View style={styles.optionsGrid}>
            {mealOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  formData.mealsPerDay === option.id && styles.optionCardSelected
                ]}
                onPress={() => setFormData({ ...formData, mealsPerDay: option.id })}
              >
                <Text style={[
                  styles.optionText,
                  formData.mealsPerDay === option.id && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.questionSection}>
          <View style={styles.questionHeader}>
            <Scale size={24} color="#10B981" />
            <Text style={styles.questionTitle}>Which units do you prefer?</Text>
          </View>
          <View style={styles.optionsGrid}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                formData.unitSystem === 'metric' && styles.optionCardSelected
              ]}
              onPress={() => setFormData({ ...formData, unitSystem: 'metric' })}
            >
              <Text style={[
                styles.optionText,
                formData.unitSystem === 'metric' && styles.optionTextSelected
              ]}>
                Metric (kg, cm)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionCard,
                formData.unitSystem === 'imperial' && styles.optionCardSelected
              ]}
              onPress={() => setFormData({ ...formData, unitSystem: 'imperial' })}
            >
              <Text style={[
                styles.optionText,
                formData.unitSystem === 'imperial' && styles.optionTextSelected
              ]}>
                Imperial (lb, in)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
      <Button
        title="Continue"
        onPress={() => setStep(4)}
        style={styles.button}
      />
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>You're All Set!</Text>
      <Text style={styles.subtitle}>
        Based on your profile, here's your personalized plan
      </Text>
      
      <Card variant="dark" style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Daily Target</Text>
        <Text style={styles.calorieTarget}>{calculateCalories()} calories</Text>
        <Text style={styles.summaryText}>
          Based on your {goals.find(g => g.id === formData.goal)?.title.toLowerCase()} goal
        </Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formData.gymSessions}x</Text>
            <Text style={styles.summaryLabel}>Gym sessions/week</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formData.mealsPerDay}</Text>
            <Text style={styles.summaryLabel}>Meals per day</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formData.runsRegularly ? 'Yes' : 'No'}</Text>
            <Text style={styles.summaryLabel}>Running</Text>
          </View>
        </View>
      </Card>

      <Button
        title="Start Your Journey"
        onPress={handleComplete}
        style={styles.button}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  card: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    marginTop: 24,
  },
  goalsContainer: {
    marginBottom: 24,
  },
  goalCard: {
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  goalCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  goalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  goalTitleSelected: {
    color: '#10B981',
  },
  goalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  questionSection: {
    marginBottom: 32,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  questionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  optionTextSelected: {
    color: '#10B981',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleOption: {
    flex: 1,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  toggleOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  toggleText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  toggleTextSelected: {
    color: '#10B981',
  },
  summaryCard: {
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  calorieTarget: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});