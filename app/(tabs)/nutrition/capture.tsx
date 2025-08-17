import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  StyleProp,
  ViewStyle,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  FlashMode,
  BarcodeScanningResult,
} from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.7;

type Mode = 'photo' | 'barcode' | 'label' | 'library';

export default function CaptureScreen() {
  /* ─────────────────────── refs & state ─────────────────────── */
  const cameraRef                         = useRef<CameraView>(null);
  const [permission, requestPermission]   = useCameraPermissions();
  const [flash, setFlash]                 = useState<FlashMode>('off');
  const [mode, setMode]                   = useState<Mode>('photo');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isBusy, setIsBusy]               = useState(false);
  const [barcodeLocked, setBarcodeLocked] = useState(false); // evita bucles en onBarcodeScanned

  const router = useRouter();

  /* ─────────────────────── helpers ──────────────────────────── */
  const compressToJpeg = useCallback(async (uri: string) => {
    // Convertimos SIEMPRE a JPEG y reducimos tamaño para estar <5MB
    const { uri: out } = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1600 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );
    return out;
  }, []);

  const goToAnalyzing = useCallback(
    (fileUri: string) => {
      // Navegamos y dejamos que analyzing.tsx haga el análisis con IA
      router.replace({
        pathname: '/(tabs)/nutrition/analyzing',
        params: { fileUri },
      });
    },
    [router]
  );

  const handleFromLibrary = useCallback(async () => {
    try {
      if (isBusy) return;
      setIsBusy(true);

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;

      const compressed = await compressToJpeg(res.assets[0].uri);
      goToAnalyzing(compressed);
    } catch (e: any) {
      Alert.alert('Library error', e?.message ?? 'Could not pick image');
    } finally {
      setIsBusy(false);
    }
  }, [compressToJpeg, goToAnalyzing, isBusy]);

  const takePicture = useCallback(async () => {
    try {
      if (isBusy || !isCameraReady || !cameraRef.current) return;
      setIsBusy(true);

      // API soportada por CameraView en SDK 53
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) throw new Error('No photo captured');

      const compressed = await compressToJpeg(photo.uri);
      goToAnalyzing(compressed);
    } catch (e: any) {
      Alert.alert('Capture error', e?.message ?? 'Failed to capture photo');
    } finally {
      setIsBusy(false);
    }
  }, [compressToJpeg, goToAnalyzing, isBusy, isCameraReady]);

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (barcodeLocked) return;
      setBarcodeLocked(true);

      const code = result?.data ?? '';
      if (!code) {
        setBarcodeLocked(false);
        return;
      }
      // Aquí podrías navegar a una pantalla de búsqueda por código de barras
      Alert.alert('Barcode', code, [{ text: 'OK', onPress: () => setBarcodeLocked(false) }]);
    },
    [barcodeLocked]
  );

  /* ─────────────────────── UI permiso cámara ─────────────────── */
  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionText}>We need camera access</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionText}>Allow</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ─────────────────────── estilos del marco ─────────────────── */
  const cornerMap: Record<'tl' | 'tr' | 'bl' | 'br', StyleProp<ViewStyle>> = {
    tl: styles.corner_tl,
    tr: styles.corner_tr,
    bl: styles.corner_bl,
    br: styles.corner_br,
  };

  /* ─────────────────────── render ────────────────────────────── */
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flash}
        onCameraReady={() => setIsCameraReady(true)}
        // Habilitamos escaneo de código sólo cuando está activo ese modo
        barcodeScannerSettings={
          mode === 'barcode'
            ? { barcodeTypes: ['qr', 'ean13', 'upc_a', 'upc_e', 'code128'] }
            : undefined
        }
        onBarcodeScanned={mode === 'barcode' ? onBarcodeScanned : undefined}
      />

      {/* Marco visual */}
      <View style={styles.frame}>
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
          <View key={pos} style={[styles.corner, cornerMap[pos]]} />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
      </View>

      {/* Modos */}
      <View style={styles.bottomBar}>
        {(
          [
            { id: 'photo',   icon: 'camera',             label: 'Scan food' },
            { id: 'barcode', icon: 'barcode-scan',       label: 'Barcode'   },
            { id: 'label',   icon: 'food-apple-outline', label: 'Food label'},
            { id: 'library', icon: 'image-multiple',     label: 'Library'   },
          ] as const
        ).map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.modeBtn, mode === m.id && styles.modeBtnActive]}
            onPress={async () => {
              if (m.id === 'library') {
                await handleFromLibrary();
              } else {
                setMode(m.id);
              }
            }}
          >
            <MaterialCommunityIcons
              name={m.icon}
              size={20}
              color={mode === m.id ? '#fff' : '#9CA3AF'}
            />
            <Text style={[styles.modeTxt, mode === m.id && styles.modeTxtActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Disparador y flash */}
      {mode === 'photo' && (
        <TouchableOpacity
          style={[styles.shutter, (isBusy || !isCameraReady) && styles.shutterDisabled]}
          onPress={takePicture}
          disabled={isBusy || !isCameraReady}
        />
      )}

      <TouchableOpacity
        style={styles.flashBtn}
        onPress={() => setFlash((prev) => (prev === 'off' ? 'on' : 'off'))}
      >
        <Ionicons name={flash === 'off' ? 'flash-off' : 'flash'} size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ─────────────────────── estilos ────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  camera: { flex: 1 },

  permissionScreen: {
    flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center',
  },
  permissionText: { color: '#fff', fontSize: 16 },
  permissionBtn:  {
    marginTop: 12, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: '#fff', borderRadius: 6,
  },

  header: {
    position: 'absolute', top: 50, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },

  frame: { position: 'absolute', top: '25%', left: (width - FRAME_SIZE) / 2,
           width: FRAME_SIZE, height: FRAME_SIZE },
  corner:     { position: 'absolute', width: 40, height: 40, borderColor: '#fff', borderWidth: 3 },
  corner_tl:  { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  corner_tr:  { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  corner_bl:  { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  corner_br:  { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  bottomBar: {
    position: 'absolute', bottom: 110, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-evenly',
  },
  modeBtn:        { alignItems: 'center', padding: 8, borderRadius: 12 },
  modeBtnActive:  { backgroundColor: 'rgba(255,255,255,0.15)' },
  modeTxt:        { marginTop: 4, fontSize: 12, color: '#9CA3AF' },
  modeTxtActive:  { color: '#fff' },

  shutter: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: '#fff',
  },
  shutterDisabled: { opacity: 0.6 },

  flashBtn: { position: 'absolute', bottom: 48, left: 32 },
});
