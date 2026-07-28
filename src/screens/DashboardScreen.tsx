import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useAuth } from '../context/AuthContext';
import { useCircle } from '../context/CircleContext';
import { useProfile } from '../context/ProfileContext';
import { getSafeWordUpdatedAt } from '../lib/circle';
import { getErrorMessage } from '../lib/errors';
import { daysSince, isRotationDue } from '../lib/safeWordRotation';
import { listRecentCallEvents, listRehearsalEvents, RecentCallSummary, sendRehearsalPrompt } from '../lib/verification';
import { colors, radius, spacing, tabularNumbers, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';
import { CircleMember } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function MemberReadinessCard({
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
    <Card style={styles.memberCard}>
      <View style={styles.memberHeaderRow}>
        <Avatar name={member.displayName} size={40} />
        <Text style={styles.memberName}>{member.displayName}</Text>
      </View>

      <View style={styles.readinessRow}>
        <Text style={informed ? styles.readinessOk : styles.readinessWarn}>
          {informed ? copy.dashboard.readinessInformed(formatDate(member.safeWordInformedAt as string)) : copy.dashboard.readinessNotInformed}
        </Text>
        {!informed && <Button label={copy.dashboard.markAsTold} variant="quiet" onPress={onMarkInformed} style={styles.readinessButton} />}
      </View>

      <View style={styles.readinessRow}>
        <Text style={styles.readinessNeutral}>
          {rehearsalDays !== null ? copy.dashboard.readinessLastRehearsed(rehearsalDays) : copy.dashboard.readinessNeverRehearsed}
        </Text>
        <Button
          label={copy.dashboard.sendPracticeRun}
          variant="quiet"
          onPress={onSendPracticeRun}
          disabled={sendingPracticeRun}
          style={styles.readinessButton}
        />
      </View>
    </Card>
  );
}

export function DashboardScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { circleId, members, hasSafeWord, markInformed } = useCircle();
  const { displayName } = useProfile();
  const [recentCalls, setRecentCalls] = useState<RecentCallSummary[]>([]);
  const [lastRehearsedByMember, setLastRehearsedByMember] = useState<Map<string, string>>(new Map());
  const [safeWordUpdatedAt, setSafeWordUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!circleId) {
      setLoading(false);
      return;
    }
    Promise.all([listRecentCallEvents(circleId), listRehearsalEvents(circleId), getSafeWordUpdatedAt(circleId)])
      .then(([calls, rehearsals, updatedAt]) => {
        setRecentCalls(calls);
        setSafeWordUpdatedAt(updatedAt);
        const latestByMember = new Map<string, string>();
        // rehearsals is ordered newest-first, so the first entry seen per
        // member is their most recent one.
        for (const event of rehearsals) {
          if (!latestByMember.has(event.memberUserId)) latestByMember.set(event.memberUserId, event.createdAt);
        }
        setLastRehearsedByMember(latestByMember);
      })
      .catch((e) => setError(getErrorMessage(e, 'Could not load your family circle.')))
      .finally(() => setLoading(false));
  }, [circleId]);

  const confirmedMembers = members.filter((m) => m.status === 'confirmed');
  const invitedMembers = members.filter((m) => m.status === 'invited');
  const memberNames = confirmedMembers.map((m) => m.displayName).join(', ');
  const rotationDue = useMemo(() => isRotationDue(safeWordUpdatedAt), [safeWordUpdatedAt]);

  async function handleSendPracticeRun(member: CircleMember) {
    if (!circleId || !member.userId) return;
    setSendingTo(member.id);
    try {
      await sendRehearsalPrompt(circleId, member.userId, displayName ?? 'a family member');
      setLastRehearsedByMember((prev) => new Map(prev).set(member.userId as string, new Date().toISOString()));
    } catch (e) {
      setError(getErrorMessage(e, 'Could not send a practice run.'));
    } finally {
      setSendingTo(null);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {rotationDue && safeWordUpdatedAt && (
          <Card accentBorder="accent" style={styles.rotationBanner}>
            <Text style={styles.rotationBannerText}>{copy.dashboard.rotationBanner(daysSince(safeWordUpdatedAt))}</Text>
            <Pressable onPress={() => navigation.navigate('SafeWord')}>
              <Text style={styles.rotationBannerLink}>{copy.dashboard.safewordChange} →</Text>
            </Pressable>
          </Card>
        )}

        <Text style={styles.sectionLabel}>{copy.dashboard.familyCircleLabel}</Text>
        {loading ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <View style={styles.memberList}>
            {confirmedMembers.map((member) => (
              <MemberReadinessCard
                key={member.id}
                member={member}
                lastRehearsedAt={member.userId ? lastRehearsedByMember.get(member.userId) ?? null : null}
                onMarkInformed={() => markInformed(member.id).catch((e) => setError(getErrorMessage(e, 'Could not update that.')))}
                onSendPracticeRun={() => handleSendPracticeRun(member)}
                sendingPracticeRun={sendingTo === member.id}
              />
            ))}
            {invitedMembers.map((member) => (
              <Card key={member.id} style={styles.memberCard}>
                <View style={styles.memberHeaderRow}>
                  <Avatar name={member.displayName} size={40} />
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  <Text style={styles.invitedTag}>{copy.circle.status.invited}</Text>
                </View>
              </Card>
            ))}
            <Pressable onPress={() => navigation.navigate('OnboardingAddMembers')} style={styles.addCard}>
              <Text style={styles.addCardText}>{copy.circle.add}</Text>
            </Pressable>
          </View>
        )}
        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>{copy.dashboard.recentCallsLabel}</Text>
        {loading ? (
          <ActivityIndicator color={colors.accentText} />
        ) : recentCalls.length === 0 ? (
          <Text style={styles.empty}>{copy.dashboard.recentCallsEmpty}</Text>
        ) : (
          <View style={styles.table}>
            {recentCalls.map((call) => (
              <View key={call.id} style={styles.tableRow}>
                <Text style={styles.tableCellCaller} numberOfLines={1}>
                  {call.callerNumber ?? 'Unknown'}
                </Text>
                {call.riskScore !== null && (
                  <View style={styles.riskPill}>
                    <Text style={[styles.riskPillText, tabularNumbers]}>{call.riskScore}%</Text>
                  </View>
                )}
                <Text style={styles.tableCellOutcome}>{call.resolution ? copy.dashboard.outcome[call.resolution] : '—'}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>{copy.dashboard.safewordLabel}</Text>
        <Card>
          <Text style={styles.safewordMasked}>{hasSafeWord ? copy.dashboard.safewordMasked : 'Not set yet'}</Text>
          <View style={styles.safewordFooterRow}>
            <Pressable onPress={() => navigation.navigate('SafeWord')}>
              <Text style={styles.safewordChange}>{copy.dashboard.safewordChange}</Text>
            </Pressable>
            {hasSafeWord && memberNames && <Text style={styles.safewordKnownBy}>{copy.dashboard.safewordKnownBy(memberNames)}</Text>}
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  sectionLabel: {
    fontFamily: typography.bodyFamilyMedium,
    fontSize: typography.small,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionSpacing: { marginTop: spacing.xl },
  rotationBanner: { marginBottom: spacing.lg, gap: spacing.xs },
  rotationBannerText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  rotationBannerLink: { fontFamily: typography.bodyFamilyMedium, fontSize: typography.body, color: colors.accentText },
  memberList: { gap: spacing.sm },
  memberCard: { gap: spacing.sm },
  memberHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberName: { flex: 1, fontFamily: typography.bodyFamilyMedium, fontSize: typography.body, color: colors.text },
  invitedTag: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600] },
  readinessRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  readinessOk: { flex: 1, fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600] },
  readinessWarn: { flex: 1, fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.accentText },
  readinessNeutral: { flex: 1, fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600] },
  readinessButton: { paddingHorizontal: spacing.sm, minHeight: 32 },
  addCard: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  addCardText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.accentText },
  error: { fontFamily: typography.bodyFamily, color: colors.accentText, marginTop: spacing.sm },
  empty: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.neutral[600] },
  table: { gap: spacing.xs },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tableCellCaller: { flex: 1, fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  riskPill: { backgroundColor: colors.accentRamp[100], borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  riskPillText: { fontFamily: typography.bodyFamilyMedium, fontSize: typography.small, color: colors.accentText },
  tableCellOutcome: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600] },
  safewordMasked: { fontFamily: typography.headingFamily, fontSize: typography.h2, color: colors.text, marginBottom: spacing.sm },
  safewordFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  safewordChange: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.accentText, textDecorationLine: 'underline' },
  safewordKnownBy: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.neutral[600] },
});
