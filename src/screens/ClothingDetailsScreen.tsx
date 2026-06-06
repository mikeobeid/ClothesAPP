import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { showCloudSyncWarning } from '../utils/syncMessages';
import { Button, ClothingImage, ScreenContainer } from '../components';
import { CLOTHING_CONDITIONS, COLORS } from '../constants/clothing';
import { colors, spacing, typography } from '../constants/theme';
import { useWearLog } from '../context/WearLogContext';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';
import { formatShortDate } from '../utils/dateFormat';

type Props = RootStackScreenProps<'ClothingDetails'>;

function formatConditionLabel(condition?: string): string | null {
  if (!condition || condition === 'unspecified') {
    return null;
  }

  return (
    CLOTHING_CONDITIONS.find((entry) => entry.value === condition)?.label ??
    condition
  );
}

export function ClothingDetailsScreen({ route, navigation }: Props) {
  const {
    getClothingItemById,
    getOutfitById,
    isClothingFavorite,
    isUserClothingItem,
    toggleClothingFavorite,
    deleteClothingItem,
  } = useWardrobe();
  const { getWearStatsForItem, getWearHistoryForItem } = useWearLog();

  const { itemId } = route.params;
  const [isDeleting, setIsDeleting] = useState(false);
  const item = getClothingItemById(itemId);
  const isFavorite = isClothingFavorite(itemId);
  const canManage = isUserClothingItem(itemId);
  const wearStats = getWearStatsForItem(itemId);

  const resolveOutfitName = useMemo(
    () => (outfitId?: string) =>
      outfitId ? getOutfitById(outfitId)?.name : undefined,
    [getOutfitById],
  );

  const wearHistory = useMemo(
    () => getWearHistoryForItem(itemId, resolveOutfitName),
    [getWearHistoryForItem, itemId, resolveOutfitName],
  );

  const colorHex = item
    ? COLORS.find((c) => c.name === item.color)?.hex ?? '#E5E7EB'
    : '#E5E7EB';
  const conditionLabel = item ? formatConditionLabel(item.condition) : null;

  const handleDelete = () => {
    Alert.alert(
      'Delete clothing item',
      'Are you sure you want to delete this clothing item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await deleteClothingItem(itemId);
              if (!result.success) {
                return;
              }
              showCloudSyncWarning(
                'Item deleted',
                result.cloudSyncWarning,
                () => navigation.goBack(),
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (!item) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.notFound}>Item not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <ClothingImage
          imageUri={item.imageUri}
          placeholderLabel={item.category.charAt(0)}
          style={styles.image}
          placeholderStyle={styles.imagePlaceholder}
          resizeMode="cover"
        />

        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.meta}>{item.category}</Text>

        <View style={styles.wearCard}>
          <Text style={styles.wearTitle}>
            Worn {wearStats.wearCount} time{wearStats.wearCount === 1 ? '' : 's'}
          </Text>
          <Text style={styles.wearMeta}>
            Last worn:{' '}
            {wearStats.lastWornDate
              ? formatShortDate(wearStats.lastWornDate)
              : 'Not logged yet'}
          </Text>
          {wearStats.contextsWornIn.length > 0 ? (
            <Text style={styles.wearMeta}>
              Contexts worn in: {wearStats.contextsWornIn.join(', ')}
            </Text>
          ) : null}
          {wearStats.mostCommonContext ? (
            <Text style={styles.wearMeta}>
              Most common context: {wearStats.mostCommonContext}
            </Text>
          ) : null}
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
            <Text style={styles.value}>{item.color}</Text>
          </View>

          <Text style={styles.label}>Season</Text>
          <Text style={styles.value}>
            {item.season.length > 0 ? item.season.join(', ') : '—'}
          </Text>

          <Text style={styles.label}>Occasion</Text>
          <Text style={styles.value}>
            {item.occasion.length > 0 ? item.occasion.join(', ') : '—'}
          </Text>

          {conditionLabel ? (
            <>
              <Text style={styles.label}>Condition</Text>
              <Text style={styles.value}>{conditionLabel}</Text>
            </>
          ) : null}

          {item.purchaseDate ? (
            <>
              <Text style={styles.label}>Purchase Date</Text>
              <Text style={styles.value}>
                {formatShortDate(item.purchaseDate)}
              </Text>
            </>
          ) : null}

          {item.notes ? (
            <>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{item.notes}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Wear History</Text>
          {wearHistory.length > 0 ? (
            wearHistory.map((entry) => (
              <View key={entry.logId} style={styles.historyRow}>
                <Text style={styles.historyDate}>
                  {formatShortDate(entry.date)}
                </Text>
                <View style={styles.historyDetails}>
                  {entry.wearContextName ? (
                    <Text style={styles.historyContext}>
                      {entry.wearContextName}
                    </Text>
                  ) : null}
                  {entry.outfitName ? (
                    <Text style={styles.historyLine}>{entry.outfitName}</Text>
                  ) : null}
                  {entry.notes ? (
                    <Text style={styles.historyNotes}>{entry.notes}</Text>
                  ) : null}
                  {!entry.wearContextName && !entry.outfitName && !entry.notes ? (
                    <Text style={styles.historyLine}>Logged wear</Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.historyEmpty}>No wear history yet.</Text>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title={isFavorite ? 'Unfavorite' : 'Favorite'}
            variant="secondary"
            onPress={() => toggleClothingFavorite(itemId)}
          />
          {canManage ? (
            <>
              <Button
                title="Edit"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('EditClothing', { itemId })
                }
              />
              <Button
                title={isDeleting ? 'Deleting...' : 'Delete'}
                variant="danger"
                onPress={handleDelete}
                loading={isDeleting}
                disabled={isDeleting}
              />
            </>
          ) : (
            <Text style={styles.sampleNote}>
              Sample items cannot be edited or deleted.
            </Text>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    marginBottom: spacing.xxl,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  wearCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  wearTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  wearMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  detailsSection: {
    gap: 4,
    marginBottom: spacing.xl,
  },
  historySection: {
    marginBottom: spacing.xl,
  },
  historyTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  historyRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  historyDetails: {
    gap: 2,
  },
  historyContext: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  historyLine: {
    ...typography.caption,
    color: colors.text,
  },
  historyNotes: {
    ...typography.small,
    fontStyle: 'italic',
  },
  historyEmpty: {
    ...typography.caption,
    lineHeight: 22,
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
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: {
    gap: spacing.md,
  },
  sampleNote: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  notFound: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
});
