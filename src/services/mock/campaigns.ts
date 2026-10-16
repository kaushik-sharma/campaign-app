import { z } from 'zod';

import { demo } from '@/config/demo';
import { isPublic } from '@/domain/lifecycle';
import { fundingProgress } from '@/domain/money';
import type {
  Campaign,
  CampaignListParams,
  CampaignSort,
  CampaignSummary,
  HomeFeed,
  ProgressBand,
} from '@/domain/types';

import type { CampaignService } from '../contracts';
import { ServiceError } from '../errors';
import { mockAuthService } from './auth';
import { db } from './db';
import { simulateRequest } from './network';

const answer = z.enum(['no', 'somewhat', 'yes']);
const feedbackSchema = z.object({ visualsEncouraged: answer, changedMind: answer });

const ENDING_SOON_DAYS = 7;
const JUST_LAUNCHED_DAYS = 14;

export function toSummary(c: Campaign): CampaignSummary {
  return {
    id: c.id,
    title: c.title,
    summary: c.summary,
    category: c.category,
    creator: { id: c.creator.id, name: c.creator.name, type: c.creator.type },
    cover: c.cover,
    status: c.status,
    goalCents: c.goalCents,
    raisedCents: c.raisedCents,
    backerCount: c.backerCount,
    durationDays: c.durationDays,
    publishedAt: c.publishedAt,
    fundingEndsAt: c.fundingEndsAt,
    featured: c.featured,
    trendScore: c.trendScore,
  };
}

function matchesQuery(c: Campaign, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [c.title, c.summary, c.creator.name, c.creator.location, ...c.audience.interests]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

function inBand(c: Campaign, band: ProgressBand): boolean {
  const p = fundingProgress(c.raisedCents, c.goalCents);
  switch (band) {
    case 'early':
      return p < 0.5;
    case 'halfway':
      return p >= 0.5 && p < 0.9;
    case 'almost':
      return p >= 0.9;
    default:
      return true;
  }
}

function isEndingSoon(c: Campaign, now: number): boolean {
  if (c.status !== 'funding' || !c.fundingEndsAt) return false;
  const left = new Date(c.fundingEndsAt).getTime() - now;
  return left > 0 && left <= ENDING_SOON_DAYS * 86_400_000;
}

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

function sorter(sort: CampaignSort, now: number): (a: Campaign, b: Campaign) => number {
  switch (sort) {
    case 'newest':
      return (a, b) => time(b.publishedAt) - time(a.publishedAt);
    case 'ending-soon':
      // Campaigns still funding first, soonest deadline first; everything else after.
      return (a, b) => {
        const rank = (c: Campaign) =>
          c.status === 'funding' && time(c.fundingEndsAt) > now ? time(c.fundingEndsAt) : Infinity;
        return rank(a) - rank(b);
      };
    case 'most-funded':
      return (a, b) => b.raisedCents - a.raisedCents;
    case 'closest-to-goal':
      // Only campaigns still short of their goal compete; funded ones sort last.
      return (a, b) => {
        const gap = (c: Campaign) => {
          const p = fundingProgress(c.raisedCents, c.goalCents);
          return p < 1 ? 1 - p : 2;
        };
        return gap(a) - gap(b);
      };
    default:
      return (a, b) => b.trendScore - a.trendScore;
  }
}

/** Opaque cursor: the offset into the filtered, sorted result set. */
const encodeCursor = (offset: number) => `o:${offset}`;
function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  const offset = Number(cursor.slice(2));
  if (!cursor.startsWith('o:') || !Number.isInteger(offset) || offset < 0) {
    throw new ServiceError('validation', 'Invalid cursor');
  }
  return offset;
}

