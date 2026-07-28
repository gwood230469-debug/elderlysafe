import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { resolveVerificationEvent } from '../lib/verification';
import { colors, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Rehearsal'>;

// Reached by tapping a low-stakes practice notification (see
// createRehearsalPrompt / App.tsx's notification-response routing) — never
// simulates an actual phone call, just walks through the same steps as
// VerifyScriptScreen with a scenario prompt on top, then logs completion.
export function RehearsalScreen({ route }: Props) {
  const { verificationEventId, scenarioName } = route.params;
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function handleComplete() {
    setCompleting(true);
    try {
      if (verificationEventId) await resolveVerificationEvent(verificationEventId, 'completed');
    } catch (e) {
      console.warn('Could not record rehearsal completion', e);
    } finally {
      setCompleting(false);
      setCompleted(true);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{copy.rehearsal.title}</Text>
        <Text style={styles.subtitle}>{copy.rehearsal.subtitle}</Text>

        <Card accentBorder="accent" style={styles.scenarioCard}>
          <Text style={styles.scenarioText}>{copy.rehearsal.scenario(scenarioName)}</Text>
        </Card>

        <View style={styles.steps}>
          {copy.verifyScript.steps.map((step, index) => (
            <Card key={index} style={styles.stepCard}>
              <View style={styles.stepRow}>
                <View style={styles.stepNumberWrap}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            </Card>
          ))}
        </View>

        {completed ? (
          <Card style={styles.completedCard}>
            <Text style={styles.completedTitle}>{copy.rehearsal.completedTitle}</Text>
            <Text style={styles.completedBody}>{copy.rehearsal.completedBody}</Text>
          </Card>
        ) : (
          <Button label={copy.rehearsal.completeButton} onPress={handleComplete} disabled={completing} style={styles.completeButton} />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontFamily: typography.headingFamily, fontSize: typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.neutral[600], marginBottom: spacing.lg },
  scenarioCard: { marginBottom: spacing.lg },
  scenarioText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  steps: { gap: spacing.md, marginBottom: spacing.xl },
  stepCard: { paddingVertical: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepNumberWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumber: { fontFamily: typography.bodyFamilyMedium, fontSize: typography.body, color: colors.accentText },
  stepText: { flex: 1, fontFamily: typography.bodyFamily, fontSize: typography.bodyLarge, color: colors.text, lineHeight: 24 },
  completeButton: {},
  completedCard: { alignItems: 'center' },
  completedTitle: { fontFamily: typography.headingFamily, fontSize: typography.h3, color: colors.accentText, marginBottom: spacing.xs },
  completedBody: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text, textAlign: 'center' },
});
