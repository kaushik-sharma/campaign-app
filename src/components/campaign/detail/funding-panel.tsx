import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EstimatedReach } from '@/components/ui/estimate';
import { FileTextIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';
import { hasReport } from '@/domain/creator';
import { acceptsContributions, statusMeta } from '@/domain/lifecycle';
import { fundingProgress } from '@/domain/money';
import type { Campaign } from '@/domain/types';
import { formatInteger, formatMoney, formatPercent, formatTimeLeft } from '@/lib/format';
import { toast } from '@/stores/toast';
import { space, useTheme } from '@/theme';

import { FollowButton } from '../engagement-buttons';

type Props = {
  campaign: Campaign;
  onBack: () => void;
  /** Draft preview: shows the live layout but the actions explain they aren't active yet. */
  preview?: boolean;
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="bodyStrong" tabular>
        {value}
      </Text>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

/** Funding progress, estimated reach and the primary action. Only funding campaigns can be backed. */
export function FundingPanel({ campaign, onBack, preview = false }: Props) {
  const { colors } = useTheme();
  const progress = fundingProgress(campaign.raisedCents, campaign.goalCents);
  const canBack = acceptsContributions(campaign.status);
  const timeLeft = campaign.status === 'funding' ? formatTimeLeft(campaign.fundingEndsAt) : null;

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.amounts}>
          <AnimatedNumber value={campaign.raisedCents} format="money" variant="amount" />
          <Text variant="subhead" color="textMuted">
            raised of {formatMoney(campaign.goalCents)} goal
          </Text>
        </View>
      </View>

      <ProgressBar value={progress} height={8} delay={350} accessibilityLabel={`${formatPercent(progress)} funded`} />

      <View style={[styles.stats, { borderColor: colors.border }]}>
        <Stat value={formatPercent(progress)} label="funded" />
        <Stat value={formatInteger(campaign.backerCount)} label="backers" />
        <Stat value={timeLeft ?? statusMeta[campaign.status].label} label={timeLeft ? 'to back' : 'status'} />
      </View>

      <View style={styles.reach}>
        <Text variant="caption" color="textMuted">
          If fully funded, the ads reach
        </Text>
        <EstimatedReach amountCents={campaign.goalCents} />
      </View>

      {canBack ? (
        <View style={styles.actions}>
          <Button
            label="Back this campaign"
            size="lg"
            onPress={preview ? () => toast('Backing opens once your campaign is approved.') : onBack}
            style={styles.primary}
          />
          {!preview && <FollowButton campaignId={campaign.id} size={56} />}
        </View>
      ) : (
        <View style={styles.closedWrap}>
          <View style={styles.closed}>
            <Text variant="subhead" color="textMuted" style={styles.closedText}>
              {statusMeta[campaign.status].next}
            </Text>
            {!preview && <FollowButton campaignId={campaign.id} />}
          </View>
          {!preview && hasReport(campaign.status) && (
            <Button
              label={campaign.status === 'completed' ? 'Final report' : 'Delivery report'}
              variant="secondary"
              icon={FileTextIcon}
              fullWidth
              onPress={() => router.push({ pathname: '/report/[id]', params: { id: campaign.id } })}
            />
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.md },
  amounts: { gap: 2, flex: 1 },
  stats: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.md,
  },
  stat: { flex: 1, gap: 2 },
  reach: { gap: 2 },
  actions: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  primary: { flex: 1, alignSelf: 'auto' },
  closedWrap: { gap: space.md },
  closed: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  closedText: { flex: 1 },
});
