-- Expo push token per user, used to notify circle-mates of alerts.
create table push_tokens (
  user_id uuid primary key references auth.users (id),
  expo_push_token text not null,
  updated_at timestamptz not null default now()
);

-- Helper: true if auth.uid() and other_user_id are both (creator or
-- confirmed member) of at least one circle in common. SECURITY DEFINER so
-- it can read circles / circle_members belonging to the *other* user
-- without being blocked by their RLS policies. Needed so a family member
-- can look up a circle-mate's push token to send them an alert.
create function shares_a_circle_with(other_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from circles c
    where (
      c.created_by = auth.uid()
      or exists (
        select 1 from circle_members m
        where m.circle_id = c.id
          and m.user_id = auth.uid()
          and m.status = 'confirmed'
      )
    )
    and (
      c.created_by = other_user_id
      or exists (
        select 1 from circle_members m
        where m.circle_id = c.id
          and m.user_id = other_user_id
          and m.status = 'confirmed'
      )
    )
  );
$$;

alter table push_tokens enable row level security;

create policy push_tokens_select_own
  on push_tokens
  for select
  using (user_id = auth.uid());

create policy push_tokens_select_circle_mate
  on push_tokens
  for select
  using (shares_a_circle_with(user_id));

create policy push_tokens_insert_own
  on push_tokens
  for insert
  with check (user_id = auth.uid());

create policy push_tokens_update_own
  on push_tokens
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy push_tokens_delete_own
  on push_tokens
  for delete
  using (user_id = auth.uid());
