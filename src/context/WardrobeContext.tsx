import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
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
import {
  getAppUserIdMode,
  getCurrentAppUserId,
  isGuestMode,
} from '../utils/userIdentity';
import { isSupabaseConfigured } from '../services/supabase';
import {
  MOCK_CLOTHING_ITEMS,
  MOCK_OUTFITS,
  getClothingItemsForOutfit,
} from '../utils/mockData';
import {
  EMPTY_FAVORITES,
  FavoritesState,
  clearLocalWardrobeDataForUser,
  isGuestStorageUserId,
  loadFavoritesForUser,
  loadUserItemsForUser,
  loadUserOutfitsForUser,
  saveFavoritesForUser,
  saveUserItemsForUser,
  saveUserOutfitsForUser,
} from '../utils/wardrobeStorage';

type AddClothingInput = Omit<ClothingItem, 'id' | 'createdAt'>;
type AddOutfitInput = Omit<Outfit, 'id' | 'createdAt'>;
type UpdateClothingInput = Partial<
  Omit<ClothingItem, 'id' | 'createdAt' | 'imageUri'>
>;

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
  refreshCloudRestore: (options?: { force?: boolean }) => Promise<void>;
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

async function loadWardrobeForCurrentUser(): Promise<{
  userId: string;
  items: ClothingItem[];
  outfits: Outfit[];
  favorites: FavoritesState;
  includeMocks: boolean;
}> {
  const userId = await getCurrentAppUserId();
  const [items, outfits, favorites] = await Promise.all([
    loadUserItemsForUser(userId),
    loadUserOutfitsForUser(userId),
    loadFavoritesForUser(userId),
  ]);

  return {
    userId,
    items,
    outfits,
    favorites,
    includeMocks: isGuestStorageUserId(userId),
  };
}

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

function persistUserItems(items: ClothingItem[]): void {
  getCurrentAppUserId()
    .then((userId) => saveUserItemsForUser(userId, items))
    .catch(() => {});
}

function persistUserOutfits(outfits: Outfit[]): void {
  getCurrentAppUserId()
    .then((userId) => saveUserOutfitsForUser(userId, outfits))
    .catch(() => {});
}

function persistFavorites(favorites: FavoritesState): void {
  getCurrentAppUserId()
    .then((userId) => saveFavoritesForUser(userId, favorites))
    .catch(() => {});
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
  userId: string,
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
    await Promise.all([
      saveUserItemsForUser(userId, items),
      saveUserOutfitsForUser(userId, outfits),
    ]);
  }

  return { items, outfits, changed };
}

