import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useCircle } from '../context/CircleContext';
import { resolveVerificationEvent } from '../lib/verification';
import { callColors } from '../theme/callTheme';
import { typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AskSafewordCall'>;

// Handoff screen 2. Manual judgment call by the elderly user — no on-device
// speech matching in this pass (the handoff explicitly scoped that as a
// future iteration, either remote family confirmation or on-device speech
// matching, not something to build now).
export function AskSafewordCallScreen({ route, navigation }: Props) {
  const { callerNumber, verificationEventId } = route.params;
  const { members } = useCircle();
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const firstConfirmed = members.find((m) => m.status === 'confirmed');

  async function handleResult(outcome: 'correct' | 'wrong') {
    setResult(outcome);
    if (!verificationEventId) return;
    try {
      await resolveVerificationEvent(verificationEventId, outcome === 'correct' ? 'verified_safe' : 'safeword_failed');
    } catch (e) {
      console.warn('Could not resolve verification event', e);
    }
  }

  return (
    <ScreenContainer dark>
      <View style={styles.flex}>
        <View style={styles.claimCard}>
          <Text style={styles.claimLabel}>They said</Text>
          <Text style={styles.claimText}>"It's an emergency — I need you to buy gift cards and read me the codes."</Text>
          <Text style={styles.claimMeta}>{callerNumber}</Text>
        </View>

        {!result ? (
          <View style={styles.promptSection}>
            <Text style={styles.prompt}>{copy.askSafeword.prompt}</Text>
            <Text style={styles.supporting}>{copy.askSafeword.supporting}</Text>
          </View>
        ) : result === 'correct' ? (
          <View style={styles.outcome}>
            <Text style={styles.outcomeIcon}>✓</Text>
            <Text style={styles.outcomeTitleGood}>{copy.askSafeword.verifiedTitle}</Text>
          </View>
        ) : (
          <View style={styles.outcome}>
            <Text style={styles.outcomeIcon}>⚠</Text>
            <Text style={styles.outcomeTitle}>{copy.incomingCall.alertedTitle}</Text>
            <Text style={styles.outcomeBody}>{copy.incomingCall.alertedBody}</Text>
          </View>
        )}

        {!result ? (
          <View style={styles.buttonCol}>
            <Button label={copy.askSafeword.correct} size="elderly" dark onPress={() => handleResult('correct')} />
            <Button label={copy.askSafeword.wrong} variant="quiet" size="elderly" dark onPress={() => handleResult('wrong')} />
          </View>
        ) : result === 'correct' ? (
          <Button label="Continue the call" size="elderly" dark onPress={() => navigation.popToTop()} />
        ) : (
          <Button
            label="Continue"
            size="elderly"
            dark
            onPress={() => navigation.replace('GuidedCall', { memberId: firstConfirmed?.id ?? '' })}
          />
        )}

        <Text style={styles.footer}>{copy.askSafeword.footer}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'space-between', paddingVertical: 27.6 },
  claimCard: { borderWidth: 1, borderColor: callColors.divider, borderRadius: 7, padding: 18.4 },
  claimLabel: { fontFamily: typography.bodyFamilyMedium, fontSize: typography.small, color: callColors.textMuted, marginBottom: 4.6 },
  claimText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: 'rgba(243, 240, 234, 0.75)', fontStyle: 'italic' },
  claimMeta: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: callColors.textMuted, marginTop: 9.2 },
  promptSection: { paddingHorizontal: 18.4 },
  prompt: { fontFamily: typography.headingFamily, fontSize: typography.h2, color: callColors.text, marginBottom: 9.2 },
  supporting: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: callColors.textMuted },
  outcome: { alignItems: 'center', paddingHorizontal: 18.4 },
  outcomeIcon: { fontSize: 40, color: callColors.accentText, marginBottom: 9.2 },
  outcomeTitleGood: { fontFamily: typography.headingFamily, fontSize: typography.h3, color: callColors.accentText, textAlign: 'center' },
  outcomeTitle: { fontFamily: typography.headingFamily, fontSize: typography.h3, color: callColors.accentText, textAlign: 'center' },
  outcomeBody: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: callColors.accentText, marginTop: 4.6 },
  buttonCol: { gap: 13.8, paddingHorizontal: 18.4 },
  footer: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: callColors.textMuted, textAlign: 'center', paddingHorizontal: 18.4 },
});
