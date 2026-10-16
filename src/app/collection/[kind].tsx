import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CampaignRow, CampaignRowSkeleton } from '@/components/campaign/campaign-row';
import { BellIcon, BookmarkSimpleIcon, HandshakeIcon, type IconComponent } from '@/components/ui/icons';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { SkeletonGroup } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useCurrentUser } from '@/features/auth/auth-provider';
import { useMyCampaignList } from '@/features/campaigns/queries';
import { space } from '@/theme';

type Kind = 'backed' | 'saved' | 'following';

const COPY: Record<Kind, { title: string; empty: string; message: string; icon: IconComponent; needsAccount: boolean }> = {
  backed: {
    title: 'Backed',
    empty: 'Nothing backed yet',
    message: 'Campaigns you back appear here, with their progress and reports.',
    icon: HandshakeIcon,
    needsAccount: false,
  },
  saved: {
    title: 'Saved',
    empty: 'Nothing saved yet',
    message: 'Tap the bookmark on a campaign to keep it here for later.',
    icon: BookmarkSimpleIcon,
    needsAccount: true,
  },
  following: {
    title: 'Following',
    empty: 'Not following anything yet',
    message: 'Follow a campaign to get its milestones and updates in Activity.',
    icon: BellIcon,
    needsAccount: true,
  },
};

/** Campaigns I backed, saved or follow. */
export default function CollectionScreen() {
  const { kind: raw } = useLocalSearchParams<{ kind: string }>();
  const kind: Kind = raw === 'saved' || raw === 'following' ? raw : 'backed';
  const copy = COPY[kind];
  const user = useCurrentUser();
  const query = useMyCampaignList(kind);
  const list = query.data ?? [];

  let body: React.ReactNode;
  if (copy.needsAccount && !user) {
    body = (
      <EmptyState
        icon={copy.icon}
        title="Sign in to see this list"
        message={copy.message}
        action={{ label: 'Sign in', onPress: () => router.push({ pathname: '/auth', params: { reason: kind === 'saved' ? 'save' : 'follow' } }) }}
      />
    );
  } else if (query.isPending) {
    body = (
      <Section>
        <SkeletonGroup style={styles.list} label="Loading campaigns">
          <CampaignRowSkeleton />
          <CampaignRowSkeleton />
        </SkeletonGroup>
      </Section>
    );
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />;
  } else if (list.length === 0) {
    body = (
      <EmptyState
        icon={copy.icon}
        title={copy.empty}
        message={copy.message}
        action={{ label: 'Explore campaigns', onPress: () => router.navigate('/explore') }}
      />
    );
  } else {
    body = (
      <Section>
        {!user && kind === 'backed' && (
          <Text variant="footnote" color="textMuted" style={styles.note}>
            Campaigns backed as a guest on this device.
          </Text>
        )}
        <View style={styles.list}>
          {list.map((c, i) => (
            <CampaignRow key={c.id} campaign={c} index={i} />
          ))}
        </View>
      </Section>
    );
  }

  return (
    <Screen title={copy.title} back>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  note: { marginBottom: space.md },
});
