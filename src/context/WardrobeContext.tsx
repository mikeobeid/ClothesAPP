import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CLOTHING_CATEGORIES } from '../constants/clothing';
import {
  deleteClothingItemFromSupabase,
  deleteOutfitFromSupabase,
  fetchClothingItemsFromSupabase,
  fetchOutfitsFromSupabase,
  SyncResult,
  updateClothingItemInSupabase,
  uploadClothingItemToSupabase,
  uploadOutfitToSupabase,
} from '../services/wardrobeSync';
import { ClothingItem, Outfit } from '../types';
import { normalizeRestoredImageUri } from '../utils/clothingImage';
import {
  MOCK_CLOTHING_ITEMS,
  MOCK_OUTFITS,
  getClothingItemsForOutfit,
} from '../utils/mockData';

function sanitizeClothingItem(item: ClothingItem): ClothingItem {
  return {
    ...item,
    imageUri: normalizeRestoredImageUri(item.imageUri),
  };
}

function sanitizeClothingItems(items: ClothingItem[]): ClothingItem[] {
  return items.map(sanitizeClothingItem);
}

const USER_ITEMS_KEY = '@wardrobe_user_items';
const USER_OUTFITS_KEY = '@wardrobe_user_outfits';
const FAVORITES_KEY = '@wardrobe_favorites';
const LEGACY_ITEMS_KEY = '@wardrobe_clothing_items';

type AddClothingInput = Omit<ClothingItem, 'id' | 'createdAt'>;
type AddOutfitInput = Omit<Outfit, 'id' | 'createdAt'>;
type UpdateClothingInput = Partial<
  Omit<ClothingItem, 'id' | 'createdAt' | 'imageUri'>
>;

type FavoritesState = {
  clothingIds: string[];
  outfitIds: string[];
};

type WardrobeContextValue = {
  clothingItems: ClothingItem[];
  userItems: ClothingItem[];
  outfits: Outfit[];
  isLoading: boolean;
  addClothingItem: (item: AddClothingInput) => Promise<ClothingItem>;
  updateClothingItem: (
    id: string,
    updates: UpdateClothingInput,
  ) => Promise<boolean>;
  deleteClothingItem: (id: string) => Promise<boolean>;
  toggleClothingFavorite: (id: string) => Promise<void>;
  isClothingFavorite: (id: string) => boolean;
  isUserClothingItem: (id: string) => boolean;
  addOutfit: (outfit: AddOutfitInput) => Promise<Outfit>;
  deleteOutfit: (id: string) => Promise<boolean>;
  toggleOutfitFavorite: (id: string) => Promise<void>;
  isOutfitFavorite: (id: string) => boolean;
  isUserOutfit: (id: string) => boolean;
  getClothingItemById: (id: string) => ClothingItem | undefined;
  getOutfitById: (id: string) => Outfit | undefined;
  getClothingItemsForOutfit: (outfit: Outfit) => ClothingItem[];
  getRecentClothingItems: (limit?: number) => ClothingItem[];
  getRecentOutfits: (limit?: number) => Outfit[];
  getWardrobeStats: () => {
    totalItems: number;
    totalOutfits: number;
    savedOutfits: number;
    favoriteItems: number;
    favoriteOutfits: number;
    activeCategories: number;
    categoryCounts: Record<string, number>;
  };
  /** Temporary developer helper — remove before production. */
  clearLocalDataAndRestore: () => Promise<{ success: boolean; error?: string }>;
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

const EMPTY_FAVORITES: FavoritesState = { clothingIds: [], outfitIds: [] };

function mergeClothingItems(userItems: ClothingItem[]): ClothingItem[] {
  const mockIds = new Set(MOCK_CLOTHING_ITEMS.map((item) => item.id));
  const uniqueUserItems = userItems.filter((item) => !mockIds.has(item.id));
  return [...uniqueUserItems, ...MOCK_CLOTHING_ITEMS];
}

function mergeOutfits(userOutfits: Outfit[]): Outfit[] {
  const mockIds = new Set(MOCK_OUTFITS.map((outfit) => outfit.id));
  const uniqueUserOutfits = userOutfits.filter(
    (outfit) => !mockIds.has(outfit.id),
  );
  return [...uniqueUserOutfits, ...MOCK_OUTFITS];
}

function pruneOutfitsAfterItemRemoval(
  outfits: Outfit[],
  removedItemId: string,
): Outfit[] {
  return outfits
    .map((outfit) => ({
      ...outfit,
      clothingItemIds: outfit.clothingItemIds.filter((id) => id !== removedItemId),
    }))
    .filter((outfit) => outfit.clothingItemIds.length >= 2);
}

async function saveUserItems(items: ClothingItem[]): Promise<void> {
  await AsyncStorage.setItem(USER_ITEMS_KEY, JSON.stringify(items));
}

async function saveUserOutfits(outfits: Outfit[]): Promise<void> {
  await AsyncStorage.setItem(USER_OUTFITS_KEY, JSON.stringify(outfits));
}

async function saveFavorites(favorites: FavoritesState): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

async function loadUserItems(): Promise<ClothingItem[]> {
  const stored = await AsyncStorage.getItem(USER_ITEMS_KEY);
  if (stored) {
    return sanitizeClothingItems(JSON.parse(stored) as ClothingItem[]);
  }

  const legacy = await AsyncStorage.getItem(LEGACY_ITEMS_KEY);
  if (!legacy) {
    return [];
  }

  const mockIds = new Set(MOCK_CLOTHING_ITEMS.map((item) => item.id));
  const legacyItems = JSON.parse(legacy) as ClothingItem[];
  const migrated = sanitizeClothingItems(
    legacyItems.filter(
      (item) => !mockIds.has(item.id) || !!item.imageUri,
    ),
  );

  if (migrated.length > 0) {
    await saveUserItems(migrated);
    await AsyncStorage.removeItem(LEGACY_ITEMS_KEY);
  }

  return migrated;
}

async function loadUserOutfits(): Promise<Outfit[]> {
  const stored = await AsyncStorage.getItem(USER_OUTFITS_KEY);
  if (!stored) {
    return [];
  }
  return JSON.parse(stored) as Outfit[];
}

async function loadFavorites(): Promise<FavoritesState> {
  const stored = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!stored) {
    return EMPTY_FAVORITES;
  }
  return JSON.parse(stored) as FavoritesState;
}

