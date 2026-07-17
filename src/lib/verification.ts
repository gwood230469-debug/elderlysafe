import { supabase } from './supabase';
import { VerificationEventResolution } from '../types/models';

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
