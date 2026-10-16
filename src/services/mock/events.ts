import type { ActivityEvent } from '@/domain/types';

import { db } from './db';

/** Activity owner for guest activity on this device. */
export const GUEST = 'guest';

export const randomId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function addEvent(owner: string, event: Omit<ActivityEvent, 'id' | 'at' | 'read'>) {
  db.addActivity(owner, { ...event, id: randomId('ev_'), at: new Date().toISOString(), read: false });
}
