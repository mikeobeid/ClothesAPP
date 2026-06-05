import { useEffect, useState } from 'react';
import {
  Image,
  ImageResizeMode,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../constants/theme';
import { isDisplayableImageUri } from '../utils/clothingImage';

type ClothingImageProps = {
  imageUri?: string;
  placeholderLabel?: string;
  style?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
};

export function ClothingImage({
  imageUri,
  placeholderLabel = '?',
  style,
  placeholderStyle,
  resizeMode = 'cover',
}: ClothingImageProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [imageUri]);

  const canDisplay = isDisplayableImageUri(imageUri) && !loadFailed;

  if (!canDisplay) {
    return (
      <View
        style={[
          styles.placeholder,
          style as StyleProp<ViewStyle>,
          placeholderStyle,
        ]}
      >
        <Text style={styles.placeholderText}>{placeholderLabel}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setLoadFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.accent,
  },
});
