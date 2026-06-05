import { CommonActions, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from './types';

type StackNavigation = NavigationProp<RootStackParamList>;

export function resetToWardrobe(navigation: StackNavigation) {
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'Wardrobe' }],
    }),
  );
}

export function resetToSavedOutfits(navigation: StackNavigation) {
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'SavedOutfits' }],
    }),
  );
}
