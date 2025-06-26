import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface NumberPadProps {
  onNumberPress: (number: string) => void;
  onBackspace: () => void;
  onDecimal: () => void;
}

export function WorkoutNumberPad({ onNumberPress, onBackspace, onDecimal }: NumberPadProps) {
  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫'],
  ];

  const handlePress = (value: string) => {
    if (value === '⌫') {
      onBackspace();
    } else if (value === '.') {
      onDecimal();
    } else {
      onNumberPress(value);
    }
  };

  return (
    <View style={styles.container}>
      {numbers.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((number) => (
            <TouchableOpacity
              key={number}
              style={styles.button}
              onPress={() => handlePress(number)}
            >
              <Text style={styles.buttonText}>{number}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000000',
  },
});