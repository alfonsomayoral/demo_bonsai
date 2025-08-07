import { ScrollView, View, Image, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNutritionStore } from '@/store/nutritionStore';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

/* --- Tipos auxiliares — ya declarados en tu store, aquí por claridad --- */
interface FoodItem {
  name: string;
  weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

interface FoodAnalysisResult {
  imageUrl: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  confidence: number;        // 0-1
  items: FoodItem[];
}

/* ---------------------------- Componente ---------------------------- */
export default function MealReviewScreen() {
  /* 1 · Tomar el parámetro de la URL */
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const router = useRouter();

  /* 2 · Obtener draft & clearDraft del store */
  const { draft, clearDraft } = useNutritionStore((s) => ({
    draft: s.draftId === draftId ? (s.draft as FoodAnalysisResult | null) : null,
    clearDraft: s.clearDraft,
  }));

  /* 3 · Si no hay draft válido mostrar fallback */
  if (!draft) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Draft not found</Text>
      </View>
    );
  }

  const { imageUrl, totals, confidence, items } = draft;

  /* Helper para las tarjetas de macros */
  const MacroCard = ({ label, value, unit = 'kcal' }: { label: string; value: number; unit?: string }) => (
    <View className="flex-1 m-1 bg-white/5 rounded-2xl p-4 items-center">
      <Text className="text-white text-xl font-bold">{value}</Text>
      <Text className="text-gray-300">{label} {unit}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-black" contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Foto/banner */}
      <Image source={{ uri: imageUrl }} className="w-full h-60 rounded-b-3xl" />

      <View className="mt-4 px-4">
        {/* Macros totales */}
        <View className="flex-row">
          <MacroCard label="Calories" value={totals.calories} />
          <MacroCard label="Protein"  value={totals.protein} unit="g" />
        </View>
        <View className="flex-row">
          <MacroCard label="Carbs" value={totals.carbs} unit="g" />
          <MacroCard label="Fat"   value={totals.fat}   unit="g" />
        </View>

        {/* Confianza */}
        <Text className="text-white mt-6">Confidence: {Math.round(confidence * 10)}/10</Text>
        <ProgressBar
          progress={confidence}
          color="#00E676"
          style={{ height: 8, borderRadius: 4 }}
        />

        {/* Lista de ítems */}
        <Text className="text-white mt-6 mb-2 text-lg">Detected foods</Text>
        {items.map((it, i) => (
          <View
            key={i}
            className="flex-row justify-between py-2 border-b border-white/10"
          >
            <Text className="text-white">{it.name}</Text>
            <Text className="text-gray-400">{it.weight_g} g</Text>
          </View>
        ))}

        {/* Botones Fix & Save */}
        <View className="mt-8 flex-row justify-between">
          <TouchableOpacity
            className="flex-row items-center bg-white/10 px-4 py-3 rounded-2xl"
            onPress={() => router.push('./fix-modal')}  
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text className="text-white ml-2">Fix ⭐</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-500 px-6 py-3 rounded-2xl"
            onPress={() => {
              clearDraft();             // limpia draft global
              router.navigate('/nutrition');
            }}
          >
            <Text className="text-white font-semibold">Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
