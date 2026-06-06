import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  EmptyState,
  FilterChip,
  OutfitCard,
  ScreenContainer,
} from '../components';
import { colors, spacing, typography } from '../constants/theme';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'SavedOutfits'>;

export function SavedOutfitsScreen({ navigation }: Props) {
  const {
    outfits,
    userOutfits,
    getClothingItemsForOutfit,
    isOutfitFavorite,
    isLoading,
  } = useWardrobe();
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const hasOutfitFavorites = useMemo(
    () => outfits.some((outfit) => isOutfitFavorite(outfit.id)),
    [outfits, isOutfitFavorite],
  );

  const sortedOutfits = useMemo(() => {
    const list = [...outfits].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (!favoritesOnly) {
      return list;
    }

    return list.filter((outfit) => isOutfitFavorite(outfit.id));
  }, [favoritesOnly, isOutfitFavorite, outfits]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading outfits...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Text style={styles.title}>Saved Outfits</Text>
        <Text style={styles.description}>
          {sortedOutfits.length} {sortedOutfits.length === 1 ? 'outfit' : 'outfits'}
          {favoritesOnly ? ' in favorites' : ''}
        </Text>

        {hasOutfitFavorites ? (
          <View style={styles.filterRow}>
            <FilterChip
              label="All"
              selected={!favoritesOnly}
              onPress={() => setFavoritesOnly(false)}
            />
            <FilterChip
              label="♥ Favorites"
              selected={favoritesOnly}
              onPress={() => setFavoritesOnly(true)}
            />
          </View>
        ) : null}

        {sortedOutfits.length > 0 ? (
          sortedOutfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={getClothingItemsForOutfit(outfit)}
              isFavorite={isOutfitFavorite(outfit.id)}
              onPress={() =>
                navigation.navigate('OutfitDetails', { outfitId: outfit.id })
              }
            />
          ))
        ) : (
          <EmptyState
            icon={favoritesOnly ? '♡' : '✧'}
            title={
              favoritesOnly
                ? 'No favorite outfits'
                : userOutfits.length > 0
                  ? 'No outfits to show'
                  : 'No saved outfits yet'
            }
            message={
              favoritesOnly
                ? 'Tap the heart on any outfit to save it here for quick access.'
                : 'Combine pieces from your wardrobe in Outfit Builder, then save looks you love.'
            }
            actionTitle={favoritesOnly ? undefined : 'Build Outfit'}
            onAction={
              favoritesOnly
                ? undefined
                : () => navigation.navigate('OutfitBuilder')
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
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
});
