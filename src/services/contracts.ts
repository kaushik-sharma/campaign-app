/**
 * Typed service contracts. Screens reach these only through `src/features/*` hooks.
 * The mock (`./mock`) and the future Supabase implementation (`./supabase`) both satisfy them,
 * so swapping backends never touches UI code.
 *
 * Drafts, reports and AI contracts are added in the phases that introduce them (see docs/PLAN.md).
 */
import type {
  ActivityEvent,
  Campaign,
  CampaignFeedback,
  CampaignListParams,
  CampaignSummary,
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
}

export type Services = {
  auth: AuthService;
  campaigns: CampaignService;
  contributions: ContributionService;
  activity: ActivityService;
  dev: DevService;
};

export type { User };
