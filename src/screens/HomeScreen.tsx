import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { MemberReadinessCard } from '../components/MemberReadinessCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useCircle } from '../context/CircleContext';
import { useProfile } from '../context/ProfileContext';
import { useCircleReadiness } from '../hooks/useCircleReadiness';
import { getErrorMessage } from '../lib/errors';
import { daysSince, isRotationDue } from '../lib/safeWordRotation';
import { sendRehearsalPrompt } from '../lib/verification';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';
import { CircleMember } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Coordinator-first home screen: the family's readiness status is the
// primary, hero content (see item 5's dashboard); "verify a call", the
// verify-the-claim script, and the printable card are secondary, one-tap-
// away actions below it — not the other way around, and never rendered in
// an alarm color at rest (only genuinely active alerts get that treatment,
// e.g. IncomingCallRiskScreen's own dark call-chrome).
export function HomeScreen({ navigation }: Props) {
  const { circleId, members, markInformed } = useCircle();
  const { displayName } = useProfile();
  const { lastRehearsedByMember, safeWordUpdatedAt, loading, error } = useCircleReadiness(circleId);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmedMembers = members.filter((m) => m.status === 'confirmed');
  const rotationDue = isRotationDue(safeWordUpdatedAt);

  async function handleSendPracticeRun(member: CircleMember) {
    if (!circleId || !member.userId) return;
    setSendingTo(member.id);
    try {
      await sendRehearsalPrompt(circleId, member.userId, displayName ?? 'a family member');
    } catch (e) {
      setActionError(getErrorMessage(e, 'Could not send a practice run.'));
    } finally {
      setSendingTo(null);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>{copy.home.greeting(displayName ?? 'there')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={8} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙︎</Text>
          </Pressable>
        </View>

        {rotationDue && safeWordUpdatedAt && (
          <Card accentBorder="accent" style={styles.rotationBanner}>
            <Text style={styles.rotationBannerText}>{copy.dashboard.rotationBanner(daysSince(safeWordUpdatedAt))}</Text>
            <Pressable onPress={() => navigation.navigate('SafeWord')}>
              <Text style={styles.rotationBannerLink}>{copy.dashboard.safewordChange} →</Text>
            </Pressable>
          </Card>
        )}

        <Text style={styles.sectionLabel}>{copy.home.circle.label}</Text>
        {loading ? (
          <ActivityIndicator color={colors.accentText} />
        ) : confirmedMembers.length === 0 ? (
          <Pressable onPress={() => navigation.navigate('Dashboard')} style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>{copy.circle.add} →</Text>
          </Pressable>
        ) : (
          <View style={styles.memberList}>
            {confirmedMembers.map((member) => (
              <MemberReadinessCard
                key={member.id}
                member={member}
                lastRehearsedAt={member.userId ? lastRehearsedByMember.get(member.userId) ?? null : null}
                onMarkInformed={() => markInformed(member.id).catch((e) => setActionError(getErrorMessage(e, 'Could not update that.')))}
                onSendPracticeRun={() => handleSendPracticeRun(member)}
                sendingPracticeRun={sendingTo === member.id}
              />
            ))}
          </View>
        )}
        {(error || actionError) && <Text style={styles.error}>{error ?? actionError}</Text>}

        <Pressable onPress={() => navigation.navigate('Dashboard')} hitSlop={4}>
          <Text style={styles.manageLink}>Manage circle & history →</Text>
        </Pressable>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>If something feels wrong</Text>
        <View style={styles.actionList}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('VerifyCall')}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
          >
            <Text style={styles.actionTitle}>{copy.home.cta.title}</Text>
            <Text style={styles.actionSubtitle}>{copy.home.cta.subtitle}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('VerifyScript')}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
          >
            <Text style={styles.actionTitle}>{copy.verifyScript.title}</Text>
            <Text style={styles.actionSubtitle}>{copy.verifyScript.subtitle}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('SafeWord')}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
          >
            <Text style={styles.actionTitle}>{copy.safeword.exportCard}</Text>
            <Text style={styles.actionSubtitle}>A large-print card to keep by the phone.</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h2,
    color: colors.text,
  },
  settingsIcon: {
    fontSize: 20,
    color: colors.neutral[600],
  },
  rotationBanner: { marginBottom: spacing.lg, gap: spacing.xs },
  rotationBannerText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  rotationBannerLink: { fontFamily: typography.bodyFamilyMedium, fontSize: typography.body, color: colors.accentText },
  sectionLabel: {
    fontFamily: typography.bodyFamilyMedium,
    fontSize: typography.small,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionSpacing: { marginTop: spacing.xl },
  memberList: { gap: spacing.sm },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  emptyCardText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.accentText },
  error: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: colors.accentText, marginTop: spacing.sm },
  manageLink: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.small,
    color: colors.accentText,
    marginTop: spacing.md,
  },
  actionList: { gap: spacing.xs },
  actionRow: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  actionRowPressed: {
    backgroundColor: colors.neutral[100],
  },
  actionTitle: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h3,
    color: colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.small,
    color: colors.neutral[600],
  },
});
