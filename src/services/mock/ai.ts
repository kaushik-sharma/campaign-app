import { demo } from '@/config/demo';
import { DEMO_TRANSCRIPTS } from '@/content/voice-demo';
import { INTERESTS, LOCATIONS, rebalanceSplit } from '@/domain/audience';
import { emptyBlock, type BasicsSuggestion, type DraftPatch, type MediaAsset } from '@/domain/draft';
import type { CategoryId, ImageAsset, Source, StoryBlock } from '@/domain/types';

import type { AiService } from '../contracts';
import { randomId } from './events';
import { simulateRequest } from './network';
import { campaignCovers, storyImages } from './seed/images';

/**
 * Demo AI. Deterministic heuristics stand in for a model so the flow can be shown offline.
 * Nothing here ever returns a funding goal: `DraftPatch` has no field for it.
 */

const thinking = () => {
  const [min, max] = demo.ai.thinkingMs;
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
};

const KEYWORDS: [CategoryId, string[]][] = [
  ['environment', ['tree', 'climate', 'heat', 'river', 'wetland', 'pollut', 'recycl', 'wildlife', 'bee', 'park', 'green']],
  ['health', ['health', 'doctor', 'stroke', 'disease', 'hospital', 'mental', 'vaccin', 'clinic']],
  ['science', ['science', 'research', 'space', 'star', 'data', 'study']],
  ['education', ['school', 'student', 'teach', 'tutor', 'learn', 'library', 'literacy']],
  ['public-policy', ['vote', 'council', 'policy', 'law', 'transit', 'public comment', 'ordinance']],
  ['economic-policy', ['wage', 'tax', 'econom', 'work week', 'jobs', 'housing cost']],
  ['community', ['neighbor', 'community', 'volunteer', 'pantry', 'cleanup', 'block']],
  ['arts-culture', ['art', 'mural', 'music', 'language', 'culture', 'museum']],
  ['business', ['business', 'shop', 'local store', 'repair', 'startup']],
];

function guessCategory(text: string): CategoryId | null {
  const t = text.toLowerCase();
  let best: [CategoryId, number] | null = null;
  for (const [id, words] of KEYWORDS) {
    const score = words.filter((w) => t.includes(w)).length;
    if (score > 0 && (!best || score > best[1])) best = [id, score];
  }
  return best?.[0] ?? null;
}

