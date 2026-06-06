import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  EmptyState,
  ScreenContainer,
  SelectionGroup,
  SuggestedOutfitCard,
} from '../components';
import { COLORS, OCCASIONS, SEASONS } from '../constants/clothing';
import { colors, spacing, typography } from '../constants/theme';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';
import {
  canGenerateSuggestions,
  generateOutfitSuggestions,
} from '../utils/outfitSuggestions';
import { showCloudSyncWarning } from '../utils/syncMessages';

type Props = RootStackScreenProps<'OutfitSuggestions'>;

const ANY_COLOR = 'Any';

export function OutfitSuggestionsScreen({ navigation }: Props) {
  const { userItems, addOutfit, isLoading } = useWardrobe();

  const [occasion, setOccasion] = useState('');
  const [season, setSeason] = useState('');
  const [preferredColor, setPreferredColor] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const colorOptions = [ANY_COLOR, ...COLORS.map((color) => color.name)];

  const suggestions = useMemo(() => {
    if (!occasion || !season) {
      return [];
    }

    return generateOutfitSuggestions(userItems, {
      occasion,
      season,
      preferredColor:
        preferredColor && preferredColor !== ANY_COLOR
          ? preferredColor
          : undefined,
    });
  }, [userItems, occasion, season, preferredColor]);

  const hasEnoughItems = canGenerateSuggestions(userItems);
  const canShowSuggestions = occasion && season;

  const handleSave = async (suggestionId: string) => {
    const suggestion = suggestions.find((entry) => entry.id === suggestionId);
    if (!suggestion) {
      return;
    }

    setSavingId(suggestionId);
    try {
      const result = await addOutfit({
        name: suggestion.name,
        clothingItemIds: suggestion.items.map((item) => item.id),
        occasion: suggestion.occasion,
        season: suggestion.season,
      });
      showCloudSyncWarning('Outfit saved', result.cloudSyncWarning);
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          <EmptyState
            icon="✧"
            title="Add more clothes first"
            message="You need at least two items in your wardrobe before we can suggest outfits."
            actionTitle="Add Clothing"
            onAction={() => navigation.navigate('AddClothing')}
          />
        ) : !canShowSuggestions ? (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Choose an occasion and season above to see personalized outfit ideas.
            </Text>
          </View>
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon="◇"
            title="No matches for this combo"
            message="Try a different occasion, season, or color — or add more variety to your wardrobe."
            actionTitle="Add Clothing"
            onAction={() => navigation.navigate('AddClothing')}
          />
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
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  results: {
    marginTop: spacing.sm,
  },
  resultsTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  hintBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    padding: spacing.xl,
    marginTop: spacing.sm,
  },
  hintText: {
    ...typography.caption,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
  },
});
