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
  /** A large serif line inside the story, e.g. a section-opening headline. */
  | { id: string; type: 'headline'; text: string }
  /** The lede: the opening paragraph in italic serif. */
  | { id: string; type: 'intro'; text: string }
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'image'; image: ImageAsset; caption?: string }
  | { id: string; type: 'stat'; value: string; label: string; sourceId?: string }
  | { id: string; type: 'quote'; text: string; attribution?: string }
  /** Suggested audience actions. Published as the campaign's "What you can do" list. */
  | { id: string; type: 'actions'; items: string[] };

export type StoryBlockType = StoryBlock['type'];

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
  /** For "changes requested": the creation step the feedback is about, reopened by "Edit & resubmit". */
  editStep?: 'basics' | 'story' | 'visuals' | 'reach' | 'submit';
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

export type FeedbackAnswer = 'no' | 'somewhat' | 'yes';

/** Reader feedback on a campaign (PRD: did the visuals help, did the message change minds). */
export type CampaignFeedback = {
  visualsEncouraged: FeedbackAnswer;
  changedMind: FeedbackAnswer;
};

/** Server-curated Home sections. A campaign appears in at most one section. */
export type HomeFeed = {
  lead: CampaignSummary | null;
  endingSoon: CampaignSummary[];
  nowPromoting: CampaignSummary[];
  justLaunched: CampaignSummary[];
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

/** What the demo card does when charged. Real payments report these as provider events. */
export type SimulatedOutcome = 'approve' | 'pending' | 'decline';

export type ContributionStatus = 'succeeded' | 'pending' | 'failed' | 'cancelled';

export type CheckoutInput = {
  campaignId: string;
  amountCents: Cents;
  /** Required for guests; ignored when signed in (the account email is used). */
  email?: string;
  /** Show the backer's name publicly. Private by default. */
  showName: boolean;
  /** Same key on a retry returns the original result instead of charging twice. */
  idempotencyKey: string;
  /** Demo card behaviour, or 'cancel' when the backer abandons payment. */
  simulate: SimulatedOutcome | 'cancel';
};

export type Contribution = {
  id: string;
  receiptNumber: string;
  campaignId: string;
  campaignTitle: string;
  status: ContributionStatus;
  amountCents: Cents;
  processingFeeCents: Cents;
  totalChargeCents: Cents;
  platformFeeCents: Cents;
  adBudgetCents: Cents;
  userId: string | null;
  email: string;
  /** The name shown publicly, or null for an anonymous backer. */
  publicName: string | null;
  cardLast4: string;
  createdAt: ISODate;
  /** Set when a pending payment is confirmed or a payment fails. */
  settledAt: ISODate | null;
  failureReason: string | null;
  /** Campaign funding immediately before and after this contribution counted. Success only. */
  funding: { beforeCents: Cents; afterCents: Cents; goalCents: Cents } | null;
};

export type ActivityKind =
  | 'payment-succeeded'
  | 'payment-pending'
  | 'payment-failed'
  | 'payment-cancelled'
  | 'milestone'
  | 'goal-reached'
  | 'submitted'
  | 'approved'
  | 'changes-requested'
  | 'rejected'
  | 'funding-open'
  | 'funding-ended'
  | 'refund'
  | 'distribution-started'
  | 'report-ready'
  | 'update-posted'
  | 'welcome'
  | 'sign-in';

/** Activity filter groups: your own campaigns, ones you backed, ones you follow, your account. */
export type ActivityGroup = 'mine' | 'backed' | 'following' | 'account';

/** Where tapping an activity item goes. */
export type ActivityLink =
  | { screen: 'receipt' | 'manage' | 'report' | 'campaign'; id: string }
  | { screen: 'payments' | 'profile' };

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  campaignId: string;
  title: string;
  body: string;
  at: ISODate;
  read: boolean;
  /** Opens the receipt when set; otherwise the campaign. */
  contributionId?: string;
  /** For the creator's own campaign events: opens its review status instead of the public page. */
  opensStatus?: boolean;
  group?: ActivityGroup;
  link?: ActivityLink;
};

/** The current reader's relationship to a campaign. */
export type Engagement = {
  following: boolean;
  saved: boolean;
};
