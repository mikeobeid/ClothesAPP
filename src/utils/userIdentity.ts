import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '../services/supabase';

const GUEST_USER_ID_KEY = '@wardrobe_guest_user_id';
const GUEST_MODE_KEY = '@wardrobe_guest_mode';

function createGuestUserId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getGuestUserId(): Promise<string> {
  const existing = await AsyncStorage.getItem(GUEST_USER_ID_KEY);
  if (existing) {
    return existing;
  }

  const newId = createGuestUserId();
  await AsyncStorage.setItem(GUEST_USER_ID_KEY, newId);
  return newId;
}

export async function setGuestMode(enabled: boolean): Promise<void> {
  if (enabled) {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
    return;
  }

  await AsyncStorage.removeItem(GUEST_MODE_KEY);
}

export async function isGuestMode(): Promise<boolean> {
  const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
  return value === 'true';
}

export async function getCurrentAppUserId(): Promise<string> {
  const guestMode = await isGuestMode();

  if (!guestMode) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        return session.user.id;
      }
    }
  }

  return getGuestUserId();
}
