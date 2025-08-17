import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export const FloatingCameraButton = () => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/(tabs)/nutrition/capture')}
    >
      <Camera color="#FFFFFF" size={28} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
});
