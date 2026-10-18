import { demo } from '@/config/demo';
import type { User } from '@/domain/types';

import type { AuthService } from '../contracts';

/**
 * Who the sample data belongs to. Auth may be real (Firebase) while campaigns, backings and drafts
 * are still sample data on the device, so the data services ask the active auth service, never a
 * specific one.
 */
let source: AuthService | null = null;

export function setSessionSource(auth: AuthService) {
  source = auth;
}

/** The id the seed data uses for the test account's campaigns, backings and drafts. */
export const TEST_ACCOUNT_ID = 'u-demo';

/** The signed-in user as the sample data knows them: the test account always owns its seeded data. */
export function dataUser(user: User): User {
  return user.email.toLowerCase() === demo.demoAccount.email ? { ...user, id: TEST_ACCOUNT_ID } : user;
}

export async function currentUser(): Promise<User | null> {
  const user = (await source?.getSession())?.user;
  return user ? dataUser(user) : null;
}
