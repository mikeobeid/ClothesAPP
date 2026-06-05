import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClothingItem } from '../types';
import { ClothingImage } from './ClothingImage';

type OutfitSelectableItemProps = {
  item: ClothingItem;
  selected: boolean;
  onPress: () => void;
};

export function OutfitSelectableItem({
  item,
  selected,
  onPress,
}: OutfitSelectableItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <ClothingImage
        imageUri={item.imageUri}
        placeholderLabel={item.category.charAt(0)}
        style={styles.image}
        placeholderStyle={styles.imagePlaceholder}
      />
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      {selected ? (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  cardSelected: {
    borderColor: '#1A1A1A',
  },
  cardPressed: {
    opacity: 0.9,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    padding: 8,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
