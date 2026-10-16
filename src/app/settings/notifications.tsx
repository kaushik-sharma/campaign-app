import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { BellIcon, EnvelopeSimpleIcon, DeviceMobileIcon, type IconComponent } from '@/components/ui/icons';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { ACTIVITY_GROUPS, activityGroupHints, activityGroupLabels } from '@/domain/activity';
import { usePreferences } from '@/stores/preferences';
import { layout, space } from '@/theme';

const CHANNELS: { title: string; subtitle: string; icon: IconComponent }[] = [
  { title: 'Push notifications', subtitle: 'Alerts on your lock screen', icon: DeviceMobileIcon },
  { title: 'Email', subtitle: 'A summary in your inbox', icon: EnvelopeSimpleIcon },
];

/** Which notifications appear in Activity. Push and email are shown but not part of the prototype. */
export default function NotificationSettingsScreen() {
  const enabled = usePreferences((s) => s.notifications);
  const setNotification = usePreferences((s) => s.setNotification);

  return (
    <Screen title="Notifications" back>
      <Section title="In the app" description="Choose what appears in Activity and on the tab badge.">
        <Card padded={false}>
          {ACTIVITY_GROUPS.map((group, i) => (
            <View key={group}>
              {i > 0 && <Divider inset={layout.cardPadding} />}
              <ListRow
                icon={BellIcon}
                title={activityGroupLabels[group]}
                subtitle={activityGroupHints[group]}
                trailing={
                  <Switch
                    value={enabled[group]}
                    onValueChange={(on) => setNotification(group, on)}
                    accessibilityLabel={`${activityGroupLabels[group]} notifications`}
                  />
                }
              />
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Other channels">
        <Card padded={false}>
          {CHANNELS.map((c, i) => (
            <View key={c.title}>
              {i > 0 && <Divider inset={layout.cardPadding} />}
              <ListRow icon={c.icon} title={c.title} subtitle={c.subtitle} trailing={<Badge label="Not in prototype" />} />
            </View>
          ))}
        </Card>
        <Text variant="footnote" color="textMuted" style={styles.note}>
          Push and email need a published app and a mail service. Everything is delivered in Activity instead.
        </Text>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: space.sm },
});
