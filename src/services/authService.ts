import { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export type AuthResult = {
  success: boolean;
  user?: User;
  session?: Session | null;
  error?: string;
};

export function getFriendlyAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Email or password is incorrect. Please try again.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }

  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }

  if (normalized.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }

  if (normalized.includes('unable to validate email address')) {
    return 'Please enter a valid email address.';
  }

  if (normalized.includes('signup requires a valid password')) {
    return 'Please enter a valid password.';
  }

  if (normalized.includes('network')) {
    return 'Network error. Check your connection and try again.';
  }

  return 'Something went wrong. Please try again.';
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured on this device.' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Could not connect to Supabase.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { success: false, error: getFriendlyAuthError(error.message) };
  }

  return { success: true, user: data.user, session: data.session };
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured on this device.' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Could not connect to Supabase.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    return { success: false, error: getFriendlyAuthError(error.message) };
  }

  if (!data.session) {
    return {
      success: true,
      user: data.user ?? undefined,
      session: null,
      error:
        'Account created. If email confirmation is enabled, check your inbox before signing in.',
    };
  }

  return { success: true, user: data.user ?? undefined, session: data.session };
}

export async function signOutUser(): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: true };
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: getFriendlyAuthError(error.message) };
  }

  return { success: true };
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}
