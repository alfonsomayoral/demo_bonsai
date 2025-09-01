import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type Point = { date: Date; value: number };

interface Props {
  title?: string;
  data: Point[];                 // datos ya agrupados por día
  height?: number;
  accentColor?: string;          // línea principal
  trendColor?: string;           // línea de tendencia
}

const { width: SCREEN_W } = Dimensions.get('window');

function linearRegression(y: number[]) {
  const n = y.length;
  if (n === 0) return { m: 0, b: 0 };
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const denom = n * sumXX - sumX * sumX || 1;
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

const formatDay = (d: Date) =>
  d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

export default function ExerciseVolumeChart({
  title,
  data,
  height = 220,
  accentColor = '#10B981',       // verde
  trendColor = '#a855f7',        // morado
}: Props) {
  const labels = useMemo(() => data.map(p => formatDay(p.date)), [data]);
  const yValues = useMemo(() => data.map(p => p.value), [data]);

  const trend = useMemo(() => {
    if (yValues.length === 0) return [];
    if (yValues.length === 1) return [yValues[0]];
    const { m, b } = linearRegression(yValues);
    return yValues.map((_, i) => m * i + b);
  }, [yValues]);

  // ChartKit espera: labels + datasets (podemos superponer la tendencia como segundo dataset)
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: yValues,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // linea principal (verde)
          strokeWidth: 3,
        },
        ...(trend.length ? [{
          data: trend,
          color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`, // tendencia (morado)
          strokeWidth: 2,
        }] : []),
      ],
      // Opcionalmente se puede pasar legend si quieres mostrarla (no requerido)
      // legend: ['Volume', 'Trend'],
    }),
    [labels, yValues, trend]
  );

  // Configuración visual del chart
  const chartConfig = {
    backgroundColor: '#191B1F',
    backgroundGradientFrom: '#191B1F',
    backgroundGradientTo: '#191B1F',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255,255,255,${opacity})`,        // textos (incluye valores)
    labelColor: (opacity = 1) => `rgba(156,163,175,${opacity})`,    // labels de ejes
    propsForDots: {
      r: '4',                                                       // puntos visibles
    },
    propsForBackgroundLines: {
      stroke: 'rgba(255,255,255,0.08)',
    },
  };

  // Evitar cortes de etiquetas Y: medimos ancho disponible y damos un margen interno
  const [chartW, setChartW] = useState<number>(SCREEN_W - 40 - 16);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - chartW) > 1) setChartW(w);
  };

  return (
    <View style={styles.card}>
      {!!title && <Text style={styles.title}>{title}</Text>}

      {data.length === 0 ? (
        <View style={[styles.empty, { height }]}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      ) : (
        <View style={styles.chartWrap} onLayout={onLayout}>
          <LineChart
            data={chartData}
            width={Math.max(100, chartW)}
            height={height}
            chartConfig={chartConfig}
            withShadow         // ⟵ sombra bajo la línea principal
            withInnerLines
            withOuterLines={false}
            withDots           // ⟵ puntos en los datos
            bezier             // ⟵ Bezier line chart
            yLabelsOffset={8}  // ⟵ separa números del eje Y para que no se corten
            xLabelsOffset={-4} // ⟵ ajusta un poco el X para que no colisione
            style={styles.chart}
            segments={6}
            formatYLabel={(v: string) => `${Math.round(Number(v))}`}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#191B1F', borderRadius: 12, padding: 16 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  empty: {
    backgroundColor: '#111318',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: '#9CA3AF' },

  chartWrap: {
    width: '100%',
    // margen interior para evitar que se "corten" etiquetas y puntos
    paddingLeft: 6,
    paddingRight: 10,
  },
  chart: {
    borderRadius: 12,
  },
});
