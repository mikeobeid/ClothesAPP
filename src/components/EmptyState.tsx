import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: string;
  actionTitle?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  message,
  icon = '✧',
  actionTitle,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionTitle && onAction ? (
        <View style={styles.action}>
          <Button title={actionTitle} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 24,
    color: colors.primary,
  },
  title: {
    ...typography.subheading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 240,
  },
});
