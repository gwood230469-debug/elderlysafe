import { copy } from '../constants/copy';
import { VerificationEventResolution } from '../types/models';
import { notifyCircleMember } from './push';
import { supabase } from './supabase';

export async function createLoopInEvent(circleId: string, triggeredBy: string): Promise<string> {
  const { data, error } = await supabase
    .from('verification_events')
    .insert({ circle_id: circleId, triggered_by: triggeredBy, type: 'loop_in_request' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function createCallRiskEvent(
  circleId: string,
  triggeredBy: string,
  callerNumber: string,
  riskScore: number,
  riskReasons: string[]
): Promise<string> {
  const { data, error } = await supabase
    .from('verification_events')
    .insert({
      circle_id: circleId,
      triggered_by: triggeredBy,
      type: 'call_risk_alert',
      caller_number: callerNumber,
      risk_score: riskScore,
      risk_reasons: riskReasons,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function createSafewordVerificationEvent(
  circleId: string,
  triggeredBy: string,
  callerNumber: string | null
): Promise<string> {
  const { data, error } = await supabase
    .from('verification_events')
    .insert({ circle_id: circleId, triggered_by: triggeredBy, type: 'safeword_verification', caller_number: callerNumber })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// Subject of the drill is `triggeredBy` (the member being trained), same
// convention call_risk_alert already uses for "who this event is about"
// rather than literally who inserted the row.
export async function createRehearsalPrompt(circleId: string, memberUserId: string): Promise<string> {
  const { data, error } = await supabase
    .from('verification_events')
    .insert({ circle_id: circleId, triggered_by: memberUserId, type: 'rehearsal_prompt' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// Combines logging the event with actually notifying the member — the
// same "write the event, then best-effort notify" split
// IncomingCallRiskScreen's real alert path uses, so a notification failure
// never loses the underlying record.
export async function sendRehearsalPrompt(circleId: string, memberUserId: string, senderName: string): Promise<string> {
  const id = await createRehearsalPrompt(circleId, memberUserId);
  await notifyCircleMember(memberUserId, 'family_request', copy.rehearsal.notificationTitle, copy.rehearsal.notificationBody(senderName), {
    type: 'rehearsal',
    scenarioName: senderName,
    verificationEventId: id,
  });
  return id;
}

export type RehearsalSummary = {
  id: string;
  memberUserId: string;
  resolution: VerificationEventResolution | null;
  createdAt: string;
};

// Fetches a batch of recent rehearsal events for the whole circle; callers
// (the dashboard) group by memberUserId client-side to find each member's
// most recent one, same pattern as listRecentCallEvents.
export async function listRehearsalEvents(circleId: string, limit = 50): Promise<RehearsalSummary[]> {
  const { data, error } = await supabase
    .from('verification_events')
    .select('id, triggered_by, resolution, created_at')
    .eq('circle_id', circleId)
    .eq('type', 'rehearsal_prompt')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    memberUserId: row.triggered_by,
    resolution: row.resolution,
    createdAt: row.created_at,
  }));
}

export async function resolveVerificationEvent(id: string, resolution: VerificationEventResolution): Promise<void> {
  const { error } = await supabase.from('verification_events').update({ resolution }).eq('id', id);
  if (error) throw error;
}

export type RecentCallSummary = {
  id: string;
  callerNumber: string | null;
  riskScore: number | null;
  resolution: VerificationEventResolution | null;
  createdAt: string;
};

export async function listRecentCallEvents(circleId: string, limit = 10): Promise<RecentCallSummary[]> {
  const { data, error } = await supabase
    .from('verification_events')
    .select('id, caller_number, risk_score, resolution, created_at')
    .eq('circle_id', circleId)
    .in('type', ['call_risk_alert', 'safeword_verification'])
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    callerNumber: row.caller_number,
    riskScore: row.risk_score,
    resolution: row.resolution,
    createdAt: row.created_at,
  }));
}
