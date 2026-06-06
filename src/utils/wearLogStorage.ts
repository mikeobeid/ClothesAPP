import AsyncStorage from '@react-native-async-storage/async-storage';
import { WearLog } from '../types';

export function getWearLogsStorageKey(userId: string): string {
  return `@wardrobe_wear_logs_${userId}`;
}

export async function loadWearLogsForUser(userId: string): Promise<WearLog[]> {
  const raw = await AsyncStorage.getItem(getWearLogsStorageKey(userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as WearLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveWearLogsForUser(
  userId: string,
  logs: WearLog[],
): Promise<void> {
  await AsyncStorage.setItem(getWearLogsStorageKey(userId), JSON.stringify(logs));
}
