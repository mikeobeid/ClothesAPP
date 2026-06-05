import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  ClothingImage,
  Input,
  OutfitSelectableItem,
  ScreenContainer,
  SelectionGroup,
} from '../components';
import { OCCASIONS, SEASONS } from '../constants/clothing';
import { OUTFIT_BUILDER_CATEGORIES } from '../constants/outfits';
import { useWardrobe } from '../context/WardrobeContext';
import { resetToSavedOutfits } from '../navigation/navigationHelpers';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'OutfitBuilder'>;

type FormErrors = {
  name?: string;
  items?: string;
};

export function OutfitBuilderScreen({ navigation }: Props) {
  const { clothingItems, addOutfit, isLoading } = useWardrobe();

  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [season, setSeason] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => clothingItems.find((item) => item.id === id))
        .filter((item): item is NonNullable<typeof item> => item !== undefined),
    [selectedIds, clothingItems],
  );

  const itemsByCategory = useMemo(() => {
    return OUTFIT_BUILDER_CATEGORIES.map((group) => ({
      ...group,
      items: clothingItems.filter((item) => item.category === group.category),
    }));
  }, [clothingItems]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id];
      if (next.length >= 2) {
        setErrors((current) => ({ ...current, items: undefined }));
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Outfit name is required';
    }
    if (selectedIds.length < 2) {
      nextErrors.items = 'Select at least 2 clothing items';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    await addOutfit({
      name: name.trim(),
      clothingItemIds: selectedIds,
      occasion: occasion || 'Casual',
      season: season || 'All-Season',
    });

    resetToSavedOutfits(navigation);
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
        <Text style={styles.sectionTitle}>Outfit Preview</Text>
        <View style={styles.previewSection}>
          {selectedItems.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewRow}
            >
              {selectedItems.map((item) => (
                <View key={item.id} style={styles.previewItem}>
                  <ClothingImage
                    imageUri={item.imageUri}
                    placeholderLabel={item.category.charAt(0)}
                    style={styles.previewImage}
                    placeholderStyle={styles.previewPlaceholder}
                    resizeMode="cover"
                  />
                  <Text style={styles.previewName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.previewEmpty}>
              Select items below to build your outfit
            </Text>
          )}
        </View>

        <Input
          label="Outfit Name *"
          placeholder="e.g. Weekend Casual"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (text.trim()) {
              setErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
        />
        {errors.name ? (
          <Text style={[styles.errorText, styles.fieldError]}>{errors.name}</Text>
        ) : null}

        <SelectionGroup
          label="Occasion"
          options={OCCASIONS}
          selected={occasion}
          onSelect={setOccasion}
        />

        <SelectionGroup
          label="Season"
          options={SEASONS}
          selected={season}
          onSelect={setSeason}
        />

        <Text style={styles.sectionTitle}>Select Items *</Text>
        {errors.items ? (
          <Text style={styles.errorText}>{errors.items}</Text>
        ) : null}

        {itemsByCategory.map((group) => (
          <View key={group.label} style={styles.categorySection}>
            <Text style={styles.categoryLabel}>{group.label}</Text>
            {group.items.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {group.items.map((item) => (
                  <OutfitSelectableItem
                    key={item.id}
                    item={item}
                    selected={selectedIds.includes(item.id)}
                    onPress={() => toggleItem(item.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyCategory}>
                No {group.label.toLowerCase()} in your wardrobe
              </Text>
            )}
          </View>
        ))}

        <View style={styles.saveButton}>
          <Button title="Save Outfit" onPress={handleSave} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  previewSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
    minHeight: 120,
    justifyContent: 'center',
  },
  previewRow: {
    gap: 12,
    paddingRight: 8,
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
    fontSize: 24,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  previewName: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
  },
  previewEmpty: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  categoryRow: {
    paddingRight: 8,
  },
  emptyCategory: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginBottom: 12,
  },
  fieldError: {
    marginTop: -12,
  },
  saveButton: {
    marginTop: 8,
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
