import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useAuth } from '../context/AuthContext';
import { getCallScreeningRoleStatus, requestCallScreeningRole } from '../../modules/call-screening/src';
import { colors, spacing, touchTarget, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function SettingsRow({ label, detail, onPress, disabled }: { label: string; detail?: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
    </Pressable>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [callProtectionStatus, setCallProtectionStatus] = useState<'granted' | 'denied' | 'unsupported' | 'checking'>('checking');

  useEffect(() => {
    getCallScreeningRoleStatus().then(setCallProtectionStatus);
  }, []);

  async function handleCallProtection() {
    const status = await requestCallScreeningRole();
    setCallProtectionStatus(status);
    if (status === 'denied') {
      Alert.alert(
        'Call protection not enabled',
        "SafeWord can only screen calls for scam risk if it's set as your call-screening app. You can turn this on any time from here."
      );
    }
  }

  const callProtectionDetail =
    callProtectionStatus === 'granted' ? 'On' : callProtectionStatus === 'unsupported' ? 'Not available on this device' : 'Off — tap to enable';

  return (
    <ScreenContainer>
      <View style={styles.list}>
        <SettingsRow label={copy.settings.changeSafeWord} onPress={() => navigation.navigate('SafeWord')} />
        <SettingsRow label={copy.settings.manageCircle} onPress={() => navigation.navigate('Dashboard')} />
        <SettingsRow
          label={copy.settings.callProtection}
          detail={callProtectionDetail}
          onPress={handleCallProtection}
          disabled={callProtectionStatus === 'unsupported' || callProtectionStatus === 'checking'}
        />
        <SettingsRow label={copy.settings.notifications} onPress={() => {}} disabled />
        <SettingsRow label={copy.settings.signOut} onPress={() => signOut()} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: spacing.lg },
  row: {
    minHeight: touchTarget.minSize,
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowDisabled: { opacity: 0.5 },
  rowLabel: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  rowDetail: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600], marginTop: 2 },
});
