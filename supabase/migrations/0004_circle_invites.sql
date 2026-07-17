-- One-time tokens used to link an "invited" circle_members row to the
-- auth.users account of the person who accepts the invite.
create table circle_invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles (id) on delete cascade,
  member_id uuid not null references circle_members (id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  created_by uuid references auth.users (id),
  expires_at timestamptz not null default (now() + interval '30 days'),
  used_at timestamptz
);

create index circle_invites_member_id_idx on circle_invites (member_id);

alter table circle_invites enable row level security;

create policy circle_invites_select_member
  on circle_invites
  for select
  using (is_circle_member(circle_id));

create policy circle_invites_insert_member
  on circle_invites
  for insert
  with check (is_circle_member(circle_id));

-- RPC: atomically claim an invite by token. The claiming user is, by
-- definition, not yet a circle member (that's what this call establishes),
-- so it must be SECURITY DEFINER to bypass the RLS policies above and on
-- circle_members. Locks the invite row (for update) so concurrent claims
-- of the same token can't both succeed.
create function claim_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite circle_invites%rowtype;
begin
  select *
  into v_invite
  from circle_invites
  where token = invite_token
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invite is invalid, expired, or already used';
  end if;

  update circle_members
  set user_id = auth.uid(),
      status = 'confirmed',
      confirmed_at = now()
  where id = v_invite.member_id;

  update circle_invites
  set used_at = now()
  where id = v_invite.id;

  return v_invite.circle_id;
end;
$$;
