import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components';
import { colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Splash'>;

const SPLASH_FALLBACK_MS = 3000;

export function SplashScreen({ navigation }: Props) {
  const { isLoading, isAuthenticated, hasChosenGuest } = useAuth();
  const hasNavigatedRef = useRef(false);
  const authStateRef = useRef({
    isAuthenticated,
    hasChosenGuest,
  });

  authStateRef.current = {
    isAuthenticated,
    hasChosenGuest,
  };

  const navigateTo = (target: 'Home' | 'Login') => {
    if (hasNavigatedRef.current) {
      return;
    }
    hasNavigatedRef.current = true;

    try {
      navigation.replace(target);
    } catch (error) {
      hasNavigatedRef.current = false;
      console.warn('Splash navigation failed:', error);
    }
  };

  const navigateFromSplash = () => {
    const { isAuthenticated: authed, hasChosenGuest: guestChosen } =
      authStateRef.current;

    if (authed || guestChosen) {
      navigateTo('Home');
      return;
    }

    navigateTo('Login');
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    navigateFromSplash();
  }, [isLoading, isAuthenticated, hasChosenGuest]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasNavigatedRef.current) {
        navigateTo('Login');
      }
    }, SPLASH_FALLBACK_MS);

    return () => clearTimeout(timer);
  }, []);

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
