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
import { WearContext } from '../types/wearContext';
import { getAppUserIdMode, getCurrentAppUserId } from '../utils/userIdentity';
import { loadWearLogsForUser } from '../utils/wearLogStorage';
import { recoverMissingContextsFromWearLogs } from '../utils/wearContextRecovery';
import {
  loadWearContextsForUser,
  saveWearContextsForUser,
} from '../utils/wearContextStorage';

type WearContextContextValue = {
  wearContexts: WearContext[];
  isLoading: boolean;
  createWearContext: (name: string, color?: string) => Promise<WearContext | null>;
  getWearContextById: (id: string) => WearContext | undefined;
};

const WearContextContext = createContext<WearContextContextValue | null>(null);

let reloadWearContextsHandler: (() => Promise<void>) | null = null;

export async function reloadWearContextsForCurrentUser(): Promise<void> {
  await reloadWearContextsHandler?.();
}

function findContextByName(
  contexts: WearContext[],
  name: string,
): WearContext | undefined {
  const normalized = name.trim().toLowerCase();
  return contexts.find(
    (context) => context.name.trim().toLowerCase() === normalized,
  );
}

export function WearContextProvider({ children }: { children: ReactNode }) {
  const [wearContexts, setWearContexts] = useState<WearContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);
  const wearContextsRef = useRef<WearContext[]>([]);
  const storageChainRef = useRef(Promise.resolve());

  const syncContextsState = useCallback((contexts: WearContext[]) => {
    wearContextsRef.current = contexts;
    setWearContexts(contexts);
  }, []);

  const runSerialized = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = storageChainRef.current.then(() => task());
    storageChainRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const loadAndRecoverForUser = useCallback(
    async (userId: string) => {
      let contexts = await loadWearContextsForUser(userId);
      const wearLogs = await loadWearLogsForUser(userId);
      const { contexts: mergedContexts, addedNames } =
        recoverMissingContextsFromWearLogs(contexts, wearLogs, userId);

      if (addedNames.length > 0) {
        await saveWearContextsForUser(userId, mergedContexts);
        for (const name of addedNames) {
          console.log(
            `[WearContext] recovered from wear logs: ${name}`,
          );
        }
        contexts = mergedContexts;
      }

      return contexts;
    },
    [],
  );

  const loadForCurrentUser = useCallback(async () => {
    return runSerialized(async () => {
      const mode = await getAppUserIdMode();
      const userId = await getCurrentAppUserId();

      currentUserIdRef.current = userId;

      const contexts = await loadAndRecoverForUser(userId);
      syncContextsState(contexts);
      console.log(
        `[WearContext] load completed (${mode}): ${contexts.length} contexts`,
      );
      setIsLoading(false);
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[WearContext] load failed: ${message}`);
      setIsLoading(false);
    });
  }, [loadAndRecoverForUser, runSerialized, syncContextsState]);

  useEffect(() => {
    reloadWearContextsHandler = loadForCurrentUser;
    return () => {
      reloadWearContextsHandler = null;
    };
  }, [loadForCurrentUser]);

  const createWearContext = useCallback(
    async (name: string, color?: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return null;
      }

      return runSerialized(async () => {
        const mode = await getAppUserIdMode();
        const userId = await getCurrentAppUserId();
        currentUserIdRef.current = userId;

        const storedContexts = await loadWearContextsForUser(userId);
        const duplicate = findContextByName(storedContexts, trimmed);
        if (duplicate) {
          syncContextsState(storedContexts);
          return duplicate;
        }

        const created: WearContext = {
          id: `context-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId,
          name: trimmed,
          color,
          createdAt: new Date().toISOString(),
        };

        const nextContexts = [created, ...storedContexts];

        await saveWearContextsForUser(userId, nextContexts);
        console.log(
          `[WearContext] created context (${mode}): ${created.name}`,
        );
        syncContextsState(nextContexts);
        setIsLoading(false);
        return created;
      }).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[WearContext] save failed: ${message}`);
        return null;
      });
    },
    [runSerialized, syncContextsState],
  );

  const getWearContextById = useCallback(
    (id: string) => wearContextsRef.current.find((context) => context.id === id),
    [],
  );

  const value = useMemo(
    () => ({
      wearContexts,
      isLoading,
      createWearContext,
      getWearContextById,
    }),
    [wearContexts, isLoading, createWearContext, getWearContextById],
  );

  return (
    <WearContextContext.Provider value={value}>
      {children}
    </WearContextContext.Provider>
  );
}

export function useWearContext(): WearContextContextValue {
  const context = useContext(WearContextContext);
  if (!context) {
    throw new Error('useWearContext must be used within WearContextProvider');
  }
  return context;
}
