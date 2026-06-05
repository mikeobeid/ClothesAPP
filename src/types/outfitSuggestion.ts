import { ClothingItem } from './clothing';

export type OutfitSuggestionCriteria = {
  occasion: string;
  season: string;
  preferredColor?: string;
};

export type OutfitSuggestion = {
  id: string;
  name: string;
  items: ClothingItem[];
  occasion: string;
  season: string;
  matchScore: number;
};
