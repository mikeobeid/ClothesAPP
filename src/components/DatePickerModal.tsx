import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { cardBase, colors, radius, spacing, typography } from '../constants/theme';
import { buildMonthGrid, getWeekdayLabels } from '../utils/calendarGrid';
import {
  addMonths,
  formatDisplayDate,
  getMonthYearLabel,
  toDateKey,
} from '../utils/dateFormat';

type DatePickerModalProps = {
  visible: boolean;
  title: string;
  value?: string | null;
  onConfirm: (dateKey: string) => void;
  onCancel: () => void;
  onClear?: () => void;
  allowClear?: boolean;
};

export function DatePickerModal({
  visible,
  title,
  value,
  onConfirm,
  onCancel,
  onClear,
  allowClear = false,
}: DatePickerModalProps) {
  const todayKey = toDateKey(new Date());
  const [monthAnchor, setMonthAnchor] = useState(value ?? todayKey);
  const [draftDate, setDraftDate] = useState(value ?? todayKey);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const next = value ?? todayKey;
    setMonthAnchor(next);
    setDraftDate(next);
  }, [visible, value, todayKey]);

  const monthCells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const weekdayLabels = getWeekdayLabels();

  const handleConfirm = () => {
    onConfirm(draftDate);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.selectedPreview}>
            {draftDate ? formatDisplayDate(draftDate) : 'No date selected'}
          </Text>

          <View style={styles.monthHeader}>
            <Pressable
              onPress={() => setMonthAnchor((prev) => addMonths(prev, -1))}
              style={({ pressed }) => [
                styles.monthArrow,
                pressed && styles.monthArrowPressed,
              ]}
            >
              <Text style={styles.monthArrowText}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{getMonthYearLabel(monthAnchor)}</Text>
            <Pressable
              onPress={() => setMonthAnchor((prev) => addMonths(prev, 1))}
              style={({ pressed }) => [
                styles.monthArrow,
                pressed && styles.monthArrowPressed,
              ]}
            >
              <Text style={styles.monthArrowText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayLabels.map((label) => (
              <Text key={label} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {monthCells.map((cell) => {
              const isSelected = cell.dateKey === draftDate;
              const isToday = cell.dateKey === todayKey;

              return (
                <Pressable
                  key={`${cell.dateKey}-${cell.inCurrentMonth}`}
                  onPress={() => {
                    setDraftDate(cell.dateKey);
                    setMonthAnchor(cell.dateKey);
                  }}
                  style={({ pressed }) => [
                    styles.dayCell,
                    !cell.inCurrentMonth && styles.dayCellOutside,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                    pressed && styles.dayCellPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !cell.inCurrentMonth && styles.dayTextOutside,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Button title="Confirm" onPress={handleConfirm} />
            {allowClear && onClear ? (
              <Button title="Clear Date" variant="ghost" onPress={onClear} />
            ) : null}
            <Button title="Cancel" variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(61,52,53,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    ...cardBase,
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.subheading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  selectedPreview: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowPressed: {
    opacity: 0.85,
  },
  monthArrowText: {
    fontSize: 22,
    color: colors.primaryDark,
    marginTop: -2,
  },
  monthLabel: {
    ...typography.subheading,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.small,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  dayCellOutside: {
    opacity: 0.35,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayCellPressed: {
    opacity: 0.9,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  dayTextOutside: {
    color: colors.textMuted,
  },
  dayTextSelected: {
    color: colors.surface,
    fontWeight: '700',
  },
  actions: {
    gap: spacing.sm,
  },
});
