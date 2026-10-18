import { demo } from '@/config/demo';
import { readJSON, writeJSON } from '@/lib/storage';

import type { NetworkSettings } from '../contracts';
import { ServiceError } from '../errors';

const STORAGE_KEY = 'mock:network:v1';

const LATENCY: Record<NetworkSettings['latency'], [number, number]> = {
  fast: [80, 200],
  realistic: demo.network.latencyMs,
  slow: [1500, 3000],
};

let settings: NetworkSettings = {
  failureRate: demo.network.failureRate,
  latency: 'realistic',
  offline: false,
};
let forcedFailures = 0;

void readJSON<NetworkSettings>(STORAGE_KEY).then((saved) => {
  if (saved) settings = { ...settings, ...saved };
});

export const networkControls = {
  get: () => settings,
  set(patch: Partial<NetworkSettings>) {
    settings = { ...settings, ...patch };
    void writeJSON(STORAGE_KEY, settings);
  },
  failNext(count: number) {
    forcedFailures = count;
  },
};

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ServiceError('aborted', 'Request canceled'));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new ServiceError('aborted', 'Request canceled'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function randomBetween([min, max]: [number, number]) {
  return min + Math.random() * (max - min);
}

function randomFailure(): ServiceError {
  const roll = Math.random();
  if (roll < 0.4) return new ServiceError('network', 'Network request failed');
  if (roll < 0.7) return new ServiceError('timeout', 'Request timed out');
  return new ServiceError('server', 'Internal server error');
}

/**
 * Wraps a mock handler so it behaves like a real request: latency, failure injection,
 * cancellation, and a deep copy of the response so callers can't mutate the "server" state.
 */
export async function simulateRequest<T>(
  handler: () => T | Promise<T>,
  opts: { signal?: AbortSignal; canFail?: boolean } = {},
): Promise<T> {
  const { signal, canFail = true } = opts;
  await wait(randomBetween(LATENCY[settings.latency]), signal);

  if (settings.offline) throw new ServiceError('network', 'Network request failed');
  if (canFail && forcedFailures > 0) {
    forcedFailures -= 1;
    throw new ServiceError('server', 'Internal server error');
  }
  if (canFail && Math.random() < settings.failureRate) throw randomFailure();

  const result = await handler();
  return result === undefined ? result : (JSON.parse(JSON.stringify(result)) as T);
}
