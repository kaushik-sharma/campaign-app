import { z } from 'zod';

import { demo } from '@/config/demo';
import { stripInline } from '@/lib/inline-format';

import { CHANNELS } from './audience';
import type { CampaignStatus } from './lifecycle';
import type {
  AdCreative,
  AudienceSettings,
  Campaign,
  CategoryId,
  Cents,
  CreatorType,
  ImageAsset,
  ISODate,
  Source,
  StoryBlock,
  StoryBlockType,
} from './types';

export const DRAFT_STEPS = ['basics', 'story', 'visuals', 'reach', 'submit'] as const;
export type DraftStep = (typeof DRAFT_STEPS)[number];

export const draftStepLabels: Record<DraftStep, string> = {
  basics: 'Basics',
  story: 'Story',
  visuals: 'Campaign & Ad Visuals',
  reach: 'Reach',
  submit: 'Submit',
};

/** Short labels for the stepper. */
export const draftStepShortLabels: Record<DraftStep, string> = {
  basics: 'Basics',
  story: 'Story',
  visuals: 'Visuals',
  reach: 'Reach',
  submit: 'Submit',
};

/** An image or video the creator added, with the metadata the file checks need. */
export type MediaAsset = {
  image: ImageAsset;
  kind: 'image' | 'video';
  width: number;
  height: number;
  fileSize: number | null;
  mimeType: string | null;
  durationMs: number | null;
  /** Produced by demo image generation rather than picked from the device. */
  generated: boolean;
};

export type DraftBasics = {
  title: string;
  category: CategoryId | null;
  creatorName: string;
  creatorType: CreatorType | null;
  summary: string;
  cover: MediaAsset | null;
};

export type DraftStory = { blocks: StoryBlock[]; sources: Source[] };

export type DraftVisuals = {
  adImages: MediaAsset[];
  video: MediaAsset | null;
  ad: AdCreative;
  /** Ids of the optional creative-quality checks the creator ticked. */
  checklist: string[];
};

export type DraftReach = AudienceSettings & { durationDays: number };

export type DraftSubmit = {
  /** Entered by the creator. Never suggested or filled by AI. */
  goalCents: Cents | null;
  /** Ids of the submission rules the creator agreed to. */
  rules: string[];
};

export type DraftContent = {
  basics: DraftBasics;
  story: DraftStory;
  visuals: DraftVisuals;
  reach: DraftReach;
  submit: DraftSubmit;
};

