import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  ClothingImage,
  DatePickerField,
  Input,
  ScreenContainer,
  SelectionGroup,
} from '../components';
import {
  CLOTHING_CATEGORIES,
  CLOTHING_CONDITIONS,
  COLORS,
  OCCASIONS,
  SEASONS,
} from '../constants/clothing';
import { ClothingCondition } from '../types';
import { cardBase, colors, radius, spacing, typography } from '../constants/theme';
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

type ImagePickerSource = 'gallery' | 'camera';

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
};

export function AddClothingScreen({ navigation }: Props) {
  const { addClothingItem } = useWardrobe();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [season, setSeason] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string[]>([]);
  const [condition, setCondition] = useState<ClothingCondition>('unspecified');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [pickingSource, setPickingSource] = useState<ImagePickerSource | null>(
    null,
  );
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const isPickingImage = pickingSource !== null;

  const applyPickerResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) {
      console.log('[ImagePicker] photo capture cancelled');
      return;
    }

    console.log('[ImagePicker] photo selected');
    setImageUri(result.assets[0].uri);
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  const pickFromGallery = async () => {
    if (isSaving || isPickingImage) {
      return;
    }

    setPickingSource('gallery');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        console.log('[ImagePicker] permission denied');
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to add clothing images.',
        );
        return;
      }

      console.log('[ImagePicker] gallery opened');
      const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);
      applyPickerResult(result);
    } finally {
      setPickingSource(null);
    }
  };

  const takePhoto = async () => {
    if (isSaving || isPickingImage) {
      return;
    }

    setPickingSource('camera');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        console.log('[ImagePicker] permission denied');
        Alert.alert(
          'Permission needed',
          'Camera permission is needed to take a clothing photo.',
        );
        return;
      }

      console.log('[ImagePicker] camera opened');
      const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);
      applyPickerResult(result);
    } finally {
      setPickingSource(null);
    }
  };

  const handleAddPhotoPressed = () => {
    if (isSaving || isPickingImage) {
      return;
    }

    console.log('[ImagePicker] add photo pressed');
    setShowPhotoOptions(true);
  };

  const handleGalleryOption = () => {
    console.log('[ImagePicker] gallery option selected');
    setShowPhotoOptions(false);
    void pickFromGallery();
  };

  const handleCameraOption = () => {
    console.log('[ImagePicker] camera option selected');
    setShowPhotoOptions(false);
    void takePhoto();
  };

  const handlePickerCancel = () => {
    console.log('[ImagePicker] picker cancelled');
    setShowPhotoOptions(false);
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
      const trimmedPurchaseDate = purchaseDate.trim();
      const result = await addClothingItem({
        name: name.trim(),
        category,
        color: color || 'Gray',
        season,
        occasion,
        imageUri,
        condition: condition === 'unspecified' ? undefined : condition,
        purchaseDate: trimmedPurchaseDate || undefined,
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
  const pickingLabel =
    pickingSource === 'camera' ? 'Opening camera...' : 'Opening gallery...';

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
            onPress={handleAddPhotoPressed}
            disabled={isSaving || isPickingImage}
            style={({ pressed }) => [
              styles.photoArea,
              errors.image && styles.photoAreaError,
              pressed && !isSaving && !isPickingImage && styles.photoAreaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={imageUri ? 'Change photo' : 'Add photo'}
          >
            {isPickingImage ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.uploadingText}>{pickingLabel}</Text>
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
                  Tap to choose from gallery or camera
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
            disabled={isSaving || isPickingImage}
            modalTitle="Purchase Date"
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

      <Modal
        visible={showPhotoOptions}
        animationType="slide"
        transparent
        onRequestClose={handlePickerCancel}
      >
        <Pressable style={styles.modalBackdrop} onPress={handlePickerCancel}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Photo</Text>
            <Text style={styles.modalSubtitle}>
              Choose how you want to add a clothing photo
            </Text>

            <Pressable
              onPress={handleGalleryOption}
              style={({ pressed }) => [
                styles.modalOption,
                pressed && styles.modalOptionPressed,
              ]}
            >
              <Text style={styles.modalOptionIcon}>🖼</Text>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.modalOptionHint}>Pick an existing photo</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleCameraOption}
              style={({ pressed }) => [
                styles.modalOption,
                pressed && styles.modalOptionPressed,
              ]}
            >
              <Text style={styles.modalOptionIcon}>📷</Text>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Take Photo</Text>
                <Text style={styles.modalOptionHint}>Use your camera now</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handlePickerCancel}
              style={({ pressed }) => [
                styles.modalCancel,
                pressed && styles.modalOptionPressed,
              ]}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  itemInfoTitle: {
    ...typography.subheading,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  itemInfoHint: {
    ...typography.caption,
    marginBottom: spacing.md,
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
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(61,52,53,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.subheading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalOption: {
    ...cardBase,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  modalOptionPressed: {
    opacity: 0.92,
  },
  modalOptionIcon: {
    fontSize: 22,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  modalOptionHint: {
    ...typography.small,
  },
  modalCancel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.xs,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
