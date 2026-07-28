import { AuthProvider } from '../types/models';

export type RootStackParamList = {
  Home: undefined;
  VerifyCall: undefined;
  Dashboard: undefined;
  SafeWord: undefined;
  Settings: undefined;
  NotificationPreferences: undefined;
  VerifyScript: undefined;
  EmergencyNumbers: undefined;
  // scenarioName is whoever the drill's practice call claims to be (the
  // sender/coordinator who scheduled it) — not the recipient's own name.
  Rehearsal: { verificationEventId: string; scenarioName: string };

  // Automatic risk-detection pipeline (Android CallScreeningService deep
  // link → these three, in order) — dark call-chrome screens.
  IncomingCallRisk: { callerNumber: string; riskScore: number; riskReasons: string[] };
  AskSafewordCall: { callerNumber: string; riskScore: number; riskReasons: string[]; verificationEventId: string };
  GuidedCall: { memberId: string };

  // Family-side
  FamilyGuiding: { verificationEventId: string; elderlyMemberName: string };

  OnboardingSignIn: undefined;
  OnboardingName: { authProvider: AuthProvider };
  OnboardingAddMembers: undefined;
  OnboardingSafeWord: undefined;
};
