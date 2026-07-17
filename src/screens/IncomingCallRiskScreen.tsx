import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useAuth } from '../context/AuthContext';
import { useCircle } from '../context/CircleContext';
import { createCallRiskEvent } from '../lib/verification';
import { callColors } from '../theme/callTheme';
import { tabularNumbers, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'IncomingCallRisk'>;

// Handoff screen 1. Risk % ticks upward live while the call is answered and
// unresolved (+2-6%/sec, capped at 91 — matching the design prototype and
// the score-call-risk Edge Function's own cap) purely as a UI simulation of
// a model that's actually already scored once at ring time by the native
// CallScreeningService; this local tick is cosmetic reassurance-pacing, not
// a second live model call.
export function IncomingCallRiskScreen({ route, navigation }: Props) {
  const { callerNumber, riskScore: initialRisk, riskReasons } = route.params;
  const { session } = useAuth();
  const { circleId } = useCircle();
  const [answered, setAnswered] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [risk, setRisk] = useState(initialRisk);
  const [alerted, setAlerted] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!answered || alerted) return;
    tickRef.current = setInterval(() => {
      setRisk((prev) => Math.min(91, prev + 2 + Math.floor(Math.random() * 5)));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [answered, alerted]);

  async function handleAlert() {
    if (tickRef.current) clearInterval(tickRef.current);
    const userId = session?.user.id;
    if (circleId && userId) {
      try {
        const id = await createCallRiskEvent(circleId, userId, callerNumber, risk, riskReasons);
        setEventId(id);
      } catch (e) {
        console.warn('Could not record call-risk alert', e);
      }
    }
    setAlerted(true);
  }

  if (declined) return null;

  return (
    <ScreenContainer dark>
      <View style={styles.flex}>
        <View style={styles.topRow}>
          <View style={styles.riskPill}>
            <Text style={styles.riskPillText}>⚠ {copy.incomingCall.riskTag(risk)}</Text>
          </View>
        </View>

        <View style={styles.center}>
          <View style={styles.avatarOutline}>
            <Text style={styles.avatarGlyph}>◍</Text>
          </View>
          <Text style={styles.callerName}>{copy.incomingCall.unknownCaller}</Text>
          <Text style={styles.callerNumber}>{callerNumber}</Text>
          {!alerted && <Text style={styles.caution}>{riskReasons[0] ?? copy.incomingCall.caution}</Text>}
          {alerted && (
            <View style={styles.alertedBox}>
              <Text style={styles.alertedTitle}>{copy.incomingCall.alertedTitle}</Text>
              <Text style={styles.alertedBody}>{copy.incomingCall.alertedBody}</Text>
            </View>
          )}
        </View>

        {!answered ? (
          <View style={styles.buttonRowBefore}>
            <Button
              label={copy.incomingCall.decline}
              variant="quiet"
              size="elderly"
              dark
              onPress={() => setDeclined(true)}
              style={styles.halfButton}
            />
            <Button label={copy.incomingCall.answer} size="elderly" dark onPress={() => setAnswered(true)} style={styles.halfButton} />
          </View>
        ) : !alerted ? (
          <View style={styles.buttonColAfter}>
            <Button label={copy.incomingCall.alertButton} size="elderly" dark onPress={handleAlert} style={styles.stackButton} />
            <Button label={copy.incomingCall.endCall} variant="quiet" size="elderly" dark onPress={() => setDeclined(true)} />
          </View>
        ) : (
          <View style={styles.buttonColAfter}>
            <Button
              label="Ask them for the safeword"
              size="elderly"
              dark
              onPress={() =>
                navigation.replace('AskSafewordCall', {
                  callerNumber,
                  riskScore: risk,
                  riskReasons,
                  verificationEventId: eventId ?? '',
                })
              }
              style={styles.stackButton}
            />
            <Button label={copy.incomingCall.endCall} variant="quiet" size="elderly" dark onPress={() => setDeclined(true)} />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'space-between', paddingVertical: 27.6 },
  topRow: { alignItems: 'center' },
  riskPill: { borderWidth: 1, borderColor: callColors.accent, borderRadius: 20, paddingHorizontal: 13.8, paddingVertical: 6 },
  riskPillText: { fontFamily: typography.bodyFamilyMedium, fontSize: typography.small, color: callColors.accentText, ...tabularNumbers },
  center: { alignItems: 'center', paddingHorizontal: 18.4 },
  avatarOutline: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: callColors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18.4,
  },
  avatarGlyph: { fontSize: 40, color: callColors.textMuted },
  callerName: { fontFamily: typography.headingFamily, fontSize: typography.h2, color: callColors.text, marginBottom: 4.6 },
  callerNumber: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: callColors.textMuted, marginBottom: 13.8 },
  caution: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: callColors.accentText, textAlign: 'center' },
  alertedBox: { alignItems: 'center', marginTop: 13.8 },
  alertedTitle: { fontFamily: typography.headingFamily, fontSize: typography.h3, color: callColors.accentText, textAlign: 'center' },
  alertedBody: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: callColors.accentText, marginTop: 4.6 },
  buttonRowBefore: { flexDirection: 'row', gap: 13.8, paddingHorizontal: 18.4 },
  halfButton: { flex: 1 },
  buttonColAfter: { gap: 13.8, paddingHorizontal: 18.4 },
  stackButton: {},
});
