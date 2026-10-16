import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import {
  BookOpenIcon,
  EnvelopeSimpleIcon,
  FileTextIcon,
  HandshakeIcon,
  InfoIcon,
  LockSimpleIcon,
  QuestionIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  type IconComponent,
  MoonIcon,
  SignOutIcon,
  UserCircleIcon,
  VibrateIcon,
  EyeSlashIcon,
  WrenchIcon,
} from '@/components/ui/icons';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import type { InfoSlug } from '@/content/info';
import { useAuth } from '@/features/auth/auth-provider';
import { formatDate } from '@/lib/format';
import { usePreferences, type AppearancePreference } from '@/stores/preferences';
import { toast } from '@/stores/toast';
import { layout, space, useTheme } from '@/theme';

const HELP_LINKS: { slug: InfoSlug; title: string; icon: IconComponent }[] = [
  { slug: 'how-it-works', title: 'How it works', icon: InfoIcon },
  { slug: 'faq', title: 'FAQs', icon: QuestionIcon },
  { slug: 'help', title: 'Help', icon: QuestionIcon },
  { slug: 'contact', title: 'Contact', icon: EnvelopeSimpleIcon },
  { slug: 'about', title: 'About Campaigns', icon: BookOpenIcon },
  { slug: 'partners', title: 'Distribution partners', icon: HandshakeIcon },
  { slug: 'guidelines', title: 'Community guidelines', icon: ShieldCheckIcon },
  { slug: 'terms', title: 'Terms of use', icon: FileTextIcon },
  { slug: 'privacy', title: 'Privacy', icon: LockSimpleIcon },
];

function AccountHeader() {
  const { session, signOut } = useAuth();
  const { colors } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const user = session?.user;

  if (!user) {
    return (
      <Card style={styles.account}>
        <View style={[styles.guestIcon, { backgroundColor: colors.surfaceSunken }]}>
          <UserCircleIcon size={28} color={colors.textMuted} />
        </View>
        <View style={styles.accountText}>
          <Text variant="title3">You’re browsing as a guest</Text>
          <Text variant="subhead" color="textMuted">
            Sign in to follow campaigns, track what you’ve backed and create your own.
          </Text>
        </View>
        <Button label="Sign in or create account" fullWidth onPress={() => router.push('/auth')} />
      </Card>
    );
  }

  return (
    <Card style={styles.account}>
      <View style={styles.userRow}>
        <Avatar name={user.name} size={56} />
        <View style={styles.accountText}>
          <Text variant="title3">{user.name}</Text>
          <Text variant="subhead" color="textMuted">
            {user.email}
          </Text>
          <Text variant="caption" color="textMuted">
            Member since {formatDate(user.createdAt)}
          </Text>
        </View>
      </View>
      <Button
        label="Sign out"
        variant="secondary"
        icon={SignOutIcon}
        fullWidth
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          try {
            await signOut();
            toast('Signed out');
          } finally {
            setSigningOut(false);
          }
        }}
      />
    </Card>
  );
}

export default function ProfileScreen() {
  const appearance = usePreferences((s) => s.appearance);
  const setAppearance = usePreferences((s) => s.setAppearance);
  const hapticsOn = usePreferences((s) => s.haptics);
  const setHaptics = usePreferences((s) => s.setHaptics);
  const showName = usePreferences((s) => s.showNameWhenBacking);
  const setShowName = usePreferences((s) => s.setShowNameWhenBacking);

  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen title="Profile">
      <Section>
        <AccountHeader />
      </Section>

      <Section title="Your activity">
        <Card padded={false}>
          <ListRow
            icon={ReceiptIcon}
            title="Payments & receipts"
            subtitle="Every contribution and its receipt"
            onPress={() => router.push('/payments')}
          />
        </Card>
      </Section>

      <Section title="Settings">
        <Card padded={false}>
          <View style={styles.appearance}>
            <View style={styles.appearanceLabel}>
              <MoonIcon size={18} color={colors.text} />
              <Text variant="body">Appearance</Text>
            </View>
            <SegmentedControl<AppearancePreference>
              accessibilityLabel="Appearance"
              value={appearance}
              onChange={setAppearance}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </View>
          <Divider inset={layout.cardPadding} />
          <ListRow
            icon={VibrateIcon}
            title="Haptic feedback"
            trailing={<Switch value={hapticsOn} onValueChange={setHaptics} accessibilityLabel="Haptic feedback" />}
          />
          <Divider inset={layout.cardPadding} />
          <ListRow
            icon={EyeSlashIcon}
            title="Show my name when I back"
            subtitle="Off by default. Your payment records stay private either way."
            trailing={
              <Switch value={showName} onValueChange={setShowName} accessibilityLabel="Show my name when I back" />
            }
          />
        </Card>
      </Section>

      <Section title="Help & info">
        <Card padded={false}>
          {HELP_LINKS.map((link, i) => (
            <View key={link.slug}>
              {i > 0 && <Divider inset={layout.cardPadding} />}
              <ListRow icon={link.icon} title={link.title} onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: link.slug } })} />
            </View>
          ))}
        </Card>
      </Section>

      {__DEV__ && (
        <Section title="Prototype">
          <Card padded={false}>
            <ListRow
              icon={WrenchIcon}
              title="Developer controls"
              subtitle="Network failures, latency, sample data and the design system"
              onPress={() => router.push('/dev')}
            />
          </Card>
        </Section>
      )}

      {/* Long-press the version to open demo controls in production builds. */}
      <Pressable
        onLongPress={() => router.push('/dev')}
        accessibilityRole="text"
        accessibilityHint="Long press to open developer controls"
        style={styles.version}>
        <Text variant="caption" color="textMuted" align="center">
          Campaigns {version} · Prototype with sample data
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: { gap: space.lg },
  guestIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  userRow: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  accountText: { flex: 1, gap: 2 },
  appearance: { padding: layout.cardPadding, gap: space.md },
  appearanceLabel: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  version: { paddingVertical: space.lg },
});
