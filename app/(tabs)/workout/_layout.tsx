import React from 'react';
import { Stack } from 'expo-router';

/**
 * Stack dedicado al flujo Workout / Routine.
 * Todas las pantallas dentro de app/(tabs)/workout/** se
 * registran automáticamente; no es necesario listar <Stack.Screen>.
 */
export default function WorkoutStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}