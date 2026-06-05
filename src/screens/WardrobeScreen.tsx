import { useLayoutEffect, useMemo, useState } from 'react';
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
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Wardrobe'>;

const ALL_FILTER = 'All';
const FAVORITES_FILTER = 'Favorites';
const FILTER_CHIP_ROW_HEIGHT = 44;

export function WardrobeScreen({ navigation }: Props) {
  const { clothingItems, isClothingFavorite, isLoading } = useWardrobe();
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER);

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

  const filteredItems = useMemo(() => {
    let items = clothingItems;

    if (favoritesOnly) {
      items = items.filter((item) => isClothingFavorite(item.id));
    }

    if (selectedCategory !== ALL_FILTER) {
      items = items.filter((item) => item.category === selectedCategory);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }

    return items;
  }, [clothingItems, favoritesOnly, isClothingFavorite, searchQuery, selectedCategory]);

  const hasActiveFilters =
    favoritesOnly || selectedCategory !== ALL_FILTER || searchQuery.trim().length > 0;

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
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />

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

        <View style={styles.listSection}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                isFavorite={isClothingFavorite(item.id)}
                onPress={() =>
                  navigation.navigate('ClothingDetails', { itemId: item.id })
                }
              />
            ))
          ) : (
            <EmptyState
              icon={hasActiveFilters ? '◇' : '✧'}
              title={hasActiveFilters ? 'No matching items' : 'Your wardrobe is empty'}
              message={
                hasActiveFilters
                  ? 'Try adjusting your search or filters to find what you are looking for.'
                  : 'Start building your closet by adding your first clothing item.'
              }
              actionTitle={hasActiveFilters ? undefined : 'Add Clothing'}
              onAction={
                hasActiveFilters
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
  filterSection: {
    minHeight: FILTER_CHIP_ROW_HEIGHT,
    marginBottom: spacing.xl,
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
