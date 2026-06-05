import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardBase, colors, radius, spacing, typography } from '../constants/theme';

type QuickActionCardProps = {
  title: string;
  subtitle: string;
  icon: string;
  accentColor?: string;
  onPress: () => void;
};

export function QuickActionCard({
  title,
  subtitle,
  icon,
  accentColor = colors.primaryLight,
  onPress,
}: QuickActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardBase,
    width: '47%',
    padding: spacing.lg,
    minHeight: 120,
    justifyContent: 'flex-start',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.small,
    lineHeight: 18,
  },
});
