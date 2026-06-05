import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, ScreenContainer } from '../components';
import { useAuth } from '../context/AuthContext';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { profile, isAuthenticated, signOut } = useAuth();
  const { clearLocalDataAndRestore, isLoading } = useWardrobe();
  const [isClearing, setIsClearing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log out', 'You can sign back in anytime. Your local wardrobe stays on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            const result = await signOut();
            if (result.error) {
              Alert.alert('Log out failed', result.error);
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
          <Text style={styles.avatarText}>
            {profile.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{profile.displayName}</Text>
        <Text style={styles.badge}>
          {profile.isGuest ? 'Guest Account' : 'Signed In'}
        </Text>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>
            {profile.email ?? 'Not signed in'}
          </Text>

          <Text style={styles.label}>Account Type</Text>
          <Text style={styles.value}>
            {profile.isGuest ? 'Guest' : 'Registered'}
          </Text>
        </View>

        {isAuthenticated ? (
          <View style={styles.actionSection}>
            <Button
              title="Log Out"
              variant="secondary"
              onPress={handleLogout}
              loading={isSigningOut}
              disabled={isSigningOut || isClearing}
            />
          </View>
        ) : null}

        <View style={styles.devSection}>
          <Text style={styles.devBadge}>TEMPORARY / DEVELOPER ONLY</Text>
          <Text style={styles.devTitle}>Developer Tools</Text>
          <Text style={styles.devDescription}>
            Clears AsyncStorage wardrobe data on this device, then reloads items
            and outfits from Supabase. Cloud records are not deleted.
          </Text>
          <Button
            title="Clear Local Data"
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
  devDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
});
