import type { ActivityEvent, ActivityGroup } from '@/domain/types';

import { db } from './db';

/** Activity owner for guest activity on this device. */
export const GUEST = 'guest';

export const randomId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function addEvent(owner: string, event: Omit<ActivityEvent, 'id' | 'at' | 'read'>) {
  db.addActivity(owner, { ...event, id: randomId('ev_'), at: new Date().toISOString(), read: false });
}

/**
 * Sends one event about a campaign to everyone with a stake in it: its owner (My campaigns),
 * backers (Backed) and followers (Following). Each person gets it once, in their closest group.
 */
export function notifyStakeholders(
  campaignId: string,
  build: (group: ActivityGroup) => Omit<ActivityEvent, 'id' | 'at' | 'read' | 'group'> | null,
  /** People to include who aren't recorded yet, e.g. a backer whose payment is being saved. */
  extraBackers: string[] = [],
) {
  const sent = new Set<string>();
  const owner = db.ownerOf(campaignId);
  const send = (who: string, group: ActivityGroup) => {
    if (sent.has(who)) return;
    const event = build(group);
    if (!event) return;
    sent.add(who);
    addEvent(who, { ...event, group });
  };
  if (owner) send(owner, 'mine');
  [...extraBackers, ...db.backersOf(campaignId)].forEach((who) => send(who, 'backed'));
  db.followersOf(campaignId).forEach((who) => send(who, 'following'));
}
