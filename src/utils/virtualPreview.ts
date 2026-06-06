import { ClothingItem } from '../types';

export type PreviewZone =
  | 'shoes'
  | 'bottoms'
  | 'dresses'
  | 'tops'
  | 'outerwear'
  | 'accessories';

export type PreviewLayer = {
  zone: PreviewZone;
  item: ClothingItem;
  zIndex: number;
};

export type ZoneLayout = {
  top: number;
  left: number;
  width: number;
  height: number;
  zIndex: number;
  borderRadius?: number;
};

const CATEGORY_TO_ZONE: Record<string, PreviewZone> = {
  Tops: 'tops',
  Bottoms: 'bottoms',
  Dresses: 'dresses',
  Outerwear: 'outerwear',
  Shoes: 'shoes',
  Accessories: 'accessories',
};

const ZONE_RENDER_ORDER: PreviewZone[] = [
  'shoes',
  'bottoms',
  'dresses',
  'tops',
  'outerwear',
  'accessories',
];

export const PREVIEW_ZONE_LAYOUT: Record<PreviewZone, ZoneLayout> = {
  shoes: {
    top: 82,
    left: 20,
    width: 60,
    height: 14,
    zIndex: 1,
    borderRadius: 10,
  },
  bottoms: {
    top: 48,
    left: 26,
    width: 48,
    height: 34,
    zIndex: 2,
    borderRadius: 12,
  },
  dresses: {
    top: 17,
    left: 23,
    width: 54,
    height: 66,
    zIndex: 3,
    borderRadius: 14,
  },
  tops: {
    top: 17,
    left: 28,
    width: 44,
    height: 30,
    zIndex: 4,
    borderRadius: 12,
  },
  outerwear: {
    top: 14,
    left: 21,
    width: 58,
    height: 36,
    zIndex: 5,
    borderRadius: 14,
  },
  accessories: {
    top: 3,
    left: 56,
    width: 30,
    height: 18,
    zIndex: 6,
    borderRadius: 10,
  },
};

export function getPreviewZoneForCategory(category: string): PreviewZone | null {
  return CATEGORY_TO_ZONE[category] ?? null;
}

export function buildPreviewLayers(items: ClothingItem[]): PreviewLayer[] {
  const zoneItems = new Map<PreviewZone, ClothingItem>();

  for (const item of items) {
    const zone = getPreviewZoneForCategory(item.category);
    if (!zone || zoneItems.has(zone)) {
      continue;
    }
    zoneItems.set(zone, item);
  }

  const hasDress = zoneItems.has('dresses');
  const visibleZones = ZONE_RENDER_ORDER.filter((zone) => {
    if (!zoneItems.has(zone)) {
      return false;
    }
    if (hasDress && (zone === 'tops' || zone === 'bottoms')) {
      return false;
    }
    return true;
  });

  return visibleZones.map((zone) => ({
    zone,
    item: zoneItems.get(zone)!,
    zIndex: PREVIEW_ZONE_LAYOUT[zone].zIndex,
  }));
}

export function getItemsForManualSelection(
  clothingItems: ClothingItem[],
  selectedIds: string[],
): ClothingItem[] {
  const selectedSet = new Set(selectedIds);
  return clothingItems.filter((item) => selectedSet.has(item.id));
}

export function toggleManualSelection(
  clothingItems: ClothingItem[],
  selectedIds: string[],
  item: ClothingItem,
): string[] {
  if (selectedIds.includes(item.id)) {
    return selectedIds.filter((id) => id !== item.id);
  }

  const idsWithoutSameCategory = selectedIds.filter((id) => {
    const existing = clothingItems.find((entry) => entry.id === id);
    return existing?.category !== item.category;
  });

  return [...idsWithoutSameCategory, item.id];
}
