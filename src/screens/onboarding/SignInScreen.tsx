import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { copy } from '../../constants/copy';
import { useAuth } from '../../context/AuthContext';
import { useCircle } from '../../context/CircleContext';
import { usePendingInvite } from '../../context/PendingInviteContext';
import { useProfile } from '../../context/ProfileContext';
import { claimInvite } from '../../lib/circle';
import { supabase } from '../../lib/supabase';
import { colors, spacing, typography } from '../../theme/tokens';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingSignIn'>;

export function SignInScreen({ navigation }: Props) {
  const { signInWithGoogle } = useAuth();
  const { refresh: refreshProfile } = useProfile();
  const { refresh: refreshCircle } = useCircle();
  const { token, clear: clearInvite } = usePendingInvite();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function afterSignIn(userId: string) {
    // Query directly rather than trusting context state here — the
    // contexts' own effects haven't necessarily re-run yet immediately
    // after signInWithGoogle resolves, and routing on stale/default state
    // would send a returning user through onboarding again.
    const name = await refreshProfile();
    if (!name) {
      navigation.reset({ index: 0, routes: [{ name: 'OnboardingName', params: { authProvider: 'google' } }] });
      return;
    }

    if (token) {
      try {
        await claimInvite(token);
        clearInvite();
      } catch (e) {
        // A stale/already-used token shouldn't block sign-in — just drop it
        // and continue to the normal routing below.
        clearInvite();
      }
    }

    const { circleId, hasSafeWord, hasConfirmedMember } = await refreshCircle(userId);
    if (!circleId) {
      navigation.reset({ index: 0, routes: [{ name: 'OnboardingAddMembers' }] });
    } else if (!hasConfirmedMember || !hasSafeWord) {
      navigation.reset({ index: 0, routes: [{ name: 'OnboardingSafeWord' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    const { error: signInError } = await signInWithGoogle();
    if (signInError) {
      setError(signInError);
      setBusy(false);
      return;
    }
    // A cancelled sign-in resolves with no error and no session — nothing
    // to route.
    const { data } = await supabase.auth.getSession();
    if (data.session?.user.id) {
      await afterSignIn(data.session.user.id);
    }
    setBusy(false);
  }

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.title}>SafeWord</Text>
        <Text style={styles.subtitle}>Protecting your family from scam calls, together.</Text>
        {busy ? (
          <ActivityIndicator color={colors.accentText} style={styles.spinner} />
        ) : (
          <Button label={copy.auth.google} onPress={handleGoogle} style={styles.button} />
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 240,
  },
  spinner: {
    marginTop: spacing.md,
  },
  error: {
    fontFamily: typography.bodyFamily,
    color: colors.accentText,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
