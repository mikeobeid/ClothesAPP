import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ClothingItem } from '../types';
import {
  buildPreviewLayers,
  PREVIEW_ZONE_LAYOUT,
  PreviewLayer,
} from '../utils/virtualPreview';
import { cardBase, colors, radius, spacing, typography } from '../constants/theme';
import { ClothingImage } from './ClothingImage';
import { MannequinSilhouette } from './MannequinSilhouette';

type MannequinPreviewProps = {
  items: ClothingItem[];
  label?: string;
};

const PREVIEW_ASPECT_RATIO = 0.62;
const MAX_PREVIEW_WIDTH = 380;

function PreviewLayerImage({ layer }: { layer: PreviewLayer }) {
  const layout = PREVIEW_ZONE_LAYOUT[layer.zone];

  return (
    <View
      style={[
        styles.layer,
        {
          top: `${layout.top}%`,
          left: `${layout.left}%`,
          width: `${layout.width}%`,
          height: `${layout.height}%`,
          zIndex: layout.zIndex,
          borderRadius: layout.borderRadius ?? radius.md,
        },
      ]}
    >
      <ClothingImage
        imageUri={layer.item.imageUri}
        placeholderLabel={layer.item.category.charAt(0)}
        style={styles.layerImage}
        placeholderStyle={styles.layerPlaceholder}
        resizeMode="cover"
      />
    </View>
  );
}

export function MannequinPreview({ items, label }: MannequinPreviewProps) {
  const { width: screenWidth } = useWindowDimensions();
  const previewWidth = Math.min(screenWidth - spacing.xxl * 2, MAX_PREVIEW_WIDTH);
  const previewHeight = previewWidth / PREVIEW_ASPECT_RATIO;

  const layers = useMemo(() => buildPreviewLayers(items), [items]);
  const hasLayers = layers.length > 0;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.stage,
          {
            width: previewWidth,
            height: previewHeight,
          },
        ]}
      >
        <View style={styles.backdrop}>
          <MannequinSilhouette />
        </View>

        {hasLayers ? (
          layers.map((layer) => (
            <PreviewLayerImage key={`${layer.zone}-${layer.item.id}`} layer={layer} />
          ))
        ) : (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyTitle}>No items selected</Text>
            <Text style={styles.emptyText}>
              Choose a saved outfit or pick items to see a preview.
            </Text>
          </View>
        )}
      </View>

      {hasLayers ? (
        <View style={styles.legend}>
          {layers.map((layer) => (
            <View key={layer.item.id} style={styles.legendChip}>
              <Text style={styles.legendText}>{layer.item.category}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    ...typography.subheading,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  stage: {
    ...cardBase,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    opacity: 0.9,
  },
  layer: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    backgroundColor: colors.surface,
  },
  layerImage: {
    width: '100%',
    height: '100%',
  },
  layerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryLight,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    backgroundColor: 'rgba(251,247,245,0.55)',
  },
  emptyTitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 22,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    maxWidth: MAX_PREVIEW_WIDTH,
  },
  legendChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  legendText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '500',
  },
});
