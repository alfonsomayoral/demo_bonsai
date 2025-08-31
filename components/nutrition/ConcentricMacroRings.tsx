import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';

type Props = {
  calories: number; caloriesTarget: number;
  protein: number;  proteinTarget: number;
  carbs: number;    carbsTarget: number;
  fat: number;      fatTarget: number;
  /** Clave para reanimar cuando el panel se revele (p.ej. cambio de página) */
  playKey?: any;
};

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/**
 * 4 anillos concéntricos con animación escalonada:
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
  playKey,
}: Props) {

  // Porcentajes objetivo (0..100)
  const perc = useMemo(() => ({
    kcal : Math.round(clamp(calories / Math.max(1, caloriesTarget)) * 100),
    prot : Math.round(clamp(protein  / Math.max(1, proteinTarget )) * 100),
    carb : Math.round(clamp(carbs    / Math.max(1, carbsTarget   )) * 100),
    fat  : Math.round(clamp(fat      / Math.max(1, fatTarget     )) * 100),
  }), [calories, caloriesTarget, protein, proteinTarget, carbs, carbsTarget, fat, fatTarget]);

  // Valores en pantalla (se animan desde 0 hasta perc.*)
  const [val, setVal] = useState({ kcal: 0, prot: 0, carb: 0, fat: 0 });

  useEffect(() => {
    // reset y animación escalonada para un efecto agradable
    setVal({ kcal: 0, prot: 0, carb: 0, fat: 0 });
    const t1 = setTimeout(() => setVal(v => ({ ...v, kcal: perc.kcal })), 60);
    const t2 = setTimeout(() => setVal(v => ({ ...v, prot: perc.prot })), 160);
    const t3 = setTimeout(() => setVal(v => ({ ...v, carb: perc.carb })), 260);
    const t4 = setTimeout(() => setVal(v => ({ ...v, fat:  perc.fat  })), 360);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [perc.kcal, perc.prot, perc.carb, perc.fat, playKey]);

  return (
    <View style={styles.wrapper}>
      {/* Exterior: Calories (verde) */}
      <CircularProgressBase
        value={val.kcal}
        radius={92}
        maxValue={100}
        duration={1200}
        activeStrokeWidth={14}
        inActiveStrokeWidth={14}
        activeStrokeColor="#10B981"
        inActiveStrokeColor="#1F2937"
        inActiveStrokeOpacity={0.35}
        strokeLinecap="round"
      >
        {/* Protein (rojo) */}
        <CircularProgressBase
          value={val.prot}
          radius={70}
          maxValue={100}
          duration={1100}
          activeStrokeWidth={14}
          inActiveStrokeWidth={14}
          activeStrokeColor="#FF6B6B"
          inActiveStrokeColor="#111827"
          inActiveStrokeOpacity={0.35}
          strokeLinecap="round"
        >
          {/* Carbs (amarillo) */}
          <CircularProgressBase
            value={val.carb}
            radius={50}
            maxValue={100}
            duration={1000}
            activeStrokeWidth={14}
            inActiveStrokeWidth={14}
            activeStrokeColor="#FFD93D"
            inActiveStrokeColor="#0F172A"
            inActiveStrokeOpacity={0.35}
            strokeLinecap="round"
          >
            {/* Interior: Fats (naranja) */}
            <CircularProgressBase
              value={val.fat}
              radius={30}
              maxValue={100}
              duration={900}
              activeStrokeWidth={14}
              inActiveStrokeWidth={14}
              activeStrokeColor="#FF8E53"
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
