export type WearLog = {
  id: string;
  userId: string;
  date: string;
  outfitId?: string;
  clothingItemIds: string[];
  wearContextId?: string;
  wearContextName?: string;
  notes?: string;
  createdAt: string;
};
