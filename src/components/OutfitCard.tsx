import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cardBase, colors, radius, spacing, typography } from '../constants/theme';
import { ClothingItem, Outfit } from '../types';
import { ClothingImage } from './ClothingImage';

type OutfitCardProps = {
  outfit: Outfit;
  items?: ClothingItem[];
  onPress?: () => void;
  isFavorite?: boolean;
};

export function OutfitCard({
  outfit,
  items = [],
  onPress,
  isFavorite = false,
}: OutfitCardProps) {
  const itemCount = outfit.clothingItemIds.length;
  const previewItems = items.slice(0, 5);
  const overflow = items.length - previewItems.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {outfit.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{outfit.occasion}</Text>
            </View>
            <View style={[styles.pill, styles.pillMuted]}>
              <Text style={styles.pillTextMuted}>{outfit.season}</Text>
            </View>
          </View>
        </View>
        {isFavorite ? (
          <View style={styles.favoriteBadge}>
            <Text style={styles.favoriteText}>♥</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.previewRow}
      >
        {previewItems.length > 0 ? (
          <>
            {previewItems.map((item) => (
              <View key={item.id} style={styles.previewSlot}>
                <ClothingImage
                  imageUri={item.imageUri}
                  placeholderLabel={item.category.charAt(0)}
                  style={styles.previewImage}
                  placeholderStyle={styles.previewPlaceholder}
                  resizeMode="cover"
                />
              </View>
            ))}
            {overflow > 0 ? (
              <View style={styles.overflowSlot}>
                <Text style={styles.overflowText}>+{overflow}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyPreviewText}>No items linked</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardBase,
    width: '100%',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  pillMuted: {
    backgroundColor: colors.surfaceMuted,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primaryDark,
  },
  pillTextMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  favoriteBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteText: {
    fontSize: 15,
    color: colors.favorite,
  },
  previewRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  previewSlot: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowSlot: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  emptyPreview: {
    paddingVertical: spacing.lg,
  },
  emptyPreviewText: {
    ...typography.small,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  itemCount: {
    ...typography.small,
  },
});
