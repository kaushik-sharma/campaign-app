import { router } from 'expo-router';

import { BellIcon } from '@/components/ui/icons';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/states';

/** Phase 1 activity: designed empty state. The notification centre arrives in Phase 5. */
export default function ActivityScreen() {
  return (
    <Screen title="Activity">
      <EmptyState
        icon={BellIcon}
        title="No activity yet"
        message="Updates about campaigns you back, follow or create will appear here: funding milestones, review decisions and promotion progress."
        action={{ label: 'Explore campaigns', onPress: () => router.navigate('/explore') }}
      />
    </Screen>
  );
}
