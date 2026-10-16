import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { Divider } from '@/components/ui/divider';
import { ArrowRightIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import type { Source } from '@/domain/types';
import { domainOf } from '@/lib/format';
import { layout, motion, radius, space, useTheme } from '@/theme';

/** Numbered sources, always visible to readers. Each opens in the in-app browser. */
export function SourceList({ sources }: { sources: Source[] }) {
  const { colors } = useTheme();
  if (sources.length === 0) {
    return (
      <Text variant="subhead" color="textMuted">
        This campaign doesn’t cite external sources.
      </Text>
    );
  }
  return (
    <View style={[styles.list, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {sources.map((source, i) => (
        <View key={source.id}>
          {i > 0 && <Divider inset={layout.cardPadding} />}
          <PressableScale
            scaleTo={motion.pressScale.row}
            accessibilityRole="link"
            accessibilityLabel={`Source ${i + 1}: ${source.title}, ${source.publisher}`}
            accessibilityHint="Opens the source in the browser"
            onPress={() => void WebBrowser.openBrowserAsync(source.url)}
            style={styles.row}>
            <View style={[styles.number, { backgroundColor: colors.primarySoft }]}>
              <Text variant="caption" color="primary">
                {i + 1}
              </Text>
            </View>
            <View style={styles.text}>
              <Text variant="subhead" numberOfLines={3}>
                {source.title}
              </Text>
              <Text variant="caption" color="textMuted" numberOfLines={1}>
                {source.publisher} · {domainOf(source.url)}
              </Text>
            </View>
            <ArrowRightIcon size={16} color={colors.textMuted} style={{ transform: [{ rotate: '-45deg' }] }} />
          </PressableScale>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: layout.cardPadding },
  number: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
