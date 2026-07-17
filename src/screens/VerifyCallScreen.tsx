import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useAuth } from '../context/AuthContext';
import { useCircle } from '../context/CircleContext';
import { useProfile } from '../context/ProfileContext';
import { getErrorMessage } from '../lib/errors';
import { getPushToken, sendPushNotification } from '../lib/push';
import { createLoopInEvent } from '../lib/verification';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';
import { CircleMember } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyCall'>;

// A client-side "don't send two loop-in requests to the same person within
// a minute" guard against accidental double-taps — not a security control.
const LOOP_IN_COOLDOWN_MS = 60_000;

export function VerifyCallScreen(_props: Props) {
  const { session } = useAuth();
  const { displayName } = useProfile();
  const { circleId, members } = useCircle();
  const confirmedMembers = members.filter((m) => m.status === 'confirmed');
  const [selectedMember, setSelectedMember] = useState<CircleMember | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [recent, setRecent] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!selectedMember && confirmedMembers.length > 0) setSelectedMember(confirmedMembers[0]);
  }, [confirmedMembers, selectedMember]);

  function callDirectly(member: CircleMember) {
    if (!member.phoneNumber) return;
    Linking.openURL(`tel:${member.phoneNumber}`);
  }

  async function requestLoopIn(member: CircleMember) {
    const userId = session?.user.id;
    if (!circleId || !userId) return;
    try {
      await createLoopInEvent(circleId, userId);
    } catch (e) {
      Alert.alert('Could not send request', getErrorMessage(e, 'Please try again.'));
      return;
    }
    setRecent((prev) => new Map(prev).set(member.id, Date.now()));
    setPickerVisible(false);
    setSentTo(member.displayName);

    if (member.userId) {
      try {
        const token = await getPushToken(member.userId);
        if (token) await sendPushNotification(token, 'Family Circle', copy.loopin.notification(displayName ?? 'Someone in your circle'));
      } catch (e) {
        console.warn('Could not send loop-in push notification', e);
      }
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card accentBorder="accent" style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>{copy.askSafeword.prompt}</Text>
          <Text style={styles.instructionBody}>{copy.askSafeword.supporting}</Text>
        </Card>

        <Text style={styles.sectionLabel}>Who is this about?</Text>
        <View style={styles.memberPicker}>
          {confirmedMembers.map((member) => {
            const selected = selectedMember?.id === member.id;
            return (
              <Pressable
                key={member.id}
                onPress={() => setSelectedMember(member)}
                style={[styles.memberChip, selected && styles.memberChipSelected]}
              >
                <Text style={[styles.memberChipText, selected && styles.memberChipTextSelected]}>{member.displayName}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedMember && (
          <>
            {selectedMember.phoneNumber && (
              <Button label={copy.circle.call(selectedMember.displayName)} onPress={() => callDirectly(selectedMember)} style={styles.gap} />
            )}
            <Button label={copy.loopin.button} variant="quiet" onPress={() => setPickerVisible(true)} style={styles.gap} />
          </>
        )}

        {sentTo && (
          <Card accentBorder="accent" style={styles.gap}>
            <Text style={styles.confirmationText}>{sentTo} has been notified and can help you check.</Text>
          </Card>
        )}

        <Text style={styles.footer}>{copy.askSafeword.footer}</Text>
      </ScrollView>

      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Loop in someone else</Text>
            <FlatList
              data={confirmedMembers.filter((m) => {
                if (m.id === selectedMember?.id) return false;
                const last = recent.get(m.id);
                return !last || Date.now() - last >= LOOP_IN_COOLDOWN_MS;
              })}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <Pressable style={styles.modalRow} onPress={() => requestLoopIn(item)}>
                  <Avatar name={item.displayName} size={44} />
                  <Text style={styles.modalRowText}>{item.displayName}</Text>
                </Pressable>
              )}
            />
            <Button label="Cancel" variant="quiet" onPress={() => setPickerVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  instructionCard: { marginBottom: spacing.xl },
  instructionTitle: { fontFamily: typography.headingFamily, fontSize: typography.h3, color: colors.text, marginBottom: spacing.xs },
  instructionBody: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  sectionLabel: {
    fontFamily: typography.bodyFamilyMedium,
    fontSize: typography.small,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  memberPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  memberChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    minHeight: 44,
    justifyContent: 'center',
  },
  memberChipSelected: { borderColor: colors.accent, backgroundColor: colors.accentRamp[100] },
  memberChipText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  memberChipTextSelected: { color: colors.accentText, fontFamily: typography.bodyFamilyMedium },
  gap: { marginBottom: spacing.md },
  confirmationText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
  footer: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.neutral[600], marginTop: spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(32, 31, 29, 0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.lg * 2, borderTopRightRadius: radius.lg * 2, padding: spacing.lg, gap: spacing.md },
  modalTitle: { fontFamily: typography.headingFamily, fontSize: typography.h3, color: colors.text, marginBottom: spacing.sm },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  modalRowText: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: colors.text },
});
