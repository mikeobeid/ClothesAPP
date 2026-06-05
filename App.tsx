import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WardrobeProvider } from './src/context/WardrobeContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <WardrobeProvider>
        <AppNavigator />
        <StatusBar style="dark" />
      </WardrobeProvider>
    </SafeAreaProvider>
  );
}
