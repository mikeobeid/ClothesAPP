import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showCloudSyncWarning } from '../utils/syncMessages';
import { Button, ClothingImage, ScreenContainer } from '../components';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'OutfitDetails'>;

export function OutfitDetailsScreen({ route, navigation }: Props) {
  const {
    getOutfitById,
    getClothingItemsForOutfit,
    isOutfitFavorite,
    isUserOutfit,
    toggleOutfitFavorite,
    deleteOutfit,
  } = useWardrobe();

  const { outfitId } = route.params;
  const [isDeleting, setIsDeleting] = useState(false);
  const outfit = getOutfitById(outfitId);
  const items = outfit ? getClothingItemsForOutfit(outfit) : [];
  const isFavorite = isOutfitFavorite(outfitId);
  const canDelete = isUserOutfit(outfitId);

  const handleDelete = () => {
    Alert.alert(
      'Delete outfit',
      'Are you sure you want to delete this outfit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await deleteOutfit(outfitId);
              if (!result.success) {
                return;
              }
              showCloudSyncWarning(
                'Outfit deleted',
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

  if (!outfit) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.notFound}>Outfit not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <Text style={styles.title}>{outfit.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{outfit.occasion}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.meta}>{outfit.season}</Text>
        </View>

        <Text style={styles.sectionTitle}>Outfit Items</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewRow}
        >
          {items.map((item) => (
            <View key={item.id} style={styles.previewItem}>
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
          ))}
        </ScrollView>

        <View style={styles.actions}>
          <Button
            title={isFavorite ? 'Unfavorite Outfit' : 'Favorite Outfit'}
            variant="secondary"
            onPress={() => toggleOutfitFavorite(outfitId)}
          />
          {canDelete ? (
            <Button
              title={isDeleting ? 'Deleting...' : 'Delete Outfit'}
              variant="danger"
              onPress={handleDelete}
              loading={isDeleting}
              disabled={isDeleting}
            />
          ) : (
            <Text style={styles.sampleNote}>
              Sample outfits cannot be deleted.
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  meta: {
    fontSize: 15,
    color: '#6B7280',
  },
  metaDot: {
    fontSize: 15,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  previewRow: {
    gap: 12,
    paddingRight: 8,
    marginBottom: 28,
  },
  previewItem: {
    width: 100,
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  previewPlaceholder: {
    width: 100,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  previewPlaceholderText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  previewName: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
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
