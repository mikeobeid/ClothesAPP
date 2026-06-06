import { WearLog } from '../types/wearLog';
import { WearContext } from '../types/wearContext';

function normalizeContextName(name: string): string {
  return name.trim().toLowerCase();
}

export function recoverMissingContextsFromWearLogs(
  contexts: WearContext[],
  wearLogs: WearLog[],
  userId: string,
): { contexts: WearContext[]; addedNames: string[] } {
  const knownNames = new Set(
    contexts.map((context) => normalizeContextName(context.name)),
  );
  const recovered: WearContext[] = [];
  const addedNames: string[] = [];

  for (const log of wearLogs) {
    const name = log.wearContextName?.trim();
    if (!name) {
      continue;
    }

    const normalized = normalizeContextName(name);
    if (knownNames.has(normalized)) {
      continue;
    }

    const created: WearContext = {
      id:
        log.wearContextId ??
        `context-recovered-${normalized}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      name,
      createdAt: log.createdAt,
    };

    recovered.push(created);
    knownNames.add(normalized);
    addedNames.push(name);
  }

  if (recovered.length === 0) {
    return { contexts, addedNames };
  }

  return {
    contexts: [...recovered, ...contexts],
    addedNames,
  };
}
