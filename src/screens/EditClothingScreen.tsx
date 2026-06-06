import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, DatePickerField, Input, ScreenContainer, SelectionGroup } from '../components';
import {
  CLOTHING_CATEGORIES,
  CLOTHING_CONDITIONS,
  COLORS,
  OCCASIONS,
  SEASONS,
} from '../constants/clothing';
import { colors, spacing, typography } from '../constants/theme';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';
import { ClothingCondition } from '../types';

type Props = RootStackScreenProps<'EditClothing'>;

type FormErrors = {
  name?: string;
  category?: string;
};

export function EditClothingScreen({ route, navigation }: Props) {
  const { getClothingItemById, updateClothingItem, isUserClothingItem } =
    useWardrobe();
  const { itemId } = route.params;
  const item = getClothingItemById(itemId);

  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState(item?.category ?? '');
  const [color, setColor] = useState(item?.color ?? '');
  const [season, setSeason] = useState<string[]>(item?.season ?? []);
  const [occasion, setOccasion] = useState<string[]>(item?.occasion ?? []);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [condition, setCondition] = useState<ClothingCondition>(
    item?.condition ?? 'unspecified',
  );
  const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  if (!item || !isUserClothingItem(itemId)) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.notFound}>This item cannot be edited.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const toggleMultiSelect = (
    value: string,
    current: string[],
    setter: (next: string[]) => void,
  ) => {
    if (current.includes(value)) {
      setter(current.filter((entry) => entry !== value));
    } else {
      setter([...current, value]);
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Name is required';
    }
    if (!category) {
      nextErrors.category = 'Category is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const trimmedPurchaseDate = purchaseDate.trim();

    await updateClothingItem(itemId, {
      name: name.trim(),
      category,
      color: color || 'Gray',
      season,
      occasion,
      notes: notes.trim() || undefined,
      condition: condition === 'unspecified' ? undefined : condition,
      purchaseDate: trimmedPurchaseDate || undefined,
    });

    navigation.goBack();
  };

  const colorOptions = COLORS.map((c) => c.name);

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Input
          label="Name *"
          placeholder="e.g. Blue denim jacket"
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
          label="Category *"
          options={CLOTHING_CATEGORIES}
          selected={category}
          onSelect={(value) => {
            setCategory(value);
            setErrors((prev) => ({ ...prev, category: undefined }));
          }}
          error={errors.category}
        />

        <SelectionGroup
          label="Color"
          options={colorOptions}
          selected={color}
          onSelect={setColor}
        />

        <SelectionGroup
          label="Season"
          options={SEASONS}
          selected={season}
          multiple
          onSelect={(value) => toggleMultiSelect(value, season, setSeason)}
        />

        <SelectionGroup
          label="Occasion"
          options={OCCASIONS}
          selected={occasion}
          multiple
          onSelect={(value) => toggleMultiSelect(value, occasion, setOccasion)}
        />

        <Input
          label="Notes"
          placeholder="Optional notes about this item"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.notesInput}
        />

        <Text style={styles.itemInfoTitle}>Item Info</Text>
        <Text style={styles.itemInfoHint}>Optional details about this piece</Text>

        <SelectionGroup
          label="Condition"
          options={CLOTHING_CONDITIONS.map((entry) => entry.label)}
          selected={
            CLOTHING_CONDITIONS.find((entry) => entry.value === condition)
              ?.label ?? 'Unspecified'
          }
          onSelect={(label) => {
            const match = CLOTHING_CONDITIONS.find(
              (entry) => entry.label === label,
            );
            setCondition(match?.value ?? 'unspecified');
          }}
        />

        <DatePickerField
          label="Purchase Date (optional)"
          value={purchaseDate || undefined}
          placeholder="Select purchase date"
          onChange={(value) => setPurchaseDate(value ?? '')}
          allowClear
          modalTitle="Purchase Date"
        />

        <View style={styles.saveButton}>
          <Button title="Save Changes" onPress={handleSave} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  itemInfoTitle: {
    ...typography.subheading,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  itemInfoHint: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginBottom: spacing.md,
  },
  fieldError: {
    marginTop: -12,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
  notFound: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
});
