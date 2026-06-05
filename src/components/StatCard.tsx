import { StyleSheet, Text, View } from 'react-native';
import { cardBase, colors, radius, spacing, typography } from '../constants/theme';

type StatCardProps = {
  value: number;
  label: string;
  accent?: string;
};

export function StatCard({ value, label, accent = colors.primaryLight }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardBase,
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  label: {
    ...typography.small,
    textAlign: 'center',
  },
});
