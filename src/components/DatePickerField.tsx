import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { formatShortDate } from '../utils/dateFormat';
import { DatePickerModal } from './DatePickerModal';

type DatePickerFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  onChange: (value: string | undefined) => void;
  allowClear?: boolean;
  disabled?: boolean;
  modalTitle?: string;
};

export function DatePickerField({
  label,
  value,
  placeholder = 'Select a date',
  onChange,
  allowClear = false,
  disabled = false,
  modalTitle,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const displayValue = value ? formatShortDate(value) : placeholder;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => {
          if (!disabled) {
            setShowPicker(true);
          }
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.field,
          disabled && styles.fieldDisabled,
          pressed && !disabled && styles.fieldPressed,
        ]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {displayValue}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <DatePickerModal
        visible={showPicker}
        title={modalTitle ?? label}
        value={value}
        allowClear={allowClear}
        onConfirm={(dateKey) => {
          onChange(dateKey);
          setShowPicker(false);
        }}
        onClear={() => {
          onChange(undefined);
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
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
  field: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldDisabled: {
    opacity: 0.55,
  },
  fieldPressed: {
    opacity: 0.92,
  },
  value: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
