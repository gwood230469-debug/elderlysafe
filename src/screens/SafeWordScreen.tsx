import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SafeWordForm } from '../components/SafeWordForm';
import { copy } from '../constants/copy';
import { useCircle } from '../context/CircleContext';
import { useProfile } from '../context/ProfileContext';
import { getSafeWordUpdatedAt } from '../lib/circle';
import { getErrorMessage } from '../lib/errors';
import { exportSafeWordCard } from '../lib/safeWordCard';
import { daysSince, isRotationDue } from '../lib/safeWordRotation';
import { colors, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SafeWord'>;

export function SafeWordScreen(_props: Props) {
  const { circleId, saveSafeWord } = useCircle();
  const { displayName } = useProfile();
  const [safeWordUpdatedAt, setSafeWordUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!circleId) return;
    getSafeWordUpdatedAt(circleId)
      .then(setSafeWordUpdatedAt)
      .catch(() => setSafeWordUpdatedAt(null));
  }, [circleId]);

  async function handleExportCard(rawValue: string) {
    try {
      await exportSafeWordCard({ circleOwnerName: displayName ?? 'Our family', safeWord: rawValue });
    } catch (e) {
      Alert.alert('Could not create card', getErrorMessage(e, copy.safeword.exportCardError));
    }
  }

  const age = safeWordUpdatedAt ? daysSince(safeWordUpdatedAt) : null;
  const due = isRotationDue(safeWordUpdatedAt);

  return (
    <ScreenContainer>
      <SafeWordForm
        headline="Change your safe word"
        savedMessage={copy.safeword.changedNotification}
        onSaved={saveSafeWord}
        onExportCard={handleExportCard}
        headerExtra={
          age !== null ? (
            <Text style={due ? styles.rotationDue : styles.rotationFresh}>
              {due ? copy.safeword.rotationReminder(age) : copy.safeword.rotationFresh(age)}
            </Text>
          ) : undefined
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  rotationDue: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.small,
    color: colors.accentText,
    marginBottom: spacing.lg,
  },
  rotationFresh: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.small,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
  },
});
