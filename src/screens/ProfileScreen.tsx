import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, ScreenContainer } from '../components';
import { useAuth } from '../context/AuthContext';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { profile, isAuthenticated, user, signOut } = useAuth();
  const { clearLocalDataAndRestore, isLoading } = useWardrobe();
  const [isClearing, setIsClearing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const avatarLetter = (profile.username ?? profile.displayName)
    .charAt(0)
    .toUpperCase();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            const result = await signOut();
            if (result.error) {
              Alert.alert('Logout failed', result.error);
              return;
            }

            navigation.replace('Login');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleClearLocalData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will remove local wardrobe and outfit data from this device only. Supabase cloud backup will not be deleted. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear & Restore',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const result = await clearLocalDataAndRestore();
              if (!result.success) {
                Alert.alert(
                  'Restore failed',
                  result.error ??
                    'Could not restore from Supabase. Local data was cleared.',
                );
              }
            } finally {
              setIsClearing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>

        <Text style={styles.name}>
          {isAuthenticated ? profile.displayName : 'Guest'}
        </Text>
        <Text style={styles.badge}>
          {isAuthenticated ? 'Logged In' : 'Guest Mode'}
        </Text>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Mode</Text>
          <Text style={styles.value}>
            {isAuthenticated ? 'Logged In' : 'Guest Mode'}
          </Text>

          {isAuthenticated ? (
            <>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>
                @{profile.username ?? profile.displayName}
              </Text>

              {profile.displayName &&
              profile.username &&
              profile.displayName !== profile.username ? (
                <>
                  <Text style={styles.label}>Display Name</Text>
                  <Text style={styles.value}>{profile.displayName}</Text>
                </>
              ) : null}

              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>
                {profile.email ?? user?.email ?? '—'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>Not signed in</Text>
            </>
          )}
        </View>

        {isAuthenticated ? (
          <View style={styles.actionSection}>
            <Button
              title="Logout"
              variant="secondary"
              onPress={handleLogout}
              loading={isSigningOut}
              disabled={isSigningOut || isClearing}
            />
          </View>
        ) : (
          <View style={styles.actionSection}>
            <Button
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              disabled={isClearing}
            />
            <Button
              title="Create Account"
              variant="secondary"
              onPress={() => navigation.navigate('Signup')}
              disabled={isClearing}
            />
          </View>
        )}

        <View style={styles.devSection}>
          <Text style={styles.devBadge}>DEVELOPER / TEST ONLY</Text>
          <Text style={styles.devTitle}>Developer / Test Tools</Text>
          {isAuthenticated && user ? (
            <Text style={styles.devMeta}>Internal user id: {user.id}</Text>
          ) : null}
          <Text style={styles.devDescription}>
            Clears AsyncStorage wardrobe data on this device, then reloads items
            and outfits from Supabase. Cloud records are not deleted.
          </Text>
          <Button
            title="Clear Local Data (Test Only)"
            variant="danger"
            onPress={handleClearLocalData}
            disabled={isLoading || isClearing || isSigningOut}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6B7280',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  badge: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 32,
  },
  infoSection: {
    width: '100%',
    gap: 4,
    marginBottom: 24,
  },
  actionSection: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  devSection: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 24,
    gap: 12,
  },
  devBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  devTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  devMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  devDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
});
