import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { showCloudSyncWarning } from '../utils/syncMessages';
import { Button, ClothingImage, ScreenContainer } from '../components';
import { COLORS } from '../constants/clothing';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'ClothingDetails'>;

export function ClothingDetailsScreen({ route, navigation }: Props) {
  const {
    getClothingItemById,
    isClothingFavorite,
    isUserClothingItem,
    toggleClothingFavorite,
    deleteClothingItem,
  } = useWardrobe();

  const { itemId } = route.params;
  const [isDeleting, setIsDeleting] = useState(false);
  const item = getClothingItemById(itemId);
  const isFavorite = isClothingFavorite(itemId);
  const canManage = isUserClothingItem(itemId);

  const colorHex = item
    ? COLORS.find((c) => c.name === item.color)?.hex ?? '#E5E7EB'
    : '#E5E7EB';

  const handleDelete = () => {
    Alert.alert(
      'Delete clothing item',
      'Are you sure you want to delete this clothing item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await deleteClothingItem(itemId);
              if (!result.success) {
                return;
              }
              showCloudSyncWarning(
                'Item deleted',
                result.cloudSyncWarning,
                () => navigation.goBack(),
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (!item) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.notFound}>Item not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <ClothingImage
          imageUri={item.imageUri}
          placeholderLabel={item.category.charAt(0)}
          style={styles.image}
          placeholderStyle={styles.imagePlaceholder}
          resizeMode="cover"
        />

        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.meta}>{item.category}</Text>

        <View style={styles.detailsSection}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
            <Text style={styles.value}>{item.color}</Text>
          </View>

          <Text style={styles.label}>Season</Text>
          <Text style={styles.value}>
            {item.season.length > 0 ? item.season.join(', ') : '—'}
          </Text>

          <Text style={styles.label}>Occasion</Text>
          <Text style={styles.value}>
            {item.occasion.length > 0 ? item.occasion.join(', ') : '—'}
          </Text>

          {item.notes ? (
            <>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{item.notes}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button
            title={isFavorite ? 'Unfavorite' : 'Favorite'}
            variant="secondary"
            onPress={() => toggleClothingFavorite(itemId)}
          />
          {canManage ? (
            <>
              <Button
                title="Edit"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('EditClothing', { itemId })
                }
              />
              <Button
                title={isDeleting ? 'Deleting...' : 'Delete'}
                variant="danger"
                onPress={handleDelete}
                loading={isDeleting}
                disabled={isDeleting}
              />
            </>
          ) : (
            <Text style={styles.sampleNote}>
              Sample items cannot be edited or deleted.
            </Text>
          )}
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
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    marginBottom: 24,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  imagePlaceholderText: {
    fontSize: 64,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  meta: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  detailsSection: {
    gap: 4,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actions: {
    gap: 12,
  },
  sampleNote: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  notFound: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 32,
  },
});
