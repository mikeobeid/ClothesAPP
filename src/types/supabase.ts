export type ClothesRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  occasion: string[];
  image_uri: string | null;
  notes: string | null;
  created_at: string;
};

export type OutfitRow = {
  id: string;
  user_id: string;
  name: string;
  occasion: string;
  season: string;
  created_at: string;
};

export type OutfitItemRow = {
  id: string;
  outfit_id: string;
  clothing_id: string;
  user_id: string;
};
