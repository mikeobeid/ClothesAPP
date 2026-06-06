import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, ClothingImage, Input, ScreenContainer, SelectionGroup } from '../components';
import {
  CLOTHING_CATEGORIES,
  COLORS,
  OCCASIONS,
  SEASONS,
} from '../constants/clothing';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useWardrobe } from '../context/WardrobeContext';
import { resetToWardrobe } from '../navigation/navigationHelpers';
import { RootStackScreenProps } from '../navigation/types';
import { showCloudSyncWarning } from '../utils/syncMessages';

type Props = RootStackScreenProps<'AddClothing'>;

type FormErrors = {
  image?: string;
  name?: string;
  category?: string;
};

export function AddClothingScreen({ navigation }: Props) {
  const { addClothingItem } = useWardrobe();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [season, setSeason] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const pickImage = async () => {
    if (isSaving || isPickingImage) {
      return;
    }

    setIsPickingImage(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to add clothing images.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setErrors((prev) => ({ ...prev, image: undefined }));
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  const toggleMultiSelect = (
    value: string,
    current: string[],
    setter: (next: string[]) => void,
  ) => {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
    } else {
      setter([...current, value]);
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!imageUri) {
      nextErrors.image = 'Please add a photo';
    }
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
    if (!validate() || !imageUri || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await addClothingItem({
        name: name.trim(),
        category,
        color: color || 'Gray',
        season,
        occasion,
        imageUri,
      });

      showCloudSyncWarning(
        'Item saved',
        result.cloudSyncWarning,
        () => resetToWardrobe(navigation),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const colorOptions = COLORS.map((c) => c.name);

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Add Clothing</Text>
        <Text style={styles.pageSubtitle}>
          Capture a piece for your wardrobe. It saves locally and syncs to the cloud.
        </Text>

        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Photo *</Text>
          <Pressable
            onPress={pickImage}
            disabled={isSaving || isPickingImage}
            style={({ pressed }) => [
              styles.photoArea,
              errors.image && styles.photoAreaError,
              pressed && styles.photoAreaPressed,
            ]}
          >
            {isPickingImage ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.uploadingText}>Opening gallery...</Text>
              </View>
            ) : imageUri ? (
              <View style={styles.previewWrap}>
                <ClothingImage
                  imageUri={imageUri}
                  style={styles.previewImage}
                  placeholderStyle={styles.previewImage}
                  resizeMode="cover"
                />
                <View style={styles.changePhotoOverlay}>
                  <Text style={styles.changePhotoText}>Tap to change photo</Text>
                </View>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.photoIconCircle}>
                  <Text style={styles.photoIcon}>+</Text>
                </View>
                <Text style={styles.photoPlaceholderTitle}>Add a photo</Text>
                <Text style={styles.photoPlaceholderText}>
                  Choose from your gallery
                </Text>
              </View>
            )}
          </Pressable>
          {errors.image ? (
            <Text style={styles.errorText}>{errors.image}</Text>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <Input
            label="Name *"
            placeholder="e.g. Blush silk blouse"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (text.trim()) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            editable={!isSaving && !isPickingImage}
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
        </View>

        <View style={styles.saveButton}>
          <Button
            title={isSaving ? 'Saving & uploading...' : 'Save Item'}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || isPickingImage}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  pageTitle: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    ...typography.caption,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  photoSection: {
    marginBottom: spacing.lg,
  },
  formSection: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  photoArea: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  photoAreaError: {
    borderColor: colors.error,
  },
  photoAreaPressed: {
    opacity: 0.92,
  },
  previewWrap: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(61,52,53,0.55)',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.surface,
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  photoIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  photoIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.primary,
  },
  photoPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
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
  uploadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  uploadingText: {
    ...typography.caption,
  },
});
