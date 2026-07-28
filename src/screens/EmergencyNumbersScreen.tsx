import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { EMBASSY_GUIDANCE, EMERGENCY_NUMBERS_LAST_UPDATED } from '../data/emergencyNumbers';
import { detectCountryByGps, getLocaleCountryCode } from '../lib/countryDetection';
import { lookupEmergencyNumbers } from '../lib/emergencyNumbers';
import { colors, spacing, tabularNumbers, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EmergencyNumbers'>;

function NumberRow({ label, note, number }: { label: string; note?: string; number: string }) {
  const callable = Boolean(number);
  return (
    <View style={styles.numberRow}>
      <View style={styles.numberRowText}>
        <Text style={styles.numberLabel}>{label}</Text>
        {note && <Text style={styles.numberNote}>{note}</Text>}
      </View>
      <Button
        label={callable ? number : '—'}
        variant={callable ? 'primary' : 'quiet'}
        disabled={!callable}
        onPress={() => Linking.openURL(`tel:${number}`)}
        style={styles.callButton}
      />
    </View>
  );
}

export function EmergencyNumbersScreen(_props: Props) {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setCountryCode(getLocaleCountryCode());
  }, []);

  async function useCurrentLocation() {
    setDetecting(true);
    setLocationError(null);
    const detected = await detectCountryByGps();
    if (detected) {
      setCountryCode(detected);
    } else {
      setLocationError(copy.emergencyNumbers.locationDeniedError);
    }
    setDetecting(false);
  }

  const numbers = lookupEmergencyNumbers(countryCode);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{copy.emergencyNumbers.title}</Text>
        <Text style={styles.subtitle}>{copy.emergencyNumbers.subtitle(numbers.countryName)}</Text>

        <Card style={styles.numbersCard}>
          <NumberRow label={copy.emergencyNumbers.emergencyLabel} note={numbers.emergencyNote} number={numbers.emergency} />
          <View style={styles.divider} />
          <NumberRow
            label={copy.emergencyNumbers.nonEmergencyLabel}
            note={numbers.nonEmergencyNote ?? copy.emergencyNumbers.nonEmergencyMissing}
            number={numbers.nonEmergencyPolice}
          />
        </Card>

        <Card accentBorder="accent" style={styles.sosCard}>
          <Text style={styles.sosText}>{copy.emergencyNumbers.emergencySosNote}</Text>
        </Card>

        <Text style={styles.sectionLabel}>{copy.emergencyNumbers.embassyLabel}</Text>
        <Text style={styles.embassyText}>{EMBASSY_GUIDANCE}</Text>

        <View style={styles.detectRow}>
          {detecting ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Button label={copy.emergencyNumbers.detectLocationButton} variant="quiet" onPress={useCurrentLocation} />
          )}
        </View>
        {locationError && <Text style={styles.error}>{locationError}</Text>}

        <Text style={styles.sourceNote}>{copy.emergencyNumbers.sourceNote(EMERGENCY_NUMBERS_LAST_UPDATED)}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontFamily: typography.headingFamily, fontSize: typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.neutral[600], marginBottom: spacing.lg },
  numbersCard: { gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.divider },
  numberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  numberRowText: { flex: 1 },
  numberLabel: { fontFamily: typography.bodyFamilyMedium, fontSize: typography.body, color: colors.text },
  numberNote: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600], marginTop: 2 },
  callButton: { minWidth: 96, ...tabularNumbers },
  sosCard: { marginTop: spacing.lg },
  sosText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  sectionLabel: {
    fontFamily: typography.bodyFamilyMedium,
    fontSize: typography.small,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  embassyText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  detectRow: { marginTop: spacing.lg, alignItems: 'flex-start' },
  error: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.accentText, marginTop: spacing.sm },
  sourceNote: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[500], marginTop: spacing.xl },
});
