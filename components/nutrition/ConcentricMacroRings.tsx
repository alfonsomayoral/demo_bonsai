// components/nutrition/ConcentricMacroRings.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';

type Props = {
  calories: number; caloriesTarget: number;
  protein: number;  proteinTarget: number;
  carbs: number;    carbsTarget: number;
  fat: number;      fatTarget: number;
};

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/**
 * Panel de 4 anillos concéntricos con animación:
 *  - interior (más pequeño): Fats  (naranja)
 *  - siguiente:               Carbs (amarillo)
 *  - siguiente:               Protein (rojo)
 *  - exterior (más grande):   Calories (verde)
 */
export default function ConcentricMacroRings({
  calories, caloriesTarget,
  protein,  proteinTarget,
  carbs,    carbsTarget,
  fat,      fatTarget,
}: Props) {

  // Porcentajes 0..100 (clamped)
  const perc = useMemo(() => ({
    kcal : Math.round(clamp(calories / Math.max(1, caloriesTarget)) * 100),
    prot : Math.round(clamp(protein  / Math.max(1, proteinTarget )) * 100),
    carb : Math.round(clamp(carbs    / Math.max(1, carbsTarget   )) * 100),
    fat  : Math.round(clamp(fat      / Math.max(1, fatTarget     )) * 100),
  }), [calories, caloriesTarget, protein, proteinTarget, carbs, carbsTarget, fat, fatTarget]);

  return (
    <View style={styles.wrapper}>
      {/* Anillo exterior: Calories (verde) */}
      <CircularProgressBase
        value={perc.kcal}
        radius={92}
        maxValue={100}
        duration={1200}
        activeStrokeWidth={14}
        inActiveStrokeWidth={14}
        activeStrokeColor="#10B981"     // verde
        inActiveStrokeColor="#1F2937"   // gris track
        inActiveStrokeOpacity={0.35}
        strokeLinecap="round"
      >
        {/* Siguiente: Protein (rojo) */}
        <CircularProgressBase
          value={perc.prot}
          radius={70}
          maxValue={100}
          duration={1100}
          activeStrokeWidth={14}
          inActiveStrokeWidth={14}
          activeStrokeColor="#FF6B6B"   // rojo
          inActiveStrokeColor="#111827"
          inActiveStrokeOpacity={0.35}
          strokeLinecap="round"
        >
          {/* Siguiente: Carbs (amarillo) */}
          <CircularProgressBase
            value={perc.carb}
            radius={50}
            maxValue={100}
            duration={1000}
            activeStrokeWidth={14}
            inActiveStrokeWidth={14}
            activeStrokeColor="#FFD93D" // amarillo
            inActiveStrokeColor="#0F172A"
            inActiveStrokeOpacity={0.35}
            strokeLinecap="round"
          >
            {/* Interior: Fats (naranja) */}
            <CircularProgressBase
              value={perc.fat}
              radius={30}
              maxValue={100}
              duration={900}
              activeStrokeWidth={14}
              inActiveStrokeWidth={14}
              activeStrokeColor="#FF8E53" // naranja
              inActiveStrokeColor="#0B1220"
              inActiveStrokeOpacity={0.35}
              strokeLinecap="round"
            >
              {/* “agujero” interior */}
              <View style={styles.centerHole} />
            </CircularProgressBase>
          </CircularProgressBase>
        </CircularProgressBase>
      </CircularProgressBase>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 220,
    width: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHole: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#191B1F',
  },
});
