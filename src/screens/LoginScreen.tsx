import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Input, ScreenContainer } from '../components';
import { useAuth } from '../context/AuthContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }

      navigation.replace('Home');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setIsGuestLoading(true);
    setError('');

    try {
      await continueAsGuest();
      navigation.replace('Home');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your wardrobe</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) {
                setError('');
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting && !isGuestLoading}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) {
                setError('');
              }
            }}
            secureTextEntry
            editable={!isSubmitting && !isGuestLoading}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button
            title="Log In"
            onPress={handleLogin}
            loading={isSubmitting}
            disabled={isSubmitting || isGuestLoading}
          />
        </View>

        <View style={styles.footer}>
          <Button
            title="Create an Account"
            variant="secondary"
            onPress={() => navigation.navigate('Signup')}
            disabled={isSubmitting || isGuestLoading}
          />
          <Button
            title="Continue as Guest"
            variant="ghost"
            onPress={handleContinueAsGuest}
            loading={isGuestLoading}
            disabled={isSubmitting || isGuestLoading}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  footer: {
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#C97B7B',
    marginTop: -8,
    marginBottom: 12,
  },
});
