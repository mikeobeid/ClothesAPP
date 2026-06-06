import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export const CLOTHING_IMAGES_BUCKET = 'clothing-images';

export type ImageUploadResult = {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
};

export type ImageDeleteResult = {
  success: boolean;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
};

export type StorageDeletePlan = {
  action: 'delete' | 'skip';
  storagePath?: string;
  skipReason?: string;
};

export function isCloudImageUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

export function isLocalImageUri(uri: string): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  );
}

export function isSupabaseStorageImageUri(uri: string): boolean {
  if (!isCloudImageUri(uri)) {
    return false;
  }

  return (
    uri.includes(CLOTHING_IMAGES_BUCKET) ||
    (uri.includes('supabase.co/storage/') && uri.includes('/object/'))
  );
}

export function getClothingImageStoragePath(
  userId: string,
  clothingItemId: string,
): string {
  return `${userId}/${clothingItemId}.jpg`;
}

export function extractStoragePathFromImageUri(
  imageUri: string,
  bucketName: string = CLOTHING_IMAGES_BUCKET,
): string | null {
  if (!isCloudImageUri(imageUri)) {
    return null;
  }

  try {
    const url = new URL(imageUri);
    const markers = [
      `/object/public/${bucketName}/`,
      `/object/authenticated/${bucketName}/`,
      `/object/sign/${bucketName}/`,
    ];

    for (const marker of markers) {
      const index = url.pathname.indexOf(marker);
      if (index >= 0) {
        const path = url.pathname.slice(index + marker.length);
        return decodeURIComponent(path.split('?')[0] ?? path);
      }
    }

    const bucketSegment = `/${bucketName}/`;
    const bucketIndex = url.pathname.indexOf(bucketSegment);
    if (bucketIndex >= 0) {
      const path = url.pathname.slice(bucketIndex + bucketSegment.length);
      return decodeURIComponent(path.split('?')[0] ?? path);
    }
  } catch {
    return null;
  }

  return null;
}

export function planClothingImageStorageDelete(
  imageUri: string | null | undefined,
  userId: string,
  clothingItemId: string,
): StorageDeletePlan {
  if (imageUri && isSupabaseStorageImageUri(imageUri)) {
    const extracted = extractStoragePathFromImageUri(imageUri);
    return {
      action: 'delete',
      storagePath:
        extracted ?? getClothingImageStoragePath(userId, clothingItemId),
    };
  }

  if (imageUri && isCloudImageUri(imageUri)) {
    const extracted = extractStoragePathFromImageUri(imageUri);
    if (extracted) {
      return { action: 'delete', storagePath: extracted };
    }

    return {
      action: 'delete',
      storagePath: getClothingImageStoragePath(userId, clothingItemId),
    };
  }

  if (!imageUri) {
    return { action: 'skip', skipReason: 'no cloud image' };
  }

  if (isLocalImageUri(imageUri)) {
    return {
      action: 'delete',
      storagePath: getClothingImageStoragePath(userId, clothingItemId),
    };
  }

  return { action: 'skip', skipReason: 'local image or no cloud image' };
}

function getPublicUrl(storagePath: string): string | null {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = supabase.storage
    .from(CLOTHING_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function uploadClothingImageToSupabase(
  localImageUri: string,
  userId: string,
  clothingItemId: string,
): Promise<ImageUploadResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client unavailable' };
  }

  const storagePath = getClothingImageStoragePath(userId, clothingItemId);

  try {
    const response = await fetch(localImageUri);
    if (!response.ok) {
      throw new Error(`Failed to read local image (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') ?? 'image/jpeg';

    const { error } = await supabase.storage
      .from(CLOTHING_IMAGES_BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase Storage upload failed:', error.message);
      return { success: false, error: error.message };
    }

    const publicUrl = getPublicUrl(storagePath);
    if (!publicUrl) {
      console.warn('Supabase Storage upload failed: could not resolve public URL');
      return { success: false, error: 'Could not resolve public URL' };
    }

    return { success: true, publicUrl, storagePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Supabase Storage upload failed:', message);
    return { success: false, error: message };
  }
}

export async function deleteClothingImageAtStoragePath(
  storagePath: string,
): Promise<ImageDeleteResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client unavailable' };
  }

  try {
    const { error } = await supabase.storage
      .from(CLOTHING_IMAGES_BUCKET)
      .remove([storagePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export async function deleteClothingImageFromSupabase(
  userId: string,
  clothingItemId: string,
  imageUri?: string | null,
): Promise<ImageDeleteResult> {
  const plan = planClothingImageStorageDelete(imageUri, userId, clothingItemId);

  if (plan.action === 'skip') {
    return {
      success: true,
      skipped: true,
      skipReason: plan.skipReason ?? 'local image or no cloud image',
    };
  }

  return deleteClothingImageAtStoragePath(plan.storagePath!);
}
