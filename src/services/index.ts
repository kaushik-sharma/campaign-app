import Constants, { ExecutionEnvironment } from 'expo-constants';

import type { Services } from './contracts';
import { createMockServices } from './mock';

/**
 * Auth runs on Firebase (email + password). Firebase needs native code, so Expo Go always uses the
 * on-device mock; EXPO_PUBLIC_AUTH=mock forces it in a development build too.
 */
const authBackend: 'firebase' | 'mock' =
  process.env.EXPO_PUBLIC_AUTH === 'mock' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ? 'mock'
    : 'firebase';

/** The single place that chooses backends. Everything except auth is sample data on the device. */
function createServices(): Services {
  if (authBackend === 'firebase') {
    // Loaded only when used: importing Firebase in Expo Go fails, as its native module is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createFirebaseAuthService } = require('./firebase/auth') as typeof import('./firebase/auth');
    return createMockServices(createFirebaseAuthService());
  }
  return createMockServices();
}

export const services: Services = createServices();

export * from './contracts';
export * from './errors';
