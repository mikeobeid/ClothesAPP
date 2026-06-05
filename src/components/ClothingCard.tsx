import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/clothing';
import { cardBase, colors, radius, spacing } from '../constants/theme';
import { ClothingItem } from '../types';
import { ClothingImage } from './ClothingImage';

type ClothingCardProps = {
  item: ClothingItem;
  onPress?: () => void;
  compact?: boolean;
  isFavorite?: boolean;
};

export function ClothingCard({
  item,
  onPress,
  compact = false,
  isFavorite = false,
}: ClothingCardProps) {
  const colorHex = COLORS.find((c) => c.name === item.color)?.hex ?? '#E5E7EB';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageWrap}>
        <ClothingImage
          imageUri={item.imageUri}
          placeholderLabel={item.category.charAt(0)}
          style={[styles.image, compact && styles.imageCompact]}
          placeholderStyle={[styles.imagePlaceholder, compact && styles.imageCompact]}
          resizeMode="cover"
        />
        {isFavorite ? (
          <View style={styles.favoriteBadge}>
            <Text style={styles.favoriteText}>♥</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.details, compact && styles.detailsCompact]}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{item.category}</Text>
          </View>
          <View style={styles.chip}>
            <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
            <Text style={styles.chipText}>{item.color}</Text>
          </View>
        </View>
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
  cardCompact: {
    width: 168,
    marginBottom: 0,
    marginRight: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCompact: {
    aspectRatio: 1,
  },
  favoriteBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteText: {
    fontSize: 14,
    color: colors.favorite,
  },
  details: {
    padding: spacing.lg,
  },
  detailsCompact: {
    padding: spacing.md,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  nameCompact: {
    fontSize: 14,
    marginBottom: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
