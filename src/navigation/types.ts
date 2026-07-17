import { AuthProvider } from '../types/models';

export type RootStackParamList = {
  Home: undefined;
  VerifyCall: undefined;
  Dashboard: undefined;
  SafeWord: undefined;
  Settings: undefined;

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
