import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { FilterChip } from './FilterChip';

type SelectionGroupProps = {
  label: string;
  options: readonly string[] | string[];
  selected: string | string[];
  onSelect: (value: string) => void;
  multiple?: boolean;
  error?: string;
  horizontal?: boolean;
};

export function SelectionGroup({
  label,
  options,
  selected,
  onSelect,
  multiple = false,
  error,
  horizontal = true,
}: SelectionGroupProps) {
  const isSelected = (option: string) =>
    multiple
      ? (selected as string[]).includes(option)
      : selected === option;

  const chips = options.map((option) => (
    <FilterChip
      key={option}
      label={option}
      selected={isSelected(option)}
      onPress={() => onSelect(option)}
    />
  ));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.chipWrap}>{chips}</View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipRow: {
    paddingRight: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  error: {
    fontSize: 13,
    color: colors.error,
    marginTop: 6,
  },
});
