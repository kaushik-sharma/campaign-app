import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { describeError, isServiceError } from '@/services';
import { duration, radius, space, useTheme } from '@/theme';

import { Button } from './button';
import {
  ArrowClockwiseIcon,
  WarningCircleIcon,
  WifiSlashIcon,
  type IconComponent,
} from './icons';
import { Text } from './text';

type EmptyStateProps = {
  icon: IconComponent;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
  children?: ReactNode;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  children,
  compact,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(duration.base)}
      style={[styles.container, compact && styles.compact]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSunken }]}>
        <Icon size={26} color={colors.textMuted} />
      </View>
      <View style={styles.copy}>
        <Text variant="title3" align="center" accessibilityRole="header">
          {title}
        </Text>
        {message && (
          <Text variant="subhead" color="textMuted" align="center">
            {message}
          </Text>
        )}
      </View>
      {children}
      {(action || secondaryAction) && (
        <View style={styles.actions}>
          {action && <Button label={action.label} onPress={action.onPress} />}
          {secondaryAction && (
            <Button label={secondaryAction.label} variant="ghost" onPress={secondaryAction.onPress} />
          )}
        </View>
      )}
    </Animated.View>
  );
}

type ErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
};

/** Error copy comes from the error code, so users never see raw technical messages. */
export function ErrorState({ error, onRetry, retrying, compact }: ErrorStateProps) {
  const { title, message, retryable } = describeError(error);
  const offline = isServiceError(error) && error.code === 'network';
  return (
    <EmptyState
      icon={offline ? WifiSlashIcon : WarningCircleIcon}
      title={title}
      message={message}
      compact={compact}>
      {retryable && onRetry && (
        <Button label="Try again" variant="secondary" icon={ArrowClockwiseIcon} loading={retrying} onPress={onRetry} />
      )}
    </EmptyState>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space['4xl'],
    paddingHorizontal: space.xxl,
  },
  compact: { paddingVertical: space.xxl },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: space.xs, maxWidth: 320 },
  actions: { alignItems: 'center', gap: space.xs },
});
