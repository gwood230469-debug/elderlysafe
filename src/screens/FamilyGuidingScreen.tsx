import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useCircle } from '../context/CircleContext';
import { sendPushNotification, getPushToken } from '../lib/push';
import { colors, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyGuiding'>;

// Handoff screen 5 ("joining as a third line"), rebuilt honestly to match
// the guided-call resolution: the family member isn't a live audio
// participant added by the app — they're shown the elderly user's guided-
// call status and given a direct call-now fallback plus a way to prompt the
// safeword check remotely.
export function FamilyGuidingScreen({ route }: Props) {
  const { elderlyMemberName } = route.params;
  const { members } = useCircle();
  const elderlyMember = members.find((m) => m.displayName === elderlyMemberName);

  function callNow() {
    if (elderlyMember?.phoneNumber) Linking.openURL(`tel:${elderlyMember.phoneNumber}`);
  }

  async function askSafewordAction() {
    if (!elderlyMember?.userId) return;
    try {
      const token = await getPushToken(elderlyMember.userId);
      if (token) await sendPushNotification(token, 'SafeWord', 'A family member is asking you to check the safeword before continuing.');
    } catch (e) {
      console.warn('Could not send ask-safeword prompt', e);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>{copy.familyGuiding.title(elderlyMemberName)}</Text>
        <Card accentBorder="accent" style={styles.card}>
          <Text style={styles.body}>{copy.familyGuiding.body(elderlyMemberName)}</Text>
        </Card>
        {elderlyMember?.phoneNumber && (
          <Button label={copy.familyGuiding.callNowFallback(elderlyMemberName)} onPress={callNow} style={styles.gap} />
        )}
        <Button label={copy.familyGuiding.askSafewordAction} variant="quiet" onPress={askSafewordAction} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg },
  title: { fontFamily: typography.headingFamily, fontSize: typography.h2, color: colors.text, marginBottom: spacing.md },
  card: { marginBottom: spacing.lg },
  body: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  gap: { marginBottom: spacing.md },
});
