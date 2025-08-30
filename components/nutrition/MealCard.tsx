import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { signedImageUrl } from '@/lib/supabase';

type Props = {
  mealId: string;
  title: string;
  /** Texto de fecha/hora ya formateado para mostrar a la derecha del título */
  time: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Ruta en Storage (o null). Si se provee, se muestra miniatura a la izquierda */
  imagePath?: string | null;
  /** Si se provee, se usa en vez de la navegación por defecto */
  onPress?: () => void;
};

export const MealCard: React.FC<Props> = ({
  mealId,
  title,
  time,
  kcal,
  protein,
  carbs,
  fat,
  imagePath,
  onPress,
}) => {
  const router = useRouter();
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let live = true;

    (async () => {
      if (!imagePath) {
        setThumbUrl(null);
        return;
      }
      // Si ya es una URL http(s), úsala tal cual; si es path de Storage, fírmala
      if (/^https?:\/\//i.test(imagePath)) {
        if (live) setThumbUrl(imagePath);
      } else {
        const url = await signedImageUrl(imagePath, 200);
        if (live) setThumbUrl(url);
      }
    })();

    return () => {
      live = false;
    };
  }, [imagePath]);

  const handlePress = () => {
    if (onPress) return onPress();
    router.push(`/(tabs)/nutrition/detail/${mealId}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      {/* Miniatura izquierda */}
      <View style={styles.thumbWrap}>
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <MaterialCommunityIcons name="image-outline" size={22} color="#9CA3AF" />
          </View>
        )}
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <MaterialCommunityIcons name="fire" size={14} color="#22c55e" />
            <Text style={styles.macroText}>{kcal} kcal</Text>
          </View>
          <View style={styles.macroItem}>
            <MaterialCommunityIcons name="food-drumstick" size={14} color="#ef4444" />
            <Text style={styles.macroText}>{protein} g</Text>
          </View>
          <View style={styles.macroItem}>
            <MaterialCommunityIcons name="rice" size={14} color="#eab308" />
            <Text style={styles.macroText}>{carbs} g</Text>
          </View>
          <View style={styles.macroItem}>
            <MaterialCommunityIcons name="cheese" size={14} color="#f97316" />
            <Text style={styles.macroText}>{fat} g</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CARD_BG = '#0B0F14';
const TEXT_MID = '#9CA3AF';

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbWrap: { marginRight: 10 },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#111827' },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#E5E7EB', fontSize: 14, fontWeight: '700', flex: 1, paddingRight: 10 },
  time: { color: TEXT_MID, fontSize: 12 },
  macrosRow: { flexDirection: 'row', marginTop: 6, justifyContent: 'space-between' },
  macroItem: { flexDirection: 'row', alignItems: 'center' },
  macroText: { color: TEXT_MID, marginLeft: 6, fontSize: 12, fontWeight: '600' },
});
