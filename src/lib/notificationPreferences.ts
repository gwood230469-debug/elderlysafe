// Pure, dependency-free by design (same reasoning as scoreCallRisk.ts):
// push.ts pulls in react-native/expo-notifications/supabase, which vitest's
// plain node environment can't parse (Flow syntax in react-native's own
// source). Keeping the preference-gating logic here — with no such
// imports — is what makes it unit-testable at all.

export type NotificationCategory = 'call_risk_alert' | 'family_request';

export type NotificationPreferences = {
  notifyCallRisk: boolean;
  notifyFamilyRequests: boolean;
};

export function shouldSendForCategory(prefs: NotificationPreferences, category: NotificationCategory): boolean {
  return category === 'call_risk_alert' ? prefs.notifyCallRisk : prefs.notifyFamilyRequests;
}
