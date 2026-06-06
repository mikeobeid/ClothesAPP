import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Wardrobe: undefined;
  AddClothing: undefined;
  ClothingDetails: { itemId: string };
  EditClothing: { itemId: string };
  OutfitBuilder: undefined;
  OutfitSuggestions: undefined;
  SavedOutfits: undefined;
  OutfitDetails: { outfitId: string };
  VirtualPreview: undefined;
  OutfitCalendar: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