async function getRestoreKey(): Promise<string> {
  const [userId, guestMode] = await Promise.all([
    getCurrentAppUserId(),
    isGuestMode(),
  ]);

  return `${userId}:${guestMode ? 'guest' : 'auth'}`;
}

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [userItems, setUserItems] = useState<ClothingItem[]>([]);
  const [userOutfits, setUserOutfits] = useState<Outfit[]>([]);
  const [favorites, setFavorites] = useState<FavoritesState>(EMPTY_FAVORITES);
  const [includeMocks, setIncludeMocks] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitializedRef = useRef(false);
  const lastRestoreKeyRef = useRef<string | null>(null);
  const restoreInFlightRef = useRef(false);

  const applyLoadedWardrobe = useCallback(
    (loaded: Awaited<ReturnType<typeof loadWardrobeForCurrentUser>>) => {
      setIncludeMocks(loaded.includeMocks);
      setUserItems(loaded.items);
      setUserOutfits(loaded.outfits);
      setFavorites(loaded.favorites);
    },
    [],
  );

  const refreshCloudRestore = useCallback(
    async (options?: { force?: boolean }) => {
      const restoreKey = await getRestoreKey();

      if (
        !options?.force &&
        restoreInFlightRef.current &&
        lastRestoreKeyRef.current === restoreKey
      ) {
        return;
      }

      if (!options?.force && lastRestoreKeyRef.current === restoreKey) {
        return;
      }

      restoreInFlightRef.current = true;
      const isFirstInit = !hasInitializedRef.current;

      if (isFirstInit) {
        setIsLoading(true);
      }

      try {
        const loaded = await loadWardrobeForCurrentUser();
        applyLoadedWardrobe(loaded);

        if (isSupabaseConfigured()) {
          const { items, outfits, changed } = await restoreFromCloud(
            loaded.userId,
            loaded.items,
            loaded.outfits,
          );

          if (changed) {
            setUserItems(items);
            setUserOutfits(outfits);
          }
        }

        lastRestoreKeyRef.current = restoreKey;
        hasInitializedRef.current = true;
      } catch (error) {
        console.warn('Wardrobe restore failed:', error);
      } finally {
        restoreInFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [applyLoadedWardrobe],
  );

  const clothingItems = useMemo(() => {
    if (includeMocks) {
      return mergeClothingItems(userItems);
    }
    return userItems;
  }, [userItems, includeMocks]);

  const outfits = useMemo(() => {
    if (includeMocks) {
      return mergeOutfits(userOutfits);
    }
    return userOutfits;
  }, [userOutfits, includeMocks]);

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
    console.log('[AddItem] save started');

    const newItem: ClothingItem = {
      ...input,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    let updatedItems: ClothingItem[] = [];
    setUserItems((prev) => {
      updatedItems = [newItem, ...prev];
      return updatedItems;
    });

    const userIdMode = await getAppUserIdMode();
    console.log(`[AddItem] current user id resolved: ${userIdMode}`);

    try {
      const userId = await getCurrentAppUserId();
      await saveUserItemsForUser(userId, updatedItems);
      console.log('[AddItem] local save completed');
    } catch (error) {
      console.warn('[AddItem] local save failed:', error);
      persistUserItems(updatedItems);
    }

    try {
      const syncResult = await uploadClothingItemToSupabase(newItem);
      if (!syncResult.success) {
        console.warn(
          '[AddItem] database upload failed:',
          syncResult.error ?? 'Unknown sync error',
        );
      } else if (syncResult.error) {
        console.warn('[AddItem] database upload warning:', syncResult.error);
      }
    } catch (error) {
      console.warn('[AddItem] database upload failed:', error);
    }

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
        persistUserItems(updated);
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
      console.log('[DeleteItem] delete started');
      console.log('[DeleteItem] item id:', id);

      if (!isUserClothingItem(id)) {
        return false;
      }

      const itemToDelete = userItems.find((item) => item.id === id);
      let updatedItems: ClothingItem[] = [];

      setUserItems((prev) => {
        updatedItems = prev.filter((item) => item.id !== id);
        return updatedItems;
      });

      try {
        const userId = await getCurrentAppUserId();
        await saveUserItemsForUser(userId, updatedItems);
      } catch (error) {
        console.warn('[DeleteItem] local delete persist failed:', error);
        persistUserItems(updatedItems);
      }

      console.log('[DeleteItem] local delete completed');

      setUserOutfits((prev) => {
        const updated = pruneOutfitsAfterItemRemoval(prev, id);
        persistUserOutfits(updated);

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

      console.log('[DeleteItem] removed item from outfits completed');

      setFavorites((prev) => {
        const updated = {
          ...prev,
          clothingIds: prev.clothingIds.filter((favId) => favId !== id),
        };
        persistFavorites(updated);
        return updated;
      });

      try {
        await deleteClothingItemFromSupabase(id, itemToDelete?.imageUri);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('[DeleteItem] Supabase database delete failed:', message);
      }

      return true;
    },
    [isUserClothingItem, userItems],
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
      persistFavorites(updated);
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
      persistUserOutfits(updated);
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
        persistUserOutfits(updated);
        return updated;
      });

      syncSafely(() => deleteOutfitFromSupabase(id));

      setFavorites((prev) => {
        const updated = {
          ...prev,
          outfitIds: prev.outfitIds.filter((favId) => favId !== id),
        };
        persistFavorites(updated);
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
      persistFavorites(updated);
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
      const userId = await getCurrentAppUserId();
      await clearLocalWardrobeDataForUser(userId);
      setUserItems([]);
      setUserOutfits([]);
      setFavorites(EMPTY_FAVORITES);

      const [clothingResult, outfitResult] = await Promise.all([
        fetchClothingItemsFromSupabase(),
        fetchOutfitsFromSupabase(),
      ]);

      if (!clothingResult.success && !outfitResult.success) {
        const error =
          clothingResult.error ?? outfitResult.error ?? 'Restore failed';
        console.warn('Developer restore failed:', error);
        return { success: false, error };
      }

      const items = clothingResult.success ? clothingResult.items : [];
      const outfits = outfitResult.success ? outfitResult.outfits : [];

      if (!clothingResult.success) {
        console.warn('Developer restore failed (clothing):', clothingResult.error);
      }

      if (!outfitResult.success) {
        console.warn('Developer restore failed (outfits):', outfitResult.error);
      }

      await Promise.all([
        saveUserItemsForUser(userId, items),
        saveUserOutfitsForUser(userId, outfits),
      ]);

      setUserItems(items);
      setUserOutfits(outfits);

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Developer restore failed:', message);
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
      refreshCloudRestore,
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
      refreshCloudRestore,
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
