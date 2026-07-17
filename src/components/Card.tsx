import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme/tokens';

type AccentBorder = 'accent' | 'none';

type Props = ViewProps & {
  children: ReactNode;
  accentBorder?: AccentBorder;
  style?: ViewStyle;
};

export function Card({ children, accentBorder = 'none', style, ...rest }: Props) {
  return (
    <View style={[styles.base, accentBorder === 'accent' && styles.accentBorder, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
    ...shadow.sm,
  },
  accentBorder: {
    borderColor: colors.accent,
  },
});
