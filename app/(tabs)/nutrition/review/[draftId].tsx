import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View, Image, Text, TouchableOpacity } from 'react-native';
import { useNutritionStore } from '@/store/nutritionStore';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function MealReviewScreen() {
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const { draft, draftId: current, clearDraft } = useNutritionStore();
  const router = useRouter();

  if (!draft || draftId !== current) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Draft not found</Text>
      </View>
    );
  }

  const { imageUrl, totals, confidence, items } = draft;
  const card = (label: string, val: number, unit = 'kcal') => (
    <View className="flex-1 m-1 bg-white/5 rounded-2xl p-4 items-center">
      <Text className="text-white text-xl font-bold">{val}</Text>
      <Text className="text-white/80">{label} {unit}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-black" contentContainerStyle={{ paddingBottom: 28 }}>
      <Image source={{ uri: imageUrl }} className="w-full h-60 rounded-b-3xl" />
      <View className="mt-4 px-4">
        <View className="flex-row">{card('Calories', totals.calories)}{card('Protein', totals.protein, 'g')}</View>
        <View className="flex-row">{card('Carbs', totals.carbs, 'g')}   {card('Fat', totals.fat, 'g')}</View>

        <Text className="text-white mt-6">Confidence: {Math.round(confidence * 10)}/10</Text>
        <ProgressBar progress={confidence} color="#00E676" style={{ height: 8, borderRadius: 4 }} />

        <Text className="text-white mt-6 mb-2 text-lg">Detected foods</Text>
        {items.map((it, i) => (
          <View key={i} className="flex-row justify-between py-2 border-b border-white/10">
            <Text className="text-white">{it.name}</Text>
            <Text className="text-white/70">{it.weight_g} g</Text>
          </View>
        ))}

        <View className="mt-8 flex-row justify-between">
          <TouchableOpacity
            className="flex-row items-center bg-white/10 px-4 py-3 rounded-2xl"
            onPress={() => router.push('./(tabs)/nutrition/fix-modal')}
          >
            <Ionicons name="create-outline" size={18} color="white" />
            <Text className="text-white ml-2">Fix ⭐</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-500 px-6 py-3 rounded-2xl"
            onPress={() => {
              // Fase 3 guardará en BD
              clearDraft();
              router.navigate('/(tabs)/nutrition');
            }}
          >
            <Text className="text-white font-semibold">Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
