import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { ArrowClockwiseIcon, FastForwardIcon, FlaskIcon, PaletteIcon, TimerIcon, WifiSlashIcon } from '@/components/ui/icons';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import { useDevControls } from '@/features/dev/use-dev-controls';
import type { ReviewDecision } from '@/services';
import { toast } from '@/stores/toast';
import { layout, space } from '@/theme';

type FailurePreset = 'off' | 'low' | 'high' | 'always';
const FAILURE_RATES: Record<FailurePreset, number> = { off: 0, low: 0.05, high: 0.3, always: 1 };

function presetFor(rate: number): FailurePreset {
  const match = (Object.keys(FAILURE_RATES) as FailurePreset[]).find((k) => FAILURE_RATES[k] === rate);
  return match ?? 'low';
}

/** Hidden demo controls: simulate network conditions and reset demo data. */
export default function DevScreen() {
  const dev = useDevControls();
  const [resetting, setResetting] = useState(false);

  const confirmReset = () =>
    Alert.alert(
      'Reset sample data?',
      'Clears contributions, drafts, follows and lifecycle changes made on this device. Your sign-in is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            await dev.resetDemoData();
            setResetting(false);
            toast('Sample data reset', 'success');
          },
        },
      ],
    );

  return (
    <Screen title="Developer controls" back>
      <Section>
        <Card tone="sunken" style={styles.note}>
          <Badge label="Prototype only" icon={FlaskIcon} />
          <Text variant="subhead" color="textMuted">
            These controls simulate backend behaviour so loading, error and retry states can be shown
            while testing. They are not part of the product.
          </Text>
        </Card>
      </Section>

      <Section title="Network">
        <Card style={styles.group}>
          <View style={styles.control}>
            <Text variant="subhead">Request failure rate</Text>
            <SegmentedControl<FailurePreset>
              accessibilityLabel="Request failure rate"
              value={presetFor(dev.network.failureRate)}
              onChange={(v) => dev.setNetwork({ failureRate: FAILURE_RATES[v] })}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'low', label: '5%' },
                { value: 'high', label: '30%' },
                { value: 'always', label: 'Always' },
              ]}
            />
          </View>
          <View style={styles.control}>
            <Text variant="subhead">Latency</Text>
            <SegmentedControl
              accessibilityLabel="Latency"
              value={dev.network.latency}
              onChange={(latency) => dev.setNetwork({ latency })}
              options={[
                { value: 'fast', label: 'Fast' },
                { value: 'realistic', label: 'Realistic' },
                { value: 'slow', label: 'Slow' },
              ]}
            />
          </View>
        </Card>
        <Card padded={false} style={styles.rows}>
          <ListRow
            icon={WifiSlashIcon}
            title="Simulate offline"
            subtitle="Every request fails with a connection error"
            trailing={
              <Switch
                value={dev.network.offline}
                onValueChange={(offline) => dev.setNetwork({ offline })}
                accessibilityLabel="Simulate offline"
              />
            }
          />
          <Divider inset={layout.cardPadding} />
          <ListRow
            icon={ArrowClockwiseIcon}
            title="Fail the next 3 requests"
            subtitle="Then pull to refresh or tap Try again"
            onPress={() => {
              dev.failNext(3);
              toast('Next 3 requests will fail');
            }}
          />
        </Card>
      </Section>

      <Section title="Campaign review">
        <Card style={styles.group}>
          <View style={styles.control}>
            <Text variant="subhead">Review decision</Text>
            <SegmentedControl<ReviewDecision>
              accessibilityLabel="Review decision"
              value={dev.lifecycle.decision}
              onChange={(decision) => dev.setLifecycle({ decision })}
              options={[
                { value: 'approve', label: 'Approve' },
                { value: 'changes', label: 'Changes' },
                { value: 'reject', label: 'Reject' },
              ]}
            />
          </View>
        </Card>
        <Card padded={false} style={styles.rows}>
          <ListRow
            icon={TimerIcon}
            title="Advance on timers"
            subtitle={`Decision after ${demo.lifecycle.reviewDecisionSec} s, backing opens ${demo.lifecycle.openForFundingSec - demo.lifecycle.reviewDecisionSec} s later`}
            trailing={
              <Switch
                value={dev.lifecycle.autoAdvance}
                onValueChange={(autoAdvance) => dev.setLifecycle({ autoAdvance })}
                accessibilityLabel="Advance on timers"
              />
            }
          />
          <Divider inset={layout.cardPadding} />
          <ListRow
            icon={FastForwardIcon}
            title="Advance newest campaign now"
            subtitle="Moves your latest submission to its next status"
            onPress={async () => toast(await dev.advanceCampaign())}
          />
        </Card>
      </Section>

      <Section title="Design">
        <Card padded={false}>
          <ListRow
            icon={PaletteIcon}
            title="Design system"
            subtitle="Tokens and components in the current theme"
            onPress={() => router.push('/dev/design-system')}
          />
        </Card>
      </Section>

      <Section title="Data">
        <Button label="Reset sample data" variant="destructive" fullWidth loading={resetting} onPress={confirmReset} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { gap: space.sm },
  group: { gap: space.xl },
  control: { gap: space.sm },
  rows: { marginTop: space.md },
});
