import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { copy } from '../constants/copy';
import { daysSince } from '../lib/safeWordRotation';
import { colors, spacing, typography } from '../theme/tokens';
import { CircleMember } from '../types/models';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MemberReadinessCard({
  member,
  lastRehearsedAt,
  onMarkInformed,
  onSendPracticeRun,
  sendingPracticeRun,
}: {
  member: CircleMember;
  lastRehearsedAt: string | null;
  onMarkInformed: () => void;
  onSendPracticeRun: () => void;
  sendingPracticeRun: boolean;
}) {
  const informed = Boolean(member.safeWordInformedAt);
  const rehearsalDays = lastRehearsedAt ? daysSince(lastRehearsedAt) : null;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Avatar name={member.displayName} size={40} />
        <Text style={styles.name}>{member.displayName}</Text>
      </View>

      <View style={styles.row}>
        <Text style={informed ? styles.ok : styles.warn}>
          {informed ? copy.dashboard.readinessInformed(formatDate(member.safeWordInformedAt as string)) : copy.dashboard.readinessNotInformed}
        </Text>
        {!informed && <Button label={copy.dashboard.markAsTold} variant="quiet" onPress={onMarkInformed} style={styles.button} />}
      </View>

      <View style={styles.row}>
        <Text style={styles.neutral}>
          {rehearsalDays !== null ? copy.dashboard.readinessLastRehearsed(rehearsalDays) : copy.dashboard.readinessNeverRehearsed}
        </Text>
        <Button
          label={copy.dashboard.sendPracticeRun}
          variant="quiet"
          onPress={onSendPracticeRun}
          disabled={sendingPracticeRun}
          style={styles.button}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontFamily: typography.bodyFamilyMedium, fontSize: typography.body, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ok: { flex: 1, fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600] },
  warn: { flex: 1, fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.accentText },
  neutral: { flex: 1, fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600] },
  button: { paddingHorizontal: spacing.sm, minHeight: 32 },
});
