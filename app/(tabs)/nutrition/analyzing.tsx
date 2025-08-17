import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNutritionStore } from '@/store/nutritionStore';

export default function AnalyzingScreen() {
  const router = useRouter();
  const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();

  // ✅ Selección estable (sin objetos literales)
  const analyzeNewPhoto = useNutritionStore((s) => s.analyzeNewPhoto);
  const isAnalyzing     = useNutritionStore((s) => s.isAnalyzing);
  const error           = useNutritionStore((s) => s.error);
  const clearDraft      = useNutritionStore((s) => s.clearDraft);

  // ✅ Disparador one-shot por fileUri
  const startedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    if (!fileUri) {
      router.back();
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const draftId = await analyzeNewPhoto(fileUri);
        if (!mounted) return;
        if (draftId) {
          router.replace({ pathname: '/(tabs)/nutrition/review/[draftId]', params: { draftId } });
        }
      } catch {
        // el estado de error ya lo gestiona el store
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fileUri, analyzeNewPhoto, router]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>We couldn't analyze your meal</Text>
        <Text style={styles.subtitle}>{String(error)}</Text>

        <View style={{ height: 16 }} />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            clearDraft();
            router.replace('/(tabs)/nutrition/capture');
          }}
        >
          <Text style={styles.btnText}>Try again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)/nutrition')}>
          <Text style={styles.btnSecondaryText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={styles.title}>Analyzing your meal…</Text>
      <Text style={styles.subtitle}>Please hold on while we estimate macros and calories.</Text>
      {!isAnalyzing && <Text style={{ color: '#9CA3AF', marginTop: 16 }}>Almost there…</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  subtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 8, textAlign: 'center' },
  primaryBtn: { marginTop: 8, backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#000', fontWeight: '700' },
  secondaryBtn: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnSecondaryText: { color: '#fff', fontWeight: '600' },
});
