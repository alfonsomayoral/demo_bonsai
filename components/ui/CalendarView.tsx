import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const dayNames = ['S','M','T','W','T','F','S'];

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
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface CalendarViewProps {
  markedDates: { [date: string]: 'green' | 'gray' };
  selectedDate: string;
  onDaySelect: (date: string) => void;
  currentMonth: number;
  setCurrentMonth: (month: number) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
}

type DayCell = { key: string; label: number } | null;

export const CalendarView: React.FC<CalendarViewProps> = ({
  markedDates,
  selectedDate,
  onDaySelect,
  currentMonth,
  setCurrentMonth,
  currentYear,
  setCurrentYear,
}) => {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
  const todayString = ymdLocalToday();

  // Construcción de la cuadricula: sólo días del mes (los previos se pintan vacíos)
  const days: DayCell[] = Array(firstDayOfWeek).fill(null);
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

      {/* Días de la semana */}
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
          const mark = markedDates[cell.key]; // 'green' | 'gray' | undefined

          return (
            <TouchableOpacity
              key={cell.key}
              style={[
                styles.dayCell,
                isSelected && styles.selectedCell,
                isToday && styles.todayOutline,
              ]}
              onPress={() => onDaySelect(cell.key)}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {cell.label}
              </Text>
              {mark && <View style={[styles.dot, { backgroundColor: mark === 'green' ? '#10B981' : '#9CA3AF' }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const CELL_H = 34;

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
    color: '#9CA3AF',
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
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
    justifyContent: 'center',
    marginVertical: 3,
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
  dot: {
    width: 5, height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
});