const sentences = (text: string) => text.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max / 2)).replace(/[,;:\s]+$/, '')}…`;
}

function titleFrom(text: string): string {
  const first = sentences(text)[0] ?? text;
  return clip(capitalize(first.replace(/^(i want people to know that|i want|we want)\s+/i, '').replace(/[.!?]$/, '')), demo.creation.titleMax);
}

// ── Prepared demo draft (used when the demo transcripts are submitted unchanged) ──────────────

const EPA_SOURCES: Source[] = [
  { id: 's_epa_heat', title: 'Heat Island Effect', publisher: 'U.S. Environmental Protection Agency', url: 'https://www.epa.gov/heatislands' },
  {
    id: 's_epa_trees',
    title: 'Using Trees and Vegetation to Reduce Heat Islands',
    publisher: 'U.S. Environmental Protection Agency',
    url: 'https://www.epa.gov/heatislands/using-trees-and-vegetation-reduce-heat-islands',
  },
];

function demoPatch(): DraftPatch {
  const blocks: StoryBlock[] = [
    { id: randomId('b_'), type: 'intro', text: 'On the same summer afternoon, one Tucson block can be far hotter than another a mile away. The difference is often shade.' },
    {
      id: randomId('b_'),
      type: 'paragraph',
      text: 'Neighborhoods with few trees soak up heat in pavement and roofs all day and release it all night. **Shade trees are one of the simplest ways to cool a street**, and they get more valuable every year they grow.',
    },
    { id: randomId('b_'), type: 'stat', value: '20–45°F', label: 'How much cooler shaded surfaces can be than unshaded ones at their peak', sourceId: 's_epa_trees' },
    { id: randomId('b_'), type: 'heading', text: 'Why now' },
    {
      id: randomId('b_'),
      type: 'paragraph',
      text: 'Summers keep getting hotter, and the blocks with the least shade are often the ones where people can least afford to run air conditioning. A tree planted this year will be shading a sidewalk within a few summers. See the [EPA’s overview of heat islands](https://www.epa.gov/heatislands) for the science.',
    },
    { id: randomId('b_'), type: 'actions', items: ['Ask your city or utility about free shade-tree programs', 'Help water new trees on your block through their first summers'] },
  ];
  return {
    basics: {
      title: 'Shade cools Tucson’s hottest blocks',
      category: 'environment',
      creatorType: 'individual',
      summary: 'Some Tucson neighborhoods are far hotter than others because they have few trees. Planting and caring for shade trees can cool those streets by many degrees.',
    },
    story: { blocks, sources: EPA_SOURCES },
    visuals: { ad: { headline: 'Shade cools the hottest blocks', description: 'Shaded surfaces can be 20–45°F cooler. See how trees help.', callToAction: 'Find out how' } },
    reach: {
      locations: ['Tucson, AZ'],
      ageRange: [25, 65],
      interests: ['Gardening', 'Outdoors', 'Local news'],
      channels: ['social-feed', 'news-sites', 'search'],
      budgetSplit: { 'social-feed': 50, 'news-sites': 30, search: 20 },
      durationDays: 14,
    },
  };
}

function templatePatch([message, audience, why, action]: string[]): DraftPatch {
  const title = titleFrom(message);
  const category = guessCategory(`${message} ${why} ${action}`) ?? 'other';
  const locations = LOCATIONS.filter((l) => audience.toLowerCase().includes(l.split(',')[0].toLowerCase())).slice(0, 3);
  const interests = INTERESTS.filter((i) => `${audience} ${message}`.toLowerCase().includes(i.toLowerCase())).slice(0, 4);
  const actions = sentences(action).map((s) => capitalize(s.replace(/[.!?]$/, ''))).slice(0, 3);
  const blocks: StoryBlock[] = [
    { ...emptyBlock('intro'), text: capitalize(message.trim()) } as StoryBlock,
    { ...emptyBlock('heading'), text: 'Why it matters' } as StoryBlock,
    { ...emptyBlock('paragraph'), text: capitalize(why.trim()) } as StoryBlock,
    ...(actions.length ? [{ id: randomId('b_'), type: 'actions' as const, items: actions }] : []),
  ];
  const channels = ['social-feed' as const, 'news-sites' as const];
  return {
    basics: { title, category, summary: clip(`${capitalize(message.trim())} ${sentences(why)[0] ?? ''}`.trim(), demo.creation.summaryMax) },
    story: { blocks },
    visuals: { ad: { headline: clip(title, 40), description: clip(sentences(message)[0] ?? message, 90), callToAction: 'Learn more' } },
    reach: {
      ...(locations.length ? { locations } : {}),
      ...(interests.length ? { interests } : {}),
      channels,
      budgetSplit: rebalanceSplit({}, channels),
    },
  };
}

// ── Images ────────────────────────────────────────────────────────────────────

/** Pixel sizes and file sizes of the bundled photos used for demo image generation. */
const PHOTO_META: Record<string, [number, number, number]> = {
  'bees-need-weeds': [960, 720, 63608], 'buy-local-winter': [1024, 605, 116770], 'four-day-week': [960, 547, 90311],
  'free-tutoring': [960, 640, 66372], 'heat-check-elders': [1024, 683, 28877], 'indigenous-languages': [1024, 683, 118941],
  'lead-pipes': [1024, 683, 96338], 'local-pantry': [1024, 683, 68411], 'main-street-murals': [960, 640, 103549],
  'microchip-pets': [1024, 683, 72012], 'neighborhood-cleanup': [960, 636, 111693], 'night-sky': [960, 640, 104208],
  'right-to-repair': [960, 640, 105168], 'riverside-wetlands': [1024, 683, 186717], 'stroke-fast': [960, 640, 52933],
  'teen-dinner-talk': [1024, 683, 126753], 'transit-plan-comment': [960, 640, 151318],
};

const PHOTO_CATEGORY: Record<string, CategoryId> = {
  'riverside-wetlands': 'environment', 'bees-need-weeds': 'environment', 'neighborhood-cleanup': 'community',
  'stroke-fast': 'health', 'heat-check-elders': 'health', 'teen-dinner-talk': 'health', 'night-sky': 'science',
  'free-tutoring': 'education', 'lead-pipes': 'public-policy', 'transit-plan-comment': 'public-policy',
  'four-day-week': 'economic-policy', 'local-pantry': 'community', 'main-street-murals': 'arts-culture',
  'indigenous-languages': 'arts-culture', 'buy-local-winter': 'business', 'right-to-repair': 'business',
  'microchip-pets': 'community',
};

function toMedia(key: string, image: ImageAsset): MediaAsset {
  const [width, height, size] = PHOTO_META[key] ?? [1024, 683, 100_000];
  return { image: { ...image, credit: undefined }, kind: 'image', width, height, fileSize: size, mimeType: 'image/jpeg', durationMs: null, generated: true };
}

export const mockAiService: AiService = {
  suggestBasics(input, opts) {
    return simulateRequest(async () => {
      await thinking();
      const text = `${input.title} ${input.summary} ${input.storyText}`;
      const suggestions: BasicsSuggestion[] = [];
      const title = input.title.trim();

      if (!title && input.summary.trim()) {
        suggestions.push({ id: randomId('sg_'), field: 'title', value: titleFrom(input.summary), reason: 'Drawn from your summary' });
      } else if (title.length > 45) {
        suggestions.push({ id: randomId('sg_'), field: 'title', value: clip(title, 42), reason: 'Shorter titles are easier to read in a feed' });
      } else if (title) {
        const sharper = clip(`Why ${title[0].toLowerCase()}${title.slice(1).replace(/[.!?]$/, '')} matters`, demo.creation.titleMax);
        suggestions.push({ id: randomId('sg_'), field: 'title', value: sharper, reason: 'Tells readers why to care' });
      }

      const summary = input.summary.trim();
      if (summary.length < demo.creation.summaryMin) {
        const base = sentences(input.storyText)[0] ?? (title ? `${title}.` : '');
        if (base) {
          const value = clip(`${base} Here’s what the evidence shows and what you can do.`, demo.creation.summaryMax);
          suggestions.push({ id: randomId('sg_'), field: 'summary', value, reason: summary ? 'Adds the context readers need' : 'A starting point from your story' });
        }
      } else if (summary.length > 160) {
        suggestions.push({ id: randomId('sg_'), field: 'summary', value: clip(sentences(summary).slice(0, 2).join(' '), 160), reason: 'Tighter summaries get read to the end' });
      }

      const category = guessCategory(text);
      if (category && category !== input.category) {
        suggestions.push({ id: randomId('sg_'), field: 'category', value: category, reason: 'Matches the topic of your title and story' });
      }
      return suggestions;
    }, opts);
  },

  draftFromAnswers(answers, opts) {
    return simulateRequest(async () => {
      await thinking();
      const unchanged = answers.every((a, i) => a.trim() === DEMO_TRANSCRIPTS[i]);
      return unchanged ? demoPatch() : templatePatch(answers);
    }, opts);
  },

  generateImages({ category, count }, opts) {
    return simulateRequest(async () => {
      await thinking();
      const pool = Object.entries({ ...campaignCovers })
        .map(([key, image]) => ({ key, image }))
        .concat(Object.entries(storyImages).map(([key, image]) => ({ key: `${key}`, image })));
      const matching = pool.filter((p) => !category || PHOTO_CATEGORY[p.key] === category);
      const source = (matching.length >= count ? matching : pool).sort(() => Math.random() - 0.5);
      return source.slice(0, count).map((p) => toMedia(p.key, p.image));
    }, opts);
  },
};
