import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Button } from './Button';
import { copy } from '../constants/copy';
import { getErrorMessage } from '../lib/errors';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  headline: string;
  savedMessage?: string;
  saveLabel?: string;
  onSaved: (value: string) => Promise<void>;
};

export function SafeWordForm({ headline, savedMessage, saveLabel, onSaved }: Props) {
  // Blocks screenshots/screen recording while the safe word is visible on
  // screen (Android FLAG_SECURE via this hook) — the one place in the app
  // with real platform security behavior, since the safe word is otherwise
  // stored only as a salted hash, never in plaintext anywhere else.
  usePreventScreenCapture();

  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!value.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSaved(value.trim());
      setSaved(true);
      setValue('');
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save your safe word. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.instruction}>{copy.safeword.instruction}</Text>
      <Text style={styles.guidance}>{copy.safeword.guidance}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Your family's safe word"
        placeholderTextColor={colors.neutral[500]}
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {saved && savedMessage && <Text style={styles.saved}>{savedMessage}</Text>}
      <Button label={saveLabel ?? copy.safeword.save} onPress={handleSave} disabled={saving || !value.trim()} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  instruction: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  guidance: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.small,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
  },
  input: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  error: {
    fontFamily: typography.bodyFamily,
    color: colors.accentText,
    marginBottom: spacing.sm,
  },
  saved: {
    fontFamily: typography.bodyFamily,
    color: colors.accentText,
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
});
