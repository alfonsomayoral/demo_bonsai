import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
  
  // Split the time string to separate date and time
  const [date, timeOnly] = time.split(' ').length === 2 ? time.split(' ') : ['', time];
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({ pathname: './nutrition/detail/[mealId]', params: { mealId } })
      }
    >
      <Image source={{ uri: image }} style={styles.thumb} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <View style={styles.calorieRow}>
          <MaterialCommunityIcons name="fire-circle" size={16} color="#22c55e" />
          <Text style={styles.subtitle}> {kcal} kcal</Text>
        </View>
        <View style={styles.macros}>
          <View style={styles.macroItem}>
            <MaterialCommunityIcons name="food-drumstick" size={14} color="#ef4444" />
            <Text style={styles.macroText}>{protein}g</Text>
          </View>
          <View style={styles.macroItem}>
            <MaterialCommunityIcons name="rice" size={14} color="#eab308" />
            <Text style={styles.macroText}>{carbs}g</Text>
          </View>
          <View style={styles.macroItem}>
            <MaterialCommunityIcons name="cheese" size={14} color="#f97316" />
            <Text style={styles.macroText}>{fat}g</Text>
          </View>
        </View>
      </View>
      
      {/* Date and time in top right corner */}
      <View style={styles.timeContainer}>
        {date && <Text style={styles.date}>{date}</Text>}
        <Text style={styles.time}>{timeOnly}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row', 
    padding: 8, 
    borderRadius: 16, 
    backgroundColor: '#191B1F', 
    marginBottom: 12,
    position: 'relative' // Added for absolute positioning of time container
  },
  thumb: { width: 70, height: 70, borderRadius: 16, marginRight: 12 },
  info:  { flex: 1 },
  title: { color: '#FFFFFF', fontFamily: 'Inter-SemiBold', marginBottom: 2, fontSize: 18},
  subtitle: { color: '#9CA3AF', fontSize: 12 },
  calorieRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  macros: { flexDirection: 'row', marginTop: 1 },
  macroItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  macroText: { color: '#9CA3AF', fontSize: 12, marginLeft: 4 },
  
  // New styles for date and time container
  timeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'flex-end',
  },
  date: { 
    color: '#9CA3AF', 
    fontSize: 12, 
    fontFamily: 'Inter-Medium',
    marginBottom: 2
  },
  time: { 
    color: '#9CA3AF', 
    fontSize: 11,
    fontFamily: 'Inter-Regular'
  },
});
