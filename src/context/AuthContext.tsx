import { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getCurrentSession,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
} from '../services/authService';
import { getSupabaseClient } from '../services/supabase';
import { isGuestMode, setGuestMode } from '../utils/userIdentity';
import { UserProfile } from '../types';
import { useWardrobe } from './WardrobeContext';

type AuthContextValue = {
  isLoading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  hasChosenGuest: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfile;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; notice?: string }>;
  signOut: () => Promise<{ error?: string }>;
  continueAsGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function buildProfile(
  user: User | null,
  authenticated: boolean,
): UserProfile {
  if (!authenticated || !user) {
    return {
      id: 'guest',
      displayName: 'Guest',
      isGuest: true,
    };
  }

  const email = user.email ?? '';
  const displayName = email ? email.split('@')[0] : 'Account';

  return {
    id: user.id,
    displayName,
    email,
    isGuest: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { refreshCloudRestore } = useWardrobe();
  const [isLoading, setIsLoading] = useState(true);
  const [hasChosenGuest, setHasChosenGuest] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const refreshAuthState = useCallback(async () => {
    const [currentSession, guestMode] = await Promise.all([
      getCurrentSession(),
      isGuestMode(),
    ]);

    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    setHasChosenGuest(guestMode);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshAuthState();

    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      const guestMode = await isGuestMode();
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setHasChosenGuest(guestMode);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAuthState]);

  const isAuthenticated = !!session?.user && !hasChosenGuest;
  const isGuest = !isAuthenticated;

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await signInWithEmail(email, password);
      if (!result.success) {
        return { error: result.error };
      }

      await setGuestMode(false);
      setHasChosenGuest(false);
      setSession(result.session ?? null);
      setUser(result.user ?? null);
      await refreshCloudRestore();

      return {};
    },
    [refreshCloudRestore],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const result = await signUpWithEmail(email, password);
      if (!result.success) {
        return { error: result.error };
      }

      if (!result.session) {
        return { notice: result.error };
      }

      await setGuestMode(false);
      setHasChosenGuest(false);
      setSession(result.session);
      setUser(result.user ?? null);
      await refreshCloudRestore();

      return {};
    },
    [refreshCloudRestore],
  );

  const signOut = useCallback(async () => {
    const result = await signOutUser();
    if (!result.success) {
      return { error: result.error };
    }

    await setGuestMode(false);
    setHasChosenGuest(false);
    setSession(null);
    setUser(null);
    await refreshCloudRestore();

    return {};
  }, [refreshCloudRestore]);

  const continueAsGuest = useCallback(async () => {
    await setGuestMode(true);
    setHasChosenGuest(true);
    await refreshCloudRestore();
  }, [refreshCloudRestore]);

  const profile = useMemo(
    () => buildProfile(user, isAuthenticated),
    [user, isAuthenticated],
  );

  const value = useMemo(
    () => ({
      isLoading,
      isGuest,
      isAuthenticated,
      hasChosenGuest,
      user,
      session,
      profile,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
    }),
    [
      isLoading,
      isGuest,
      isAuthenticated,
      hasChosenGuest,
      user,
      session,
      profile,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
