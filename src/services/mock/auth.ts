import { z } from 'zod';

import { demo } from '@/config/demo';
import type { Session, User } from '@/domain/types';
import { readJSON, writeJSON } from '@/lib/storage';

import type { AuthChangeListener, AuthService } from '../contracts';
import { ServiceError } from '../errors';
import { simulateRequest } from './network';

/**
 * Mock auth. Demo only: passwords are stored locally in plain text and never leave the device.
 * Replaced by Supabase email + password in the final phase, behind the same AuthService contract.
 */
const USERS_KEY = 'mockauth:users:v1';
const SESSION_KEY = 'mockauth:session:v1';
const SESSION_DAYS = 30;

type StoredUser = User & { password: string };

const demoUser: StoredUser = {
  id: 'u-demo',
  name: 'Alex Rivera',
  email: demo.demoAccount.email,
  password: demo.demoAccount.password,
  createdAt: new Date(Date.now() - 140 * 86_400_000).toISOString(),
};

const credentials = z.object({
  email: z.email('Enter a valid email address').transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
const signUpInput = credentials.extend({
  name: z.string().trim().min(2, 'Enter your name').max(60),
});

const listeners = new Set<AuthChangeListener>();
let current: Session | null = null;

async function loadUsers(): Promise<StoredUser[]> {
  const users = (await readJSON<StoredUser[]>(USERS_KEY)) ?? [];
  return users.some((u) => u.id === demoUser.id) ? users : [demoUser, ...users];
}

function createSession({ password: _password, ...user }: StoredUser): Session {
  return {
    user,
    token: `mock.${user.id}.${Date.now().toString(36)}`,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString(),
  };
}

async function setSession(session: Session | null) {
  current = session;
  await writeJSON(SESSION_KEY, session);
  listeners.forEach((l) => l(session));
}

function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    throw new ServiceError('validation', 'Check the highlighted fields', fieldErrors);
  }
  return parsed.data;
}

export const mockAuthService: AuthService = {
  async getSession() {
    if (current) return current;
    const saved = await readJSON<Session>(SESSION_KEY);
    current = saved && new Date(saved.expiresAt).getTime() > Date.now() ? saved : null;
    return current;
  },

  signIn(input) {
    return simulateRequest(async () => {
      const { email, password } = validate(credentials, input);
      const user = (await loadUsers()).find((u) => u.email === email);
      if (!user || user.password !== password) {
        throw new ServiceError('unauthorized', 'That email and password don’t match.');
      }
      const session = createSession(user);
      await setSession(session);
      return session;
    });
  },

  signUp(input) {
    return simulateRequest(async () => {
      const { name, email, password } = validate(signUpInput, input);
      const users = await loadUsers();
      if (users.some((u) => u.email === email)) {
        throw new ServiceError('conflict', 'An account with this email already exists.', {
          email: 'An account with this email already exists',
        });
      }
      const user: StoredUser = {
        id: `u-${Date.now().toString(36)}`,
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      };
      await writeJSON(USERS_KEY, [...users, user]);
      const session = createSession(user);
      await setSession(session);
      return session;
    });
  },

  signOut() {
    return simulateRequest(() => setSession(null), { canFail: false });
  },

  onAuthStateChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
