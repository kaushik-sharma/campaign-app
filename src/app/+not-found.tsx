import { router } from 'expo-router';

import { CompassIcon } from '@/components/ui/icons';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/states';

export default function NotFoundScreen() {
  return (
    <Screen title="Not found" back>
      <EmptyState
        icon={CompassIcon}
        title="This page doesn’t exist"
        message="The link may be broken, or the campaign is no longer public."
        action={{ label: 'Go to Home', onPress: () => router.replace('/') }}
      />
    </Screen>
  );
}
