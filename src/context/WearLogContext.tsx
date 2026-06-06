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
import { Outfit } from '../types';
import { WearLog } from '../types/wearLog';
import { getCurrentAppUserId } from '../utils/userIdentity';
import {
  loadWearLogsForUser,
  saveWearLogsForUser,
} from '../utils/wearLogStorage';
import {
  getItemWearHistory,
  getItemWearStats,
  getLogsForDate,
  getRecentWearLogs,
  ItemWearHistoryEntry,
  ItemWearStats,
} from '../utils/wearStats';

type SaveWearLogInput = {
  id?: string;
  date: string;
  outfitId?: string;
  clothingItemIds: string[];
  wearContextId?: string;
  wearContextName?: string;
  notes?: string;
};

type WearLogContextValue = {
  wearLogs: WearLog[];
  isLoading: boolean;
  getLogsForDate: (date: string) => WearLog[];
  getRecentLogs: (limit?: number) => WearLog[];
  getWearStatsForItem: (itemId: string) => ItemWearStats;
  getWearHistoryForItem: (
    itemId: string,
    resolveOutfitName: (outfitId?: string) => string | undefined,
    limit?: number,
  ) => ItemWearHistoryEntry[];
  saveWearLog: (input: SaveWearLogInput) => Promise<WearLog>;
  removeWearLogById: (logId: string) => Promise<void>;
  buildClothingIdsFromOutfit: (outfit: Outfit) => string[];
};

const WearLogContext = createContext<WearLogContextValue | null>(null);

let reloadWearLogsHandler: (() => Promise<void>) | null = null;

export async function reloadWearLogsForCurrentUser(): Promise<void> {
  await reloadWearLogsHandler?.();
}

export function WearLogProvider({ children }: { children: ReactNode }) {
  const [wearLogs, setWearLogs] = useState<WearLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  const loadForCurrentUser = useCallback(async () => {
    const userId = await getCurrentAppUserId();
    currentUserIdRef.current = userId;
    const logs = await loadWearLogsForUser(userId);
    setWearLogs(logs);
    setIsLoading(false);
  }, []);

  const ensureCurrentUser = useCallback(async () => {
    const userId = await getCurrentAppUserId();
    if (currentUserIdRef.current !== userId) {
      setIsLoading(true);
      await loadForCurrentUser();
    }
  }, [loadForCurrentUser]);

  useEffect(() => {
    reloadWearLogsHandler = loadForCurrentUser;
    void loadForCurrentUser();
    return () => {
      reloadWearLogsHandler = null;
    };
  }, [loadForCurrentUser]);

  const persistLogs = useCallback(async (logs: WearLog[]) => {
    await ensureCurrentUser();
    const userId = await getCurrentAppUserId();
    await saveWearLogsForUser(userId, logs);
    setWearLogs(logs);
  }, [ensureCurrentUser]);

  const getLogsForDateFn = useCallback(
    (date: string) => getLogsForDate(date, wearLogs),
    [wearLogs],
  );

  const getRecentLogs = useCallback(
    (limit = 10) => getRecentWearLogs(wearLogs, limit),
    [wearLogs],
  );

  const getWearStatsForItem = useCallback(
    (itemId: string) => getItemWearStats(itemId, wearLogs),
    [wearLogs],
  );

  const getWearHistoryForItem = useCallback(
    (
      itemId: string,
      resolveOutfitName: (outfitId?: string) => string | undefined,
      limit?: number,
    ) => getItemWearHistory(itemId, wearLogs, resolveOutfitName, limit),
    [wearLogs],
  );

  const buildClothingIdsFromOutfit = useCallback(
    (outfit: Outfit) => outfit.clothingItemIds,
    [],
  );

  const saveWearLog = useCallback(
    async (input: SaveWearLogInput) => {
      await ensureCurrentUser();
      const userId = await getCurrentAppUserId();
      const uniqueItemIds = [...new Set(input.clothingItemIds)];
      const existing = input.id
        ? wearLogs.find((log) => log.id === input.id)
        : undefined;

      const nextLog: WearLog = {
        id: existing?.id ?? `wear-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        date: input.date,
        outfitId: input.outfitId,
        clothingItemIds: uniqueItemIds,
        wearContextId: input.wearContextId,
        wearContextName: input.wearContextName?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };

      const withoutExisting = existing
        ? wearLogs.filter((log) => log.id !== existing.id)
        : wearLogs;

      await persistLogs([nextLog, ...withoutExisting]);
      return nextLog;
    },
    [ensureCurrentUser, persistLogs, wearLogs],
  );

  const removeWearLogById = useCallback(
    async (logId: string) => {
      await ensureCurrentUser();
      const next = wearLogs.filter((log) => log.id !== logId);
      await persistLogs(next);
    },
    [ensureCurrentUser, persistLogs, wearLogs],
  );

  const value = useMemo(
    () => ({
      wearLogs,
      isLoading,
      getLogsForDate: getLogsForDateFn,
      getRecentLogs,
      getWearStatsForItem,
      getWearHistoryForItem,
      saveWearLog,
      removeWearLogById,
      buildClothingIdsFromOutfit,
    }),
    [
      wearLogs,
      isLoading,
      getLogsForDateFn,
      getRecentLogs,
      getWearStatsForItem,
      getWearHistoryForItem,
      saveWearLog,
      removeWearLogById,
      buildClothingIdsFromOutfit,
    ],
  );

  return (
    <WearLogContext.Provider value={value}>{children}</WearLogContext.Provider>
  );
}

export function useWearLog(): WearLogContextValue {
  const context = useContext(WearLogContext);
  if (!context) {
    throw new Error('useWearLog must be used within WearLogProvider');
  }
  return context;
}
