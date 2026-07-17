import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { copy } from '../../constants/copy';
import { useCircle } from '../../context/CircleContext';
import { getErrorMessage } from '../../lib/errors';
import { normalizePhoneNumber } from '../../lib/phone';
import { shareInvite } from '../../lib/invite';
import { useProfile } from '../../context/ProfileContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingAddMembers'>;

export function AddMembersScreen({ navigation }: Props) {
  const { members, addMember } = useCircle();
  const { displayName } = useProfile();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const phoneValue = phone.trim() ? normalizePhoneNumber(phone) : null;
      const { inviteToken } = await addMember(name.trim(), phoneValue);
      await shareInvite(displayName ?? 'Your family member', name.trim(), inviteToken);
      setName('');
      setPhone('');
    } catch (e) {
      setError(getErrorMessage(e, 'Could not add that member. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>{copy.onboarding.addMembers.title}</Text>
      <Text style={styles.subtitle}>{copy.onboarding.addMembers.subtitle}</Text>

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <Avatar name={item.displayName} size={40} />
            <Text style={styles.memberName}>{item.displayName}</Text>
            <Text style={styles.memberStatus}>{copy.circle.status.invited}</Text>
          </View>
        )}
      />

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={copy.onboarding.addMembers.namePlaceholder}
        placeholderTextColor={colors.neutral[500]}
        style={styles.input}
      />
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder={copy.onboarding.addMembers.phonePlaceholder}
        placeholderTextColor={colors.neutral[500]}
        keyboardType="phone-pad"
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        label={copy.onboarding.invite.button}
        variant="quiet"
        onPress={handleAdd}
        disabled={saving || !name.trim()}
        style={styles.addButton}
      />
      <Button
        label={copy.onboarding.addMembers.continue}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'OnboardingSafeWord' }] })}
        disabled={members.length === 0}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
  },
  list: {
    maxHeight: 160,
    marginBottom: spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  memberName: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.text,
    flex: 1,
  },
  memberStatus: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.small,
    color: colors.neutral[600],
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
    marginBottom: spacing.sm,
  },
  error: {
    fontFamily: typography.bodyFamily,
    color: colors.accentText,
    marginBottom: spacing.sm,
  },
  addButton: {
    marginBottom: spacing.md,
  },
});
