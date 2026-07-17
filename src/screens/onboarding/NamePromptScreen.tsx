import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { copy } from '../../constants/copy';
import { usePendingInvite } from '../../context/PendingInviteContext';
import { useProfile } from '../../context/ProfileContext';
import { claimInvite } from '../../lib/circle';
import { getErrorMessage } from '../../lib/errors';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingName'>;

export function NamePromptScreen({ navigation }: Props) {
  const { createProfile } = useProfile();
  const { token, clear: clearInvite } = usePendingInvite();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createProfile(name.trim());
      if (token) {
        try {
          await claimInvite(token);
          clearInvite();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          return;
        } catch {
          clearInvite();
        }
      }
      navigation.reset({ index: 0, routes: [{ name: 'OnboardingAddMembers' }] });
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save your name. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.prompt}>{copy.onboarding.name.prompt}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={copy.onboarding.name.placeholder}
          placeholderTextColor={colors.neutral[500]}
          autoFocus
          style={styles.input}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button label={copy.onboarding.name.continue} onPress={handleContinue} disabled={saving || !name.trim()} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  prompt: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  input: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.bodyLarge,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  error: {
    fontFamily: typography.bodyFamily,
    color: colors.accentText,
    marginBottom: spacing.md,
  },
});
