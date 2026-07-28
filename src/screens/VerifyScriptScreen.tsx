import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { colors, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyScript'>;

// Static, always-accessible reference — no backend, no state. Deliberately
// plain and calm rather than alarming: this is meant to be read slowly by
// someone who's already anxious, not to add to that.
export function VerifyScriptScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{copy.verifyScript.title}</Text>
        <Text style={styles.subtitle}>{copy.verifyScript.subtitle}</Text>

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

        <Card accentBorder="accent" style={styles.emergencyCard}>
          <Text style={styles.emergencyText}>{copy.verifyScript.stillNeedHelp}</Text>
          <Button
            label={copy.emergencyNumbers.title}
            variant="quiet"
            onPress={() => navigation.navigate('EmergencyNumbers')}
            style={styles.emergencyButton}
          />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontFamily: typography.headingFamily, fontSize: typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.neutral[600], marginBottom: spacing.xl },
  steps: { gap: spacing.md },
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
  emergencyCard: { marginTop: spacing.xl },
  emergencyText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  emergencyButton: { marginTop: spacing.md },
});
