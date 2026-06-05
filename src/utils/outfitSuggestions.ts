import { ClothingItem } from '../types';
import {
  OutfitSuggestion,
  OutfitSuggestionCriteria,
} from '../types/outfitSuggestion';

const MAX_ITEMS_PER_CATEGORY = 5;
const MAX_SUGGESTIONS = 3;

function scoreItem(
  item: ClothingItem,
  criteria: OutfitSuggestionCriteria,
): number {
  let score = 0;

  if (item.occasion.includes(criteria.occasion)) {
    score += 40;
  } else if (item.occasion.length > 0) {
    score += 12;
  }

  if (
    item.season.includes(criteria.season) ||
    item.season.includes('All-Season')
  ) {
    score += 35;
  } else if (item.season.length > 0) {
    score += 8;
  }

  if (criteria.preferredColor) {
    if (item.color === criteria.preferredColor) {
      score += 25;
    }
  } else {
    score += 10;
  }

  return score;
}

function sortByScore(
  items: ClothingItem[],
  criteria: OutfitSuggestionCriteria,
): ClothingItem[] {
  return [...items].sort(
    (a, b) => scoreItem(b, criteria) - scoreItem(a, criteria),
  );
}

function outfitKey(items: ClothingItem[]): string {
  return items
    .map((item) => item.id)
    .sort()
    .join('-');
}

function generateOutfitName(
  occasion: string,
  items: ClothingItem[],
): string {
  const hasDress = items.some((item) => item.category === 'Dresses');
  const hasJacket = items.some((item) => item.category === 'Outerwear');

  if (hasDress) {
    return `${occasion} Dress Look`;
  }
  if (hasJacket) {
    return `${occasion} Layered Look`;
  }
  return `${occasion} Classic Look`;
}

function scoreOutfit(
  items: ClothingItem[],
  criteria: OutfitSuggestionCriteria,
): number {
  if (items.length === 0) {
    return 0;
  }

  const itemScores = items.map((item) => scoreItem(item, criteria));
  const average = itemScores.reduce((sum, value) => sum + value, 0) / items.length;

  let bonus = 0;
  const categories = new Set(items.map((item) => item.category));
  bonus += Math.min(categories.size * 5, 15);

  if (
    criteria.preferredColor &&
    items.some((item) => item.color === criteria.preferredColor)
  ) {
    bonus += 10;
  }

  const maxPossible = 100;
  return Math.min(Math.round(average + bonus), maxPossible);
}

function buildSuggestion(
  items: ClothingItem[],
  criteria: OutfitSuggestionCriteria,
  index: number,
): OutfitSuggestion {
  const uniqueItems = items.filter(
    (item, idx, arr) => arr.findIndex((entry) => entry.id === item.id) === idx,
  );

  return {
    id: outfitKey(uniqueItems) || `suggestion-${index}`,
    name: generateOutfitName(criteria.occasion, uniqueItems),
    items: uniqueItems,
    occasion: criteria.occasion,
    season: criteria.season,
    matchScore: scoreOutfit(uniqueItems, criteria),
  };
}

function addCandidate(
  candidates: OutfitSuggestion[],
  seen: Set<string>,
  items: ClothingItem[],
  criteria: OutfitSuggestionCriteria,
) {
  if (items.length < 2) {
    return;
  }

  const key = outfitKey(items);
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  candidates.push(buildSuggestion(items, criteria, candidates.length));
}

export function generateOutfitSuggestions(
  clothingItems: ClothingItem[],
  criteria: OutfitSuggestionCriteria,
): OutfitSuggestion[] {
  if (clothingItems.length < 2) {
    return [];
  }

  const tops = sortByScore(
    clothingItems.filter((item) => item.category === 'Tops'),
    criteria,
  ).slice(0, MAX_ITEMS_PER_CATEGORY);
  const bottoms = sortByScore(
    clothingItems.filter((item) => item.category === 'Bottoms'),
    criteria,
  ).slice(0, MAX_ITEMS_PER_CATEGORY);
  const dresses = sortByScore(
    clothingItems.filter((item) => item.category === 'Dresses'),
    criteria,
  ).slice(0, MAX_ITEMS_PER_CATEGORY);
  const shoes = sortByScore(
    clothingItems.filter((item) => item.category === 'Shoes'),
    criteria,
  ).slice(0, MAX_ITEMS_PER_CATEGORY);
  const jackets = sortByScore(
    clothingItems.filter((item) => item.category === 'Outerwear'),
    criteria,
  ).slice(0, MAX_ITEMS_PER_CATEGORY);
  const accessories = sortByScore(
    clothingItems.filter((item) => item.category === 'Accessories'),
    criteria,
  ).slice(0, MAX_ITEMS_PER_CATEGORY);

  const candidates: OutfitSuggestion[] = [];
  const seen = new Set<string>();

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        addCandidate(candidates, seen, [top, bottom, shoe], criteria);
      }
      for (const jacket of jackets) {
        addCandidate(candidates, seen, [top, bottom, jacket], criteria);
        for (const shoe of shoes) {
          addCandidate(candidates, seen, [top, bottom, jacket, shoe], criteria);
        }
      }
      addCandidate(candidates, seen, [top, bottom], criteria);
    }
  }

  for (const dress of dresses) {
    for (const shoe of shoes) {
      addCandidate(candidates, seen, [dress, shoe], criteria);
    }
    for (const accessory of accessories) {
      addCandidate(candidates, seen, [dress, accessory], criteria);
    }
    for (const shoe of shoes) {
      for (const accessory of accessories) {
        addCandidate(candidates, seen, [dress, shoe, accessory], criteria);
      }
    }
  }

  if (candidates.length === 0) {
    const fallback = sortByScore(clothingItems, criteria).slice(0, 3);
    if (fallback.length >= 2) {
      addCandidate(candidates, seen, fallback.slice(0, 2), criteria);
      if (fallback.length >= 3) {
        addCandidate(candidates, seen, fallback.slice(0, 3), criteria);
      }
    }
  }

  return candidates
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, MAX_SUGGESTIONS);
}

export function canGenerateSuggestions(clothingItems: ClothingItem[]): boolean {
  return clothingItems.length >= 2;
}
