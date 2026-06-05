export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  occasion: string[];
  imageUri?: string;
  notes?: string;
  createdAt: string;
};