async function clearLocalWardrobeData(): Promise<void> {
  await AsyncStorage.multiRemove([
    USER_ITEMS_KEY,
    USER_OUTFITS_KEY,
    FAVORITES_KEY,
    LEGACY_ITEMS_KEY,
  ]);
  console.log('[Dev] Local data cleared');
}

async function syncSafely(task: () => Promise<SyncResult>): Promise<void> {
  try {
    await task();
  } catch (error) {
    console.warn('Supabase sync error:', error);
  }
}

function mergeCloudClothing(
  localItems: ClothingItem[],
  cloudItems: ClothingItem[],
): ClothingItem[] {
  const localIds = new Set(localItems.map((item) => item.id));
  const newItems = cloudItems.filter((item) => !localIds.has(item.id));
  return newItems.length > 0 ? [...newItems, ...localItems] : localItems;
}

function mergeCloudOutfits(
  localOutfits: Outfit[],
  cloudOutfits: Outfit[],
): Outfit[] {
  const localIds = new Set(localOutfits.map((outfit) => outfit.id));
  const newOutfits = cloudOutfits.filter((outfit) => !localIds.has(outfit.id));
  return newOutfits.length > 0 ? [...newOutfits, ...localOutfits] : localOutfits;
}

async function restoreFromCloud(
  localItems: ClothingItem[],
  localOutfits: Outfit[],
): Promise<{
  items: ClothingItem[];
  outfits: Outfit[];
  changed: boolean;
}> {
  const [clothingResult, outfitResult] = await Promise.all([
    fetchClothingItemsFromSupabase(),
    fetchOutfitsFromSupabase(),
  ]);

  let items = localItems;
  let outfits = localOutfits;
  let changed = false;

  if (clothingResult.success) {
    const mergedItems = mergeCloudClothing(localItems, clothingResult.items);
    if (mergedItems.length !== localItems.length) {
      items = mergedItems;
      changed = true;
    }
  } else if (clothingResult.error) {
    console.warn('Supabase sync error (restore clothing):', clothingResult.error);
  }

  if (outfitResult.success) {
    const mergedOutfits = mergeCloudOutfits(localOutfits, outfitResult.outfits);
    if (mergedOutfits.length !== localOutfits.length) {
      outfits = mergedOutfits;
      changed = true;
    }
  } else if (outfitResult.error) {
    console.warn('Supabase sync error (restore outfits):', outfitResult.error);
  }

  if (changed) {
    await Promise.all([saveUserItems(items), saveUserOutfits(outfits)]);
    console.log('[Sync] merged cloud backup into local storage');
  }

  return { items, outfits, changed };
}

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [userItems, setUserItems] = useState<ClothingItem[]>([]);
  const [userOutfits, setUserOutfits] = useState<Outfit[]>([]);
  const [favorites, setFavorites] = useState<FavoritesState>(EMPTY_FAVORITES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      try {
        const [savedItems, savedOutfits, savedFavorites] = await Promise.all([
          loadUserItems(),
          loadUserOutfits(),
          loadFavorites(),
        ]);
        setUserItems(savedItems);
        setUserOutfits(savedOutfits);
        setFavorites(savedFavorites);
        setIsLoading(false);

        restoreFromCloud(savedItems, savedOutfits)
          .then(({ items, outfits, changed }) => {
            if (changed) {
              setUserItems(items);
              setUserOutfits(outfits);
            }
          })
          .catch((error) => {
            console.warn('Supabase sync error (restore from cloud):', error);
          });
      } catch {
        setUserItems([]);
        setUserOutfits([]);
        setFavorites(EMPTY_FAVORITES);
        setIsLoading(false);
      }
    }

    hydrate();
  }, []);

  const clothingItems = useMemo(
    () => mergeClothingItems(userItems),
    [userItems],
  );

  const outfits = useMemo(
    () => mergeOutfits(userOutfits),
    [userOutfits],
  );

  const isUserClothingItem = useCallback(
    (id: string) => userItems.some((item) => item.id === id),
    [userItems],
  );

  const isUserOutfit = useCallback(
    (id: string) => userOutfits.some((outfit) => outfit.id === id),
    [userOutfits],
  );

  const isClothingFavorite = useCallback(
    (id: string) => favorites.clothingIds.includes(id),
    [favorites.clothingIds],
  );

  const isOutfitFavorite = useCallback(
    (id: string) => favorites.outfitIds.includes(id),
    [favorites.outfitIds],
  );

  const addClothingItem = useCallback(async (input: AddClothingInput) => {
    const newItem: ClothingItem = {
      ...input,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setUserItems((prev) => {
      const updated = [newItem, ...prev];
      saveUserItems(updated).catch(() => {});
      return updated;
    });

    syncSafely(() => uploadClothingItemToSupabase(newItem));

    return newItem;
  }, []);

  const updateClothingItem = useCallback(
    async (id: string, updates: UpdateClothingInput) => {
      if (!isUserClothingItem(id)) {
        return false;
      }

      let updatedItem: ClothingItem | undefined;

      setUserItems((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, ...updates } : item,
        );
        updatedItem = updated.find((item) => item.id === id);
        saveUserItems(updated).catch(() => {});
        return updated;
      });

      if (updatedItem) {
        syncSafely(() => updateClothingItemInSupabase(updatedItem!));
      }

      return true;
    },
    [isUserClothingItem],
  );

  const deleteClothingItem = useCallback(
    async (id: string) => {
      if (!isUserClothingItem(id)) {
        return false;
      }

      setUserItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveUserItems(updated).catch(() => {});
        return updated;
      });

      setUserOutfits((prev) => {
        const updated = pruneOutfitsAfterItemRemoval(prev, id);
        saveUserOutfits(updated).catch(() => {});

        const removedOutfits = prev.filter(
          (outfit) => !updated.some((entry) => entry.id === outfit.id),
        );
        removedOutfits.forEach((outfit) => {
          syncSafely(() => deleteOutfitFromSupabase(outfit.id));
        });

        updated.forEach((outfit) => {
          const before = prev.find((entry) => entry.id === outfit.id);
          if (before?.clothingItemIds.includes(id)) {
            syncSafely(() => uploadOutfitToSupabase(outfit));
          }
        });

        return updated;
      });

      syncSafely(() => deleteClothingItemFromSupabase(id));

      setFavorites((prev) => {
        const updated = {
          ...prev,
          clothingIds: prev.clothingIds.filter((favId) => favId !== id),
        };
        saveFavorites(updated).catch(() => {});
        return updated;
      });

      return true;
    },
    [isUserClothingItem],
  );

  const toggleClothingFavorite = useCallback(async (id: string) => {
    setFavorites((prev) => {
      const isFavorite = prev.clothingIds.includes(id);
      const updated = {
        ...prev,
        clothingIds: isFavorite
          ? prev.clothingIds.filter((favId) => favId !== id)
          : [...prev.clothingIds, id],
      };
      saveFavorites(updated).catch(() => {});
      return updated;
    });
  }, []);

  const addOutfit = useCallback(async (input: AddOutfitInput) => {
    const newOutfit: Outfit = {
      ...input,
      id: `outfit-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setUserOutfits((prev) => {
      const updated = [newOutfit, ...prev];
      saveUserOutfits(updated).catch(() => {});
      return updated;
    });

    syncSafely(() => uploadOutfitToSupabase(newOutfit));

    return newOutfit;
  }, []);

  const deleteOutfit = useCallback(
    async (id: string) => {
      if (!isUserOutfit(id)) {
        return false;
      }

      setUserOutfits((prev) => {
        const updated = prev.filter((outfit) => outfit.id !== id);
        saveUserOutfits(updated).catch(() => {});
        return updated;
      });

      syncSafely(() => deleteOutfitFromSupabase(id));

      setFavorites((prev) => {
        const updated = {
          ...prev,
          outfitIds: prev.outfitIds.filter((favId) => favId !== id),
        };
        saveFavorites(updated).catch(() => {});
        return updated;
      });

      return true;
    },
    [isUserOutfit],
  );

  const toggleOutfitFavorite = useCallback(async (id: string) => {
    setFavorites((prev) => {
      const isFavorite = prev.outfitIds.includes(id);
      const updated = {
        ...prev,
        outfitIds: isFavorite
          ? prev.outfitIds.filter((favId) => favId !== id)
          : [...prev.outfitIds, id],
      };
      saveFavorites(updated).catch(() => {});
      return updated;
    });
  }, []);

  const getClothingItemById = useCallback(
    (id: string) => clothingItems.find((item) => item.id === id),
    [clothingItems],
  );

  const getOutfitById = useCallback(
    (id: string) => outfits.find((outfit) => outfit.id === id),
    [outfits],
  );

  const resolveOutfitItems = useCallback(
    (outfit: Outfit) => getClothingItemsForOutfit(outfit, clothingItems),
    [clothingItems],
  );

  const getRecentClothingItems = useCallback(
    (limit = 4) =>
      [...clothingItems]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, limit),
    [clothingItems],
  );

  const getRecentOutfits = useCallback(
    (limit = 3) =>
      [...outfits]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, limit),
    [outfits],
  );

  const getWardrobeStats = useCallback(() => {
    const categoryCounts = CLOTHING_CATEGORIES.reduce(
      (acc, category) => {
        acc[category] = clothingItems.filter(
          (item) => item.category === category,
        ).length;
        return acc;
      },
      {} as Record<string, number>,
    );

    const activeCategories = Object.values(categoryCounts).filter(
      (count) => count > 0,
    ).length;

    const favoriteItems = favorites.clothingIds.filter((id) =>
      clothingItems.some((item) => item.id === id),
    ).length;

    const favoriteOutfits = favorites.outfitIds.filter((id) =>
      outfits.some((outfit) => outfit.id === id),
    ).length;

    return {
      totalItems: clothingItems.length,
      totalOutfits: outfits.length,
      savedOutfits: userOutfits.length,
      favoriteItems,
      favoriteOutfits,
      activeCategories,
      categoryCounts,
    };
  }, [clothingItems, outfits, userOutfits, favorites]);

  const clearLocalDataAndRestore = useCallback(async () => {
    setIsLoading(true);

    try {
      await clearLocalWardrobeData();
      setUserItems([]);
      setUserOutfits([]);
      setFavorites(EMPTY_FAVORITES);

      console.log('[Dev] Restore from Supabase started');

      const [clothingResult, outfitResult] = await Promise.all([
        fetchClothingItemsFromSupabase(),
        fetchOutfitsFromSupabase(),
      ]);

      if (!clothingResult.success && !outfitResult.success) {
        const error =
          clothingResult.error ?? outfitResult.error ?? 'Restore failed';
        console.warn('[Dev] Restore failed:', error);
        return { success: false, error };
      }

      const items = clothingResult.success ? clothingResult.items : [];
      const outfits = outfitResult.success ? outfitResult.outfits : [];

      if (!clothingResult.success) {
        console.warn(
          '[Dev] Restore failed (clothing):',
          clothingResult.error,
        );
      }

      if (!outfitResult.success) {
        console.warn('[Dev] Restore failed (outfits):', outfitResult.error);
      }

      await Promise.all([saveUserItems(items), saveUserOutfits(outfits)]);

      setUserItems(items);
      setUserOutfits(outfits);

      console.log('[Dev] Restore from Supabase completed');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[Dev] Restore failed:', message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      clothingItems,
      userItems,
      outfits,
      isLoading,
      addClothingItem,
      updateClothingItem,
      deleteClothingItem,
      toggleClothingFavorite,
      isClothingFavorite,
      isUserClothingItem,
      addOutfit,
      deleteOutfit,
      toggleOutfitFavorite,
      isOutfitFavorite,
      isUserOutfit,
      getClothingItemById,
      getOutfitById,
      getClothingItemsForOutfit: resolveOutfitItems,
      getRecentClothingItems,
      getRecentOutfits,
      getWardrobeStats,
      clearLocalDataAndRestore,
    }),
    [
      clothingItems,
      userItems,
      outfits,
      isLoading,
      addClothingItem,
      updateClothingItem,
      deleteClothingItem,
      toggleClothingFavorite,
      isClothingFavorite,
      isUserClothingItem,
      addOutfit,
      deleteOutfit,
      toggleOutfitFavorite,
      isOutfitFavorite,
      isUserOutfit,
      getClothingItemById,
      getOutfitById,
      resolveOutfitItems,
      getRecentClothingItems,
      getRecentOutfits,
      getWardrobeStats,
      clearLocalDataAndRestore,
    ],
  );

  return (
    <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (!context) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
}
