import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationCategory, NotificationPreferences, shouldSendForCategory } from './notificationPreferences';
import { supabase } from './supabase';

export type { NotificationCategory, NotificationPreferences };
export { shouldSendForCategory };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Requires an EAS project id (app.config.js `extra.eas.projectId`, set by
// `eas init`) and a development/standalone build — Expo Go dropped push
// support in SDK 53, which is exactly why this project uses a custom dev
// client for testing.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || projectId === 'REPLACE_WITH_EAS_PROJECT_ID') {
    console.warn('No EAS project id configured — skipping push token registration. Run `eas init` to enable push.');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (e) {
    console.warn('Could not get an Expo push token', e);
    return null;
  }
}

export async function saveOwnPushToken(userId: string, expoPushToken: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, expo_push_token: expoPushToken, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getPushToken(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('push_tokens').select('expo_push_token').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.expo_push_token ?? null;
}

export type NotificationChannelId = 'call-risk-alert' | 'family-alert';

const NOTIFICATION_CHANNELS: Record<NotificationChannelId, Notifications.NotificationChannelInput> = {
  'call-risk-alert': {
    name: 'Call risk alerts',
    description: 'A family member flagged a call as possible scam risk and may need help.',
    importance: Notifications.AndroidImportance.MAX,
    // No `sound` field: Android channels use the system's own default
    // notification sound when this is left unset. Setting it to the
    // string 'default' (as this used to) tells the config plugin to look
    // for a *custom* bundled sound file literally named "default", which
    // was never bundled -- producing a build-time "Custom sound 'default'
    // not found" error for no benefit over just omitting the field.
  },
  'family-alert': {
    name: 'Family requests',
    description: 'Loop-in requests and safeword check prompts from your family circle.',
    importance: Notifications.AndroidImportance.HIGH,
  },
};

// Android silently drops any push whose channelId isn't already registered
// on the receiving device — it does NOT fall back to a default channel.
// CallScreenerService.kt (native) only ever creates 'call-risk-alert', and
// only reactively the first time it screens a risky call on THAT device;
// 'family-alert' is never created natively at all. Without this, every
// loop-in/ask-safeword push, and any call-risk push arriving before a
// user's first screened call, is silently discarded by the OS with no
// error surfaced anywhere — this was the actual root cause behind
// notifications appearing "not to work". Call this once at app startup,
// unconditionally, so both channels exist before any push can arrive.
export async function ensureAndroidNotificationChannelsAsync(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Promise.all(
    (Object.keys(NOTIFICATION_CHANNELS) as NotificationChannelId[]).map((id) =>
      Notifications.setNotificationChannelAsync(id, NOTIFICATION_CHANNELS[id])
    )
  );
}

// Expo's push send endpoint accepts unauthenticated requests for basic
// sends. Best-effort: swallow failures so a missing/expired token never
// blocks the (already-created) VerificationEvent from being the source of
// truth.
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  channelId: NotificationChannelId,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: expoPushToken,
        title,
        body,
        data,
        // Android-only app: render the notification as a heads-up card with
        // Dismiss/Join actions (screen 4 of the design — "the alert lands"
        // is this payload, not a bespoke screen) via a dedicated channel.
        channelId,
        priority: 'high',
        categoryId: channelId === 'call-risk-alert' ? 'call-risk-alert' : undefined,
      }),
    });
  } catch (e) {
    console.warn('Could not send push notification', e);
  }
}

const DEFAULT_PREFERENCES: NotificationPreferences = { notifyCallRisk: true, notifyFamilyRequests: true };

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('notify_call_risk, notify_family_requests')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_PREFERENCES;
  return { notifyCallRisk: data.notify_call_risk, notifyFamilyRequests: data.notify_family_requests };
}

export async function setNotificationPreferences(userId: string, prefs: NotificationPreferences): Promise<void> {
  const { error } = await supabase.from('notification_preferences').upsert({
    user_id: userId,
    notify_call_risk: prefs.notifyCallRisk,
    notify_family_requests: prefs.notifyFamilyRequests,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

function channelForCategory(category: NotificationCategory): NotificationChannelId {
  return category === 'call_risk_alert' ? 'call-risk-alert' : 'family-alert';
}

// Single entry point every screen should use to alert a circle-mate —
// looks up their preference, skips silently if they've muted this
// category, otherwise looks up their token and sends on the correct
// channel. Centralizing this is what previously-scattered call sites
// (VerifyCallScreen, FamilyGuidingScreen) were missing, and what
// IncomingCallRiskScreen's "alert family" action never called at all — it
// only wrote a VerificationEvent row, with nothing to actually notify
// anyone. Best-effort throughout: a notification failure never blocks the
// underlying event, which is the real source of truth.
export async function notifyCircleMember(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const prefs = await getNotificationPreferences(userId);
    if (!shouldSendForCategory(prefs, category)) return;
    const token = await getPushToken(userId);
    if (!token) return;
    await sendPushNotification(token, title, body, channelForCategory(category), data);
  } catch (e) {
    console.warn('Could not notify circle member', e);
  }
}
