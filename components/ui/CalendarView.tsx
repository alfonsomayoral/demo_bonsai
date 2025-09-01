import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// Semana iniciando en LUNES
const dayNames = ['M','T','W','T','F','S','S'];

/** YYYY-MM-DD en horario local (sin toISOString para evitar desfases) */
function ymdLocalFromParts(year: number, monthIndex: number, day: number) {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}
function ymdLocalToday() {
  const d = new Date();
  return ymdLocalFromParts(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeekSundayIndex(year: number, month: number) {
  // 0..6 (0 = Domingo, 1 = Lunes, ...)
  return new Date(year, month, 1).getDay();
}

type MealSlot = 'morning' | 'day' | 'night';
export type DayMarkers = {
  workout?: boolean;
  meals?: MealSlot[]; // cada franja sólo se marca una vez máximo
};

interface CalendarViewProps {
  /** Marcadores por día: entreno y franjas de comidas */
  dayMarkers: { [date: string]: DayMarkers };
  selectedDate: string;
  onDaySelect: (date: string) => void;
  currentMonth: number;
  setCurrentMonth: (month: number) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
}

type DayCell = { key: string; label: number } | null;

export const CalendarView: React.FC<CalendarViewProps> = ({
  dayMarkers,
  selectedDate,
  onDaySelect,
  currentMonth,
  setCurrentMonth,
  currentYear,
  setCurrentYear,
}) => {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  // Índice del primer día del mes con base DOMINGO (0=Dom,...6=Sáb)
  const firstSundayIdx = getFirstDayOfWeekSundayIndex(currentYear, currentMonth);

  // Convertimos a índice con base LUNES (0=Lun,...6=Dom)
  // Si el primer día es Lunes (1 en base domingo), queremos 0 "pads".
  // Fórmula estándar: (idxDomingo + 6) % 7
  const leadingNulls = (firstSundayIdx + 6) % 7;

  const todayString = ymdLocalToday();

  // Construcción de la cuadricula: sólo días del mes (los previos se pintan vacíos)
  const days: DayCell[] = Array(leadingNulls).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ key: ymdLocalFromParts(currentYear, currentMonth, d), label: d });
  }
  while (days.length % 7 !== 0) days.push(null);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth}>
          <ChevronLeft size={22} color="#10B981" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{monthNames[currentMonth]} {currentYear}</Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <ChevronRight size={22} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Días de la semana (L a D) */}
      <View style={styles.weekdaysRow}>
        {dayNames.map((d, i) => (
          <Text key={i} style={styles.weekdayText}>{d}</Text>
        ))}
      </View>

      {/* Grid de días */}
      <View style={styles.grid}>
        {days.map((cell, idx) => {
          if (!cell) {
            return <View key={`pad-${idx}`} style={[styles.dayCell, styles.emptyCell]} />;
          }
          const isSelected = cell.key === selectedDate;
          const isToday = cell.key === todayString;
          const markers = dayMarkers[cell.key]; // { workout?: boolean; meals?: MealSlot[] }

          const showWorkout = !!markers?.workout;
          const meals = markers?.meals ?? [];

          // Construimos una única fila de iconos combinada: pesa + comidas
          const hasAnyIcon = showWorkout || meals.length > 0;

          return (
            <TouchableOpacity
              key={cell.key}
              style={[
                styles.dayCell,
                isSelected && styles.selectedCell,
                isToday && styles.todayOutline,
              ]}
              onPress={() => onDaySelect(cell.key)}
              activeOpacity={0.8}
            >
              {/* Número del día SIEMPRE centrado vertical y horizontalmente */}
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {cell.label}
              </Text>

              {/* Fila inferior con iconos (pesa + comidas) ABSOLUTA, no desplaza el número */}
              {hasAnyIcon && (
                <View style={styles.iconBottomRow}>
                  {showWorkout && (
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={14}
                      color="#10B981"
                      style={styles.iconSpacing}
                    />
                  )}
                  {meals.includes('morning') && (
                    <MaterialCommunityIcons
                      name="apple"
                      size={14}
                      color="#10B981"
                      style={styles.iconSpacing}
                    />
                  )}
                  {meals.includes('day') && (
                    <MaterialCommunityIcons
                      name="food-turkey"
                      size={14}
                      color="#10B981"
                      style={styles.iconSpacing}
                    />
                  )}
                  {meals.includes('night') && (
                    <MaterialCommunityIcons
                      name="food-steak"
                      size={14}
                      color="#10B981"
                      style={styles.iconSpacing}
                    />
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const CELL_H = 56; // alto suficiente para número centrado + fila inferior de iconos

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0F14',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  weekdayText: {
    color: '#10B981',
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: CELL_H,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center', // mantiene el número centrado
    marginVertical: 3,
    paddingVertical: 3,
    position: 'relative',      // necesario para posicionar la fila de iconos en absoluto
    overflow: 'hidden',
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  selectedCell: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  todayOutline: {
    borderWidth: 1,
    borderColor: '#374151',
  },
  dayLabel: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  dayLabelSelected: {
    color: '#10B981',
  },

  /* Fila inferior de iconos combinados (pesa + comidas) */
  iconBottomRow: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconSpacing: {
    marginHorizontal: 2,
  },
});
