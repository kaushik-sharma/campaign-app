/**
 * Every demo assumption in one place. Figures derived from these are always labeled
 * as estimates or demo data in the UI.
 */
export const demo = {
  network: {
    /** Random latency range applied to every mock request. */
    latencyMs: [300, 1200] as [number, number],
    /** Share of mock requests that fail, so error and retry states actually appear. */
    failureRate: 0.05,
    pageSize: 8,
  },
  reach: {
    /** Assumed average cost per 1,000 ad impressions. */
    assumedCpmUsd: 10,
    /** Assumed average times each person sees the ad. */
    avgFrequency: 2.5,
    /** Range shown around the midpoint (±30%). */
    spread: 0.3,
  },
  fees: {
    /** Platform fee taken from funds raised: covers review, ad setup and reporting. */
    platformPct: 0.1,
    /** Card processing added on top of the contribution at checkout. */
    processingPct: 0.029,
    processingFixedCents: 30,
  },
  funding: {
    /** Below this, an unsuccessful campaign refunds every backer instead of distributing. */
    minimumToDistributeCents: 25_000,
    presetAmountsCents: [1_000, 2_500, 5_000, 10_000],
    defaultAmountCents: 2_500,
    minContributionCents: 100,
    maxContributionCents: 1_000_000,
    /** Progress points that create an activity event for backers and followers. */
    milestones: [0.25, 0.5, 0.75, 1],
  },
  lifecycle: {
    autoAdvance: true,
    /** Seconds after submission until the review decision, then until funding opens. */
    reviewDecisionSec: 20,
    openForFundingSec: 40,
    /** How long a newly opened campaign accepts contributions. */
    fundingWindowDays: 30,
  },
  creation: {
    titleMax: 60,
    titleMin: 10,
    summaryMin: 40,
    summaryMax: 200,
    storyMinChars: 150,
    goalMinCents: 25_000,
    goalMaxCents: 10_000_000,
    durationOptionsDays: [7, 14, 30],
    maxAdImages: 4,
    maxStoryBlocks: 24,
    /** Autosave fires this long after the last edit. */
    autosaveMs: 700,
    image: { maxBytes: 10 * 1024 * 1024, minShortSide: 600, recommendedShortSide: 1080 },
    video: { maxBytes: 100 * 1024 * 1024, minMs: 3_000, maxMs: 60_000 },
  },
  payments: {
    /** A pending demo payment confirms after this many seconds. */
    pendingResolveSec: 8,
    demoCardLast4: '4242',
  },
  ai: {
    thinkingMs: [1500, 3000] as [number, number],
  },
  demoAccount: {
    email: 'demo@campaigns.app',
    password: 'demo1234',
  },
} as const;
