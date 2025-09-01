import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  title?: string;
  rm1: number; // 1RM calculado (kg)
}

const to2Dec = (n: number) => Math.round(n * 100) / 100;

/**
 * Brzycki:
 * 1RM = w / (1.0278 - 0.0278*r)
 * w@r = 1RM * (1.0278 - 0.0278*r)
 *
 * Mostramos barras para reps: 6,5,4,3,2,1 (de izquierda a derecha).
 * La barra de 1 rep (última) va en rojo.
 */
export default function BrzyckiRMChart({ title, rm1 }: Props) {
  const reps = [6, 5, 4, 3, 2, 1];
  const weightsRaw = reps.map((r) => Math.max(0, rm1 * (1.0278 - 0.0278 * r)));
  const weights = weightsRaw.map(to2Dec); // normalizamos a 2 decimales para graficar

  const lastIdx = reps.length - 1; // índice de la barra de 1 rep

  const data = {
    labels: reps.map(String), // ['6','5','4','3','2','1']
    datasets: [
      {
        data: weights,
        // Colores por barra: verde para todas menos la última (1 rep), que será roja
        colors: weights.map((_, i) =>
          (opacity = 0.1) =>
            i === lastIdx
              ? `rgba(239, 68, 68, ${opacity})` // rojo (tailwind red-500)
              : `rgba(16, 185, 129, ${opacity})` // verde (tailwind emerald-500)
        ),
      },
    ],
  };

  // ChartKit usa chartConfig.color para los textos (incluye valores sobre barras) ⇒ blanco.
  // Los ejes/labels del eje X van en gris con labelColor.
  const chartConfig = {
    backgroundColor: '#191B1F',
    backgroundGradientFrom: '#191B1F',
    backgroundGradientTo: '#191B1F',
    decimalPlaces: 2, // 2 decimales en eje Y y valores sobre barras
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // valores sobre barras en blanco
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`, // labels eje X en gris
    propsForLabels: { fontSize: 10 },
    barPercentage: 0.8, // barras más anchas
  };

  // Medimos el ancho disponible para evitar overflow
  const [chartW, setChartW] = useState<number>(SCREEN_W - 40 - 32); // fallback (screen - margen - padding card)
  const onLayoutWidth = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - chartW) > 1) setChartW(w);
  };

  return (
    <View style={styles.card}>
      {!!title && <Text style={styles.title}>{title}</Text>}

      {/* wrapper que mide el ancho disponible */}
      <View style={styles.chartBox} onLayout={onLayoutWidth}>
        <BarChart
          style={styles.chart}
          width={Math.max(100, chartW)}
          height={220}
          data={data}
          chartConfig={chartConfig}
          fromZero
          withInnerLines
          showValuesOnTopOfBars
          withCustomBarColorFromData
          flatColor
          // Algunas definiciones de tipos marcan yAxisLabel como requerido:
          yAxisLabel=""
          yAxisSuffix=" kg"
        />
      </View>

      {/* Único texto debajo del chart */}
      <Text style={styles.rmText}>1RM: {to2Dec(rm1)} kg</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#191B1F', borderRadius: 12, padding: 16 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chartBox: { width: '100%' },
  chart: { borderRadius: 12 },
  rmText: { marginTop: 10, color: '#ef4444', fontSize: 16, fontWeight: '700' },
});
