import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Scan, Plus, Search, Clock, X } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const recentFoods = [
  { id: 1, name: 'Grilled Chicken Breast', calories: 231, protein: 43.5, carbs: 0, fat: 5 },
  { id: 2, name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8 },
  { id: 3, name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
];

const quickActions = [
  { id: 'photo', title: 'Take Photo', subtitle: 'Snap your meal', icon: Camera, color: '#10B981' },
  { id: 'scan', title: 'Scan Barcode', subtitle: 'Quick product scan', icon: Scan, color: '#3B82F6' },
  { id: 'search', title: 'Search Food', subtitle: 'Find by name', icon: Search, color: '#F59E0B' },
];

export default function Nutrition() {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTab, setCameraTab] = useState<'photo' | 'barcode' | 'label'>('photo');
  const [permission, requestPermission] = useCameraPermissions();
  const [todayIntake, setTodayIntake] = useState({
    calories: 1247,
    protein: 89,
    carbs: 156,
    fat: 34,
  });

  const targets = {
    calories: 2200,
    protein: 165,
    carbs: 275,
    fat: 73,
  };

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setShowCamera(true);
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'photo':
        setCameraTab('photo');
        handleTakePhoto();
        break;
      case 'scan':
        setCameraTab('barcode');
        handleTakePhoto();
        break;
      case 'search':
        console.log('Searching food...');
        break;
    }
  };

  const renderCameraModal = () => (
    <Modal
      visible={showCamera}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowCamera(false)}
    >
      <SafeAreaView style={styles.cameraContainer}>
        <CameraView style={styles.camera}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.cameraTabs}>
                <TouchableOpacity
                  style={[styles.cameraTab, cameraTab === 'photo' && styles.cameraTabActive]}
                  onPress={() => setCameraTab('photo')}
                >
                  <Text style={[styles.cameraTabText, cameraTab === 'photo' && styles.cameraTabTextActive]}>
                    Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cameraTab, cameraTab === 'barcode' && styles.cameraTabActive]}
                  onPress={() => setCameraTab('barcode')}
                >
                  <Text style={[styles.cameraTabText, cameraTab === 'barcode' && styles.cameraTabTextActive]}>
                    Barcode
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cameraTab, cameraTab === 'label' && styles.cameraTabActive]}
                  onPress={() => setCameraTab('label')}
                >
                  <Text style={[styles.cameraTabText, cameraTab === 'label' && styles.cameraTabTextActive]}>
                    Label
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.captureFrame}>
              {cameraTab === 'photo' && (
                <>
                  <View style={[styles.frameCorner, styles.topLeft]} />
                  <View style={[styles.frameCorner, styles.topRight]} />
                  <View style={[styles.frameCorner, styles.bottomLeft]} />
                  <View style={[styles.frameCorner, styles.bottomRight]} />
                </>
              )}
              {cameraTab === 'barcode' && (
                <View style={styles.barcodeFrame}>
                  <View style={styles.barcodeLine} />
                </View>
              )}
            </View>

            <View style={styles.cameraFooter}>
              <Text style={styles.cameraInstruction}>
                {cameraTab === 'photo' && 'Center your meal in the frame'}
                {cameraTab === 'barcode' && 'Align barcode within the frame'}
                {cameraTab === 'label' && 'Focus on the nutrition label'}
              </Text>
              <TouchableOpacity style={styles.captureButton}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <Text style={styles.headerDate}>Today, March 15</Text>
        </View>

        {/* Daily Progress */}
        <Card variant="dark" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily Progress</Text>
            <Text style={styles.caloriesRemaining}>
              {targets.calories - todayIntake.calories} cal remaining
            </Text>
          </View>
          
          <View style={styles.calorieProgress}>
            <View style={styles.calorieBar}>
              <View 
                style={[
                  styles.calorieBarFill, 
                  { width: `${(todayIntake.calories / targets.calories) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.calorieText}>
              {todayIntake.calories} / {targets.calories} cal
            </Text>
          </View>

          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{todayIntake.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.macroBar}>
                <View 
                  style={[
                    styles.macroBarFill, 
                    { width: `${(todayIntake.protein / targets.protein) * 100}%`, backgroundColor: '#EF4444' }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{todayIntake.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.macroBar}>
                <View 
                  style={[
                    styles.macroBarFill, 
                    { width: `${(todayIntake.carbs / targets.carbs) * 100}%`, backgroundColor: '#F59E0B' }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{todayIntake.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.macroBar}>
                <View 
                  style={[
                    styles.macroBarFill, 
                    { width: `${(todayIntake.fat / targets.fat) * 100}%`, backgroundColor: '#8B5CF6' }
                  ]} 
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Food</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={() => handleQuickAction(action.id)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                    <IconComponent size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent Foods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Foods</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {recentFoods.map((food) => (
            <Card key={food.id} variant="dark" style={styles.foodItem}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodMacros}>
                  {food.calories} cal • {food.protein}g protein • {food.carbs}g carbs • {food.fat}g fat
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Plus size={20} color="#10B981" />
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      </ScrollView>

      {renderCameraModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  progressCard: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  caloriesRemaining: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  calorieProgress: {
    marginBottom: 20,
  },
  calorieBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  calorieBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  calorieText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  macroBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  foodMacros: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 4,
  },
  cameraTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  cameraTabActive: {
    backgroundColor: '#10B981',
  },
  cameraTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  cameraTabTextActive: {
    color: '#FFFFFF',
  },
  captureFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 40,
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10B981',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  barcodeFrame: {
    width: '80%',
    height: 200,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#10B981',
  },
  cameraFooter: {
    padding: 40,
    alignItems: 'center',
  },
  cameraInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
});