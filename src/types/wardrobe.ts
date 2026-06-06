import { ClothingItem, Outfit } from './index';

export type ClothingSaveResult = {
  item: ClothingItem;
  cloudSyncWarning?: string;
};

export type OutfitSaveResult = {
  outfit: Outfit;
  cloudSyncWarning?: string;
};

export type DeleteResult = {
  success: boolean;
  cloudSyncWarning?: string;
};
