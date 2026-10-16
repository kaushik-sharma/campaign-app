import { Image } from 'expo-image';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import type { CategoryId, ImageAsset } from '@/domain/types';
import { duration, useTheme } from '@/theme';

import { categoryIcons } from './category-icon';

type Props = {
  image: ImageAsset | null;
  category: CategoryId;
  style?: StyleProp<ImageStyle>;
  /** Decorative when the surrounding element already describes the campaign. */
  decorative?: boolean;
};

/** Campaign cover with a blurhash placeholder; falls back to a category tile when missing. */
export function CoverImage({ image, category, style, decorative = true }: Props) {
  const { categoryTint, colors } = useTheme();

  if (!image) {
    const Icon = categoryIcons[category];
    return (
      <View style={[styles.fallback, { backgroundColor: categoryTint(category) }, style as StyleProp<ViewStyle>]}>
        <Icon size={28} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={image.source}
      placeholder={image.blurhash ? { blurhash: image.blurhash } : undefined}
      contentFit="cover"
      transition={duration.base}
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : image.alt}
      style={[{ backgroundColor: categoryTint(category) }, style]}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
