import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentSession } from '../services/authService';

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

export async function getAppUserIdMode(): Promise<'auth' | 'guest'> {
  if (await isGuestMode()) {
    return 'guest';
  }

  const session = await getCurrentSession();
  return session?.user?.id ? 'auth' : 'guest';
}

export async function isAuthenticatedAppUser(): Promise<boolean> {
  if (await isGuestMode()) {
    return false;
  }

  const session = await getCurrentSession();
  return Boolean(session?.user?.id);
}

export async function getCurrentAppUserId(): Promise<string> {
  const guestMode = await isGuestMode();

  if (!guestMode) {
    const session = await getCurrentSession();
    if (session?.user?.id) {
      return session.user.id;
    }
  }

  return getGuestUserId();
}
