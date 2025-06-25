import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Target, Download, Settings, Bell, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

const settingsItems = [
  { id: 'notifications', title: 'Push Notifications', subtitle: 'Meal and workout reminders', type: 'toggle', value: true },
  { id: 'units', title: 'Units', subtitle: 'Metric (kg, cm)', type: 'option' },
  { id: 'privacy', title: 'Privacy', subtitle: 'Data sharing preferences', type: 'option' },
  { id: 'export', title: 'Export Data', subtitle: 'Download your data as CSV', type: 'action', icon: Download },
];

const supportItems = [
  { id: 'help', title: 'Help Center', icon: HelpCircle },
  { id: 'feedback', title: 'Send Feedback', icon: Settings },
  { id: 'privacy-policy', title: 'Privacy Policy', icon: Shield },
];

export default function Profile() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    age: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          setUserProfile(data);
          setEditData({
            full_name: data.full_name || '',
            age: data.age ? String(data.age) : '',
            weight: data.weight ? String(data.weight) : '',
            height: data.height ? String(data.height) : '',
          });
        }
      }
      setLoading(false);
    };
    fetchUserProfile();
  }, []);

  const handleSaveEdit = async () => {
    if (!userProfile) return;
    setLoading(true);
    const { error } = await supabase.from('users').update({
      full_name: editData.full_name,
      age: editData.age ? parseInt(editData.age, 10) : null,
      weight: editData.weight ? parseFloat(editData.weight) : null,
      height: editData.height ? parseFloat(editData.height) : null,
    }).eq('id', userProfile.id);
    if (!error) {
      setUserProfile({ ...userProfile, ...editData, age: editData.age ? parseInt(editData.age, 10) : null, weight: editData.weight ? parseFloat(editData.weight) : null, height: editData.height ? parseFloat(editData.height) : null });
      setEditMode(false);
    }
    setLoading(false);
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your nutrition and workout data will be exported as a CSV file. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Exporting data...') },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/auth');
          }
        },
      ]
    );
  };

  const calculateProgress = () => {
    if (!userProfile) return 0;
    const startWeight = userProfile.weight || 0;
    const targetWeight = userProfile.target_weight || 0;
    const currentWeight = userProfile.weight || 0;
    const totalLoss = startWeight - targetWeight;
    const currentLoss = startWeight - currentWeight;
    return totalLoss ? (currentLoss / totalLoss) * 100 : 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff' }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileIcon}>
            <User size={32} color="#10B981" />
          </View>
          {editMode ? (
            <>
              <TextInput
                style={[styles.userName, { backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 8 }]}
                value={editData.full_name}
                onChangeText={text => setEditData({ ...editData, full_name: text })}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.userEmail}>{userProfile.email}</Text>
            </>
          ) : (
            <>
              <Text style={styles.userName}>{userProfile.full_name}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
            </>
          )}
        </View>

        {/* Editable fields */}
        <Card variant="dark" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Profile Data</Text>
            {editMode ? (
              <Button title="Save" onPress={handleSaveEdit} style={{ marginLeft: 8 }} />
            ) : (
              <Button title="Edit" onPress={() => setEditMode(true)} style={{ marginLeft: 8 }} />
            )}
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Age</Text>
            {editMode ? (
              <TextInput
                style={[styles.input, { backgroundColor: '#222', borderRadius: 8, color: '#fff' }]}
                value={editData.age}
                onChangeText={text => setEditData({ ...editData, age: text })}
                placeholder="Age"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.weightValue}>{userProfile.age ?? '-'}</Text>
            )}
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Weight (kg)</Text>
            {editMode ? (
              <TextInput
                style={[styles.input, { backgroundColor: '#222', borderRadius: 8, color: '#fff' }]}
                value={editData.weight}
                onChangeText={text => setEditData({ ...editData, weight: text })}
                placeholder="Weight"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.weightValue}>{userProfile.weight ?? '-'}</Text>
            )}
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Height (cm)</Text>
            {editMode ? (
              <TextInput
                style={[styles.input, { backgroundColor: '#222', borderRadius: 8, color: '#fff' }]}
                value={editData.height}
                onChangeText={text => setEditData({ ...editData, height: text })}
                placeholder="Height"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.weightValue}>{userProfile.height ?? '-'}</Text>
            )}
          </View>
        </Card>

        {/* Goal Progress */}
        <Card variant="dark" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Goal Progress</Text>
            <View style={styles.goalBadge}>
              <Target size={16} color="#10B981" />
              <Text style={styles.goalText}>{userProfile.goal}</Text>
            </View>
          </View>
          
          <View style={styles.weightProgress}>
            <View style={styles.weightItem}>
              <Text style={styles.weightValue}>{userProfile.startWeight}</Text>
              <Text style={styles.weightLabel}>Start</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${calculateProgress()}%` }
                ]} 
              />
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightValue}>{userProfile.targetWeight}</Text>
              <Text style={styles.weightLabel}>Target</Text>
            </View>
          </View>
          
          <View style={styles.currentWeight}>
            <Text style={styles.currentWeightLabel}>Current Weight</Text>
            <Text style={styles.currentWeightValue}>{userProfile.currentWeight} kg</Text>
          </View>
        </Card>

        {/* Stats Card */}
        <Card variant="dark" style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.dailyCalories}</Text>
              <Text style={styles.statLabel}>Daily Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(userProfile.startWeight - userProfile.currentWeight).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Weight Lost (kg)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>14</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>28</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settingsItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.settingItem}
              onPress={() => {
                if (item.id === 'export') {
                  handleExportData();
                }
              }}
            >
              <Card variant="dark" style={styles.settingCard}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                {item.type === 'toggle' ? (
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: '#374151', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                ) : item.type === 'action' && item.icon ? (
                  <item.icon size={20} color="#9CA3AF" />
                ) : (
                  <ChevronRight size={20} color="#9CA3AF" />
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity key={item.id} style={styles.settingItem}>
                <Card variant="dark" style={styles.settingCard}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                  </View>
                  <IconComponent size={20} color="#9CA3AF" />
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Member since {userProfile.joinDate}
          </Text>
          <Text style={styles.versionText}>
            Bonsai v1.0.0
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
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
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  goalText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  weightProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weightItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  weightValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  weightLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  currentWeight: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  currentWeightLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  currentWeightValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  statsCard: {
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 8,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  logoutButton: {
    marginBottom: 24,
    borderColor: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    color: '#FFFFFF',
  },
});