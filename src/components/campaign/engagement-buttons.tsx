import { IconButton } from '@/components/ui/icon-button';
import { BellIcon, BellRingingIcon, BookmarkSimpleIcon } from '@/components/ui/icons';
import { useRequireAuth } from '@/features/auth/require-auth';
import { useEngagement, useSetEngagement } from '@/features/campaigns/queries';
import { haptics } from '@/lib/haptics';
import { describeError } from '@/services';
import { toast } from '@/stores/toast';

type Props = {
  campaignId: string;
  variant?: 'plain' | 'tinted' | 'surface';
  size?: number;
};

function useToggle(campaignId: string, field: 'following' | 'saved') {
  const engagement = useEngagement(campaignId);
  const set = useSetEngagement(campaignId);
  const requireAuth = useRequireAuth();
  const on = engagement.data?.[field] ?? false;

  const toggle = (next: boolean) =>
    set.mutate(
      { [field]: next },
      {
        onSuccess: () => {
          haptics.success();
          if (field === 'following') toast(next ? 'Following. Updates will appear in Activity.' : 'Unfollowed', 'success');
          else toast(next ? 'Saved' : 'Removed from saved', 'success');
        },
        onError: (e) => toast(describeError(e).title, 'error'),
      },
    );

  // Guests sign in first; the toggle then completes on its own.
  const onPress = () => requireAuth(field === 'following' ? 'follow' : 'save', () => toggle(!on));
  return { on, onPress };
}

/** Follow a campaign to get its milestones and updates in Activity. Sign-in gated. */
export function FollowButton({ campaignId, variant = 'tinted', size = 44 }: Props) {
  const { on, onPress } = useToggle(campaignId, 'following');
  return (
    <IconButton
      icon={on ? BellRingingIcon : BellIcon}
      active={on}
      accessibilityLabel={on ? 'Following. Tap to unfollow' : 'Follow campaign'}
      variant={variant}
      size={size}
      onPress={onPress}
    />
  );
}

/** Bookmark a campaign to read or back later. Sign-in gated. */
export function SaveButton({ campaignId, variant = 'surface', size = 40 }: Props) {
  const { on, onPress } = useToggle(campaignId, 'saved');
  return (
    <IconButton
      icon={BookmarkSimpleIcon}
      active={on}
      accessibilityLabel={on ? 'Saved. Tap to remove' : 'Save campaign'}
      variant={variant}
      size={size}
      onPress={onPress}
    />
  );
}
