import type { Services } from './contracts';
import { createMockServices } from './mock';

/**
 * The single place that chooses a backend. Set EXPO_PUBLIC_BACKEND=supabase once
 * `./supabase` implements the contracts; nothing outside this file changes.
 */
function createServices(): Services {
  switch (process.env.EXPO_PUBLIC_BACKEND) {
    default:
      return createMockServices();
  }
}

export const services: Services = createServices();

export * from './contracts';
export * from './errors';
