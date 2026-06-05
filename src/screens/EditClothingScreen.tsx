import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Input, ScreenContainer, SelectionGroup } from '../components';
import {
  CLOTHING_CATEGORIES,
  COLORS,
  OCCASIONS,
  SEASONS,
} from '../constants/clothing';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';

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

    await updateClothingItem(itemId, {
      name: name.trim(),
      category,
      color: color || 'Gray',
      season,
      occasion,
      notes: notes.trim() || undefined,
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

        <View style={styles.saveButton}>
          <Button title="Save Changes" onPress={handleSave} />
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
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 12,
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
  notFound: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 32,
  },
});
