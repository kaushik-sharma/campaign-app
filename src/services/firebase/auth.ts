import {
  createUserWithEmailAndPassword,
  getAuth,
  getIdTokenResult,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from '@react-native-firebase/auth';

import type { Session, User } from '@/domain/types';

import type { AuthChangeListener, AuthService } from '../contracts';
import { ServiceError } from '../errors';
import { credentials, emailInput, signUpInput, validate } from '../validation';

/** Firebase error codes → the app's error codes and copy. Raw Firebase messages never reach the UI. */
function toServiceError(e: unknown): ServiceError {
  const code = typeof e === 'object' && e && 'code' in e ? String(e.code) : '';
  switch (code) {
    case 'auth/invalid-email':
      return new ServiceError('validation', 'Check the highlighted fields', { email: 'Enter a valid email address' });
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new ServiceError('unauthorized', 'That email and password don’t match.');
    case 'auth/email-already-in-use':
      return new ServiceError('conflict', 'An account with this email already exists.', {
        email: 'An account with this email already exists',
      });
    case 'auth/weak-password':
      return new ServiceError('validation', 'Choose a stronger password.', { password: 'Choose a stronger password' });
    case 'auth/user-disabled':
      return new ServiceError('forbidden', 'This account has been disabled.');
    case 'auth/too-many-requests':
      return new ServiceError('forbidden', 'Too many attempts. Wait a few minutes and try again.');
    case 'auth/network-request-failed':
      return new ServiceError('network', 'You seem to be offline.');
    case 'auth/operation-not-allowed':
      return new ServiceError('server', 'Email sign-in isn’t available right now.');
    default:
      return new ServiceError('server', 'Something went wrong. Try again.');
  }
}

/** Firebase reports times as ISO strings or epoch milliseconds, depending on the platform. */
function toISO(value: string | number | undefined): string {
  const date = value === undefined ? new Date() : new Date(/^\d+$/.test(String(value)) ? Number(value) : value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function toUser(user: FirebaseUser, name?: string): User {
  const email = user.email ?? '';
  return {
    id: user.uid,
    name: name ?? (user.displayName?.trim() || email.split('@')[0] || 'Campaigns user'),
    email,
    createdAt: toISO(user.metadata.creationTime),
  };
}

async function toSession(user: FirebaseUser, name?: string): Promise<Session> {
  try {
    const { token, expirationTime } = await getIdTokenResult(user);
    return { user: toUser(user, name), token, expiresAt: toISO(expirationTime) };
  } catch {
    // Offline with an expired token: the user is still signed in; the token refreshes once online.
    return { user: toUser(user, name), token: '', expiresAt: new Date().toISOString() };
  }
}

const sameUser = (a: Session | null, b: Session | null) =>
  a?.user.id === b?.user.id && a?.user.name === b?.user.name && a?.user.email === b?.user.email;

/**
 * Email + password auth with Firebase. Firebase keeps the session in the device keychain/keystore
 * and refreshes the ID token itself; this mirrors it as a `Session` and tells listeners when the
 * signed-in user changes (not on every hourly token refresh).
 */
export function createFirebaseAuthService(): AuthService {
  const auth = getAuth();
  const listeners = new Set<AuthChangeListener>();
  let current: Session | null = null;
  /** Bumped on every change, so a slow token fetch can't overwrite a newer state. */
  let version = 0;
  /** While signing up, hold notifications until the name is saved, so nobody sees a nameless user. */
  let holding = false;

  let markReady: () => void = () => {};
  const ready = new Promise<void>((resolve) => {
    markReady = resolve;
    // Firebase reports the restored user almost at once; never block startup on it.
    setTimeout(resolve, 5_000);
  });

  const publish = (session: Session | null) => {
    const changed = !sameUser(current, session);
    current = session;
    if (changed && !holding) listeners.forEach((l) => l(session));
  };

  onIdTokenChanged(auth, (user) => {
    const v = ++version;
    void (user ? toSession(user) : Promise.resolve(null)).then((session) => {
      markReady();
      if (v === version) publish(session);
    });
  });

  return {
    async getSession() {
      await ready;
      return current;
    },

    async signIn(input) {
      const { email, password } = validate(credentials, input);
      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        const session = await toSession(user);
        version++;
        publish(session);
        return session;
      } catch (e) {
        throw toServiceError(e);
      }
    },

    async signUp(input) {
      const { name, email, password } = validate(signUpInput, input);
      holding = true;
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        // The account exists even if saving the name fails; the session still carries the name.
        await updateProfile(user, { displayName: name }).catch(() => {});
        const session = await toSession(auth.currentUser ?? user, name);
        version++;
        holding = false;
        current = null;
        publish(session);
        return session;
      } catch (e) {
        throw toServiceError(e);
      } finally {
        holding = false;
      }
    },

    async sendPasswordReset(input) {
      const { email } = validate(emailInput, input);
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (e) {
        // Don't reveal whether an account exists for this address.
        if (typeof e === 'object' && e && 'code' in e && e.code === 'auth/user-not-found') return;
        throw toServiceError(e);
      }
    },

    async signOut() {
      try {
        await signOut(auth);
        version++;
        publish(null);
      } catch (e) {
        throw toServiceError(e);
      }
    },

    onAuthStateChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
