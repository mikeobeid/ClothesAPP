import { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getStoredSessionFast,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
} from '../services/authService';
import {
  createProfile,
  ensureProfileForUser,
  fetchProfileByUserId,
  isUsernameTaken,
  USERNAME_TAKEN_ERROR,
} from '../services/profileService';
import { getSupabaseClient } from '../services/supabase';
import { ProfileRow } from '../types/profile';
import { UserProfile } from '../types';
import { isGuestMode, setGuestMode } from '../utils/userIdentity';
import { validateUsername } from '../utils/username';
import { reloadWearContextsForCurrentUser } from './WearContextContext';
import { reloadWearLogsForCurrentUser } from './WearLogContext';
import { useWardrobe } from './WardrobeContext';

const PROFILE_LOAD_TIMEOUT_MS = 12000;

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
    username: string,
  ) => Promise<{ error?: string; notice?: string }>;
  signOut: () => Promise<{ error?: string }>;
  continueAsGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  displayName: 'Guest',
  isGuest: true,
};

function mapProfileRowToUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name?.trim() || row.username,
    username: row.username,
    email: row.email ?? undefined,
    isGuest: false,
  };
}

function buildFallbackProfile(user: User): UserProfile {
  const email = user.email ?? '';
  const emailPrefix = email ? email.split('@')[0] : 'Account';

  return {
    id: user.id,
    displayName: emailPrefix,
    email,
    isGuest: false,
  };
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { refreshCloudRestore } = useWardrobe();
  const refreshCloudRestoreRef = useRef(refreshCloudRestore);
  refreshCloudRestoreRef.current = refreshCloudRestore;

  const [isLoading, setIsLoading] = useState(true);
  const [hasChosenGuest, setHasChosenGuest] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profileRow, setProfileRow] = useState<ProfileRow | null>(null);

  const loadProfileForAuthenticatedUser = useCallback(
    async (authUser: User, preferredUsername?: string) => {
      try {
        const existing = await withTimeout(
          fetchProfileByUserId(authUser.id),
          PROFILE_LOAD_TIMEOUT_MS,
          'profile fetch',
        );

        if (existing) {
          setProfileRow(existing);
          return { success: true as const };
        }

        const ensured = await withTimeout(
          ensureProfileForUser(authUser, preferredUsername),
          PROFILE_LOAD_TIMEOUT_MS,
          'profile ensure',
        );

        if (ensured.success && ensured.profile) {
          setProfileRow(ensured.profile);
          return { success: true as const };
        }

        console.warn('Profile load failed:', ensured.error);
        return { success: true as const };
      } catch (error) {
        console.warn('Profile load failed:', error);
        return { success: true as const };
      }
    },
    [],
  );

  const loadProfileRef = useRef(loadProfileForAuthenticatedUser);
  loadProfileRef.current = loadProfileForAuthenticatedUser;

  const finishStartup = useCallback(() => {
    setIsLoading(false);
  }, []);

  const triggerWardrobeRestore = useCallback(async (force = false) => {
    try {
      await refreshCloudRestoreRef.current({ force });
      await Promise.all([
        reloadWearLogsForCurrentUser(),
        reloadWearContextsForCurrentUser(),
      ]);
    } catch (error) {
      console.warn('Wardrobe restore failed:', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let startupHandled = false;

    const applyAuthSession = async (
      nextSession: Session | null,
      loadProfile: boolean,
    ) => {
      const guestMode = await isGuestMode();
      if (cancelled) {
        return;
      }

      setHasChosenGuest(guestMode);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user && !guestMode) {
        if (loadProfile) {
          void loadProfileRef.current(nextSession.user);
        }
      } else {
        setProfileRow(null);
      }
    };

    const completeStartup = async (nextSession: Session | null) => {
      if (startupHandled || cancelled) {
        return;
      }
      startupHandled = true;

      try {
        await applyAuthSession(nextSession, true);
      } catch (error) {
        console.warn('Auth startup failed:', error);
      } finally {
        if (!cancelled) {
          try {
            await triggerWardrobeRestore();
          } catch (error) {
            console.warn('Wardrobe restore failed:', error);
          } finally {
            finishStartup();
          }
        }
      }
    };

    const bootstrap = async () => {
      try {
        const cachedSession = await getStoredSessionFast();

        if (cancelled) {
          return;
        }

        await completeStartup(cachedSession);
      } catch (error) {
        console.warn('Auth bootstrap failed:', error);
        if (!cancelled) {
          try {
            await triggerWardrobeRestore();
          } catch (restoreError) {
            console.warn('Wardrobe restore failed:', restoreError);
          } finally {
            finishStartup();
          }
        }
      }
    };

    bootstrap();

    const supabase = getSupabaseClient();
    if (!supabase) {
      return () => {
        cancelled = true;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      try {
        if (event === 'INITIAL_SESSION') {
          if (!startupHandled) {
            await completeStartup(nextSession);
          } else {
            await applyAuthSession(nextSession, true);
          }
          return;
        }

        if (cancelled) {
          return;
        }

        await applyAuthSession(nextSession, true);

        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          void triggerWardrobeRestore(true);
        }
      } catch (error) {
        console.warn('Auth state change failed:', error);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [finishStartup, triggerWardrobeRestore]);

  const isAuthenticated = !!session?.user && !hasChosenGuest;
  const isGuest = !isAuthenticated;

  const profile = useMemo(() => {
    if (!isAuthenticated || !user) {
      return GUEST_PROFILE;
    }

    if (profileRow) {
      return mapProfileRowToUserProfile(profileRow);
    }

    return buildFallbackProfile(user);
  }, [isAuthenticated, user, profileRow]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await signInWithEmail(email, password);
        if (!result.success || !result.user) {
          return { error: result.error };
        }

        await setGuestMode(false);
        setHasChosenGuest(false);
        setSession(result.session ?? null);
        setUser(result.user);

        void loadProfileForAuthenticatedUser(result.user);
        await triggerWardrobeRestore(true);
        return {};
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Sign in failed.';
        return { error: message };
      }
    },
    [loadProfileForAuthenticatedUser, triggerWardrobeRestore],
  );

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      try {
        const validationError = validateUsername(username);
        if (validationError) {
          return { error: validationError };
        }

        if (await isUsernameTaken(username)) {
          return { error: USERNAME_TAKEN_ERROR };
        }

        const result = await signUpWithEmail(email, password);
        if (!result.success) {
          return { error: result.error };
        }

        if (!result.session || !result.user) {
          return { notice: result.error };
        }

        await setGuestMode(false);
        setHasChosenGuest(false);
        setSession(result.session);
        setUser(result.user);

        const profileResult = await createProfile({
          userId: result.user.id,
          email: email.trim(),
          username,
        });

        if (!profileResult.success || !profileResult.profile) {
          return {
            error: profileResult.error ?? 'Could not create your profile.',
          };
        }

        setProfileRow(profileResult.profile);
        await triggerWardrobeRestore(true);

        return {};
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Sign up failed.';
        return { error: message };
      }
    },
    [triggerWardrobeRestore],
  );

  const signOut = useCallback(async () => {
    try {
      const result = await signOutUser();
      if (!result.success) {
        return { error: result.error };
      }

      await setGuestMode(false);
      setHasChosenGuest(false);
      setSession(null);
      setUser(null);
      setProfileRow(null);
      await triggerWardrobeRestore(true);

      return {};
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sign out failed.';
      return { error: message };
    }
  }, [triggerWardrobeRestore]);

  const continueAsGuest = useCallback(async () => {
    try {
      await setGuestMode(true);
      setHasChosenGuest(true);
      setProfileRow(null);
      await triggerWardrobeRestore(true);
    } catch (error) {
      console.warn('Continue as guest failed:', error);
    }
  }, [triggerWardrobeRestore]);

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
