import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { duration, radius, space, typography, useTheme } from '@/theme';

import { IconButton } from './icon-button';
import { MagnifyingGlassIcon, XIcon } from './icons';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChangeText, placeholder = 'Search' }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: colors.surfaceSunken }]}>
      <MagnifyingGlassIcon size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 && (
        <Animated.View entering={FadeIn.duration(duration.fast)} exiting={FadeOut.duration(duration.fast)}>
          <IconButton icon={XIcon} accessibilityLabel="Clear search" size={28} variant="plain" onPress={() => onChangeText('')} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 46,
    paddingLeft: space.md,
    paddingRight: space.xs,
    borderRadius: radius.md,
  },
  input: { flex: 1, ...typography.body, paddingVertical: 0 },
});
