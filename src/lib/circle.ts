import { mapMemberRow } from './circleMappers';
import { supabase } from './supabase';
import { CircleMember } from '../types/models';

export type OwnCircleState = { role: 'creator' | 'member'; circleId: string } | { role: 'none' };

export async function getOwnCircleState(userId: string): Promise<OwnCircleState> {
  const { data: created, error: createdError } = await supabase
    .from('circles')
    .select('id')
    .eq('created_by', userId)
    .maybeSingle();
  if (createdError) throw createdError;
  if (created) return { role: 'creator', circleId: created.id };

  const { data: memberOf, error: memberError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .maybeSingle();
  if (memberError) throw memberError;
  if (memberOf) return { role: 'member', circleId: memberOf.circle_id };

  return { role: 'none' };
}

export async function createCircle(userId: string): Promise<string> {
  // Splitting insert and select (rather than `.insert().select().single()`)
  // avoids a same-statement RLS snapshot issue: the select-after-insert RLS
  // check can evaluate against a snapshot taken before the row was visible
  // to the inserting session's own policies in some Postgres/PostgREST
  // versions, causing an intermittent false "no rows returned".
  const { error: insertError } = await supabase.from('circles').insert({ created_by: userId });
  if (insertError) throw insertError;

  const { data, error: selectError } = await supabase
    .from('circles')
    .select('id')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (selectError) throw selectError;
  return data.id;
}

const MEMBER_COLUMNS = 'id, circle_id, user_id, phone_number, display_name, status, invited_at, confirmed_at, safe_word_informed_at';

export async function listMembers(circleId: string): Promise<CircleMember[]> {
  const { data, error } = await supabase
    .from('circle_members')
    .select(MEMBER_COLUMNS)
    .eq('circle_id', circleId)
    .order('invited_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMemberRow);
}

// Coordinator-facing "mark as told" action for the readiness dashboard —
// the app never has the plaintext safe word to re-send automatically (see
// safeWordCard.ts), so this just records that the member has been told by
// some other means (a call, showing them the printed card, etc).
export async function markMemberInformed(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('circle_members')
    .update({ safe_word_informed_at: new Date().toISOString() })
    .eq('id', memberId);
  if (error) throw error;
}

export type NewMemberInvite = { member: CircleMember; inviteToken: string };

export async function inviteMember(
  circleId: string,
  createdBy: string,
  displayName: string,
  phoneNumber: string | null
): Promise<NewMemberInvite> {
  const { data: memberRow, error: memberError } = await supabase
    .from('circle_members')
    .insert({ circle_id: circleId, display_name: displayName, phone_number: phoneNumber, status: 'invited' })
    .select(MEMBER_COLUMNS)
    .single();
  if (memberError) throw memberError;

  const { data: inviteRow, error: inviteError } = await supabase
    .from('circle_invites')
    .insert({ circle_id: circleId, member_id: memberRow.id, created_by: createdBy })
    .select('token')
    .single();
  if (inviteError) throw inviteError;

  return {
    member: mapMemberRow(memberRow),
    inviteToken: inviteRow.token,
  };
}

export async function getInviteTokenForMember(memberId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('circle_invites')
    .select('token')
    .eq('member_id', memberId)
    .is('used_at', null)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.token ?? null;
}

export async function claimInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('claim_invite', { invite_token: token });
  if (error) throw error;
  return data as string;
}

export async function safeWordExists(circleId: string): Promise<boolean> {
  const { data, error } = await supabase.from('safe_words').select('id').eq('circle_id', circleId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function getSafeWordUpdatedAt(circleId: string): Promise<string | null> {
  const { data, error } = await supabase.from('safe_words').select('updated_at').eq('circle_id', circleId).maybeSingle();
  if (error) throw error;
  return data?.updated_at ?? null;
}

export async function setSafeWord(circleId: string, userId: string, encryptedValue: string): Promise<void> {
  const hadSafeWordBefore = await safeWordExists(circleId);

  // onConflict must be explicit: safe_words' primary key is `id` (not
  // provided here), while `circle_id` — the column that actually identifies
  // "this circle's safe word" — is only a separate unique constraint.
  // Without onConflict, PostgREST upserts against the primary key by
  // default, so `id` never matches an existing row and every save after
  // the first hits the circle_id unique constraint instead of updating it —
  // i.e. changing an already-set safe word always failed.
  const { error } = await supabase
    .from('safe_words')
    .upsert(
      { circle_id: circleId, encrypted_value: encryptedValue, updated_by: userId, updated_at: new Date().toISOString() },
      { onConflict: 'circle_id' }
    );
  if (error) throw error;

  // First time it's ever set: every already-confirmed member was there when
  // it was set "together" (OnboardingSafeWordScreen only allows this once a
  // member has confirmed), so mark them informed immediately. Any later
  // rotation clears it for everyone instead — they need to actually be told
  // the new word (via markMemberInformed, or a fresh printed card) before
  // the dashboard shows them as informed again.
  const informedAt = hadSafeWordBefore ? null : new Date().toISOString();
  const { error: memberError } = await supabase
    .from('circle_members')
    .update({ safe_word_informed_at: informedAt })
    .eq('circle_id', circleId)
    .eq('status', 'confirmed');
  if (memberError) throw memberError;
}
