import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WATER_GOAL_ML = 3000;
const STEP = 300;

const ymd = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export const WaterCard: React.FC = () => {
  const [ml, setMl] = useState(0);
  const [modal, setModal] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    (async () => {
      const key = `water_${ymd()}`;
      const raw = await AsyncStorage.getItem(key);
      setMl(raw ? Number(raw) || 0 : 0);
    })();
  }, []);

  const persist = async (value: number) => {
    const v = Math.max(0, Math.min(WATER_GOAL_ML, value));
    setMl(v);
    await AsyncStorage.setItem(`water_${ymd()}`, String(v));
  };

  const add = () => persist(ml + STEP);
  const sub = () => persist(ml - STEP);

  const openModal = () => {
    setInput('');
    setModal(true);
  };

  const onSaveInput = () => {
    const v = parseInt(input || '0', 10);
    if (!isNaN(v) && v > 0) {
      persist(ml + v);
      setModal(false);
    }
  };

  const liters = (ml / 1000).toFixed(1);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.left}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="cup-water" size={28} color="#6CA8FF" />
          </View>
          <View>
            <Text style={styles.title}>Water</Text>
            <Text style={styles.subtitle}>{ml} ml ({liters} L)</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.circleBtn} onPress={sub}>
            <MaterialCommunityIcons name="minus" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={add}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={openModal}>
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de cantidad personalizada */}
      <Modal visible={modal} animationType="fade" transparent onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={styles.modalWrap}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add water (ml)</Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="e.g. 250"
              placeholderTextColor="#7B7F86"
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2A2D33' }]} onPress={() => setModal(false)}>
                <Text style={styles.modalBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#10B981' }]} onPress={onSaveInput}>
                <Text style={[styles.modalBtnTxt, { color: '#0B0B0D' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#191B1F',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#1E2430',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  title: { color: '#6CA8FF', fontFamily: 'Inter-SemiBold', fontSize: 15 },
  subtitle: { color: '#9CA3AF', fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 2 },

  actions: { flexDirection: 'row', alignItems: 'center' },
  circleBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#2A2D33',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },

  /* modal */
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '80%', backgroundColor: '#191B1F', borderRadius: 14, padding: 16 },
  modalTitle: { color: '#FFFFFF', fontFamily: 'Inter-SemiBold', fontSize: 16, marginBottom: 10 },
  input: {
    backgroundColor: '#0F1115',
    borderRadius: 10,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  modalBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginLeft: 10,
  },
  modalBtnTxt: { color: '#FFFFFF', fontFamily: 'Inter-SemiBold' },
});
