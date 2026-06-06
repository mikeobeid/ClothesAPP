import AsyncStorage from '@react-native-async-storage/async-storage';
import { WearContext } from '../types/wearContext';

export function getWearContextsStorageKey(userId: string): string {
  return `@wardrobe_wear_contexts_${userId}`;
}

export async function loadWearContextsForUser(
  userId: string,
): Promise<WearContext[]> {
  const key = getWearContextsStorageKey(userId);

  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as WearContext[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[WearContext] load failed: ${message}`);
    return [];
  }
}

export async function saveWearContextsForUser(
  userId: string,
  contexts: WearContext[],
): Promise<void> {
  const key = getWearContextsStorageKey(userId);

  try {
    await AsyncStorage.setItem(key, JSON.stringify(contexts));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[WearContext] save failed: ${message}`);
    throw error;
  }
}
