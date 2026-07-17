import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../theme/tokens';
import { RootStackParamList } from './types';

import { HomeScreen } from '../screens/HomeScreen';
import { VerifyCallScreen } from '../screens/VerifyCallScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SafeWordScreen } from '../screens/SafeWordScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { IncomingCallRiskScreen } from '../screens/IncomingCallRiskScreen';
import { AskSafewordCallScreen } from '../screens/AskSafewordCallScreen';
import { GuidedCallScreen } from '../screens/GuidedCallScreen';
import { FamilyGuidingScreen } from '../screens/FamilyGuidingScreen';
import { SignInScreen } from '../screens/onboarding/SignInScreen';
import { NamePromptScreen } from '../screens/onboarding/NamePromptScreen';
import { AddMembersScreen } from '../screens/onboarding/AddMembersScreen';
import { OnboardingSafeWordScreen } from '../screens/onboarding/OnboardingSafeWordScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator({ initialRouteName }: { initialRouteName: keyof RootStackParamList }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: typography.headingFamily, fontSize: typography.h3 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VerifyCall" component={VerifyCallScreen} options={{ title: 'Verify a call' }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Family circle' }} />
      <Stack.Screen name="SafeWord" component={SafeWordScreen} options={{ title: 'Safe word' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />

      <Stack.Screen
        name="IncomingCallRisk"
        component={IncomingCallRiskScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="AskSafewordCall"
        component={AskSafewordCallScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="GuidedCall" component={GuidedCallScreen} options={{ headerShown: false, gestureEnabled: false }} />

      <Stack.Screen name="FamilyGuiding" component={FamilyGuidingScreen} options={{ title: 'Guiding' }} />

      <Stack.Screen name="OnboardingSignIn" component={SignInScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OnboardingName" component={NamePromptScreen} options={{ title: 'Welcome', headerBackVisible: false }} />
      <Stack.Screen name="OnboardingAddMembers" component={AddMembersScreen} options={{ title: 'Family circle' }} />
      <Stack.Screen name="OnboardingSafeWord" component={OnboardingSafeWordScreen} options={{ title: 'Safe word' }} />
    </Stack.Navigator>
  );
}
