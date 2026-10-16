import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { CompassIcon, FlaskIcon } from '@/components/ui/icons';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { infoPages, type InfoSlug } from '@/content/info';
import { layout, space } from '@/theme';

/** Secondary content pages (About, FAQ, Terms…), rendered from `src/content/info.ts`. */
export default function InfoScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = infoPages[slug as InfoSlug];

  if (!page) {
    return (
      <Screen title="Not found" back>
        <EmptyState icon={CompassIcon} title="This page doesn’t exist" />
      </Screen>
    );
  }

  return (
    <Screen title={page.title} back>
      <View style={styles.body}>
        <Text variant="body" color="textMuted">
          {page.intro}
        </Text>
        {page.illustrative && <Badge label="Illustrative prototype text, not legal terms" icon={FlaskIcon} />}
        {page.sections.map((section, i) => (
          <View key={section.heading ?? i} style={styles.section}>
            {section.heading && (
              <Text variant="title3" accessibilityRole="header">
                {section.heading}
              </Text>
            )}
            <Text variant="body">{section.body}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: layout.gutter, gap: space.xl },
  section: { gap: space.sm },
});
