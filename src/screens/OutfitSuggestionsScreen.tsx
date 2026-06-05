import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  ScreenContainer,
  SelectionGroup,
  SuggestedOutfitCard,
} from '../components';
import { COLORS, OCCASIONS, SEASONS } from '../constants/clothing';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';
import {
  canGenerateSuggestions,
  generateOutfitSuggestions,
} from '../utils/outfitSuggestions';

type Props = RootStackScreenProps<'OutfitSuggestions'>;

const ANY_COLOR = 'Any';

export function OutfitSuggestionsScreen({ navigation }: Props) {
  const { clothingItems, addOutfit, isLoading } = useWardrobe();

  const [occasion, setOccasion] = useState('');
  const [season, setSeason] = useState('');
  const [preferredColor, setPreferredColor] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const colorOptions = [ANY_COLOR, ...COLORS.map((color) => color.name)];

  const suggestions = useMemo(() => {
    if (!occasion || !season) {
      return [];
    }

    return generateOutfitSuggestions(clothingItems, {
      occasion,
      season,
      preferredColor:
        preferredColor && preferredColor !== ANY_COLOR
          ? preferredColor
          : undefined,
    });
  }, [clothingItems, occasion, season, preferredColor]);

  const hasEnoughItems = canGenerateSuggestions(clothingItems);
  const canShowSuggestions = occasion && season;

  const handleSave = async (suggestionId: string) => {
    const suggestion = suggestions.find((entry) => entry.id === suggestionId);
    if (!suggestion) {
      return;
    }

    setSavingId(suggestionId);
    try {
      await addOutfit({
        name: suggestion.name,
        clothingItemIds: suggestion.items.map((item) => item.id),
        occasion: suggestion.occasion,
        season: suggestion.season,
      });
      Alert.alert('Saved', 'Outfit added to your saved outfits.');
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>Loading wardrobe...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Text style={styles.description}>
          Pick an occasion and season to get outfit ideas from your wardrobe.
        </Text>

        <SelectionGroup
          label="Occasion *"
          options={OCCASIONS}
          selected={occasion}
          onSelect={setOccasion}
        />

        <SelectionGroup
          label="Season *"
          options={SEASONS}
          selected={season}
          onSelect={setSeason}
        />

        <SelectionGroup
          label="Preferred Color (optional)"
          options={colorOptions}
          selected={preferredColor}
          onSelect={setPreferredColor}
        />

        {!hasEnoughItems ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Not enough items yet</Text>
            <Text style={styles.emptyText}>
              Add more clothing items to generate better outfit suggestions.
            </Text>
            <View style={styles.emptyButton}>
              <Button
                title="Add Clothing"
                variant="secondary"
                onPress={() => navigation.navigate('AddClothing')}
              />
            </View>
          </View>
        ) : !canShowSuggestions ? (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Select an occasion and season to see suggestions.
            </Text>
          </View>
        ) : suggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>
              Add more clothing items to generate better outfit suggestions.
            </Text>
          </View>
        ) : (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>
              {suggestions.length} suggestion
              {suggestions.length === 1 ? '' : 's'} for you
            </Text>
            {suggestions.map((suggestion) => (
              <SuggestedOutfitCard
                key={suggestion.id}
                suggestion={suggestion}
                onSave={() => handleSave(suggestion.id)}
                saving={savingId === suggestion.id}
              />
            ))}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 32,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
  },
  results: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  hintBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    width: '100%',
    marginTop: 16,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
  },
});
