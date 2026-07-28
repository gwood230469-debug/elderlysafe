import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { getNotificationPreferences, NotificationPreferences, setNotificationPreferences } from '../lib/push';
import { colors, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationPreferences'>;

function PreferenceRow({
  label,
  detail,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  detail: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.neutral[300], true: colors.accent }}
        thumbColor={colors.white}
      />
    </View>
  );
}

export function NotificationPreferencesScreen(_props: Props) {
  const { session } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    getNotificationPreferences(userId)
      .then(setPrefs)
      .catch((e) => setError(getErrorMessage(e, copy.notificationPreferences.loadError)));
  }, [session?.user.id]);

  async function update(next: NotificationPreferences) {
    const userId = session?.user.id;
    if (!userId) return;
    const previous = prefs;
    setPrefs(next);
    setSaving(true);
    setError(null);
    try {
      await setNotificationPreferences(userId, next);
    } catch (e) {
      setPrefs(previous);
      setError(getErrorMessage(e, copy.notificationPreferences.saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.list}>
        {prefs && (
          <>
            <PreferenceRow
              label={copy.notificationPreferences.callRisk.label}
              detail={copy.notificationPreferences.callRisk.detail}
              value={prefs.notifyCallRisk}
              disabled={saving}
              onValueChange={(next) => update({ ...prefs, notifyCallRisk: next })}
            />
            <PreferenceRow
              label={copy.notificationPreferences.familyRequests.label}
              detail={copy.notificationPreferences.familyRequests.detail}
              value={prefs.notifyFamilyRequests}
              disabled={saving}
              onValueChange={(next) => update({ ...prefs, notifyFamilyRequests: next })}
            />
          </>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  rowDetail: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600], marginTop: 2 },
  error: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.accentText, marginTop: spacing.md },
});
