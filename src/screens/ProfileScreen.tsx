import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, ScreenContainer } from '../components';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { profile, isAuthenticated, user, signOut } = useAuth();
  const { clearLocalDataAndRestore, isLoading } = useWardrobe();
  const [isClearing, setIsClearing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = isAuthenticated
    ? profile.username ?? profile.displayName
    : 'Guest';
  const avatarLetter = displayName.charAt(0).toUpperCase();

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

        <Text style={styles.name}>{displayName}</Text>
        {isAuthenticated && profile.username ? (
          <Text style={styles.username}>@{profile.username}</Text>
        ) : null}

        <View style={styles.infoSection}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>
            {isAuthenticated
              ? profile.email ?? user?.email ?? '—'
              : 'Not signed in'}
          </Text>
        </View>

        {!isAuthenticated ? (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerTitle}>Sign in for cloud backup</Text>
            <Text style={styles.guestBannerText}>
              Guest mode works on this device. Create an account to back up your
              wardrobe and access it on other devices.
            </Text>
          </View>
        ) : null}

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

        {__DEV__ ? (
          <View style={styles.devSection}>
            <Text style={styles.devBadge}>Developer only</Text>
            <Text style={styles.devTitle}>Test tools</Text>
            {isAuthenticated && user ? (
              <Text style={styles.devMeta}>User id: {user.id}</Text>
            ) : null}
            <Text style={styles.devDescription}>
              Clears local wardrobe data on this device, then reloads from
              Supabase. Cloud records are not deleted.
            </Text>
            <Button
              title="Clear Local Data"
              variant="danger"
              onPress={handleClearLocalData}
              disabled={isLoading || isClearing || isSigningOut}
              loading={isClearing}
            />
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.textMuted,
  },
  name: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  username: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  infoSection: {
    width: '100%',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  value: {
    fontSize: 16,
    color: colors.text,
  },
  guestBanner: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  guestBannerTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  guestBannerText: {
    ...typography.caption,
    lineHeight: 22,
  },
  actionSection: {
    width: '100%',
    gap: spacing.md,
  },
  devSection: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xxl,
    marginTop: spacing.xxl,
    gap: spacing.md,
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
    ...typography.subheading,
  },
  devMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  devDescription: {
    ...typography.caption,
    lineHeight: 20,
  },
});
