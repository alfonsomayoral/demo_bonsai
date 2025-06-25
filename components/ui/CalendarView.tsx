import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
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
  const todayString = getTodayString();

  // Build calendar grid
  const days: (string | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(currentYear, currentMonth, d);
    days.push(date.toISOString().slice(0, 10));
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
          <ChevronLeft size={24} color="#10B981" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {monthNames[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <ChevronRight size={24} color="#10B981" />
        </TouchableOpacity>
      </View>
      {/* Day names */}
      <View style={styles.weekdaysRow}>
        {dayNames.map((d, i) => (
          <Text key={i} style={styles.weekdayText}>{d}</Text>
        ))}
      </View>
      {/* Calendar grid */}
      <View style={styles.grid}>
        {days.map((date, idx) => {
          if (!date) return <View key={idx} style={styles.dayCell} />;
          const isToday = date === todayString;
          const isSelected = date === selectedDate;
          const mark = markedDates[date];
          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.dayCell,
                mark === 'green' && styles.dayGreen,
                mark === 'gray' && styles.dayGray,
                isToday && styles.todayBorder,
                isSelected && styles.selectedDay,
              ]}
              onPress={() => onDaySelect(date)}
            >
              <Text style={[
                styles.dayText,
                isToday && styles.todayText,
                isSelected && styles.selectedDayText,
              ]}>
                {parseInt(date.slice(8, 10), 10)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 4,
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  dayGreen: {
    backgroundColor: '#10B981',
  },
  dayGray: {
    backgroundColor: '#374151',
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  selectedDay: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  dayText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  todayText: {
    color: '#EF4444',
  },
  selectedDayText: {
    color: '#10B981',
  },
}); 