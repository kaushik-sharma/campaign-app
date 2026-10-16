/**
 * Campaign lifecycle state machine (PRD):
 * Draft → Submitted → Changes requested | Approved → Funding → Goal reached | Funding ended
 *   → Distribution prep → Promoting → Completed
 * Exceptional: Rejected, Cancelled, Refund pending, Failed.
 *
 * Funding completion never implies advertising has launched: promotion only follows
 * distribution prep.
 */
export const CAMPAIGN_STATUSES = [
  'draft',
  'submitted',
  'changes-requested',
  'approved',
  'funding',
  'goal-reached',
  'funding-ended',
  'distribution-prep',
  'promoting',
  'completed',
  'rejected',
  'cancelled',
  'refund-pending',
  'failed',
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const transitions: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['changes-requested', 'approved', 'rejected', 'cancelled'],
  'changes-requested': ['submitted', 'cancelled'],
  approved: ['funding', 'cancelled'],
  funding: ['goal-reached', 'funding-ended', 'cancelled'],
  'goal-reached': ['distribution-prep', 'cancelled'],
  'funding-ended': ['distribution-prep', 'refund-pending'],
  'distribution-prep': ['promoting', 'failed', 'refund-pending'],
  promoting: ['completed', 'failed'],
  completed: [],
  rejected: [],
  cancelled: ['refund-pending'],
  'refund-pending': [],
  failed: ['refund-pending'],
};

export function canTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return transitions[from].includes(to);
}

export function nextStatuses(from: CampaignStatus): CampaignStatus[] {
  return transitions[from];
}

type StatusMeta = {
  label: string;
  tone: StatusTone;
  /** Plain-language "what happens next" copy for timelines and dashboards. */
  next: string;
};

export const statusMeta: Record<CampaignStatus, StatusMeta> = {
  draft: { label: 'Draft', tone: 'neutral', next: 'Finish the five steps and submit for review.' },
  submitted: {
    label: 'Under review',
    tone: 'info',
    next: 'Our team checks the story, sources, visuals and targeting.',
  },
  'changes-requested': {
    label: 'Changes requested',
    tone: 'warning',
    next: 'Review the feedback, edit and resubmit.',
  },
  approved: {
    label: 'Approved',
    tone: 'info',
    next: 'The campaign opens for backing shortly.',
  },
  funding: {
    label: 'Funding',
    tone: 'info',
    next: 'Backers are pooling contributions toward distribution.',
  },
  'goal-reached': {
    label: 'Goal reached',
    tone: 'success',
    next: 'Funding is complete. Distribution setup begins next.',
  },
  'funding-ended': {
    label: 'Funding ended',
    tone: 'neutral',
    next: 'Funds raised move to distribution at a smaller scale.',
  },
  'distribution-prep': {
    label: 'Preparing ads',
    tone: 'info',
    next: 'Ads are being set up and approved with distribution partners.',
  },
  promoting: {
    label: 'Promoting',
    tone: 'success',
    next: 'Ads are live. Delivery is reported as it comes in.',
  },
  completed: {
    label: 'Completed',
    tone: 'neutral',
    next: 'Distribution has finished. The final report is available.',
  },
  rejected: {
    label: 'Not approved',
    tone: 'danger',
    next: 'This campaign did not meet the campaign rules.',
  },
  cancelled: { label: 'Cancelled', tone: 'neutral', next: 'This campaign was cancelled.' },
  'refund-pending': {
    label: 'Refund pending',
    tone: 'warning',
    next: 'Backers are being refunded.',
  },
  failed: {
    label: 'Distribution failed',
    tone: 'danger',
    next: 'Ads could not be delivered. Unspent funds are refunded.',
  },
};

/** Statuses visible in public discovery (Home, Explore). */
export const PUBLIC_STATUSES: CampaignStatus[] = [
  'funding',
  'goal-reached',
  'funding-ended',
  'distribution-prep',
  'promoting',
  'completed',
];

export function isPublic(status: CampaignStatus): boolean {
  return PUBLIC_STATUSES.includes(status);
}

/** Only these statuses accept new contributions. */
export function acceptsContributions(status: CampaignStatus): boolean {
  return status === 'funding' || status === 'goal-reached';
}
