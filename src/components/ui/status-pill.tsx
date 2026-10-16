import { statusMeta, type CampaignStatus } from '@/domain/lifecycle';

import { Badge } from './badge';

export function StatusPill({ status }: { status: CampaignStatus }) {
  const meta = statusMeta[status];
  return <Badge label={meta.label} tone={meta.tone} dot />;
}
