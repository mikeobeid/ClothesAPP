import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Input, ScreenContainer } from '../components';
import { useAuth } from '../context/AuthContext';
import { RootStackScreenProps } from '../navigation/types';
import {
  normalizeUsername,
  suggestUsernameFromEmail,
  validateUsername,
} from '../utils/username';

type Props = RootStackScreenProps<'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!usernameTouched && email.includes('@')) {
      setUsername(suggestUsernameFromEmail(email));
    }
  }, [email, usernameTouched]);

  const handleSignUp = async () => {
    const normalizedUsername = normalizeUsername(username);

    if (!email.trim() || !normalizedUsername || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    const usernameError = validateUsername(normalizedUsername);
    if (usernameError) {
      setError(usernameError);
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
      const result = await signUp(email, password, normalizedUsername);

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
          label="Username"
          placeholder="Choose a username"
          value={username}
          onChangeText={(text) => {
            setUsernameTouched(true);
            setUsername(normalizeUsername(text));
            if (error) {
              setError('');
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
        />
        <Text style={styles.helperText}>
          Lowercase letters, numbers, and underscores only (3-20 characters).
        </Text>
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
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 16,
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
