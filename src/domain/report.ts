import { demo } from '@/config/demo';

import type { CampaignStatus } from './lifecycle';
import { computeFees, estimateReach } from './money';
import type { Campaign, Cents, Channel, ISODate, ReachRange } from './types';

const DAY = 86_400_000;

export type ReportPhase = 'not-started' | 'delivering' | 'final' | 'refunded';

export type ChannelDelivery = { channel: Channel; spendCents: Cents; impressions: number; clicks: number };
export type DailyPoint = { day: number; date: ISODate; impressions: number };

export type CampaignReport = {
  campaignId: string;
  title: string;
  status: CampaignStatus;
  phase: ReportPhase;
  durationDays: number;
  daysDelivered: number;
  startedAt: ISODate | null;
  money: {
    raisedCents: Cents;
    platformFeeCents: Cents;
    adBudgetCents: Cents;
    spentCents: Cents;
    unspentCents: Cents;
    /** What happens to whatever isn't spent. */
    unspentNote: string;
  };
  /** Projections from the demo assumptions. Always shown as estimates. */
  estimated: { reach: ReachRange; impressions: number };
  /** Delivery reported by ad networks. Null until ads have run. */
  measured: null | {
    impressions: number;
    reach: number;
    frequency: number;
    clicks: number;
    ctr: number;
    byChannel: ChannelDelivery[];
    daily: DailyPoint[];
  };
};

/** Small deterministic PRNG so a campaign's figures never change between screens or launches. */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (r: () => number, min: number, max: number) => min + r() * (max - min);

/** Relative click-through by channel (search intent clicks most; video least). */
const CHANNEL_CTR: Record<Channel, number> = { 'social-feed': 1, stories: 0.8, search: 2.4, 'news-sites': 0.7, video: 0.5 };

/**
 * Builds a campaign's delivery report. In the prototype the "measured" side is simulated, but
 * deterministically, so the dashboard, report and notifications always agree.
 */
export function computeReport(c: Campaign, now = Date.now()): CampaignReport {
  const r = rng(c.id);
  const fees = computeFees(c.raisedCents);
  const startedEvent = [...c.history].reverse().find((e) => e.status === 'promoting');
  const startedAt = startedEvent?.at ?? null;
  const refunded = c.status === 'refund-pending' || (c.status === 'funding-ended' && c.raisedCents < demo.funding.minimumToDistributeCents);

  const phase: ReportPhase = refunded
    ? 'refunded'
    : c.status === 'completed'
      ? 'final'
      : c.status === 'promoting'
        ? 'delivering'
        : 'not-started';

  const daysDelivered =
    phase === 'final'
      ? c.durationDays
      : phase === 'delivering' && startedAt
        ? Math.max(1, Math.min(c.durationDays, Math.ceil((now - new Date(startedAt).getTime()) / DAY)))
        : 0;

  const estimatedImpressions = Math.round((fees.adBudgetCents / 100 / demo.reach.assumedCpmUsd) * 1000);
  const estimated = { reach: estimateReach(c.raisedCents), impressions: estimatedImpressions };

  // Daily pacing: smooth weekly rhythm plus noise, normalised over the whole run.
  const weights = Array.from({ length: c.durationDays }, (_, i) => 1 + 0.22 * Math.sin((i / 7) * Math.PI * 2) + between(r, -0.15, 0.15));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const deliveredShare = weights.slice(0, daysDelivered).reduce((a, b) => a + b, 0) / totalWeight;
  const spendRate = phase === 'final' ? between(r, 0.94, 0.99) : 1;
  const performance = between(r, 0.86, 1.14);

  const spentCents = refunded || phase === 'not-started' ? 0 : Math.round(fees.adBudgetCents * deliveredShare * spendRate);
  const unspentCents = refunded ? fees.contributionCents : fees.adBudgetCents - spentCents;
  const unspentNote = refunded
    ? `Less than $${demo.funding.minimumToDistributeCents / 100} was raised, so every backer is refunded in full.`
    : phase === 'final'
      ? 'The ads didn’t spend this, so it’s refunded to backers in proportion to what they gave.'
      : phase === 'delivering'
        ? 'Still being spent. Anything left when the run ends is refunded to backers.'
        : 'Ads haven’t started yet. Spending begins once distribution is set up.';

  let measured: CampaignReport['measured'] = null;
  if (daysDelivered > 0 && spentCents > 0) {
    const fullImpressions = estimatedImpressions * performance;
    const daily = weights.slice(0, daysDelivered).map((w, day) => ({
      day,
      date: new Date((startedAt ? new Date(startedAt).getTime() : now) + day * DAY).toISOString(),
      impressions: Math.round((fullImpressions * w * spendRate) / totalWeight),
    }));
    const impressions = daily.reduce((s, d) => s + d.impressions, 0);
    const frequency = Number((demo.reach.avgFrequency * between(r, 0.9, 1.15)).toFixed(1));
    const baseCtr = between(r, 0.008, 0.016);
    const channels = (Object.entries(c.audience.budgetSplit) as [Channel, number][]).filter(([, pct]) => pct > 0);
    const byChannel = channels.map(([channel, pct]) => {
      const share = pct / 100;
      const channelImpressions = Math.round(impressions * share);
      return {
        channel,
        spendCents: Math.round(spentCents * share),
        impressions: channelImpressions,
        clicks: Math.round(channelImpressions * baseCtr * CHANNEL_CTR[channel]),
      };
    });
    const clicks = byChannel.reduce((s, ch) => s + ch.clicks, 0);
    measured = {
      impressions,
      reach: Math.round(impressions / frequency),
      frequency,
      clicks,
      ctr: impressions ? clicks / impressions : 0,
      byChannel,
      daily,
    };
  }

  return {
    campaignId: c.id,
    title: c.title,
    status: c.status,
    phase,
    durationDays: c.durationDays,
    daysDelivered,
    startedAt,
    money: {
      raisedCents: c.raisedCents,
      platformFeeCents: refunded ? 0 : fees.platformFeeCents,
      adBudgetCents: refunded ? 0 : fees.adBudgetCents,
      spentCents,
      unspentCents,
      unspentNote,
    },
    estimated,
    measured,
  };
}

/** Plain-language definitions shown in the report glossary. */
export const METRIC_GLOSSARY: { term: string; definition: string }[] = [
  { term: 'Impressions', definition: 'How many times an ad was shown. One person can see an ad more than once.' },
  { term: 'Reach', definition: 'How many different people saw an ad at least once.' },
  { term: 'Frequency', definition: 'The average number of times each person saw an ad (impressions ÷ reach).' },
  { term: 'Clicks', definition: 'How many times people tapped an ad to open the campaign.' },
  { term: 'CTR', definition: 'Click-through rate: clicks as a share of impressions.' },
  { term: 'Ad budget', definition: 'What’s left of the funds raised after the platform fee. Only this is spent on ads.' },
  { term: 'Estimated vs measured', definition: 'Estimates are projections from our assumptions and are shown with ≈ and a dashed outline. Measured figures come from the ad networks once ads run.' },
];
