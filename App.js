import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { TraceScreen } from './screens/TraceScreen';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <TraceScreen />
      <StatusBar style="auto" />
    </View>
  );
}
