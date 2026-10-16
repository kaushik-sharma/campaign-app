import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheetSpringConfigs,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/lib/haptics';
import { layout, radius, space, spring, useTheme } from '@/theme';

import { IconButton } from './icon-button';
import { XIcon } from './icons';
import { Text } from './text';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Pinned below the content (primary action). */
  footer?: ReactNode;
  /** Use for long content; the sheet then scrolls instead of growing. */
  scrollable?: boolean;
};

/** Bottom sheet with tokenised spring, backdrop and safe-area padding. Controlled via `open`. */
export function Sheet({ open, onClose, title, subtitle, children, footer, scrollable }: Props) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);
  const animationConfigs = useBottomSheetSpringConfigs(spring.sheet);

  useEffect(() => {
    if (open) {
      ref.current?.present();
      haptics.selection();
    } else {
      ref.current?.dismiss();
    }
  }, [open]);

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={scheme === 'dark' ? 0.6 : 0.4}
      pressBehavior="close"
    />
  );

  const Body = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      enableDynamicSizing
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
      handleIndicatorStyle={{ backgroundColor: colors.borderStrong, width: 36 }}
      accessibilityLabel={title}>
      <Body style={styles.body} contentContainerStyle={scrollable ? styles.scrollContent : undefined}>
        {title && (
          <View style={styles.header}>
            <View style={styles.titles}>
              <Text variant="title2" accessibilityRole="header">
                {title}
              </Text>
              {subtitle && (
                <Text variant="subhead" color="textMuted">
                  {subtitle}
                </Text>
              )}
            </View>
            <IconButton icon={XIcon} accessibilityLabel="Close" variant="tinted" size={32} onPress={onClose} />
          </View>
        )}
        {children}
        {footer && <View style={styles.footer}>{footer}</View>}
        <View style={{ height: Math.max(insets.bottom, space.lg) }} />
      </Body>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: layout.gutter },
  scrollContent: { paddingBottom: space.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingTop: space.xs,
    paddingBottom: space.lg,
  },
  titles: { flex: 1, gap: 2 },
  footer: { paddingTop: space.xl },
});
