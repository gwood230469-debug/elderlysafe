import { useFonts as useCormorantFonts, CormorantGaramond_500Medium, CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { useFonts as useLoraFonts, Lora_400Regular, Lora_500Medium } from '@expo-google-fonts/lora';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CircleProvider, useCircle } from './src/context/CircleContext';
import { PendingInviteProvider } from './src/context/PendingInviteContext';
import { ProfileProvider, useProfile } from './src/context/ProfileContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { RootStackParamList } from './src/navigation/types';
import { isSupabaseConfigured } from './src/lib/supabase';
import { registerForPushNotificationsAsync, saveOwnPushToken } from './src/lib/push';
import { parseIncomingCallRiskUrl } from './src/lib/deepLinks';
import { configureCallScreening } from './modules/call-screening/src';
import { colors, typography } from './src/theme/tokens';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

Notifications.setNotificationCategoryAsync('call-risk-alert', [
  { identifier: 'dismiss', buttonTitle: 'Dismiss', options: { opensAppToForeground: false } },
  { identifier: 'join', buttonTitle: 'Join call', options: { opensAppToForeground: true } },
]);

function Gate() {
  const { session, loading: authLoading } = useAuth();
  const { loading: profileLoading, displayName, refresh: refreshProfile } = useProfile();
  const { loading: circleLoading, circleId, hasSafeWord, members, refresh: refreshCircle } = useCircle();

  useEffect(() => {
    if (!session?.user.id) return;
    registerForPushNotificationsAsync().then((token) => {
      if (token) saveOwnPushToken(session.user.id, token).catch((e) => console.warn('Could not save push token', e));
    });
    if (Platform.OS === 'android') {
      configureCallScreening({
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        userRegion: 'GB',
      }).catch((e) => console.warn('Could not configure call screening', e));
    }
  }, [session?.user.id]);

  // CallScreenerService delivers a scored call via a full-screen-intent
  // notification whose tap target (and full-screen intent itself) is a deep
  // link into this URL — this works uniformly whether the app was cold,
  // backgrounded, or foregrounded when the call came in, so it's the single
  // delivery path rather than a separate live in-process event bridge.
  useEffect(() => {
    function handleUrl(url: string | null) {
      if (!url || !navigationRef.isReady()) return;
      const parsed = parseIncomingCallRiskUrl(url);
      if (parsed) navigationRef.navigate('IncomingCallRisk', parsed);
    }
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!navigationRef.isReady()) return;
      const data = response.notification.request.content.data as { elderlyMemberName?: string; verificationEventId?: string } | undefined;
      if (response.actionIdentifier === 'join' || response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        if (data?.elderlyMemberName) {
          navigationRef.navigate('FamilyGuiding', {
            elderlyMemberName: data.elderlyMemberName,
            verificationEventId: data.verificationEventId ?? '',
          });
        }
      }
    });
    return () => sub.remove();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 27.6, backgroundColor: colors.bg }}>
        <Text style={{ fontFamily: typography.headingFamily, fontSize: typography.h3, color: colors.text, textAlign: 'center' }}>
          Supabase isn't set up yet
        </Text>
        <Text style={{ fontFamily: typography.bodyFamily, color: colors.neutral[600], textAlign: 'center', marginTop: 9.2 }}>
          Copy .env.example to .env, add your Supabase project URL and anon key, then restart the dev server.
        </Text>
      </View>
    );
  }

  if (authLoading || (session && (profileLoading || circleLoading))) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accentText} />
      </View>
    );
  }

  let initialRouteName: keyof RootStackParamList = 'OnboardingSignIn';
  if (session) {
    if (!displayName) initialRouteName = 'OnboardingName';
    else if (!circleId) initialRouteName = 'OnboardingAddMembers';
    else if (!members.some((m) => m.status === 'confirmed') || !hasSafeWord) initialRouteName = 'OnboardingSafeWord';
    else initialRouteName = 'Home';
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator initialRouteName={initialRouteName} />
    </NavigationContainer>
  );
}

export default function App() {
  const [cormorantLoaded] = useCormorantFonts({ CormorantGaramond_500Medium, CormorantGaramond_600SemiBold });
  const [loraLoaded] = useLoraFonts({ Lora_400Regular, Lora_500Medium });

  if (!cormorantLoaded || !loraLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accentText} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <ProfileProvider>
          <PendingInviteProvider>
            <CircleProvider>
              <Gate />
            </CircleProvider>
          </PendingInviteProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
