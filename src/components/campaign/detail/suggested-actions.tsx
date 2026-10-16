import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { CheckIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { layout, space, useTheme } from '@/theme';

/** The campaign's "What you can do" list. Shared by the detail page and the story preview. */
export function SuggestedActions({ actions }: { actions: string[] }) {
  const { colors } = useTheme();
  return (
    <Card padded={false}>
      {actions.map((action, i) => (
        <View key={`${i}-${action}`}>
          {i > 0 && <Divider inset={layout.cardPadding} />}
          <View style={styles.action}>
            <View style={[styles.icon, { backgroundColor: colors.successSoft }]}>
              <CheckIcon size={14} color={colors.success} weight="bold" />
            </View>
            <Text variant="body" style={styles.flex}>
              {action}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: layout.cardPadding },
  icon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
