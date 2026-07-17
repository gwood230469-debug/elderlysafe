-- Circle membership. A member row may be "invited" (not yet linked to an
-- auth user, just a name/phone number) or "confirmed" (linked to user_id
-- after the invite is claimed — see claim_invite() in 0004_circle_invites.sql).
create table circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles (id) on delete cascade,
  user_id uuid references auth.users (id),
  phone_number text,
  display_name text not null,
  status text not null default 'invited' check (status in ('invited', 'confirmed')),
  invited_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index circle_members_circle_id_idx on circle_members (circle_id);
create index circle_members_user_id_idx on circle_members (user_id);

-- Helper functions -----------------------------------------------------
-- The circle creator never gets their own circle_members row, so every
-- "is this person allowed to see/touch this circle's data" check needs to
-- union two sources: "is the circle's creator" and "is a confirmed member".
-- These are SECURITY DEFINER so they can read circles / circle_members
-- regardless of the calling policy's own RLS restrictions, and STABLE so
-- the planner can use them efficiently inside policy expressions.

create function is_circle_creator(check_circle_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from circles
    where id = check_circle_id
      and created_by = auth.uid()
  );
$$;

create function is_confirmed_member_of(check_circle_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from circle_members
    where circle_id = check_circle_id
      and user_id = auth.uid()
      and status = 'confirmed'
  );
$$;

create function is_circle_member(check_circle_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select is_circle_creator(check_circle_id) or is_confirmed_member_of(check_circle_id);
$$;

alter table circle_members enable row level security;

create policy circle_members_select_member
  on circle_members
  for select
  using (is_circle_member(circle_id));

create policy circle_members_insert_member
  on circle_members
  for insert
  with check (is_circle_member(circle_id));

create policy circle_members_update_member
  on circle_members
  for update
  using (is_circle_member(circle_id))
  with check (is_circle_member(circle_id));

create policy circle_members_delete_member
  on circle_members
  for delete
  using (is_circle_member(circle_id));
