import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WearLog } from '../types/wearLog';
import {
  Button,
  DatePickerModal,
  EmptyState,
  Input,
  OutfitSelectableItem,
  ScreenContainer,
} from '../components';
import { OUTFIT_BUILDER_CATEGORIES } from '../constants/outfits';
import { cardBase, colors, radius, spacing, typography } from '../constants/theme';
import {
  reloadWearContextsForCurrentUser,
  useWearContext,
} from '../context/WearContextContext';
import { useWearLog } from '../context/WearLogContext';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';
import { Outfit } from '../types';
import {
  addDays,
  formatDisplayDate,
  formatShortDate,
  toDateKey,
} from '../utils/dateFormat';
import { formatWearHistoryLine } from '../utils/wearStats';

type Props = RootStackScreenProps<'OutfitCalendar'>;

export function OutfitCalendarScreen({ navigation }: Props) {
  const {
    userOutfits,
    clothingItems,
    getClothingItemsForOutfit,
    getClothingItemById,
    isLoading: wardrobeLoading,
  } = useWardrobe();
  const {
    getLogsForDate,
    getRecentLogs,
    saveWearLog,
    removeWearLogById,
    isLoading: wearLogLoading,
  } = useWearLog();
  const {
    wearContexts,
    createWearContext,
    getWearContextById,
    isLoading: wearContextLoading,
  } = useWearContext();

  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorLogId, setEditorLogId] = useState<string | null>(null);
  const [editorOutfitId, setEditorOutfitId] = useState<string | null>(null);
  const [editorItemIds, setEditorItemIds] = useState<string[]>([]);
  const [editorContextId, setEditorContextId] = useState<string | null>(null);
  const [newContextName, setNewContextName] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = wardrobeLoading || wearLogLoading || wearContextLoading;
  const selectedDateLogs = getLogsForDate(selectedDate);
  const recentLogs = getRecentLogs(10);
  const isEditingLog = editorLogId !== null;

  useFocusEffect(
    useCallback(() => {
      void reloadWearContextsForCurrentUser();
    }, []),
  );

  const sortedOutfits = useMemo(
    () =>
      [...userOutfits].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [userOutfits],
  );

  const resetEditor = () => {
    setEditorLogId(null);
    setEditorOutfitId(null);
    setEditorItemIds([]);
    setEditorContextId(null);
    setEditorNotes('');
    setNewContextName('');
  };

  const openEditor = (log?: WearLog) => {
    if (log) {
      setEditorLogId(log.id);
      setEditorOutfitId(log.outfitId ?? null);
      setEditorItemIds(log.clothingItemIds);
      setEditorContextId(log.wearContextId ?? null);
      setEditorNotes(log.notes ?? '');
    } else {
      resetEditor();
    }
    setShowEditor(true);
  };

  const handleSelectOutfit = (outfit: Outfit) => {
    setEditorOutfitId(outfit.id);
    setEditorItemIds(outfit.clothingItemIds);
  };

  const handleToggleItem = (itemId: string) => {
    setEditorOutfitId(null);
    setEditorItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const resolveWearContextForSave = async () => {
    if (editorContextId) {
      const selected =
        wearContexts.find((context) => context.id === editorContextId) ??
        getWearContextById(editorContextId);
      if (selected) {
        return selected;
      }
    }

    const typedName = newContextName.trim();
    if (!typedName) {
      return null;
    }

    return createWearContext(typedName);
  };

  const handleSaveWearLog = async () => {
    if (editorItemIds.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      const selectedContext = await resolveWearContextForSave();

      await saveWearLog({
        id: editorLogId ?? undefined,
        date: selectedDate,
        outfitId: editorOutfitId ?? undefined,
        clothingItemIds: editorItemIds,
        wearContextId: selectedContext?.id,
        wearContextName: selectedContext?.name,
        notes: editorNotes,
      });
      setShowEditor(false);
      resetEditor();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateContext = async () => {
    const name = newContextName.trim();
    if (!name) {
      return;
    }

    const created = await createWearContext(name);
    if (created) {
      setEditorContextId(created.id);
      setNewContextName('');
    }
  };

  const handleRemoveWearLog = (log: WearLog) => {
    Alert.alert('Remove wear log', 'Delete this outfit log from this date?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsSaving(true);
          try {
            await removeWearLogById(log.id);
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
  };

  const renderWearLogCard = (log: WearLog) => {
    const outfit = log.outfitId
      ? sortedOutfits.find((entry) => entry.id === log.outfitId)
      : undefined;
    const items = log.clothingItemIds
      .map((id) => getClothingItemById(id))
      .filter((item): item is NonNullable<typeof item> => item !== undefined);

    return (
      <View key={log.id} style={styles.wearLogCard}>
        {log.wearContextName ? (
          <>
            <Text style={styles.wearLogLabel}>Wear context</Text>
            <Text style={styles.wearLogTitle}>{log.wearContextName}</Text>
          </>
        ) : null}
        {outfit ? (
          <>
            <Text style={styles.wearLogLabel}>Outfit</Text>
            <Text style={styles.wearLogTitle}>{outfit.name}</Text>
            <Text style={styles.wearLogMeta}>
              {outfit.occasion} · {outfit.season}
            </Text>
          </>
        ) : null}
        <Text style={styles.wearLogLabel}>Items worn</Text>
        {items.length > 0 ? (
          <View style={styles.itemChipRow}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemChip}>
                <Text style={styles.itemChipText}>{item.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.wearLogMeta}>No items found</Text>
        )}
        {log.notes ? (
          <>
            <Text style={styles.wearLogLabel}>Notes</Text>
            <Text style={styles.wearLogMeta}>{log.notes}</Text>
          </>
        ) : null}
        <View style={styles.wearLogActions}>
          <Button
            title="Edit"
            variant="secondary"
            onPress={() => openEditor(log)}
            disabled={isSaving}
            fullWidth={false}
            style={styles.wearLogActionButton}
          />
          <Button
            title="Delete"
            variant="danger"
            onPress={() => handleRemoveWearLog(log)}
            disabled={isSaving}
            fullWidth={false}
            style={styles.wearLogActionButton}
          />
        </View>
      </View>
    );
  };

  const renderDayWearLogs = () => {
    if (selectedDateLogs.length === 0) {
      return (
        <View style={styles.emptyDayLogs}>
          <Text style={styles.emptyDayLogsTitle}>No outfit logs yet</Text>
          <Text style={styles.emptyDayLogsText}>
            Log what you wore on this date. You can add multiple outfit logs per day.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.dayLogsSection}>
        <Text style={styles.dayLogsHeading}>
          {selectedDateLogs.length} outfit log
          {selectedDateLogs.length === 1 ? '' : 's'} on this date
        </Text>
        {selectedDateLogs.map(renderWearLogCard)}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Outfit Calendar</Text>
        <Text style={styles.pageSubtitle}>
          Track what you wore on each day. Wear counts update automatically.
        </Text>

        <View style={styles.dateSelector}>
          <Pressable
            onPress={() => setSelectedDate((prev) => addDays(prev, -1))}
            style={({ pressed }) => [
              styles.dateArrow,
              pressed && styles.dateArrowPressed,
            ]}
          >
            <Text style={styles.dateArrowText}>‹</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => [
              styles.dateCenter,
              pressed && styles.dateCenterPressed,
            ]}
          >
            <Text style={styles.dateLabel}>Selected date</Text>
            <Text style={styles.dateValue}>{formatDisplayDate(selectedDate)}</Text>
            <Text style={styles.todayLink}>Tap to pick a date</Text>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                setSelectedDate(toDateKey(new Date()));
              }}
              hitSlop={8}
            >
              <Text style={styles.todayQuickLink}>Go to today</Text>
            </Pressable>
          </Pressable>
          <Pressable
            onPress={() => setSelectedDate((prev) => addDays(prev, 1))}
            style={({ pressed }) => [
              styles.dateArrow,
              pressed && styles.dateArrowPressed,
            ]}
          >
            <Text style={styles.dateArrowText}>›</Text>
          </Pressable>
        </View>

        {renderDayWearLogs()}

        <View style={styles.actions}>
          <Button
            title="Log an outfit"
            onPress={() => openEditor()}
            disabled={isSaving}
          />
          {selectedDateLogs.length > 0 ? (
            <Button
              title="Log another outfit"
              variant="secondary"
              onPress={() => openEditor()}
              disabled={isSaving}
            />
          ) : null}
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Wear History</Text>
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => {
              const outfit = log.outfitId
                ? sortedOutfits.find((entry) => entry.id === log.outfitId)
                : undefined;

              return (
                <Pressable
                  key={log.id}
                  onPress={() => setSelectedDate(log.date)}
                  style={({ pressed }) => [
                    styles.historyRow,
                    pressed && styles.historyRowPressed,
                    log.date === selectedDate && styles.historyRowSelected,
                  ]}
                >
                  <Text style={styles.historySummary} numberOfLines={2}>
                    {formatWearHistoryLine(log, outfit?.name)}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <EmptyState
              icon="◇"
              title="No wear history yet"
              message="Log your first outfit or clothing items to start tracking."
            />
          )}
        </View>
      </View>

      <Modal
        visible={showEditor}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditor(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditingLog ? 'Edit outfit log' : 'Log an outfit'} for{' '}
                {formatShortDate(selectedDate)}
              </Text>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Wear context</Text>
                {wearContexts.length > 0 ? (
                  <View style={styles.contextChipRow}>
                    {wearContexts.map((context) => (
                      <Pressable
                        key={context.id}
                        onPress={() =>
                          setEditorContextId((prev) =>
                            prev === context.id ? null : context.id,
                          )
                        }
                        style={({ pressed }) => [
                          styles.contextChip,
                          editorContextId === context.id && styles.contextChipSelected,
                          pressed && styles.contextChipPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.contextChipText,
                            editorContextId === context.id &&
                              styles.contextChipTextSelected,
                          ]}
                        >
                          {context.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.modalHintText}>
                    No wear contexts yet. Create one below.
                  </Text>
                )}
                <View style={styles.createContextRow}>
                  <Input
                    placeholder="e.g. College, Work, Wedding"
                    value={newContextName}
                    onChangeText={setNewContextName}
                    style={styles.createContextInput}
                  />
                  <Button
                    title="Add"
                    variant="secondary"
                    onPress={handleCreateContext}
                    fullWidth={false}
                    style={styles.createContextButton}
                    disabled={!newContextName.trim()}
                  />
                </View>
              </View>

              {sortedOutfits.length > 0 ? (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Saved outfit</Text>
                  {sortedOutfits.map((outfit) => (
                    <Pressable
                      key={outfit.id}
                      onPress={() => handleSelectOutfit(outfit)}
                      style={({ pressed }) => [
                        styles.outfitOption,
                        editorOutfitId === outfit.id && styles.outfitOptionSelected,
                        pressed && styles.outfitOptionPressed,
                      ]}
                    >
                      <Text style={styles.outfitOptionName}>{outfit.name}</Text>
                      <Text style={styles.outfitOptionMeta}>
                        {getClothingItemsForOutfit(outfit).length} items
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.modalHint}>
                  <Text style={styles.modalHintText}>
                    No outfits yet. Create an outfit first, or pick individual
                    items below.
                  </Text>
                  <Button
                    title="Build Outfit"
                    variant="secondary"
                    onPress={() => {
                      setShowEditor(false);
                      navigation.navigate('OutfitBuilder');
                    }}
                  />
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  Or pick individual items
                </Text>
                {OUTFIT_BUILDER_CATEGORIES.map((group) => {
                  const items = clothingItems.filter(
                    (item) => item.category === group.category,
                  );

                  if (items.length === 0) {
                    return null;
                  }

                  return (
                    <View key={group.label} style={styles.categoryBlock}>
                      <Text style={styles.categoryLabel}>{group.label}</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryRow}
                      >
                        {items.map((item) => (
                          <OutfitSelectableItem
                            key={item.id}
                            item={item}
                            selected={editorItemIds.includes(item.id)}
                            onPress={() => handleToggleItem(item.id)}
                          />
                        ))}
                      </ScrollView>
                    </View>
                  );
                })}
              </View>

              <Input
                label="Notes (optional)"
                placeholder="e.g. Work meeting, rainy day"
                value={editorNotes}
                onChangeText={setEditorNotes}
                multiline
                style={styles.notesInput}
              />

              <View style={styles.modalActions}>
                <Button
                  title={isSaving ? 'Saving...' : 'Save'}
                  onPress={handleSaveWearLog}
                  loading={isSaving}
                  disabled={isSaving || editorItemIds.length === 0}
                />
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setShowEditor(false)}
                  disabled={isSaving}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        title="Select date"
        value={selectedDate}
        onConfirm={(dateKey) => {
          setSelectedDate(dateKey);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  pageTitle: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    ...typography.caption,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  dateSelector: {
    ...cardBase,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  dateArrow: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowPressed: {
    opacity: 0.85,
  },
  dateArrowText: {
    fontSize: 24,
    color: colors.primaryDark,
    marginTop: -2,
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  dateCenterPressed: {
    opacity: 0.9,
  },
  dateLabel: {
    ...typography.small,
    marginBottom: spacing.xs,
  },
  dateValue: {
    ...typography.subheading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  todayLink: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  todayQuickLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  dayLogsSection: {
    marginBottom: spacing.lg,
  },
  dayLogsHeading: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  wearLogCard: {
    ...cardBase,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyDayLogs: {
    ...cardBase,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  emptyDayLogsTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  emptyDayLogsText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 22,
  },
  wearLogLabel: {
    ...typography.small,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  wearLogTitle: {
    ...typography.subheading,
  },
  wearLogMeta: {
    ...typography.caption,
  },
  wearLogActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  wearLogActionButton: {
    flex: 1,
  },
  itemChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  itemChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  itemChipText: {
    ...typography.small,
    color: colors.primaryDark,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  historySection: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  historyRow: {
    ...cardBase,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  historyRowPressed: {
    opacity: 0.92,
  },
  historyRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  historySummary: {
    ...typography.caption,
    flex: 1,
    lineHeight: 20,
  },
  contextChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  contextChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  contextChipPressed: {
    opacity: 0.9,
  },
  contextChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  contextChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  createContextRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  createContextInput: {
    flex: 1,
    marginBottom: 0,
  },
  createContextButton: {
    minWidth: 72,
    marginBottom: spacing.lg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(61,52,53,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '88%',
  },
  modalContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  modalTitle: {
    ...typography.subheading,
    marginBottom: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.xl,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalHint: {
    ...cardBase,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.md,
  },
  modalHintText: {
    ...typography.caption,
    lineHeight: 22,
  },
  outfitOption: {
    ...cardBase,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  outfitOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  outfitOptionPressed: {
    opacity: 0.92,
  },
  outfitOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  outfitOptionMeta: {
    ...typography.small,
    marginTop: 2,
  },
  categoryBlock: {
    marginBottom: spacing.md,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categoryRow: {
    paddingRight: spacing.md,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  modalActions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
