import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { WardrobeScreen } from '../screens/WardrobeScreen';
import { AddClothingScreen } from '../screens/AddClothingScreen';
import { ClothingDetailsScreen } from '../screens/ClothingDetailsScreen';
import { EditClothingScreen } from '../screens/EditClothingScreen';
import { OutfitBuilderScreen } from '../screens/OutfitBuilderScreen';
import { OutfitSuggestionsScreen } from '../screens/OutfitSuggestionsScreen';
import { OutfitDetailsScreen } from '../screens/OutfitDetailsScreen';
import { SavedOutfitsScreen } from '../screens/SavedOutfitsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VirtualPreviewScreen } from '../screens/VirtualPreviewScreen';
import { OutfitCalendarScreen } from '../screens/OutfitCalendarScreen';
import { colors } from '../constants/theme';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ title: 'Sign Up' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Wardrobe"
          component={WardrobeScreen}
          options={{
            title: 'My Wardrobe',
            headerTintColor: colors.primary,
          }}
        />
        <Stack.Screen
          name="AddClothing"
          component={AddClothingScreen}
          options={{ title: 'Add Clothing' }}
        />
        <Stack.Screen
          name="ClothingDetails"
          component={ClothingDetailsScreen}
          options={{ title: 'Clothing Details' }}
        />
        <Stack.Screen
          name="EditClothing"
          component={EditClothingScreen}
          options={{ title: 'Edit Clothing' }}
        />
        <Stack.Screen
          name="OutfitBuilder"
          component={OutfitBuilderScreen}
          options={{ title: 'Outfit Builder' }}
        />
        <Stack.Screen
          name="OutfitSuggestions"
          component={OutfitSuggestionsScreen}
          options={{ title: 'Smart Suggestions' }}
        />
        <Stack.Screen
          name="SavedOutfits"
          component={SavedOutfitsScreen}
          options={{ title: 'Saved Outfits' }}
        />
        <Stack.Screen
          name="OutfitDetails"
          component={OutfitDetailsScreen}
          options={{ title: 'Outfit Details' }}
        />
        <Stack.Screen
          name="VirtualPreview"
          component={VirtualPreviewScreen}
          options={{ title: 'Virtual Preview' }}
        />
        <Stack.Screen
          name="OutfitCalendar"
          component={OutfitCalendarScreen}
          options={{ title: 'Outfit Calendar' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
