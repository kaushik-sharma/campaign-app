import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './text';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={name}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }]}>
      <Text
        variant={size >= 56 ? 'title2' : 'subhead'}
        color="primary"
        maxFontSizeMultiplier={1}
        importantForAccessibility="no">
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
