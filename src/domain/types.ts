import type { CampaignStatus } from './lifecycle';

export type { CampaignStatus };

export type CategoryId =
  | 'environment'
  | 'health'
  | 'science'
  | 'education'
  | 'public-policy'
  | 'economic-policy'
  | 'community'
  | 'arts-culture'
  | 'business'
  | 'other';

export type CreatorType =
  | 'individual'
  | 'influencer'
  | 'nonprofit'
  | 'organization'
  | 'business'
  | 'community-group';

/** Integer cents. Never use floating-point dollars for money. */
export type Cents = number;

export type ISODate = string;

export type ImageAsset = {
  /** A bundled `require()` id or a remote URI. */
  source: number | { uri: string };
  alt: string;
  blurhash?: string;
  credit?: string;
};

export type ReachRange = { low: number; mid: number; high: number };

export type Creator = {
  id: string;
  name: string;
  type: CreatorType;
  location: string;
  bio: string;
};

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt?: ISODate;
};

export type StoryBlock =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'image'; image: ImageAsset; caption?: string }
  | { id: string; type: 'stat'; value: string; label: string; sourceId?: string }
  | { id: string; type: 'quote'; text: string; attribution?: string };

export type Channel = 'social-feed' | 'stories' | 'search' | 'news-sites' | 'video';

export type AudienceSettings = {
  locations: string[];
  ageRange: [number, number];
  interests: string[];
  channels: Channel[];
  /** Percent per channel, sums to 100. */
  budgetSplit: Partial<Record<Channel, number>>;
};

export type AdCreative = {
  headline: string;
  description: string;
  callToAction: string;
};

export type StatusEvent = {
  status: CampaignStatus;
  at: ISODate;
  note?: string;
};

export type CampaignUpdate = {
  id: string;
  title: string;
  body: string;
  at: ISODate;
};

/** What lists and cards need. */
export type CampaignSummary = {
  id: string;
  title: string;
  summary: string;
  category: CategoryId;
  creator: Pick<Creator, 'id' | 'name' | 'type'>;
  cover: ImageAsset | null;
  status: CampaignStatus;
  goalCents: Cents;
  raisedCents: Cents;
  backerCount: number;
  durationDays: number;
  publishedAt: ISODate | null;
  fundingEndsAt: ISODate | null;
  featured: boolean;
  /** Deterministic popularity signal used for "Trending" sort. */
  trendScore: number;
};

/** Full campaign for the detail page. */
export type Campaign = CampaignSummary & {
  creator: Creator;
  story: StoryBlock[];
  sources: Source[];
  suggestedActions: string[];
  audience: AudienceSettings;
  ad: AdCreative;
  submittedAt: ISODate | null;
  history: StatusEvent[];
  updates: CampaignUpdate[];
};

export type CampaignSort = 'trending' | 'newest' | 'ending-soon' | 'most-funded' | 'closest-to-goal';

export type ProgressBand = 'any' | 'early' | 'halfway' | 'almost';

export type CampaignFilters = {
  statuses?: CampaignStatus[];
  creatorTypes?: CreatorType[];
  progress?: ProgressBand;
  endingSoon?: boolean;
};

export type CampaignListParams = {
  query?: string;
  category?: CategoryId | null;
  sort?: CampaignSort;
  filters?: CampaignFilters;
  cursor?: string | null;
  limit?: number;
};

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
  total: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: ISODate;
};

export type Session = {
  user: User;
  token: string;
  expiresAt: ISODate;
};