export type Draft = DraftContent & {
  id: string;
  ownerId: string | null;
  origin: 'manual' | 'voice';
  /** The step the creator was on, so a resumed draft opens where they left off. */
  step: DraftStep;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type DraftSummary = Pick<Draft, 'id' | 'origin' | 'step' | 'createdAt' | 'updatedAt'> & {
  title: string;
  category: CategoryId | null;
  cover: ImageAsset | null;
};

/**
 * Everything AI is allowed to change. The funding goal and the rule agreements are absent by
 * design, so no AI output can set them (and `applyDraftPatch` ignores them at runtime too).
 */
export type DraftPatch = {
  basics?: Partial<Omit<DraftBasics, 'cover'>>;
  story?: Partial<DraftStory>;
  visuals?: { ad?: Partial<AdCreative> };
  reach?: Partial<DraftReach>;
};

/** One AI suggestion for a Basics field, offered to accept, edit or dismiss. */
export type BasicsSuggestion = {
  id: string;
  field: 'title' | 'summary' | 'category';
  value: string;
  reason: string;
};

/** Answers to the four guided voice questions, in order. */
export type VoiceAnswers = [string, string, string, string];

export const SUBMIT_RULES = [
  { id: 'accurate', label: 'The claims in my story are accurate and supported by the sources I cited.' },
  { id: 'rights', label: 'I own, or have permission to use, every image and video.' },
  { id: 'amplification', label: 'Backers pay for ads that spread this message. The money doesn’t come to me.' },
  { id: 'guidelines', label: 'My campaign follows the community guidelines.' },
  { id: 'review', label: 'Review may ask for changes, and targeting may be adjusted before ads run.' },
] as const;

export const QUALITY_CHECKS = [
  { id: 'headline-alone', label: 'The headline makes sense without the image' },
  { id: 'little-text', label: 'Images carry little or no overlaid text' },
  { id: 'faces-context', label: 'People shown are in a respectful, accurate context' },
  { id: 'no-shock', label: 'No shock, fear or before-and-after imagery' },
  { id: 'cta-matches', label: 'The call to action matches what the story asks' },
] as const;

export const CTA_OPTIONS = ['Learn more', 'Read the story', 'See the facts', 'Get involved', 'Find out how'];

export const blockTypeLabels: Record<StoryBlockType, string> = {
  headline: 'Headline',
  intro: 'Intro',
  heading: 'Heading',
  paragraph: 'Paragraph',
  image: 'Image',
  stat: 'Statistic',
  quote: 'Quote',
  actions: 'Suggested actions',
};

export const newId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function emptyBlock(type: StoryBlockType): StoryBlock {
  const id = newId('b_');
  switch (type) {
    case 'image':
      return { id, type, image: { source: { uri: '' }, alt: '' }, caption: '' };
    case 'stat':
      return { id, type, value: '', label: '' };
    case 'quote':
      return { id, type, text: '', attribution: '' };
    case 'actions':
      return { id, type, items: [''] };
    default:
      return { id, type, text: '' };
  }
}

export function emptyContent(): DraftContent {
  return {
    basics: { title: '', category: null, creatorName: '', creatorType: null, summary: '', cover: null },
    story: { blocks: [emptyBlock('intro'), emptyBlock('paragraph')], sources: [] },
    visuals: { adImages: [], video: null, ad: { headline: '', description: '', callToAction: CTA_OPTIONS[0] }, checklist: [] },
    reach: {
      locations: [],
      ageRange: [18, 65],
      interests: [],
      channels: ['social-feed', 'news-sites'],
      budgetSplit: { 'social-feed': 60, 'news-sites': 40 },
      durationDays: 14,
    },
    submit: { goalCents: null, rules: [] },
  };
}

/** Applies an AI patch field by field. Anything outside `DraftPatch` (e.g. a goal) is ignored. */
export function applyDraftPatch<T extends DraftContent>(draft: T, patch: DraftPatch): T {
  return {
    ...draft,
    basics: { ...draft.basics, ...pick(patch.basics, ['title', 'category', 'creatorName', 'creatorType', 'summary']) },
    story: { ...draft.story, ...pick(patch.story, ['blocks', 'sources']) },
    visuals: { ...draft.visuals, ad: { ...draft.visuals.ad, ...pick(patch.visuals?.ad, ['headline', 'description', 'callToAction']) } },
    reach: {
      ...draft.reach,
      ...pick(patch.reach, ['locations', 'ageRange', 'interests', 'channels', 'budgetSplit', 'durationDays']),
    },
    submit: draft.submit,
  };
}

function pick<T extends object, K extends keyof T>(obj: T | undefined, keys: K[]): Partial<Pick<T, K>> {
  const out: Partial<Pick<T, K>> = {};
  if (!obj) return out;
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

// ── Validation ──────────────────────────────────────────────────────────────────

/** Field path (e.g. `basics.title`, `story.blocks.<blockId>.text`) → message. */
export type FieldErrors = Record<string, string>;

const c = demo.creation;
const text = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Add ${label}`)
    .min(min, `${label[0].toUpperCase()}${label.slice(1)} needs at least ${min} characters`)
    .max(max, `Keep ${label} to ${max} characters`);

const basicsSchema = z.object({
  title: text('a title', c.titleMin, c.titleMax),
  category: z.string({ error: 'Choose a category' }),
  creatorName: text('your name or organization', 2, 60),
  creatorType: z.string({ error: 'Choose who is creating this' }),
  summary: text('a summary', c.summaryMin, c.summaryMax),
  cover: z.object({}, { error: 'Add a cover image' }).passthrough(),
});

const sourceSchema = z.object({
  title: z.string().trim().min(3, 'Add a source title'),
  url: z.url({ protocol: /^https?$/, error: 'Enter a full link starting with https://' }),
});

export function validateSource(input: { title: string; url: string }): FieldErrors {
  const parsed = sourceSchema.safeParse(input);
  return parsed.success ? {} : issuesToErrors(parsed.error.issues, (path) => path.join('.'));
}

function issuesToErrors(
  issues: z.core.$ZodIssue[],
  key: (path: PropertyKey[]) => string,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) errors[key(issue.path)] ??= issue.message;
  return errors;
}

function validateBasics(d: DraftContent): FieldErrors {
  const parsed = basicsSchema.safeParse({ ...d.basics, cover: d.basics.cover ?? undefined });
  return parsed.success ? {} : issuesToErrors(parsed.error.issues, (p) => `basics.${p.join('.')}`);
}

function validateStory({ story }: DraftContent): FieldErrors {
  const errors: FieldErrors = {};
  const sourceIds = new Set(story.sources.map((s) => s.id));
  let chars = 0;
  for (const b of story.blocks) {
    const key = (field: string) => `story.blocks.${b.id}.${field}`;
    switch (b.type) {
      case 'headline':
      case 'intro':
      case 'heading':
      case 'paragraph':
        if (!b.text.trim()) errors[key('text')] = `Write the ${blockTypeLabels[b.type].toLowerCase()}, or remove this block`;
        chars += stripInline(b.text).trim().length;
        break;
      case 'image':
        if (!imageUri(b.image)) errors[key('image')] = 'Choose an image, or remove this block';
        else if (!b.image.alt.trim()) errors[key('alt')] = 'Describe the image for people using screen readers';
        break;
      case 'stat':
        if (!b.value.trim()) errors[key('value')] = 'Add the figure, e.g. 40%';
        if (!b.label.trim()) errors[key('label')] = 'Say what the figure measures';
        if (!b.sourceId || !sourceIds.has(b.sourceId)) errors[key('source')] = 'Statistics must cite a source';
        break;
      case 'quote':
        if (!b.text.trim()) errors[key('text')] = 'Add the quote, or remove this block';
        break;
      case 'actions':
        if (!b.items.some((i) => i.trim())) errors[key('items')] = 'Add at least one action, or remove this block';
        break;
    }
  }
  if (!story.blocks.some((b) => b.type === 'paragraph')) errors['story.blocks'] = 'Add at least one paragraph';
  else if (chars < c.storyMinChars) {
    errors['story.blocks'] ??= `Your story needs at least ${c.storyMinChars} characters of text (${chars} so far)`;
  }
  if (story.sources.length === 0) errors['story.sources'] = 'Cite at least one source for your claims';
  return errors;
}

function validateVisuals({ visuals }: DraftContent): FieldErrors {
  const errors: FieldErrors = {};
  const { headline, description, callToAction } = visuals.ad;
  if (!headline.trim()) errors['visuals.ad.headline'] = 'Add an ad headline';
  else if (headline.length > 40) errors['visuals.ad.headline'] = 'Keep the ad headline to 40 characters';
  if (!description.trim()) errors['visuals.ad.description'] = 'Add a short ad description';
  else if (description.length > 90) errors['visuals.ad.description'] = 'Keep the description to 90 characters';
  if (!callToAction.trim()) errors['visuals.ad.callToAction'] = 'Choose a call to action';
  return errors;
}

function validateReach({ reach }: DraftContent): FieldErrors {
  const errors: FieldErrors = {};
  if (reach.locations.length === 0) errors['reach.locations'] = 'Add at least one location';
  if (reach.interests.length === 0) errors['reach.interests'] = 'Choose at least one interest';
  if (reach.channels.length === 0) errors['reach.channels'] = 'Choose at least one channel';
  const total = reach.channels.reduce((sum, ch) => sum + (reach.budgetSplit[ch] ?? 0), 0);
  if (reach.channels.length > 0 && total !== 100) errors['reach.budgetSplit'] = 'The budget split must total 100%';
  return errors;
}

function validateSubmit({ submit }: DraftContent): FieldErrors {
  const errors: FieldErrors = {};
  const goal = submit.goalCents;
  if (goal === null || goal <= 0) errors['submit.goalCents'] = 'Enter a funding goal';
  else if (goal < c.goalMinCents) errors['submit.goalCents'] = `The goal must be at least $${c.goalMinCents / 100}`;
  else if (goal > c.goalMaxCents) errors['submit.goalCents'] = `The goal can be at most $${(c.goalMaxCents / 100).toLocaleString('en-US')}`;
  if (SUBMIT_RULES.some((r) => !submit.rules.includes(r.id))) errors['submit.rules'] = 'Confirm every statement to submit';
  return errors;
}

const validators: Record<DraftStep, (d: DraftContent) => FieldErrors> = {
  basics: validateBasics,
  story: validateStory,
  visuals: validateVisuals,
  reach: validateReach,
  submit: validateSubmit,
};

export function validateStep(draft: DraftContent, step: DraftStep): FieldErrors {
  return validators[step](draft);
}

/** The first step with errors, or null when the whole draft can be submitted. */
export function firstInvalidStep(draft: DraftContent): DraftStep | null {
  return DRAFT_STEPS.find((s) => Object.keys(validateStep(draft, s)).length > 0) ?? null;
}

// ── Media checks ──────────────────────────────────────────────────────────────

export type MediaCheck = { id: string; label: string; status: 'ok' | 'warn' | 'error' };

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function ratioLabel(w: number, h: number): string {
  const r = w / h;
  const known: [number, string][] = [[1, '1:1'], [4 / 5, '4:5'], [3 / 4, '3:4'], [9 / 16, '9:16'], [16 / 9, '16:9'], [4 / 3, '4:3'], [3 / 2, '3:2'], [2 / 3, '2:3'], [1.91, '1.91:1']];
  const near = known.find(([k]) => Math.abs(k - r) / k < 0.04);
  return near ? near[1] : `${r.toFixed(2)}:1`;
}

/**
 * File checks for an uploaded asset: type, size, resolution, aspect ratio and (videos) length.
 * Errors block the asset; warnings are shown but allowed.
 */
export function checkMedia(asset: MediaAsset, role: 'cover' | 'ad' | 'video'): MediaCheck[] {
  const checks: MediaCheck[] = [];
  const isVideo = asset.kind === 'video';
  const limits = isVideo ? c.video : c.image;
  const types = isVideo ? VIDEO_TYPES : IMAGE_TYPES;

  if (asset.mimeType) {
    const ok = types.includes(asset.mimeType.toLowerCase());
    const format = asset.mimeType.split('/')[1]?.toUpperCase() ?? asset.mimeType;
    checks.push({ id: 'type', label: ok ? format : `${format} isn’t supported`, status: ok ? 'ok' : 'error' });
  }
  if (asset.fileSize) {
    const ok = asset.fileSize <= limits.maxBytes;
    checks.push({ id: 'size', label: ok ? mb(asset.fileSize) : `${mb(asset.fileSize)} (max ${mb(limits.maxBytes)})`, status: ok ? 'ok' : 'error' });
  }
  if (asset.generated) checks.push({ id: 'generated', label: 'AI-generated', status: 'ok' });
  if (asset.width && asset.height) {
    const short = Math.min(asset.width, asset.height);
    const size = `${asset.width}×${asset.height}`;
    if (asset.generated) checks.push({ id: 'resolution', label: size, status: 'ok' });
    else if (!isVideo && short < c.image.minShortSide) checks.push({ id: 'resolution', label: `${size} is too small`, status: 'error' });
    else if (!isVideo && short < c.image.recommendedShortSide) checks.push({ id: 'resolution', label: `${size}, may look soft`, status: 'warn' });
    else checks.push({ id: 'resolution', label: size, status: 'ok' });

    const r = asset.width / asset.height;
    const label = ratioLabel(asset.width, asset.height);
    if (role === 'cover') {
      const ok = r >= 1 && r <= 2;
      checks.push({ id: 'aspect', label: ok ? label : `${label}, crops in cards (landscape works best)`, status: ok ? 'ok' : 'warn' });
    } else if (role === 'ad') {
      const ok = r >= 0.75 && r <= 1.25;
      checks.push({ id: 'aspect', label: ok ? label : `${label}, crops in feed and story placements`, status: ok ? 'ok' : 'warn' });
    } else {
      const ok = r <= 0.8 || (r >= 0.95 && r <= 1.05);
      checks.push({ id: 'aspect', label: ok ? label : `${label}, vertical or square works best`, status: ok ? 'ok' : 'warn' });
    }
  }
  if (isVideo && asset.durationMs) {
    const s = Math.round(asset.durationMs / 1000);
    const ok = asset.durationMs >= c.video.minMs && asset.durationMs <= c.video.maxMs;
    checks.push({ id: 'duration', label: ok ? `${s}s` : `${s}s (${c.video.minMs / 1000}–${c.video.maxMs / 1000}s allowed)`, status: ok ? 'ok' : 'error' });
  }
  return checks;
}

export const hasBlockingIssue = (checks: MediaCheck[]) => checks.some((x) => x.status === 'error');

/** Missing-asset warnings for the Visuals step. These never block Continue. */
export function visualsWarnings(d: DraftContent): string[] {
  const warnings: string[] = [];
  if (d.visuals.adImages.length === 0) warnings.push('No ad images yet. Ads will use your cover image, cropped to each placement.');
  if (!d.visuals.video) warnings.push('No video. Video placements will be skipped, which may lower reach.');
  return warnings;
}

// ── Conversion ────────────────────────────────────────────────────────────────

/** Blocks as they publish: actions move to "What you can do" and unfinished images are skipped. */
export function publishableBlocks(blocks: StoryBlock[]): StoryBlock[] {
  return blocks.filter((b) => b.type !== 'actions' && (b.type !== 'image' || imageUri(b.image)));
}

export function imageUri(image: ImageAsset): boolean {
  return typeof image.source === 'number' || !!image.source.uri;
}

/**
 * Builds the campaign a draft publishes as. The preview and the submitted campaign both come
 * from here, so the preview always matches the published page.
 */
export function draftToCampaign(
  d: Draft,
  opts: { id: string; creatorId: string; status: CampaignStatus; now: ISODate; history?: Campaign['history'] },
): Campaign {
  const { basics, story, visuals, reach } = d;
  const channels = reach.channels.length ? reach.channels : CHANNELS.slice(0, 1);
  return {
    id: opts.id,
    title: basics.title.trim(),
    summary: basics.summary.trim(),
    category: basics.category ?? 'other',
    creator: {
      id: opts.creatorId,
      name: basics.creatorName.trim() || 'You',
      type: basics.creatorType ?? 'individual',
      location: reach.locations[0] ?? '',
      bio: '',
    },
    cover: basics.cover ? { ...basics.cover.image, alt: basics.cover.image.alt || basics.title.trim() } : null,
    status: opts.status,
    goalCents: d.submit.goalCents ?? 0,
    raisedCents: 0,
    backerCount: 0,
    durationDays: reach.durationDays,
    publishedAt: null,
    fundingEndsAt: null,
    featured: false,
    trendScore: 0,
    story: publishableBlocks(story.blocks),
    sources: story.sources,
    suggestedActions: story.blocks.flatMap((b) => (b.type === 'actions' ? b.items.map((i) => i.trim()).filter(Boolean) : [])),
    audience: {
      locations: reach.locations,
      ageRange: reach.ageRange,
      interests: reach.interests,
      channels,
      budgetSplit: Object.fromEntries(channels.map((ch) => [ch, reach.budgetSplit[ch] ?? 0])),
    },
    ad: visuals.ad,
    submittedAt: opts.status === 'draft' ? null : opts.now,
    history: opts.history ?? [],
    updates: [],
  };
}

export function toDraftSummary(d: Draft): DraftSummary {
  return {
    id: d.id,
    origin: d.origin,
    step: d.step,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    title: d.basics.title.trim(),
    category: d.basics.category,
    cover: d.basics.cover?.image ?? null,
  };
}
