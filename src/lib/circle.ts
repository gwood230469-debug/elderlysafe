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

export async function listMembers(circleId: string): Promise<CircleMember[]> {
  const { data, error } = await supabase
    .from('circle_members')
    .select('id, circle_id, user_id, phone_number, display_name, status, invited_at, confirmed_at')
    .eq('circle_id', circleId)
    .order('invited_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    circleId: row.circle_id,
    userId: row.user_id,
    phoneNumber: row.phone_number,
    displayName: row.display_name,
    status: row.status,
    invitedAt: row.invited_at,
    confirmedAt: row.confirmed_at,
  }));
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
    .select('id, circle_id, user_id, phone_number, display_name, status, invited_at, confirmed_at')
    .single();
  if (memberError) throw memberError;

  const { data: inviteRow, error: inviteError } = await supabase
    .from('circle_invites')
    .insert({ circle_id: circleId, member_id: memberRow.id, created_by: createdBy })
    .select('token')
    .single();
  if (inviteError) throw inviteError;

  return {
    member: {
      id: memberRow.id,
      circleId: memberRow.circle_id,
      userId: memberRow.user_id,
      phoneNumber: memberRow.phone_number,
      displayName: memberRow.display_name,
      status: memberRow.status,
      invitedAt: memberRow.invited_at,
      confirmedAt: memberRow.confirmed_at,
    },
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

export async function setSafeWord(circleId: string, userId: string, encryptedValue: string): Promise<void> {
  const { error } = await supabase
    .from('safe_words')
    .upsert({ circle_id: circleId, encrypted_value: encryptedValue, updated_by: userId, updated_at: new Date().toISOString() });
  if (error) throw error;
}
