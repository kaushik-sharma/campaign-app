import { router } from 'expo-router';

import { useCurrentUser } from './auth-provider';
import { setPendingAuthAction } from './pending-action';

export { clearPendingAuthAction } from './pending-action';

export type AuthReason = 'follow' | 'save' | 'payments';

export const authReasons: Record<AuthReason, string> = {
  follow: 'Sign in to follow this campaign and get its updates in Activity.',
  save: 'Sign in to save campaigns and find them again on any device.',
  payments: 'Sign in to keep receipts for future payments together in your account.',
};

/**
 * Gates an action behind sign-in. Signed-in users run it immediately; guests see the auth modal
 * and the action completes automatically after they sign in, so they never have to tap twice.
 */
export function useRequireAuth() {
  const user = useCurrentUser();
  return (reason: AuthReason, action: () => void) => {
    if (user) return action();
    setPendingAuthAction(action);
    router.push({ pathname: '/auth', params: { reason } });
  };
}
