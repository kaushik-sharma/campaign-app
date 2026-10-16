import type { Cents, ReachRange } from '@/domain/types';

function group(n: number): string {
  'worklet';
  const s = Math.round(Math.abs(n)).toString();
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ',';
    out += s[i];
  }
  return (n < 0 ? '-' : '') + out;
}

/**
 * Formats integer cents as dollars. Worklet-safe (no Intl), so it also runs on the UI thread
 * inside AnimatedNumber.
 */
export function formatMoney(cents: Cents, opts: { showCents?: boolean } = {}): string {
  'worklet';
  const dollars = cents / 100;
  if (opts.showCents) {
    const whole = Math.trunc(dollars);
    const frac = Math.round(Math.abs(cents) % 100)
      .toString()
      .padStart(2, '0');
    return `$${group(whole)}.${frac}`;
  }
  return `$${group(dollars)}`;
}

/** 1,234 → "1,234"; 12,345 → "12.3K"; 1,234,567 → "1.2M". Worklet-safe. */
export function formatCompact(n: number): string {
  'worklet';
  const abs = Math.abs(n);
  const trim = (s: string) => (s.endsWith('.0') ? s.slice(0, -2) : s);
  if (abs >= 1_000_000) return `${trim((n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1))}M`;
  if (abs >= 10_000) return `${trim((n / 1_000).toFixed(abs >= 100_000 ? 0 : 1))}K`;
  return group(n);
}

export function formatInteger(n: number): string {
  'worklet';
  return group(n);
}

/**
 * Estimates are rounded to two significant figures so they never look more precise than they
 * are (252 → 250, 46,800 → 47K).
 */
export function roundEstimate(n: number): number {
  if (n < 100) return Math.round(n);
  const magnitude = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.round(n / magnitude) * magnitude;
}

export function formatReachRange(range: ReachRange): string {
  return `${formatCompact(roundEstimate(range.low))}–${formatCompact(roundEstimate(range.high))}`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

const DAY = 86_400_000;

export function daysUntil(iso: string, now = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / DAY);
}

export function formatTimeLeft(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'Ended';
  const days = Math.floor(ms / DAY);
  if (days >= 1) return `${days} day${days === 1 ? '' : 's'} left`;
  const hours = Math.max(1, Math.floor(ms / 3_600_000));
  return `${hours} hour${hours === 1 ? '' : 's'} left`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Oct 16, 2026 at 3:05 PM" for receipts. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return `${formatDate(iso)} at ${time}`;
}

export function formatRelative(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return formatDate(iso);
}

/** "https://www.epa.gov/x" → "epa.gov". React Native's URL polyfill lacks `hostname`. */
export function domainOf(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}
