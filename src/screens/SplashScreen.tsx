import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components';
import { colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { isLoading, isAuthenticated, hasChosenGuest } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      if (isAuthenticated || hasChosenGuest) {
        navigation.replace('Home');
        return;
      }

      navigation.replace('Login');
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, hasChosenGuest, navigation]);

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Wardrobe</Text>
        <Text style={styles.subtitle}>Your personal style companion</Text>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  loader: {
    marginTop: 24,
  },
});
