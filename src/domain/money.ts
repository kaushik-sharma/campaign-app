import { demo } from '@/config/demo';

import type { Cents, ReachRange } from './types';

export type FeeBreakdown = {
  contributionCents: Cents;
  processingFeeCents: Cents;
  totalChargeCents: Cents;
  /** Portion of the contribution kept by the platform for review, setup and reporting. */
  platformFeeCents: Cents;
  /** Portion of the contribution available for advertising. */
  adBudgetCents: Cents;
};

export function computeFees(contributionCents: Cents): FeeBreakdown {
  const { processingPct, processingFixedCents, platformPct } = demo.fees;
  const processingFeeCents =
    contributionCents > 0 ? Math.round(contributionCents * processingPct) + processingFixedCents : 0;
  const platformFeeCents = Math.round(contributionCents * platformPct);
  return {
    contributionCents,
    processingFeeCents,
    totalChargeCents: contributionCents + processingFeeCents,
    platformFeeCents,
    adBudgetCents: contributionCents - platformFeeCents,
  };
}

/** People reached per $1 of ad budget at the midpoint of the demo assumptions. */
export function peoplePerDollar(): number {
  const { assumedCpmUsd, avgFrequency } = demo.reach;
  return 1000 / assumedCpmUsd / avgFrequency;
}

/**
 * Estimated people reached for a contribution. Uses the ad-budget portion only (after the
 * platform fee) and returns a range: reach is never a guarantee.
 */
export function estimateReach(contributionCents: Cents): ReachRange {
  const adDollars = computeFees(contributionCents).adBudgetCents / 100;
  const mid = adDollars * peoplePerDollar();
  const { spread } = demo.reach;
  return {
    low: Math.round(mid * (1 - spread)),
    mid: Math.round(mid),
    high: Math.round(mid * (1 + spread)),
  };
}

export function fundingProgress(raisedCents: Cents, goalCents: Cents): number {
  if (goalCents <= 0) return 0;
  return raisedCents / goalCents;
}
