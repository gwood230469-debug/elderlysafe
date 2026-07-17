import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { callColors } from '../theme/callTheme';
import { colors, radius, spacing, touchTarget, typography } from '../theme/tokens';

// Classical buttons are outlined only — never solid-filled. "primary" gets
// an accent border with a light accent tint on press; "quiet" is a lower-
// emphasis neutral-border outline; "ghost" has no border, just underlined
// text, for tertiary actions (e.g. "Cancel", "Change").
// accent-500 fails WCAG AA for text at these sizes, so all variants use
// accent-700 (colors.accentText) for their label color, never accent-500.
type Variant = 'primary' | 'quiet' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  // Elderly-facing screens use the 64px touch target; family-facing screens
  // use the denser 44px default.
  size?: 'default' | 'elderly';
  // Call-chrome screens (near-black background) need accent-300 borders/text
  // instead of the light-ground accent-700 — accent-700 reads as near-
  // invisible dark brown on a near-black background.
  dark?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false, style, size = 'default', dark = false }: Props) {
  const minHeight = size === 'elderly' ? touchTarget.elderly : touchTarget.minSize;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { minHeight },
        variant === 'primary' && (dark ? styles.primaryDark : styles.primary),
        variant === 'quiet' && (dark ? styles.quietDark : styles.quiet),
        variant === 'ghost' && styles.ghost,
        pressed && variant === 'primary' && (dark ? styles.primaryPressedDark : styles.primaryPressed),
        pressed && variant === 'quiet' && (dark ? styles.quietPressedDark : styles.quietPressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          dark && styles.labelDark,
          size === 'elderly' && styles.labelElderly,
          variant === 'ghost' && styles.ghostLabel,
          variant === 'quiet' && dark && styles.quietLabelDark,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
  },
  primaryPressed: {
    backgroundColor: colors.accentRamp[100],
  },
  quiet: {
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'transparent',
  },
  quietPressed: {
    backgroundColor: colors.neutral[100],
  },
  primaryDark: {
    borderWidth: 1.5,
    borderColor: callColors.accent,
    backgroundColor: 'transparent',
  },
  primaryPressedDark: {
    backgroundColor: 'rgba(250, 203, 141, 0.12)',
  },
  quietDark: {
    borderWidth: 1,
    borderColor: callColors.divider,
    backgroundColor: 'transparent',
  },
  quietPressedDark: {
    backgroundColor: 'rgba(243, 240, 234, 0.06)',
  },
  ghost: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: typography.bodyFamilyMedium,
    fontSize: typography.body,
    color: colors.accentText,
  },
  labelElderly: {
    fontSize: typography.bodyLarge,
  },
  labelDark: {
    color: callColors.accentText,
  },
  quietLabelDark: {
    color: callColors.text,
  },
  ghostLabel: {
    color: colors.text,
    textDecorationLine: 'underline',
  },
});
