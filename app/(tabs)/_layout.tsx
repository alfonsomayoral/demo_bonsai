
import React from 'react'; 
import { Tabs, Stack } from 'expo-router';
import {
  Camera,
  Dumbbell,
  ChartBar as BarChart3,
  User,
  Calendar,
} from 'lucide-react-native';

/**
 * Tab navigator (bottom bar) + hidden stack for all deep-link screens.
 * Tabs keep header hidden; Stack handles push/pop transitions
 * for every Workout / Routine screen sin duplicar lógica.
 */
export default function TabsLayout() {
  return (
    <>
      {/* ───────────── Tabs (bottom bar) ───────────── */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10B981',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#1F2937',
            borderTopWidth: 1,
            borderTopColor: '#374151',
            paddingBottom: 8,
            paddingTop: 8,
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Inter-Medium',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="nutrition"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ size, color }) => <Camera size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: 'Workout',
            tabBarIcon: ({ size, color }) => <Dumbbell size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>

      {/* ───────────── Hidden stack for deep routes ───────────── */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Workout flow */}
        <Stack.Screen name="workout/ActiveWorkoutScreen" />
        <Stack.Screen name="workout/ExercisePickerScreen" />
        <Stack.Screen name="workout/ExerciseSearchScreen" />
        <Stack.Screen name="workout/exercise/[exerciseId]" />
        <Stack.Screen name="workout/WorkoutSummaryScreen" />

        {/* Routine CRUD flow */}
        <Stack.Screen name="workout/routine/[routineId]" />
        <Stack.Screen name="workout/routine/edit/[routineId]" />
        <Stack.Screen name="workout/routine/create" />
      </Stack>
    </>
  );
}
