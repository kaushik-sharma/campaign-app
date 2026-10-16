import type { Campaign } from '@/domain/types';
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
};

const emptyOverlay = (): Overlay => ({ campaignPatches: {} });

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

  async reset(): Promise<void> {
    overlay = emptyOverlay();
    tables = build(overlay);
    await removeKeys([OVERLAY_KEY]);
  },
};
