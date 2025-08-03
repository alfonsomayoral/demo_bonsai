import { ActivityIndicator, View, Text } from 'react-native';

export default function AnalyzingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black/60">
      <ActivityIndicator size="large" color="white" />
      <Text className="text-white mt-4">Analizando tu comida…</Text>
    </View>
  );
}
