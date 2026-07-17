import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useCircle } from '../context/CircleContext';
import { callColors } from '../theme/callTheme';
import { typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'GuidedCall'>;

// Handoff screen 3 ("family joining"), rebuilt honestly: no public Android
// or iOS API lets a third-party app add itself as a live audio participant
// on a real carrier call, so instead of silently joining, the app coaches
// the elderly user through their phone's own native 3-way calling. The
// alerted family member is real and standing by (an alert already fired
// from the previous screen) — this screen just guides the mechanics.
export function GuidedCallScreen({ route, navigation }: Props) {
  const { memberId } = route.params;
  const { members } = useCircle();
  const member = members.find((m) => m.id === memberId);
  const name = member?.displayName ?? 'them';

  return (
    <ScreenContainer dark>
      <View style={styles.flex}>
        <View style={styles.center}>
          <Avatar name={name} size={84} />
          <Text style={styles.title}>{copy.guidedCall.title(name)}</Text>
          <Text style={styles.body}>{copy.guidedCall.body(name)}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{copy.guidedCall.statusPill(name)}</Text>
          </View>
        </View>
        <Button label={copy.guidedCall.continueButton} size="elderly" dark onPress={() => navigation.popToTop()} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'space-between', paddingVertical: 27.6, paddingHorizontal: 18.4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h2,
    color: callColors.text,
    textAlign: 'center',
    marginTop: 18.4,
    marginBottom: 9.2,
  },
  body: { fontFamily: typography.bodyFamily, fontSize: typography.body, color: callColors.textMuted, textAlign: 'center', marginBottom: 18.4 },
  statusPill: { borderWidth: 1, borderColor: callColors.divider, borderRadius: 20, paddingHorizontal: 13.8, paddingVertical: 6 },
  statusPillText: { fontFamily: typography.bodyFamily, fontSize: typography.small, color: callColors.textMuted },
});
