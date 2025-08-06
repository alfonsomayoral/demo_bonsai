import { ActivityIndicator, View, Text } from 'react-native';

export default function Analyzing() {
    return (
      <View style={{ flex:1, backgroundColor:'#000', alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ color:'#fff', marginTop:16 }}>Analizando tu comida…</Text>
      </View>
    );
  }