import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SafeWordForm } from '../../components/SafeWordForm';
import { copy } from '../../constants/copy';
import { useCircle } from '../../context/CircleContext';
import { useProfile } from '../../context/ProfileContext';
import { getErrorMessage } from '../../lib/errors';
import { exportSafeWordCard } from '../../lib/safeWordCard';
import { colors, spacing, typography } from '../../theme/tokens';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingSafeWord'>;

export function OnboardingSafeWordScreen({ navigation }: Props) {
  const { members, saveSafeWord } = useCircle();
  const { displayName } = useProfile();
  const hasConfirmedMember = members.some((m) => m.status === 'confirmed');

  async function handleExportCard(rawValue: string) {
    try {
      await exportSafeWordCard({ circleOwnerName: displayName ?? 'Our family', safeWord: rawValue });
    } catch (e) {
      Alert.alert('Could not create card', getErrorMessage(e, copy.safeword.exportCardError));
    }
  }

  if (!hasConfirmedMember) {
    return (
      <ScreenContainer>
        <View style={styles.waiting}>
          <Text style={styles.title}>{copy.onboarding.safeword.waitingTitle}</Text>
          <Text style={styles.body}>{copy.onboarding.safeword.waitingBody}</Text>
          <Button
            label={copy.onboarding.safeword.continueHome}
            variant="quiet"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.form}>
        <SafeWordForm
          headline="Set your family's safe word"
          savedMessage={copy.safeword.changedNotification}
          onSaved={saveSafeWord}
          onExportCard={handleExportCard}
          footerWhenSaved={
            <Button
              label={copy.onboarding.safeword.continueHome}
              variant="quiet"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
              style={styles.continueButton}
            />
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  waiting: {
    flex: 1,
    justifyContent: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.neutral[600],
    marginBottom: spacing.xl,
  },
  continueButton: {
    marginTop: spacing.md,
  },
});
