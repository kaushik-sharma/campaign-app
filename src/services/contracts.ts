/**
 * Typed service contracts. Screens reach these only through `src/features/*` hooks.
 * The mock (`./mock`) and the future Supabase implementation (`./supabase`) both satisfy them,
 * so swapping backends never touches UI code.
 *
 * Drafts, contributions, activity, reports and AI contracts are added in the phases that
 * introduce them (see docs/PLAN.md).
 */
import type {
  Campaign,
  CampaignListParams,
  CampaignSummary,
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
  dev: DevService;
};

export type { User };
