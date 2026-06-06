import { ClothingItem, WearLog } from '../types';
import { CLOTHING_CONDITIONS } from '../constants/clothing';
import { formatShortDate } from './dateFormat';

export type ItemWearStats = {
  wearCount: number;
  lastWornDate?: string;
  contextsWornIn: string[];
  mostCommonContext?: string;
};

export type ItemWearHistoryEntry = {
  logId: string;
  date: string;
  wearContextName?: string;
  outfitName?: string;
  notes?: string;
};

export function sortWearLogsNewestFirst(logs: WearLog[]): WearLog[] {
  return [...logs].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function getLogsForItem(itemId: string, wearLogs: WearLog[]): WearLog[] {
  return wearLogs.filter((log) => log.clothingItemIds.includes(itemId));
}

export function getLogsForDate(date: string, wearLogs: WearLog[]): WearLog[] {
  return sortWearLogsNewestFirst(
    wearLogs.filter((log) => log.date === date),
  );
}

export function getContextsWornIn(
  itemId: string,
  wearLogs: WearLog[],
): string[] {
  const names = new Set<string>();

  for (const log of getLogsForItem(itemId, wearLogs)) {
    const name = log.wearContextName?.trim();
    if (name) {
      names.add(name);
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}

export function itemWasWornInContext(
  itemId: string,
  contextName: string,
  wearLogs: WearLog[],
): boolean {
  const normalized = contextName.trim().toLowerCase();
  return getLogsForItem(itemId, wearLogs).some(
    (log) => log.wearContextName?.trim().toLowerCase() === normalized,
  );
}

export function getMostCommonContext(logs: WearLog[]): string | undefined {
  const counts = new Map<string, number>();

  for (const log of logs) {
    const name = log.wearContextName?.trim();
    if (!name) {
      continue;
    }
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  let topName: string | undefined;
  let topCount = 0;

  for (const [name, count] of counts.entries()) {
    if (count > topCount) {
      topName = name;
      topCount = count;
    }
  }

  return topName;
}

export function getItemWearStats(
  itemId: string,
  wearLogs: WearLog[],
): ItemWearStats {
  const matching = getLogsForItem(itemId, wearLogs);

  if (matching.length === 0) {
    return { wearCount: 0, contextsWornIn: [] };
  }

  const sorted = sortWearLogsNewestFirst(matching);

  return {
    wearCount: matching.length,
    lastWornDate: sorted[0]?.date,
    contextsWornIn: getContextsWornIn(itemId, wearLogs),
    mostCommonContext: getMostCommonContext(matching),
  };
}

export function getItemWearHistory(
  itemId: string,
  wearLogs: WearLog[],
  resolveOutfitName: (outfitId?: string) => string | undefined,
  limit?: number,
): ItemWearHistoryEntry[] {
  const sorted = sortWearLogsNewestFirst(getLogsForItem(itemId, wearLogs));
  const sliced = limit ? sorted.slice(0, limit) : sorted;

  return sliced.map((log) => ({
    logId: log.id,
    date: log.date,
    wearContextName: log.wearContextName,
    outfitName: resolveOutfitName(log.outfitId),
    notes: log.notes,
  }));
}

export function getRecentWearLogs(
  wearLogs: WearLog[],
  limit = 10,
): WearLog[] {
  return sortWearLogsNewestFirst(wearLogs).slice(0, limit);
}

export function formatWearHistoryLine(
  log: WearLog,
  outfitName?: string,
): string {
  const parts: string[] = [];

  if (log.wearContextName) {
    parts.push(log.wearContextName);
  }

  if (outfitName) {
    parts.push(outfitName);
  } else if (log.clothingItemIds.length > 0) {
    parts.push(
      `${log.clothingItemIds.length} item${log.clothingItemIds.length === 1 ? '' : 's'}`,
    );
  }

  parts.push(formatShortDate(log.date));

  return parts.join(' — ');
}

function formatConditionForSearch(condition?: string): string | undefined {
  if (!condition || condition === 'unspecified') {
    return undefined;
  }

  return (
    CLOTHING_CONDITIONS.find((entry) => entry.value === condition)?.label ??
    condition
  );
}

export function clothingItemMatchesSearch(
  item: ClothingItem,
  query: string,
  wearLogs: WearLog[],
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    item.name,
    item.category,
    item.color,
    item.notes,
    item.purchaseDate,
    formatConditionForSearch(item.condition),
    ...(item.season ?? []),
    ...(item.occasion ?? []),
    ...getContextsWornIn(item.id, wearLogs),
  ];

  return searchableValues.some((value) =>
    value?.toLowerCase().includes(normalizedQuery),
  );
}
