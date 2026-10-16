import type { StatusTone } from './lifecycle';
import type { FeeBreakdown } from './money';
import type { Contribution, ContributionStatus } from './types';

export const contributionStatusMeta: Record<ContributionStatus, { label: string; tone: StatusTone; charged: boolean }> = {
  succeeded: { label: 'Paid', tone: 'success', charged: true },
  pending: { label: 'Pending', tone: 'warning', charged: true },
  failed: { label: 'Declined', tone: 'danger', charged: false },
  cancelled: { label: 'Cancelled', tone: 'neutral', charged: false },
};

/** The fee breakdown recorded at payment time (never recomputed, so old receipts stay accurate). */
export function feesOf(c: Contribution): FeeBreakdown {
  return {
    contributionCents: c.amountCents,
    processingFeeCents: c.processingFeeCents,
    totalChargeCents: c.totalChargeCents,
    platformFeeCents: c.platformFeeCents,
    adBudgetCents: c.adBudgetCents,
  };
}
