import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  EmptyState,
  MannequinPreview,
  OutfitSelectableItem,
  ScreenContainer,
} from '../components';
import { OUTFIT_BUILDER_CATEGORIES } from '../constants/outfits';
import { cardBase, colors, radius, spacing, typography } from '../constants/theme';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';
import { Outfit } from '../types';
import {
  getItemsForManualSelection,
  toggleManualSelection,
} from '../utils/virtualPreview';

type Props = RootStackScreenProps<'VirtualPreview'>;

type PreviewSource = 'none' | 'outfit' | 'manual';

export function VirtualPreviewScreen({ navigation }: Props) {
  const {
    clothingItems,
    userItems,
    userOutfits,
    getClothingItemsForOutfit,
    isLoading,
  } = useWardrobe();

  const [previewSource, setPreviewSource] = useState<PreviewSource>('none');
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [manualSelectedIds, setManualSelectedIds] = useState<string[]>([]);
  const [showOutfitPicker, setShowOutfitPicker] = useState(false);
  const [showManualPicker, setShowManualPicker] = useState(false);

  const sortedOutfits = useMemo(
    () =>
      [...userOutfits].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [userOutfits],
  );

  const previewItems = useMemo(() => {
    if (previewSource === 'outfit' && selectedOutfit) {
      return getClothingItemsForOutfit(selectedOutfit);
    }
    if (previewSource === 'manual') {
      return getItemsForManualSelection(clothingItems, manualSelectedIds);
    }
    return [];
  }, [
    clothingItems,
    getClothingItemsForOutfit,
    manualSelectedIds,
    previewSource,
    selectedOutfit,
  ]);

  const previewLabel =
    previewSource === 'outfit' && selectedOutfit
      ? selectedOutfit.name
      : previewSource === 'manual'
        ? 'Custom selection'
        : undefined;

  const handleChooseOutfit = () => {
    if (userOutfits.length === 0) {
      return;
    }
    setShowOutfitPicker(true);
  };

  const handleSelectOutfit = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setPreviewSource('outfit');
    setManualSelectedIds([]);
    setShowManualPicker(false);
    setShowOutfitPicker(false);
  };

  const handleToggleManualItem = (itemId: string) => {
    const item = clothingItems.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    setPreviewSource('manual');
    setSelectedOutfit(null);
    setManualSelectedIds((prev) =>
      toggleManualSelection(clothingItems, prev, item),
    );
  };

  const handleClearPreview = () => {
    setPreviewSource('none');
    setSelectedOutfit(null);
    setManualSelectedIds([]);
    setShowManualPicker(false);
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading wardrobe...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (userItems.length === 0) {
    return (
      <ScreenContainer scrollable>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Virtual Preview</Text>
          <Text style={styles.pageSubtitle}>
            See how outfit pieces layer on a simple mannequin.
          </Text>
          <EmptyState
            icon="✧"
            title="Add clothes first"
            message="Add clothes to start building a preview."
            actionTitle="Add Clothing"
            onAction={() => navigation.navigate('AddClothing')}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Virtual Preview</Text>
        <Text style={styles.pageSubtitle}>
          Layer your clothing on a simple 2D mannequin. This is a visual guide,
          not a realistic try-on.
        </Text>

        <MannequinPreview items={previewItems} label={previewLabel} />

        <View style={styles.controls}>
          <Button
            title="Choose Saved Outfit"
            variant="secondary"
            onPress={handleChooseOutfit}
            disabled={userOutfits.length === 0}
          />
          <Button
            title={showManualPicker ? 'Hide Manual Select' : 'Manual Select Items'}
            variant="secondary"
            onPress={() => setShowManualPicker((prev) => !prev)}
          />
          <Button
            title="Clear Preview"
            variant="ghost"
            onPress={handleClearPreview}
            disabled={previewSource === 'none'}
          />
        </View>

        {userOutfits.length === 0 ? (
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>No saved outfits yet</Text>
            <Text style={styles.hintText}>
              Create an outfit first to preview it.
            </Text>
            <View style={styles.hintAction}>
              <Button
                title="Build Outfit"
                variant="secondary"
                onPress={() => navigation.navigate('OutfitBuilder')}
              />
            </View>
          </View>
        ) : null}

        {showManualPicker ? (
          <View style={styles.manualSection}>
            <Text style={styles.sectionTitle}>Pick items by category</Text>
            <Text style={styles.sectionHint}>
              Select one item per category. Dresses replace tops and bottoms in
              the preview.
            </Text>
            {OUTFIT_BUILDER_CATEGORIES.map((group) => {
              const categoryItems = clothingItems.filter(
                (item) => item.category === group.category,
              );

              return (
                <View key={group.label} style={styles.categoryBlock}>
                  <Text style={styles.categoryLabel}>{group.label}</Text>
                  {categoryItems.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryRow}
                    >
                      {categoryItems.map((item) => (
                        <OutfitSelectableItem
                          key={item.id}
                          item={item}
                          selected={manualSelectedIds.includes(item.id)}
                          onPress={() => handleToggleManualItem(item.id)}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.emptyCategory}>
                      No {group.label.toLowerCase()} in your wardrobe
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      <Modal
        visible={showOutfitPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOutfitPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Saved Outfit</Text>
              <Pressable
                onPress={() => setShowOutfitPicker(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close outfit picker"
              >
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            {sortedOutfits.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyTitle}>No saved outfits</Text>
                <Text style={styles.modalEmptyText}>
                  Create an outfit first to preview it.
                </Text>
                <Button
                  title="Build Outfit"
                  variant="secondary"
                  onPress={() => {
                    setShowOutfitPicker(false);
                    navigation.navigate('OutfitBuilder');
                  }}
                />
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.modalList}>
                {sortedOutfits.map((outfit) => {
                  const items = getClothingItemsForOutfit(outfit);
                  return (
                    <Pressable
                      key={outfit.id}
                      onPress={() => handleSelectOutfit(outfit)}
                      style={({ pressed }) => [
                        styles.outfitOption,
                        selectedOutfit?.id === outfit.id && styles.outfitOptionSelected,
                        pressed && styles.outfitOptionPressed,
                      ]}
                    >
                      <Text style={styles.outfitOptionName}>{outfit.name}</Text>
                      <Text style={styles.outfitOptionMeta}>
                        {outfit.occasion} · {outfit.season} · {items.length}{' '}
                        {items.length === 1 ? 'item' : 'items'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  controls: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  hintCard: {
    ...cardBase,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  hintTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  hintText: {
    ...typography.caption,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  hintAction: {
    marginTop: spacing.sm,
  },
  manualSection: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.caption,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  categoryBlock: {
    marginBottom: spacing.lg,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  categoryRow: {
    paddingRight: spacing.md,
  },
  emptyCategory: {
    ...typography.small,
    fontStyle: 'italic',
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
    maxHeight: '72%',
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    ...typography.subheading,
  },
  modalClose: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  modalList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalEmpty: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  modalEmptyTitle: {
    ...typography.subheading,
  },
  modalEmptyText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 22,
  },
  outfitOption: {
    ...cardBase,
    padding: spacing.lg,
  },
  outfitOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  outfitOptionPressed: {
    opacity: 0.92,
  },
  outfitOptionName: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  outfitOptionMeta: {
    ...typography.caption,
  },
});
