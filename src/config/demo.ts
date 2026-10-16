/**
 * Every demo assumption in one place. Figures derived from these are always labelled
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
  },
  lifecycle: {
    autoAdvance: true,
    /** Seconds after submission for: under review → decision → available for funding. */
    stepDelaysSec: [20, 40, 60] as [number, number, number],
  },
  payments: {
    pendingResolveSec: 8,
  },
  ai: {
    thinkingMs: [1500, 3000] as [number, number],
  },
  demoAccount: {
    email: 'demo@campaigns.app',
    password: 'demo1234',
  },
} as const;
