import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Input, ScreenContainer } from '../components';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleContinueAsGuest = () => {
    // TODO: Remove when Supabase auth is wired
    navigation.replace('Home');
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
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button title="Log In" onPress={() => {}} disabled />
        </View>

        <View style={styles.footer}>
          <Button
            title="Create an Account"
            variant="secondary"
            onPress={() => navigation.navigate('Signup')}
          />
          <Button
            title="Continue as Guest"
            variant="ghost"
            onPress={handleContinueAsGuest}
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
});
