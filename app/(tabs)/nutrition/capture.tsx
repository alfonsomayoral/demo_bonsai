import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  FlashMode,
} from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNutritionStore } from '@/store/nutritionStore';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.7;

type Mode = 'photo' | 'barcode' | 'label' | 'library';

export default function CaptureScreen() {
  /* refs & state --------------------------------------------------- */
  const cameraRef                         = useRef<CameraView>(null);
  const [permission, requestPermission]   = useCameraPermissions();
  const [flash, setFlash]                 = useState<FlashMode>('off');
  const [mode, setMode]                   = useState<Mode>('photo');
  const [isCameraReady, setIsCameraReady] = useState(false);

  const router           = useRouter();
  const analyzeNewPhoto  = useNutritionStore((s) => s.analyzeNewPhoto);

  /* permisos ------------------------------------------------------- */
  if (!permission?.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionText}>We need camera access</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionText}>Allow</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* helpers -------------------------------------------------------- */
  const compress = async (uri: string) => {
    const { uri: out } = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );
    return out;
  };

  const handleLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.9,
    });
    if (res.canceled) return;
    processImage(res.assets[0].uri);
  };

  const takeShot = async () => {
    if (!isCameraReady) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const photo = await (cameraRef.current as any)?.takePhoto({ skipMetadata: true });
    const localPath = photo?.path ?? photo?.uri;   // compat ambas keys
    if (localPath) processImage(localPath);
  };

  /* flujo principal ------------------------------------------------ */
  const processImage = async (localPath: string) => {
    router.replace('./analyzing');                // pantalla de loading

    try {
      const compressed = await compress(localPath);
      console.log('DBG compressedPath', compressed);   // <-- trazas
      const id = await analyzeNewPhoto(compressed);
      console.log('DBG returned draftId', id);

      if (!id) throw new Error('No draft created');

      router.replace(`./review/${id}`);           // pantalla de resumen
    } catch (err) {
      router.back();                            // vuelve a Capture
      alert((err as Error).message ?? 'Error analysing food');
    }
  };

  /* estilos marco -------------------------------------------------- */
  const cornerMap: Record<'tl' | 'tr' | 'bl' | 'br', StyleProp<ViewStyle>> = {
    tl: styles.corner_tl,
    tr: styles.corner_tr,
    bl: styles.corner_bl,
    br: styles.corner_br,
  };

  /* UI ------------------------------------------------------------- */
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flash}
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* marco visual */}
      <View style={styles.frame}>
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
          <View key={pos} style={[styles.corner, cornerMap[pos]]} />
        ))}
      </View>

      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
      </View>

      {/* modos */}
      <View style={styles.bottomBar}>
        {(
          [
            { id: 'photo',   icon: 'camera',            label: 'Scan food' },
            { id: 'barcode', icon: 'barcode-scan',      label: 'Barcode'   },
            { id: 'label',   icon: 'food-apple-outline',label: 'Food label'},
            { id: 'library', icon: 'image-multiple',    label: 'Library'   },
          ] as const
        ).map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.modeBtn, mode === m.id && styles.modeBtnActive]}
            onPress={() => {
              if (m.id === 'library') handleLibrary();
              else setMode(m.id);
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

      {/* disparador & flash */}
      <TouchableOpacity style={styles.shutter} onPress={takeShot} />
      <TouchableOpacity
        style={styles.flashBtn}
        onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
      >
        <Ionicons name={flash === 'off' ? 'flash-off' : 'flash'} size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* estilos ---------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera:    { flex: 1 },

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
  flashBtn: { position: 'absolute', bottom: 48, left: 32 },
});
