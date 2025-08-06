import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useNutritionStore } from '@/store/nutritionStore';

export default function FixModal() {
  const [input, setInput] = useState('');
  const router = useRouter();
  const fixDraft = useNutritionStore(s => s.fixDraft);

  const submit = async () => {
    if (!input.trim()) return;
    await fixDraft(input.trim());
    router.back();
  };

  return (
    <View className="flex-1 bg-black px-4 pt-8">
      <TextInput
        placeholder="Describe exactamente lo que comiste…"
        placeholderTextColor="#aaa"
        multiline
        value={input}
        onChangeText={setInput}
        className="text-white text-base border border-white/20 rounded-xl p-4 h-40"
      />
      <TouchableOpacity onPress={submit} className="bg-green-600 mt-6 py-3 rounded-xl items-center">
        <Text className="text-white font-semibold">Re-analizar</Text>
      </TouchableOpacity>
    </View>
  );
}
