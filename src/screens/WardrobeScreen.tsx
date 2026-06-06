import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ClothingCard,
  EmptyState,
  FilterChip,
  Input,
  ScreenContainer,
} from '../components';
import { CLOTHING_CATEGORIES } from '../constants/clothing';
import { colors, spacing, typography } from '../constants/theme';
import {
  reloadWearContextsForCurrentUser,
  useWearContext,
} from '../context/WearContextContext';
import { useWearLog } from '../context/WearLogContext';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';
import {
  clothingItemMatchesSearch,
  itemWasWornInContext,
} from '../utils/wearStats';

type Props = RootStackScreenProps<'Wardrobe'>;

const ALL_FILTER = 'All';
const FAVORITES_FILTER = 'Favorites';
const ALL_CONTEXTS_FILTER = 'All contexts';
const FILTER_CHIP_ROW_HEIGHT = 44;

export function WardrobeScreen({ navigation }: Props) {
  const { clothingItems, userItems, isClothingFavorite, isLoading } =
    useWardrobe();
  const { wearLogs, getWearStatsForItem } = useWearLog();
  const { wearContexts } = useWearContext();
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER);
  const [selectedWearContext, setSelectedWearContext] =
    useState(ALL_CONTEXTS_FILTER);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('AddClothing')}
          style={({ pressed }) => [
            styles.headerAddButton,
            pressed && styles.headerAddButtonPressed,
          ]}
          hitSlop={8}
          accessibilityLabel="Add clothing"
          accessibilityRole="button"
        >
          <Text style={styles.headerAddButtonText}>+</Text>
        </Pressable>
      ),
    });
  }, [navigation]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const wearContextFilters = useMemo(
    () => [ALL_CONTEXTS_FILTER, ...wearContexts.map((context) => context.name)],
    [wearContexts],
  );
  useFocusEffect(
    useCallback(() => {
      void reloadWearContextsForCurrentUser();
    }, []),
  );

  const filteredItems = useMemo(() => {
    let items = clothingItems;

    if (favoritesOnly) {
      items = items.filter((item) => isClothingFavorite(item.id));
    }

    if (selectedCategory !== ALL_FILTER) {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (selectedWearContext !== ALL_CONTEXTS_FILTER) {
      items = items.filter((item) =>
        itemWasWornInContext(item.id, selectedWearContext, wearLogs),
      );
    }

    const query = searchQuery.trim();
    if (query) {
      items = items.filter((item) =>
        clothingItemMatchesSearch(item, query, wearLogs),
      );
    }

    return items;
  }, [
    clothingItems,
    favoritesOnly,
    isClothingFavorite,
    searchQuery,
    selectedCategory,
    selectedWearContext,
    wearLogs,
  ]);

  const hasActiveFilters =
    favoritesOnly ||
    selectedCategory !== ALL_FILTER ||
    selectedWearContext !== ALL_CONTEXTS_FILTER ||
    searchQuery.trim().length > 0;
  const hasOwnItems = userItems.length > 0;

  const filterOptions = [ALL_FILTER, FAVORITES_FILTER, ...CLOTHING_CATEGORIES];

  const handleCategoryPress = (category: string) => {
    if (category === FAVORITES_FILTER) {
      setFavoritesOnly((prev) => !prev);
      return;
    }

    setFavoritesOnly(false);
    setSelectedCategory(category);
  };

  const isChipSelected = (category: string) => {
    if (category === FAVORITES_FILTER) {
      return favoritesOnly;
    }
    if (favoritesOnly) {
      return false;
    }
    return selectedCategory === category;
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

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Text style={styles.title}>My Wardrobe</Text>
        <Text style={styles.description}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </Text>

        <Input
          placeholder="Search name, category, color, season, context..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />

        <Text style={styles.filterGroupLabel}>Category</Text>
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
          >
            {filterOptions.map((category) => (
              <FilterChip
                key={category}
                label={category === FAVORITES_FILTER ? '♥ Favorites' : category}
                selected={isChipSelected(category)}
                onPress={() => handleCategoryPress(category)}
              />
            ))}
          </ScrollView>
        </View>

        <Text style={styles.filterGroupLabel}>Wear context</Text>
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
          >
            {wearContextFilters.map((contextName) => (
              <FilterChip
                key={contextName}
                label={contextName}
                selected={selectedWearContext === contextName}
                onPress={() => setSelectedWearContext(contextName)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.listSection}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const wearStats = getWearStatsForItem(item.id);
              return (
                <ClothingCard
                  key={item.id}
                  item={item}
                  isFavorite={isClothingFavorite(item.id)}
                  wearCount={wearStats.wearCount}
                  lastWornDate={wearStats.lastWornDate}
                  onPress={() =>
                    navigation.navigate('ClothingDetails', { itemId: item.id })
                  }
                />
              );
            })
          ) : (
            <EmptyState
              icon={hasActiveFilters ? '◇' : '✧'}
              title={
                hasActiveFilters
                  ? 'No matching items'
                  : hasOwnItems
                    ? 'No items match'
                    : 'Your wardrobe is empty'
              }
              message={
                hasActiveFilters || hasOwnItems
                  ? 'Try adjusting your search or filters to find what you are looking for.'
                  : 'Add photos of your clothes to start building outfits and getting smart suggestions.'
              }
              actionTitle={
                hasActiveFilters || hasOwnItems ? undefined : 'Add Clothing'
              }
              onAction={
                hasActiveFilters || hasOwnItems
                  ? undefined
                  : () => navigation.navigate('AddClothing')
              }
            />
          )}
        </View>
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
    marginBottom: spacing.md,
  },
  searchInput: {
    marginBottom: spacing.lg,
  },
  filterGroupLabel: {
    ...typography.small,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  filterSection: {
    minHeight: FILTER_CHIP_ROW_HEIGHT,
    marginBottom: spacing.lg,
    flexShrink: 0,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: FILTER_CHIP_ROW_HEIGHT,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: FILTER_CHIP_ROW_HEIGHT,
    paddingRight: spacing.md,
  },
  listSection: {
    paddingTop: spacing.xs,
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
  headerAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  headerAddButtonPressed: {
    opacity: 0.85,
  },
  headerAddButtonText: {
    fontSize: 22,
    fontWeight: '400',
    color: colors.surface,
    lineHeight: 24,
    marginTop: -1,
  },
});
