import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Input, ScreenContainer } from '../components';
import { useAuth } from '../context/AuthContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await signUp(email, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.notice) {
        Alert.alert('Account created', result.notice, [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
        return;
      }

      navigation.replace('Home');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start building your digital wardrobe</Text>

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
          editable={!isSubmitting}
        />
        <Input
          label="Password"
          placeholder="Create a password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (error) {
              setError('');
            }
          }}
          secureTextEntry
          editable={!isSubmitting}
        />
        <Input
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (error) {
              setError('');
            }
          }}
          secureTextEntry
          editable={!isSubmitting}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Create Account"
          onPress={handleSignUp}
          loading={isSubmitting}
          disabled={isSubmitting}
        />

        <View style={styles.backLink}>
          <Button
            title="Back to Login"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  backLink: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#C97B7B',
    marginTop: -8,
    marginBottom: 12,
  },
});
