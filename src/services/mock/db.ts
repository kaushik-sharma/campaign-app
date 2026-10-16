import type { ActivityEvent, Campaign, CampaignFeedback, Contribution, Engagement } from '@/domain/types';
import { readJSON, removeKeys, writeJSON } from '@/lib/storage';

import { seedCampaigns } from './seed/campaigns';

/**
 * The mock "server" database: read-only seed tables plus a persisted overlay, so changes made
 * during a demo (contributions, drafts, follows, lifecycle moves) survive app restarts.
 */
const OVERLAY_KEY = 'mockdb:v1';

type Overlay = {
  /** Field-level changes to seeded or user-created campaigns, keyed by id. */
  campaignPatches: Record<string, Partial<Campaign>>;
  /** Reader feedback per campaign. Keyed by campaign id (one reader per device in the mock). */
  feedback: Record<string, CampaignFeedback>;
  /** Every payment attempt, newest last. */
  contributions: Contribution[];
  /** Idempotency key → contribution id, so a retried checkout never charges twice. */
  idempotency: Record<string, string>;
  /** Activity per owner (user id, or `guest` for guest activity on this device), newest last. */
  activity: Record<string, ActivityEvent[]>;
  /** Follow / save state per user id, keyed by campaign id. */
  engagement: Record<string, Record<string, Engagement>>;
};

const emptyOverlay = (): Overlay => ({
  campaignPatches: {},
  feedback: {},
  contributions: [],
  idempotency: {},
  activity: {},
  engagement: {},
});

type Tables = {
  campaigns: Map<string, Campaign>;
};

let overlay: Overlay = emptyOverlay();
let tables: Tables = build(overlay);
let ready: Promise<void> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function build(o: Overlay): Tables {
  const campaigns = new Map<string, Campaign>();
  for (const c of seedCampaigns()) {
    campaigns.set(c.id, { ...c, ...o.campaignPatches[c.id] });
  }
  return { campaigns };
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => void writeJSON(OVERLAY_KEY, overlay), 250);
}

export const db = {
  /** Resolves once the persisted overlay has been loaded. Every service awaits this first. */
  ready(): Promise<void> {
    ready ??= readJSON<Overlay>(OVERLAY_KEY).then((saved) => {
      overlay = { ...emptyOverlay(), ...saved };
      tables = build(overlay);
    });
    return ready;
  },

  get tables(): Readonly<Tables> {
    return tables;
  },

  patchCampaign(id: string, patch: Partial<Campaign>) {
    const current = tables.campaigns.get(id);
    if (!current) return;
    tables.campaigns.set(id, { ...current, ...patch });
    overlay.campaignPatches[id] = { ...overlay.campaignPatches[id], ...patch };
    schedulePersist();
  },

  getFeedback(id: string): CampaignFeedback | null {
    return overlay.feedback[id] ?? null;
  },

  setFeedback(id: string, feedback: CampaignFeedback) {
    overlay.feedback[id] = feedback;
    schedulePersist();
  },

  contributions(): Contribution[] {
    return overlay.contributions;
  },

  findContribution(id: string): Contribution | undefined {
    return overlay.contributions.find((c) => c.id === id);
  },

  contributionForKey(key: string): Contribution | undefined {
    const id = overlay.idempotency[key];
    return id ? this.findContribution(id) : undefined;
  },

  saveContribution(contribution: Contribution, idempotencyKey?: string) {
    const index = overlay.contributions.findIndex((c) => c.id === contribution.id);
    if (index >= 0) overlay.contributions[index] = contribution;
    else overlay.contributions.push(contribution);
    if (idempotencyKey) overlay.idempotency[idempotencyKey] = contribution.id;
    schedulePersist();
  },

  activity(owner: string): ActivityEvent[] {
    return overlay.activity[owner] ?? [];
  },

  addActivity(owner: string, event: ActivityEvent) {
    overlay.activity[owner] = [...(overlay.activity[owner] ?? []), event];
    schedulePersist();
  },

  markActivityRead(owner: string) {
    overlay.activity[owner] = (overlay.activity[owner] ?? []).map((e) => ({ ...e, read: true }));
    schedulePersist();
  },

  engagement(userId: string, campaignId: string): Engagement {
    return overlay.engagement[userId]?.[campaignId] ?? { following: false, saved: false };
  },

  /** Every user id following a campaign. */
  followersOf(campaignId: string): string[] {
    return Object.entries(overlay.engagement)
      .filter(([, byCampaign]) => byCampaign[campaignId]?.following)
      .map(([userId]) => userId);
  },

  setEngagement(userId: string, campaignId: string, value: Engagement) {
    overlay.engagement[userId] = { ...overlay.engagement[userId], [campaignId]: value };
    schedulePersist();
  },

  async reset(): Promise<void> {
    overlay = emptyOverlay();
    tables = build(overlay);
    await removeKeys([OVERLAY_KEY]);
  },
};
