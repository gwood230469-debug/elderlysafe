import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  // Call-chrome screens (incoming call, ask-safeword, guided-call) sit on
  // the dark callTheme background instead of the default light ground.
  dark?: boolean;
};

export function ScreenContainer({ children, style, dark = false }: Props) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, dark && styles.dark]}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  dark: {
    backgroundColor: '#1c1a19',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18.4,
  },
});
