// Android only — CallScreeningService (and ROLE_CALL_SCREENING) has no iOS
// equivalent, and this whole app is Android-only regardless.

export type CallScreeningRoleStatus = 'granted' | 'denied' | 'unsupported';

// Mirrors the payload the native CallScreenerService posts alongside its
// full-screen-intent notification once a call has been (async) scored —
// scoring never blocks CallScreeningService's own time-boxed onScreenCall()
// response, so this event always arrives after the phone has already
// started ringing normally.
export type CallRiskScoredEvent = {
  callerNumber: string;
  riskScore: number;
  riskReasons: string[];
};

export type CallScreeningModuleEvents = {
  onCallRiskScored: (event: CallRiskScoredEvent) => void;
};

// The native CallScreenerService runs as a system-invoked background
// service with no access to the JS bundle's env vars, so it can't read
// EXPO_PUBLIC_SUPABASE_URL/ANON_KEY directly — the JS side hands them over
// once at startup (App.tsx) and the native side persists them (Android
// SharedPreferences) for the service to read at scoring time.
export type CallScreeningConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userRegion: string; // e.g. 'GB' — used for the area-code-mismatch heuristic
};
