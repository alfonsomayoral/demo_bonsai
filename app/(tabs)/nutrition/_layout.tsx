// app/(tabs)/nutrition/_layout.tsx
import { Stack } from 'expo-router';

export default function NutritionStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="capture"     options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="analyzing"   options={{ presentation: 'transparentModal' }} />
      <Stack.Screen name="review/[draftId]" />
      <Stack.Screen name="fix-modal"   options={{ presentation: 'modal' }} />
      <Stack.Screen name="detail/[mealId]" />
    </Stack>
  );
}
