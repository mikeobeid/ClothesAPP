import { ClothingItem, Outfit } from '../types';
import { ClothesRow, OutfitItemRow, OutfitRow } from '../types/supabase';
import { normalizeRestoredImageUri } from '../utils/clothingImage';
import {
  deleteClothingImageFromSupabase,
  isCloudImageUri,
  planClothingImageStorageDelete,
  uploadClothingImageToSupabase,
} from './clothingStorage';
import { getAppUserIdMode, getCurrentAppUserId } from '../utils/userIdentity';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export type SyncResult = {
  success: boolean;
  error?: string;
};

function logSyncError(action: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`Supabase sync error (${action}):`, message);
}

function skipResult(reason: string): SyncResult {
  return { success: false, error: reason };
}

async function logSyncUploadMode(): Promise<void> {
  const mode = await getAppUserIdMode();
  if (mode === 'guest') {
    console.log('[Sync] uploading as guest user');
  } else {
    console.log('[Sync] uploading as auth user');
  }
}

function getSupabaseOrSkip(): {
  supabase: ReturnType<typeof getSupabaseClient>;
  error?: SyncResult;
} {
  if (!isSupabaseConfigured()) {
    return { supabase: null, error: skipResult('Supabase not configured') };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { supabase: null, error: skipResult('Supabase client unavailable') };
  }

  return { supabase };
}

async function resolveCloudImageUri(
  item: ClothingItem,
  userId: string,
): Promise<{ imageUri: string | null; storageError?: string }> {
  if (!item.imageUri) {
    return { imageUri: null };
  }

  if (isCloudImageUri(item.imageUri)) {
    console.log('[AddItem] storage upload completed');
    return { imageUri: item.imageUri };
  }

  console.log('[AddItem] storage upload started');

  const uploadResult = await uploadClothingImageToSupabase(
    item.imageUri,
    userId,
    item.id,
  );

  if (uploadResult.success && uploadResult.publicUrl) {
    console.log('[AddItem] storage upload completed');
    return { imageUri: uploadResult.publicUrl };
  }

  console.warn(
    '[AddItem] storage upload failed:',
    uploadResult.error ?? 'Unknown storage error',
  );
  return {
    imageUri: null,
    storageError: uploadResult.error ?? 'Unknown storage error',
  };
}

async function toClothesRow(
  item: ClothingItem,
  userId: string,
): Promise<{ row: ClothesRow; storageError?: string }> {
  const { imageUri, storageError } = await resolveCloudImageUri(item, userId);

  return {
    row: {
      id: item.id,
      user_id: userId,
      name: item.name,
      category: item.category,
      color: item.color,
      season: item.season,
      occasion: item.occasion,
      image_uri: imageUri,
      notes: item.notes ?? null,
      created_at: item.createdAt,
    },
    storageError,
  };
}

function fromClothesRow(row: ClothesRow): ClothingItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    color: row.color,
    season: row.season ?? [],
    occasion: row.occasion ?? [],
    imageUri: normalizeRestoredImageUri(row.image_uri),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function toOutfitRow(outfit: Outfit, userId: string): OutfitRow {
  return {
    id: outfit.id,
    user_id: userId,
    name: outfit.name,
    occasion: outfit.occasion,
    season: outfit.season,
    created_at: outfit.createdAt,
  };
}

function fromOutfitRows(
  outfitRow: OutfitRow,
  itemRows: OutfitItemRow[],
): Outfit {
  return {
    id: outfitRow.id,
    name: outfitRow.name,
    occasion: outfitRow.occasion,
    season: outfitRow.season,
    clothingItemIds: itemRows
      .filter((row) => row.outfit_id === outfitRow.id)
      .map((row) => row.clothing_id),
    createdAt: outfitRow.created_at,
  };
}

