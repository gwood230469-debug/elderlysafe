import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useCircle } from '../context/CircleContext';
import { listRecentCallEvents, RecentCallSummary } from '../lib/verification';
import { getErrorMessage } from '../lib/errors';
import { colors, radius, spacing, tabularNumbers, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { circleId, members, hasSafeWord } = useCircle();
  const [recentCalls, setRecentCalls] = useState<RecentCallSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!circleId) {
      setLoading(false);
      return;
    }
    listRecentCallEvents(circleId)
      .then(setRecentCalls)
      .catch((e) => setError(getErrorMessage(e, 'Could not load recent calls.')))
      .finally(() => setLoading(false));
  }, [circleId]);

  const confirmedMembers = members.filter((m) => m.status === 'confirmed');
  const memberNames = confirmedMembers.map((m) => m.displayName).join(', ');

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{copy.dashboard.familyCircleLabel}</Text>
        <View style={styles.circleGrid}>
          {members.map((member) => (
            <Card key={member.id} style={styles.memberCard}>
              <Avatar name={member.displayName} size={40} />
              <Text style={styles.memberName}>{member.displayName}</Text>
              <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>
                  {member.status === 'confirmed' ? copy.circle.status.confirmed : copy.circle.status.invited}
                </Text>
              </View>
            </Card>
          ))}
          <Pressable onPress={() => navigation.navigate('OnboardingAddMembers')} style={styles.addCard}>
            <Text style={styles.addCardText}>{copy.circle.add}</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>{copy.dashboard.recentCallsLabel}</Text>
        {loading ? (
          <ActivityIndicator color={colors.accentText} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
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
  circleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  memberCard: { width: '47%', alignItems: 'center', gap: spacing.xs },
  memberName: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  statusTag: { borderWidth: 1, borderColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusTagText: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.accentText },
  addCard: {
    width: '47%',
    borderWidth: 1,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
  },
  addCardText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.accentText },
  error: { fontFamily: typography.bodyFamily, color: colors.accentText },
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
