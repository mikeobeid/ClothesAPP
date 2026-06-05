import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ClothingItem } from '../types';
import { OutfitSuggestion } from '../types/outfitSuggestion';
import { Button } from './Button';
import { ClothingImage } from './ClothingImage';

type SuggestedOutfitCardProps = {
  suggestion: OutfitSuggestion;
  onSave: () => void;
  saving?: boolean;
};

export function SuggestedOutfitCard({
  suggestion,
  onSave,
  saving = false,
}: SuggestedOutfitCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {suggestion.name}
        </Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{suggestion.matchScore}% match</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.previewRow}
      >
        {suggestion.items.map((item) => (
          <PreviewItem key={item.id} item={item} />
        ))}
      </ScrollView>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{suggestion.occasion}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.meta}>{suggestion.season}</Text>
      </View>

      <Button
        title="Save This Outfit"
        variant="secondary"
        onPress={onSave}
        disabled={saving}
      />
    </View>
  );
}

function PreviewItem({ item }: { item: ClothingItem }) {
  return (
    <View style={styles.previewItem}>
      <ClothingImage
        imageUri={item.imageUri}
        placeholderLabel={item.category.charAt(0)}
        style={styles.previewImage}
        placeholderStyle={styles.previewPlaceholder}
        resizeMode="cover"
      />
      <Text style={styles.previewName} numberOfLines={2}>
        {item.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scoreBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  previewRow: {
    gap: 12,
    paddingRight: 8,
    marginBottom: 12,
  },
  previewItem: {
    width: 80,
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
  },
  previewPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  previewPlaceholderText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  previewName: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  meta: {
    fontSize: 14,
    color: '#6B7280',
  },
  metaDot: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
});
