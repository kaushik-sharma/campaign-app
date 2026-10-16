import { Switch as RNSwitch } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

/** Native switch, themed. Native control keeps platform-correct accessibility and motion. */
export function Switch({ value, onValueChange, accessibilityLabel, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <RNSwitch
      value={value}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onValueChange={(v) => {
        haptics.selection();
        onValueChange(v);
      }}
      trackColor={{ false: colors.borderStrong, true: colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.borderStrong}
    />
  );
}