export const mockCampaignService: CampaignService = {
  list(params: CampaignListParams, opts) {
    return simulateRequest(async () => {
      await db.ready();
      const now = Date.now();
      const { query = '', category, sort = 'trending', filters = {} } = params;
      const limit = Math.min(Math.max(params.limit ?? demo.network.pageSize, 1), 50);
      const offset = decodeCursor(params.cursor);

      const all = [...db.tables.campaigns.values()]
        .filter((c) => isPublic(c.status))
        .filter((c) => !category || c.category === category)
        .filter((c) => matchesQuery(c, query))
        .filter((c) => !filters.statuses?.length || filters.statuses.includes(c.status))
        .filter((c) => !filters.creatorTypes?.length || filters.creatorTypes.includes(c.creator.type))
        .filter((c) => inBand(c, filters.progress ?? 'any'))
        .filter((c) => !filters.endingSoon || isEndingSoon(c, now))
        .sort(sorter(sort, now));

      const items = all.slice(offset, offset + limit).map(toSummary);
      const next = offset + limit;
      return { items, nextCursor: next < all.length ? encodeCursor(next) : null, total: all.length };
    }, opts);
  },

  featured(opts) {
    return simulateRequest(async () => {
      await db.ready();
      return [...db.tables.campaigns.values()]
        .filter((c) => c.featured && isPublic(c.status))
        .sort((a, b) => b.trendScore - a.trendScore)
        .map(toSummary);
    }, opts);
  },

  home(opts) {
    return simulateRequest(async (): Promise<HomeFeed> => {
      await db.ready();
      const now = Date.now();
      const all = [...db.tables.campaigns.values()];
      const used = new Set<string>();
      const take = (list: Campaign[], max: number) => {
        const picked = list.filter((c) => !used.has(c.id)).slice(0, max);
        picked.forEach((c) => used.add(c.id));
        return picked.map(toSummary);
      };
      const funding = all.filter((c) => c.status === 'funding');

      const [lead = null] = take(
        funding.filter((c) => c.featured).sort((a, b) => b.trendScore - a.trendScore),
        1,
      );
      const endingSoon = take(
        funding.filter((c) => isEndingSoon(c, now)).sort((a, b) => time(a.fundingEndsAt) - time(b.fundingEndsAt)),
        5,
      );
      const nowPromoting = take(
        all.filter((c) => c.status === 'promoting').sort((a, b) => b.trendScore - a.trendScore),
        5,
      );
      const justLaunched = take(
        funding
          .filter((c) => now - time(c.publishedAt) <= JUST_LAUNCHED_DAYS * 86_400_000)
          .sort((a, b) => time(b.publishedAt) - time(a.publishedAt)),
        3,
      );
      return { lead, endingSoon, nowPromoting, justLaunched };
    }, opts);
  },

  get(id, opts) {
    return simulateRequest(async () => {
      await db.ready();
      const campaign = db.tables.campaigns.get(id);
      if (!campaign || !isPublic(campaign.status)) {
        throw new ServiceError('not-found', 'Campaign not found');
      }
      return campaign;
    }, opts);
  },

  getFeedback(id, opts) {
    return simulateRequest(async () => {
      await db.ready();
      return db.getFeedback(id);
    }, opts);
  },

  submitFeedback(id, feedback) {
    return simulateRequest(async () => {
      await db.ready();
      const parsed = feedbackSchema.safeParse(feedback);
      if (!parsed.success) throw new ServiceError('validation', 'Choose an answer for both questions');
      const campaign = db.tables.campaigns.get(id);
      if (!campaign || !isPublic(campaign.status)) throw new ServiceError('not-found', 'Campaign not found');
      db.setFeedback(id, parsed.data);
      return parsed.data;
    });
  },

  getEngagement(id, opts) {
    return simulateRequest(async () => {
      await db.ready();
      const user = (await mockAuthService.getSession())?.user;
      return user ? db.engagement(user.id, id) : { following: false, saved: false };
    }, opts);
  },

  setEngagement(id, patch) {
    return simulateRequest(async () => {
      await db.ready();
      const user = (await mockAuthService.getSession())?.user;
      if (!user) throw new ServiceError('unauthorized', 'Sign in to follow or save campaigns.');
      const campaign = db.tables.campaigns.get(id);
      if (!campaign || !isPublic(campaign.status)) throw new ServiceError('not-found', 'Campaign not found');
      const next = { ...db.engagement(user.id, id), ...patch };
      db.setEngagement(user.id, id, next);
      return next;
    });
  },
};
