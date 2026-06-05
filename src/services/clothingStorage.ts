import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export const CLOTHING_IMAGES_BUCKET = 'clothing-images';

export type ImageUploadResult = {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
};

export function isCloudImageUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

export function getClothingImageStoragePath(
  userId: string,
  clothingItemId: string,
): string {
  return `${userId}/${clothingItemId}.jpg`;
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

    console.log('Image uploaded to Supabase Storage:', storagePath);
    return { success: true, publicUrl, storagePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Supabase Storage upload failed:', message);
    return { success: false, error: message };
  }
}
