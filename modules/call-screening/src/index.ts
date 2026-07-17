import { Platform } from 'react-native';
import { requireNativeModule, EventEmitter, type EventSubscription } from 'expo-modules-core';

import type {
  CallRiskScoredEvent,
  CallScreeningConfig,
  CallScreeningModuleEvents,
  CallScreeningRoleStatus,
} from './CallScreening.types';

export type { CallRiskScoredEvent, CallScreeningConfig, CallScreeningRoleStatus };

type NativeCallScreeningModule = {
  requestCallScreeningRole(): Promise<CallScreeningRoleStatus>;
  getCallScreeningRoleStatus(): Promise<CallScreeningRoleStatus>;
  configure(config: CallScreeningConfig): Promise<void>;
};

// Only registered on Android (see expo-module.config.json — "platforms":
// ["android"]); requireNativeModule throws on platforms with no native
// implementation, so every export below is guarded with Platform.OS checks
// rather than trusting the native call to exist.
const nativeModule: NativeCallScreeningModule | null =
  Platform.OS === 'android' ? requireNativeModule<NativeCallScreeningModule>('CallScreening') : null;

const emitter = nativeModule ? new EventEmitter<CallScreeningModuleEvents>(nativeModule as any) : null;

/**
 * Prompts the system's "set default call-screening app" flow
 * (RoleManager.createRequestRoleIntent(ROLE_CALL_SCREENING)). No-op,
 * resolves 'unsupported' on iOS (never reached — this app is Android-only).
 */
export async function requestCallScreeningRole(): Promise<CallScreeningRoleStatus> {
  if (!nativeModule) return 'unsupported';
  return nativeModule.requestCallScreeningRole();
}

export async function getCallScreeningRoleStatus(): Promise<CallScreeningRoleStatus> {
  if (!nativeModule) return 'unsupported';
  return nativeModule.getCallScreeningRoleStatus();
}

/** Hands the native CallScreenerService what it needs to score calls. */
export async function configureCallScreening(config: CallScreeningConfig): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.configure(config);
}

/**
 * Fires once per incoming call, after CallScreenerService has finished its
 * (async, off the ring-time critical path) risk scoring. Only ever fires
 * while the app process is alive — if the app isn't running when a call
 * comes in, the same event instead arrives as a full-screen-intent
 * notification tap (App.tsx's addCallRiskScoredListener only covers the
 * foreground/backgrounded-but-alive case; the notification tap path in
 * App.tsx's Notifications listener covers cold start).
 */
export function addCallRiskScoredListener(listener: (event: CallRiskScoredEvent) => void): EventSubscription {
  if (!emitter) {
    return { remove: () => {} } as EventSubscription;
  }
  return emitter.addListener('onCallRiskScored', listener);
}
