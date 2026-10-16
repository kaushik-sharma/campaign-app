import type { Channel } from './types';

export const CHANNELS: Channel[] = ['social-feed', 'stories', 'search', 'news-sites', 'video'];

export const INTERESTS = [
  'Animal welfare', 'Art', 'Astronomy', 'Careers', 'Caregiving', 'Commuting', 'Community', 'Conservation',
  'Culture', 'DIY', 'Economics', 'Education', 'Family', 'Food & drink', 'Gardening', 'Health',
  'Health & wellness', 'History', 'Home', 'Local government', 'Local news', 'Mental health', 'Nature',
  'Outdoors', 'Parenting', 'Personal finance', 'Pets', 'Photography', 'Podcasts', 'Public transit',
  'Science', 'Shopping', 'Small business', 'Sports', 'Sustainability', 'Technology', 'Travel',
  'Volunteering', 'Weather',
];

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida',
  'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
  'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
  'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const CITIES = [
  'Atlanta, GA', 'Austin, TX', 'Baltimore, MD', 'Boston, MA', 'Charlotte, NC', 'Chicago, IL', 'Cleveland, OH',
  'Columbus, OH', 'Dallas, TX', 'Denver, CO', 'Detroit, MI', 'Houston, TX', 'Indianapolis, IN',
  'Kansas City, MO', 'Las Vegas, NV', 'Los Angeles, CA', 'Miami, FL', 'Milwaukee, WI', 'Minneapolis, MN',
  'Nashville, TN', 'New Orleans, LA', 'New York, NY', 'Oakland, CA', 'Philadelphia, PA', 'Phoenix, AZ',
  'Pittsburgh, PA', 'Portland, OR', 'Raleigh, NC', 'Richmond, VA', 'Sacramento, CA', 'Salt Lake City, UT',
  'San Antonio, TX', 'San Diego, CA', 'San Francisco, CA', 'San Jose, CA', 'Seattle, WA', 'St. Louis, MO',
  'Tampa, FL', 'Tucson, AZ', 'Washington, DC',
];

/** Targetable places for the location search (demo list: the US, its states and large cities). */
export const LOCATIONS = ['United States', ...STATES, ...CITIES];

export function searchLocations(query: string, exclude: string[] = [], limit = 6): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = LOCATIONS.filter((l) => l.toLowerCase().startsWith(q));
  const contains = LOCATIONS.filter((l) => !l.toLowerCase().startsWith(q) && l.toLowerCase().includes(q));
  return [...starts, ...contains].filter((l) => !exclude.includes(l)).slice(0, limit);
}

export const AGE_MIN = 13;
export const AGE_MAX = 65;

export function formatAgeRange([min, max]: [number, number]): string {
  return `${min}–${max >= AGE_MAX ? `${AGE_MAX}+` : max}`;
}

/**
 * Re-spreads a budget split so it always totals exactly 100: the changed channel keeps its value
 * and the others share the remainder in proportion to their previous values.
 */
export function rebalanceSplit(
  split: Partial<Record<Channel, number>>,
  channels: Channel[],
  changed?: { channel: Channel; value: number },
): Partial<Record<Channel, number>> {
  if (channels.length === 0) return {};
  if (channels.length === 1) return { [channels[0]]: 100 };
  const next: Partial<Record<Channel, number>> = {};
  const fixed = changed && channels.includes(changed.channel) ? Math.max(0, Math.min(100, changed.value)) : null;
  if (changed && fixed !== null) next[changed.channel] = fixed;
  const others = channels.filter((c) => c !== changed?.channel || fixed === null);
  const remaining = 100 - (fixed ?? 0);
  const weights = others.map((c) => split[c] ?? 0);
  const total = weights.reduce((a, b) => a + b, 0);
  let assigned = 0;
  others.forEach((c, i) => {
    const share = total > 0 ? (weights[i] / total) * remaining : remaining / others.length;
    const value = i === others.length - 1 ? remaining - assigned : Math.round(share / 5) * 5;
    next[c] = value;
    assigned += value;
  });
  // The last channel absorbs rounding; if that pushed it negative, fall back to an even spread.
  if (Object.values(next).some((v) => (v ?? 0) < 0)) {
    const even = Math.floor(remaining / others.length / 5) * 5;
    others.forEach((c, i) => (next[c] = i === others.length - 1 ? remaining - even * (others.length - 1) : even));
  }
  return next;
}
