import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_USER_ID_KEY = '@wardrobe_guest_user_id';

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
