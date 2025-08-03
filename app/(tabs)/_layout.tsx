// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Dumbbell, Calendar, User, Camera, BarChart3 } from 'lucide-react-native';

export default function RootTabs() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#10B981',
      tabBarInactiveTintColor: '#6B7280',
      tabBarStyle: { backgroundColor: '#1F2937', height: 80, paddingVertical: 8 },
      tabBarLabelStyle: { fontSize: 12, fontFamily: 'Inter-Medium', marginTop: 4 },
    }}>
      <Tabs.Screen name="nutrition"  options={{ title: 'Nutrition',  tabBarIcon: p => <Camera    {...p} /> }} />
      <Tabs.Screen name="workout"    options={{ title: 'Workout',    tabBarIcon: p => <Dumbbell {...p} /> }} />
      <Tabs.Screen name="dashboard"  options={{ title: 'Dashboard',  tabBarIcon: p => <BarChart3 {...p} /> }} />
      <Tabs.Screen name="calendar"   options={{ title: 'Calendar',   tabBarIcon: p => <Calendar  {...p} /> }} />
      <Tabs.Screen name="profile"    options={{ title: 'Profile',    tabBarIcon: p => <User      {...p} /> }} />
    </Tabs>
  );
}
