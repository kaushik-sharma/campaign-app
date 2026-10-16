/**
 * Typed service contracts. Screens reach these only through `src/features/*` hooks.
 * The mock (`./mock`) and the future Supabase implementation (`./supabase`) both satisfy them,
 * so swapping backends never touches UI code.
 *
 * Report contracts are added in the phase that introduces them (see docs/PLAN.md).
 */
import type { CampaignStatus } from '@/domain/lifecycle';
import type {
  BasicsSuggestion,
  Draft,
  DraftPatch,
  DraftSummary,
  MediaAsset,
  VoiceAnswers,
} from '@/domain/draft';
import type {
  ActivityEvent,
  Campaign,
  CampaignFeedback,
  CampaignListParams,
  CampaignSummary,
  CategoryId,
  CheckoutInput,
  Contribution,
  Engagement,
  HomeFeed,
  Page,
  Session,
  User,
} from '@/domain/types';

type Opts = { signal?: AbortSignal };

export type AuthChangeListener = (session: Session | null) => void;

export interface AuthService {
  /** Restores a persisted session, if any. Does not hit the network. */
  getSession(): Promise<Session | null>;
  signIn(input: { email: string; password: string }): Promise<Session>;
  signUp(input: { name: string; email: string; password: string }): Promise<Session>;
  signOut(): Promise<void>;
  onAuthStateChange(listener: AuthChangeListener): () => void;
}

export interface CampaignService {
  /** Public discovery: only campaigns that have passed review. Cursor-paginated. */
  list(params: CampaignListParams, opts?: Opts): Promise<Page<CampaignSummary>>;
  featured(opts?: Opts): Promise<CampaignSummary[]>;
  /** Curated Home sections, de-duplicated server-side. */
  home(opts?: Opts): Promise<HomeFeed>;
  get(id: string, opts?: Opts): Promise<Campaign>;
  /** The current reader's feedback on a campaign, if they gave any. */
  getFeedback(id: string, opts?: Opts): Promise<CampaignFeedback | null>;
  submitFeedback(id: string, feedback: CampaignFeedback): Promise<CampaignFeedback>;
  /** Follow / save state for the signed-in reader. Guests always get both false. */
  getEngagement(id: string, opts?: Opts): Promise<Engagement>;
  /** Requires a session (`unauthorized` otherwise). */
  setEngagement(id: string, patch: Partial<Engagement>): Promise<Engagement>;
}

export interface ContributionService {
  /**
   * Charges the backer and records the attempt. Resolves with the attempt whatever the payment
   * outcome (succeeded, pending, failed, cancelled); only rejects when the request itself fails,
   * in which case nothing was charged and the same idempotency key can be retried safely.
   */
  checkout(input: CheckoutInput): Promise<Contribution>;
  /** Pending payments settle server-side; poll this to see the result. */
  get(id: string, opts?: Opts): Promise<Contribution>;
  /** Payment history for the signed-in user, or for guest payments made on this device. */
  listMine(opts?: Opts): Promise<Contribution[]>;
}

export interface ActivityService {
  /** Newest first. */
  list(opts?: Opts): Promise<ActivityEvent[]>;
  markAllRead(): Promise<void>;
}

/** Campaign drafts. Guests can draft on this device; submitting requires a session. */
export interface DraftService {
  /** Unsubmitted drafts for the current user (or guest drafts on this device), newest first. */
  list(opts?: Opts): Promise<DraftSummary[]>;
  get(id: string, opts?: Opts): Promise<Draft>;
  /** A new draft, optionally pre-filled by AI (voice creation). */
  create(input: { origin: Draft['origin']; patch?: DraftPatch }): Promise<Draft>;
  /** Autosave: replaces the stored draft and returns it with the server's `updatedAt`. */
  save(draft: Draft): Promise<Draft>;
  remove(id: string): Promise<void>;
  /**
   * Validates every step and submits for review (`unauthorized` without a session, `validation`
   * with field errors otherwise). Resubmitting after "changes requested" updates the same campaign.
   */
  submit(id: string): Promise<Campaign>;
}

/** A creator's own campaigns in any status, including ones not yet public. */
export interface CreatorService {
  listCampaigns(opts?: Opts): Promise<CampaignSummary[]>;
  getCampaign(id: string, opts?: Opts): Promise<Campaign>;
  /** The draft a submitted campaign came from, for "edit and resubmit". */
  draftFor(campaignId: string, opts?: Opts): Promise<string | null>;
}

/** Demo AI. Output types cannot carry a funding goal (see `DraftPatch`). */
export interface AiService {
  suggestBasics(
    input: { title: string; summary: string; category: CategoryId | null; storyText: string },
    opts?: Opts,
  ): Promise<BasicsSuggestion[]>;
  draftFromAnswers(answers: VoiceAnswers, opts?: Opts): Promise<DraftPatch>;
  generateImages(input: { category: CategoryId | null; count: number }, opts?: Opts): Promise<MediaAsset[]>;
}

export type ReviewDecision = 'approve' | 'changes' | 'reject';

export type LifecycleSettings = {
  /** Advance submitted campaigns on timers. */
  autoAdvance: boolean;
  /** What the simulated review decides. */
  decision: ReviewDecision;
};

export type NetworkSettings = {
  /** 0–1 share of requests that fail. */
  failureRate: number;
  latency: 'fast' | 'realistic' | 'slow';
  offline: boolean;
};

/** Demo controls. The Supabase implementation turns these into no-ops. */
export interface DevService {
  readonly available: boolean;
  getNetwork(): NetworkSettings;
  setNetwork(patch: Partial<NetworkSettings>): void;
  /** Force the next `count` requests to fail with a server error. */
  failNext(count: number): void;
  resetDemoData(): Promise<void>;
  getLifecycle(): LifecycleSettings;
  setLifecycle(patch: Partial<LifecycleSettings>): void;
  /** Moves a campaign (default: the newest one in review) to its next status now. */
  advanceCampaign(id?: string): Promise<{ id: string; status: CampaignStatus } | null>;
}

export type Services = {
  auth: AuthService;
  campaigns: CampaignService;
  contributions: ContributionService;
  activity: ActivityService;
  drafts: DraftService;
  creator: CreatorService;
  ai: AiService;
  dev: DevService;
};

export type { User };