export async function uploadClothingItemToSupabase(
  item: ClothingItem,
): Promise<SyncResult> {
  console.log('[AddItem] database upload started');

  const { supabase, error: setupError } = getSupabaseOrSkip();
  if (!supabase) {
    console.warn('[AddItem] database upload failed:', setupError?.error);
    return setupError ?? skipResult('Supabase unavailable');
  }

  try {
    await logSyncUploadMode();
    const userId = await getCurrentAppUserId();
    const { row, storageError } = await toClothesRow(item, userId);
    const { error } = await supabase.from('clothes').upsert(row);

    if (error) {
      logSyncError('upload clothing item', error.message);
      console.warn('[AddItem] database upload failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[AddItem] database upload completed');
    if (storageError) {
      return {
        success: true,
        error: `Saved without image: ${storageError}`,
      };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logSyncError('upload clothing item', error);
    console.warn('[AddItem] database upload failed:', message);
    return {
      success: false,
      error: message,
    };
  }
}

export async function fetchClothingItemsFromSupabase(): Promise<{
  success: boolean;
  items: ClothingItem[];
  error?: string;
}> {
  const { supabase, error: setupError } = getSupabaseOrSkip();
  if (!supabase) {
    return {
      success: false,
      items: [],
      error: setupError?.error ?? 'Supabase unavailable',
    };
  }

  try {
    const userId = await getCurrentAppUserId();
    const { data, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logSyncError('fetch clothing items', error.message);
      return { success: false, items: [], error: error.message };
    }

    const items = (data as ClothesRow[]).map(fromClothesRow);
    return { success: true, items };
  } catch (error) {
    logSyncError('fetch clothing items', error);
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateClothingItemInSupabase(
  item: ClothingItem,
): Promise<SyncResult> {
  const { supabase, error: setupError } = getSupabaseOrSkip();
  if (!supabase) {
    return setupError ?? skipResult('Supabase unavailable');
  }

  try {
    await logSyncUploadMode();
    const userId = await getCurrentAppUserId();
    const { row } = await toClothesRow(item, userId);
    const { error } = await supabase.from('clothes').upsert(row);

    if (error) {
      logSyncError('update clothing item', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logSyncError('update clothing item', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteClothingItemFromSupabase(
  itemId: string,
  imageUri?: string | null,
): Promise<SyncResult> {
  const { supabase, error: setupError } = getSupabaseOrSkip();
  if (!supabase) {
    const message = setupError?.error ?? 'Supabase unavailable';
    console.warn('[DeleteItem] Supabase database delete failed:', message);
    return setupError ?? skipResult('Supabase unavailable');
  }

  try {
    const userId = await getCurrentAppUserId();
    console.log('[DeleteItem] Supabase database delete started');

    const { error } = await supabase
      .from('clothes')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      logSyncError('delete clothing item', error.message);
      console.warn('[DeleteItem] Supabase database delete failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[DeleteItem] Supabase database delete completed');

    const storagePlan = planClothingImageStorageDelete(imageUri, userId, itemId);

    if (storagePlan.action === 'skip') {
      console.log(
        '[DeleteItem] Supabase storage delete skipped:',
        storagePlan.skipReason ?? 'local image or no cloud image',
      );
      return { success: true };
    }

    console.log('[DeleteItem] Supabase storage delete started');

    const storageResult = await deleteClothingImageFromSupabase(
      userId,
      itemId,
      imageUri,
    );

    if (storageResult.skipped) {
      console.log(
        '[DeleteItem] Supabase storage delete skipped:',
        storageResult.skipReason ?? 'local image or no cloud image',
      );
    } else if (storageResult.success) {
      console.log('[DeleteItem] Supabase storage delete completed');
    } else {
      console.warn(
        '[DeleteItem] Supabase storage delete failed:',
        storageResult.error ?? 'Unknown storage error',
      );
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logSyncError('delete clothing item', error);
    console.warn('[DeleteItem] Supabase database delete failed:', message);
    return {
      success: false,
      error: message,
    };
  }
}

export async function uploadOutfitToSupabase(
  outfit: Outfit,
): Promise<SyncResult> {
  const { supabase, error: setupError } = getSupabaseOrSkip();
  if (!supabase) {
    return setupError ?? skipResult('Supabase unavailable');
  }

  try {
    await logSyncUploadMode();
    const userId = await getCurrentAppUserId();
    const { error: outfitError } = await supabase
      .from('outfits')
      .upsert(toOutfitRow(outfit, userId));

    if (outfitError) {
      logSyncError('upload outfit', outfitError.message);
      return { success: false, error: outfitError.message };
    }

    const { error: deleteItemsError } = await supabase
      .from('outfit_items')
      .delete()
      .eq('outfit_id', outfit.id)
      .eq('user_id', userId);

    if (deleteItemsError) {
      logSyncError('upload outfit items reset', deleteItemsError.message);
      return { success: false, error: deleteItemsError.message };
    }

    if (outfit.clothingItemIds.length > 0) {
      const junctionRows = outfit.clothingItemIds.map((clothingId) => ({
        outfit_id: outfit.id,
        clothing_id: clothingId,
        user_id: userId,
      }));

      const { error: insertItemsError } = await supabase
        .from('outfit_items')
        .insert(junctionRows);

      if (insertItemsError) {
        logSyncError('upload outfit items', insertItemsError.message);
        return { success: false, error: insertItemsError.message };
      }
    }

    return { success: true };
  } catch (error) {
    logSyncError('upload outfit', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function fetchOutfitsFromSupabase(): Promise<{
  success: boolean;
  outfits: Outfit[];
  error?: string;
}> {
  const { supabase, error: setupError } = getSupabaseOrSkip();
  if (!supabase) {
    return {
      success: false,
      outfits: [],
      error: setupError?.error ?? 'Supabase unavailable',
    };
  }

  try {
    const userId = await getCurrentAppUserId();
    const { data: outfitRows, error: outfitError } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (outfitError) {
      logSyncError('fetch outfits', outfitError.message);
      return { success: false, outfits: [], error: outfitError.message };
    }

    const { data: itemRows, error: itemError } = await supabase
      .from('outfit_items')
      .select('*')
      .eq('user_id', userId);

    if (itemError) {
      logSyncError('fetch outfit items', itemError.message);
      return { success: false, outfits: [], error: itemError.message };
    }

    const outfits = (outfitRows as OutfitRow[]).map((row) =>
      fromOutfitRows(row, (itemRows as OutfitItemRow[]) ?? []),
    );

    return { success: true, outfits };
  } catch (error) {
    logSyncError('fetch outfits', error);
    return {
      success: false,
      outfits: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteOutfitFromSupabase(
  outfitId: string,
): Promise<SyncResult> {
  const { supabase, error: setupError } = getSupabaseOrSkip();
  if (!supabase) {
    return setupError ?? skipResult('Supabase unavailable');
  }

  try {
    const userId = await getCurrentAppUserId();
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', outfitId)
      .eq('user_id', userId);

    if (error) {
      logSyncError('delete outfit', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logSyncError('delete outfit', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
