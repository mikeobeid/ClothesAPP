export type ClothingCondition = 'new' | 'old' | 'unspecified';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  occasion: string[];
  imageUri?: string;
  notes?: string;
  condition?: ClothingCondition;
  purchaseDate?: string;
  createdAt: string;
};
