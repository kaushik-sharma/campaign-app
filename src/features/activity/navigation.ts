import { router } from 'expo-router';

import type { ActivityLink } from '@/domain/types';

/** Opens the screen an activity item points to. */
export function openActivityLink(link: ActivityLink | null) {
  if (!link) return;
  switch (link.screen) {
    case 'receipt':
      return router.push({ pathname: '/receipt/[id]', params: { id: link.id } });
    case 'manage':
      return router.push({ pathname: '/manage/[id]', params: { id: link.id } });
    case 'report':
      return router.push({ pathname: '/report/[id]', params: { id: link.id } });
    case 'campaign':
      return router.push({ pathname: '/campaign/[id]', params: { id: link.id } });
    case 'payments':
      return router.push('/payments');
    case 'profile':
      return router.navigate('/profile');
  }
}
