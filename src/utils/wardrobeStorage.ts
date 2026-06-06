import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClothingItem, Outfit } from '../types';
import { normalizeRestoredImageUri } from './clothingImage';
import { MOCK_CLOTHING_ITEMS } from './mockData';

function sanitizeClothingItem(item: ClothingItem): ClothingItem {
  return {
    ...item,
    imageUri: normalizeRestoredImageUri(item.imageUri),
  };
}

function sanitizeClothingItems(items: ClothingItem[]): ClothingItem[] {
  return items.map(sanitizeClothingItem);
}

const LEGACY_GLOBAL_ITEMS_KEY = '@wardrobe_user_items';
const LEGACY_GLOBAL_OUTFITS_KEY = '@wardrobe_user_outfits';
const LEGACY_GLOBAL_FAVORITES_KEY = '@wardrobe_favorites';
const LEGACY_ITEMS_KEY = '@wardrobe_clothing_items';

export type FavoritesState = {
  clothingIds: string[];
  outfitIds: string[];
};

export const EMPTY_FAVORITES: FavoritesState = {
  clothingIds: [],
  outfitIds: [],
};

export type WardrobeStorageKeys = {
  itemsKey: string;
  outfitsKey: string;
  favoritesKey: string;
};

export function getWardrobeStorageKeys(userId: string): WardrobeStorageKeys {
  return {
    itemsKey: `@wardrobe_user_items_${userId}`,
    outfitsKey: `@wardrobe_outfits_${userId}`,
    favoritesKey: `@wardrobe_favorites_${userId}`,
  };
}

export function isGuestStorageUserId(userId: string): boolean {
  return userId.startsWith('guest-');
}

async function migrateGlobalKeysToGuest(guestUserId: string): Promise<void> {
  const keys = getWardrobeStorageKeys(guestUserId);

  const [existingItems, globalItems, globalOutfits, globalFavorites, legacyItems] =
    await Promise.all([
      AsyncStorage.getItem(keys.itemsKey),
      AsyncStorage.getItem(LEGACY_GLOBAL_ITEMS_KEY),
      AsyncStorage.getItem(LEGACY_GLOBAL_OUTFITS_KEY),
      AsyncStorage.getItem(LEGACY_GLOBAL_FAVORITES_KEY),
      AsyncStorage.getItem(LEGACY_ITEMS_KEY),
    ]);

  if (!existingItems) {
    if (globalItems) {
      await AsyncStorage.setItem(keys.itemsKey, globalItems);
      await AsyncStorage.removeItem(LEGACY_GLOBAL_ITEMS_KEY);
    } else if (legacyItems) {
      const mockIds = new Set(MOCK_CLOTHING_ITEMS.map((item) => item.id));
      const legacyParsed = JSON.parse(legacyItems) as ClothingItem[];
      const migrated = sanitizeClothingItems(
        legacyParsed.filter(
          (item) => !mockIds.has(item.id) || !!item.imageUri,
        ),
      );

      if (migrated.length > 0) {
        await AsyncStorage.setItem(keys.itemsKey, JSON.stringify(migrated));
      }

      await AsyncStorage.removeItem(LEGACY_ITEMS_KEY);
    }
  } else if (globalItems) {
    await AsyncStorage.removeItem(LEGACY_GLOBAL_ITEMS_KEY);
  }

  const existingOutfits = await AsyncStorage.getItem(keys.outfitsKey);
  if (!existingOutfits && globalOutfits) {
    await AsyncStorage.setItem(keys.outfitsKey, globalOutfits);
    await AsyncStorage.removeItem(LEGACY_GLOBAL_OUTFITS_KEY);
  } else if (globalOutfits) {
    await AsyncStorage.removeItem(LEGACY_GLOBAL_OUTFITS_KEY);
  }

  const existingFavorites = await AsyncStorage.getItem(keys.favoritesKey);
  if (!existingFavorites && globalFavorites) {
    await AsyncStorage.setItem(keys.favoritesKey, globalFavorites);
    await AsyncStorage.removeItem(LEGACY_GLOBAL_FAVORITES_KEY);
  } else if (globalFavorites) {
    await AsyncStorage.removeItem(LEGACY_GLOBAL_FAVORITES_KEY);
  }
}

export async function loadUserItemsForUser(userId: string): Promise<ClothingItem[]> {
  if (isGuestStorageUserId(userId)) {
    await migrateGlobalKeysToGuest(userId);
  }

  const { itemsKey } = getWardrobeStorageKeys(userId);
  const stored = await AsyncStorage.getItem(itemsKey);
  if (!stored) {
    return [];
  }

  return sanitizeClothingItems(JSON.parse(stored) as ClothingItem[]);
}

export async function saveUserItemsForUser(
  userId: string,
  items: ClothingItem[],
): Promise<void> {
  const { itemsKey } = getWardrobeStorageKeys(userId);
  await AsyncStorage.setItem(itemsKey, JSON.stringify(items));
}

export async function loadUserOutfitsForUser(userId: string): Promise<Outfit[]> {
  if (isGuestStorageUserId(userId)) {
    await migrateGlobalKeysToGuest(userId);
  }

  const { outfitsKey } = getWardrobeStorageKeys(userId);
  const stored = await AsyncStorage.getItem(outfitsKey);
  if (!stored) {
    return [];
  }

  return JSON.parse(stored) as Outfit[];
}

export async function saveUserOutfitsForUser(
  userId: string,
  outfits: Outfit[],
): Promise<void> {
  const { outfitsKey } = getWardrobeStorageKeys(userId);
  await AsyncStorage.setItem(outfitsKey, JSON.stringify(outfits));
}

export async function loadFavoritesForUser(userId: string): Promise<FavoritesState> {
  if (isGuestStorageUserId(userId)) {
    await migrateGlobalKeysToGuest(userId);
  }

  const { favoritesKey } = getWardrobeStorageKeys(userId);
  const stored = await AsyncStorage.getItem(favoritesKey);
  if (!stored) {
    return EMPTY_FAVORITES;
  }

  return JSON.parse(stored) as FavoritesState;
}

export async function saveFavoritesForUser(
  userId: string,
  favorites: FavoritesState,
): Promise<void> {
  const { favoritesKey } = getWardrobeStorageKeys(userId);
  await AsyncStorage.setItem(favoritesKey, JSON.stringify(favorites));
}

export async function clearLocalWardrobeDataForUser(userId: string): Promise<void> {
  const { itemsKey, outfitsKey, favoritesKey } = getWardrobeStorageKeys(userId);
  await AsyncStorage.multiRemove([itemsKey, outfitsKey, favoritesKey]);
}
