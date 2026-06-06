import { ClothingItem, Outfit } from '../types';
import { ClothesRow, OutfitItemRow, OutfitRow } from '../types/supabase';
import { normalizeRestoredImageUri } from '../utils/clothingImage';
import {
  isCloudImageUri,
  uploadClothingImageToSupabase,
} from './clothingStorage';
import {
  getCurrentAppUserId,
  isAuthenticatedAppUser,
} from '../utils/userIdentity';
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

async function resolveCloudImageUri(
  item: ClothingItem,
  userId: string,
): Promise<string | null> {
  if (!item.imageUri) {
    return null;
  }

  if (isCloudImageUri(item.imageUri)) {
    return item.imageUri;
  }

  const uploadResult = await uploadClothingImageToSupabase(
    item.imageUri,
    userId,
    item.id,
  );

  if (uploadResult.success && uploadResult.publicUrl) {
    return uploadResult.publicUrl;
  }

  return null;
}

async function toClothesRow(item: ClothingItem, userId: string): Promise<ClothesRow> {
  const imageUri = await resolveCloudImageUri(item, userId);

  return {
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
  if (!isSupabaseConfigured()) {
    return skipResult('Supabase not configured');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return skipResult('Supabase client unavailable');
  }

  if (!(await isAuthenticatedAppUser())) {
    return skipResult('Guest mode or unauthenticated');
  }

  try {
    const userId = await getCurrentAppUserId();
    const row = await toClothesRow(item, userId);
    const { error } = await supabase.from('clothes').upsert(row);

    if (error) {
      logSyncError('upload clothing item', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logSyncError('upload clothing item', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function fetchClothingItemsFromSupabase(): Promise<{
  success: boolean;
  items: ClothingItem[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, items: [], error: 'Supabase not configured' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, items: [], error: 'Supabase client unavailable' };
  }

  if (!(await isAuthenticatedAppUser())) {
    return { success: false, items: [], error: 'Guest mode or unauthenticated' };
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
  if (!isSupabaseConfigured()) {
    return skipResult('Supabase not configured');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return skipResult('Supabase client unavailable');
  }

  if (!(await isAuthenticatedAppUser())) {
    return skipResult('Guest mode or unauthenticated');
  }

  try {
    const userId = await getCurrentAppUserId();
    const row = await toClothesRow(item, userId);
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
): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return skipResult('Supabase not configured');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return skipResult('Supabase client unavailable');
  }

  if (!(await isAuthenticatedAppUser())) {
    return skipResult('Guest mode or unauthenticated');
  }

  try {
    const userId = await getCurrentAppUserId();
    const { error } = await supabase
      .from('clothes')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      logSyncError('delete clothing item', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logSyncError('delete clothing item', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function uploadOutfitToSupabase(
  outfit: Outfit,
): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return skipResult('Supabase not configured');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return skipResult('Supabase client unavailable');
  }

  if (!(await isAuthenticatedAppUser())) {
    return skipResult('Guest mode or unauthenticated');
  }

  try {
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
  if (!isSupabaseConfigured()) {
    return { success: false, outfits: [], error: 'Supabase not configured' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, outfits: [], error: 'Supabase client unavailable' };
  }

  if (!(await isAuthenticatedAppUser())) {
    return { success: false, outfits: [], error: 'Guest mode or unauthenticated' };
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
  if (!isSupabaseConfigured()) {
    return skipResult('Supabase not configured');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return skipResult('Supabase client unavailable');
  }

  if (!(await isAuthenticatedAppUser())) {
    return skipResult('Guest mode or unauthenticated');
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
