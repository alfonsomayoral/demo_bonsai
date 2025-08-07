import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  mealId: string;
  image:  string;
  title:  string;
  kcal:   number;
  protein: number;
  carbs:   number;
  fat:     number;
  time:    string;
}

export const MealCard: React.FC<Props> = ({
  mealId, image, title, kcal, protein, carbs, fat, time,
}) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`detail/${mealId}`)}>
      <Image source={{ uri: image }} style={styles.thumb} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{kcal} kcal</Text>
        <View style={styles.macros}>
          <Text style={styles.macroText}>⚡ {protein}g</Text>
          <Text style={styles.macroText}>🍞 {carbs}g</Text>
          <Text style={styles.macroText}>🧈 {fat}g</Text>
        </View>
      </View>
      <Text style={styles.time}>{time}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 12, borderRadius: 16, backgroundColor: '#1F2937', marginBottom: 12 },
  thumb: { width: 56, height: 56, borderRadius: 12, marginRight: 12 },
  info:  { flex: 1 },
  title: { color: '#FFFFFF', fontFamily: 'Inter-SemiBold' },
  subtitle: { color: '#9CA3AF', fontSize: 12 },
  macros: { flexDirection: 'row', marginTop: 4 },
  macroText: { color: '#9CA3AF', fontSize: 10, marginRight: 6 },
  time: { color: '#9CA3AF', fontSize: 12, alignSelf: 'flex-start' },
});
