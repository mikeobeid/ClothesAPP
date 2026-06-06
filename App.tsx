import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { WearContextProvider } from './src/context/WearContextContext';
import { WearLogProvider } from './src/context/WearLogContext';
import { WardrobeProvider } from './src/context/WardrobeContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <WardrobeProvider>
        <WearLogProvider>
          <WearContextProvider>
          <AuthProvider>
            <AppNavigator />
            <StatusBar style="dark" />
          </AuthProvider>
          </WearContextProvider>
        </WearLogProvider>
      </WardrobeProvider>
    </SafeAreaProvider>
  );
}
