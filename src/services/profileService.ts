import { User } from '@supabase/supabase-js';
import { ProfileRow } from '../types/profile';
import {
  buildUsernameWithSuffix,
  normalizeUsername,
  suggestUsernameFromEmail,
  validateUsername,
} from '../utils/username';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export const USERNAME_TAKEN_ERROR = 'This username is already taken.';

function mapProfileRow(row: ProfileRow): ProfileRow {
  return {
    ...row,
    username: row.username.toLowerCase(),
  };
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return false;
    }

    const normalized = normalizeUsername(username);
    const { data, error } = await supabase.rpc('is_username_available', {
      check_username: normalized,
    });

    if (error) {
      console.warn('Profile username check failed:', error.message);
      return false;
    }

    return data === false;
  } catch (error) {
    console.warn('Profile username check failed:', error);
    return false;
  }
}

export async function fetchProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  try {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Profile fetch failed:', error.message);
      return null;
    }

    return data ? mapProfileRow(data as ProfileRow) : null;
  } catch (error) {
    console.warn('Profile fetch failed:', error);
    return null;
  }
}

type CreateProfileInput = {
  userId: string;
  email: string;
  username: string;
  displayName?: string;
};

export async function createProfile(
  input: CreateProfileInput,
): Promise<{ success: boolean; profile?: ProfileRow; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Could not connect to Supabase.' };
  }

  const username = normalizeUsername(input.username);
  const validationError = validateUsername(username);
  if (validationError) {
    return { success: false, error: validationError };
  }

  if (await isUsernameTaken(username)) {
    return { success: false, error: USERNAME_TAKEN_ERROR };
  }

  const displayName = input.displayName?.trim() || username;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: input.userId,
      email: input.email,
      username,
      display_name: displayName,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: USERNAME_TAKEN_ERROR };
    }

    console.warn('Profile create failed:', error.message);
    return { success: false, error: 'Could not create your profile. Please try again.' };
  }

  return { success: true, profile: mapProfileRow(data as ProfileRow) };
}

export async function generateAvailableUsername(base: string): Promise<string> {
  const normalized = normalizeUsername(base).slice(0, 20);
  const starter = normalized.length >= 3 ? normalized : 'user';

  if (!(await isUsernameTaken(starter))) {
    return starter;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = `_${Math.floor(Math.random() * 90 + 10)}`;
    const candidate = buildUsernameWithSuffix(starter, suffix);
    if (!(await isUsernameTaken(candidate))) {
      return candidate;
    }
  }

  return buildUsernameWithSuffix(starter, `_${Date.now().toString(36).slice(-4)}`);
}

export async function ensureProfileForUser(
  user: User,
  preferredUsername?: string,
): Promise<{ success: boolean; profile?: ProfileRow; error?: string }> {
  try {
    const existing = await fetchProfileByUserId(user.id);
    if (existing) {
      return { success: true, profile: existing };
    }

    const email = user.email ?? '';
    const baseUsername = preferredUsername?.trim()
      ? normalizeUsername(preferredUsername)
      : suggestUsernameFromEmail(email || 'user');

    const username = await generateAvailableUsername(baseUsername);

    return createProfile({
      userId: user.id,
      email,
      username,
      displayName: username,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not ensure profile.';
    console.warn('Profile ensure failed:', message);
    return { success: false, error: message };
  }
}
