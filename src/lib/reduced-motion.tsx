import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
// eslint-disable-next-line no-restricted-imports -- the one place that reads Reanimated's launch-time value
import { ReducedMotionConfig, ReduceMotion, useReducedMotion as useReducedMotionAtLaunch } from 'react-native-reanimated';

/**
 * The system "reduce motion" setting: Reduce Motion on iOS, Remove animations on Android.
 *
 * Reanimated already makes every timing, spring and layout animation jump to its end while it is
 * on, but it only reads the setting at launch. This keeps it live, so turning the setting on or off
 * while the app is open applies at once, both to Reanimated and to components that swap in a
 * calmer variant.
 */
let reduced: boolean | null = null;
const listeners = new Set<() => void>();
let subscribed = false;

function set(value: boolean) {
  if (value === reduced) return;
  reduced = value;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!subscribed) {
    subscribed = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(set);
    AccessibilityInfo.addEventListener('reduceMotionChanged', set);
  }
  return () => listeners.delete(listener);
}

/** Whether to reduce motion right now. Re-renders when the setting changes. */
export function useReducedMotion(): boolean {
  const atLaunch = useReducedMotionAtLaunch();
  return useSyncExternalStore(subscribe, () => reduced ?? atLaunch);
}

/**
 * Mounted once at the root. Overrides Reanimated's launch-time value only once the setting has
 * changed since launch (overriding logs a development warning, so it isn't done needlessly).
 */
export function ReducedMotionSync() {
  const atLaunch = useReducedMotionAtLaunch();
  const now = useReducedMotion();
  return now === atLaunch ? null : <ReducedMotionConfig mode={now ? ReduceMotion.Always : ReduceMotion.Never} />;
}
