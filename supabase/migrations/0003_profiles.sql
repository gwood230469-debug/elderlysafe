-- One row per authenticated user. Android-only build: Google Sign-In is
-- the only supported auth method (no Apple, no email/password), hence the
-- single-value check constraint below instead of an open-ended text field.
create table profiles (
  id uuid primary key references auth.users (id),
  auth_provider text not null check (auth_provider = 'google'),
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy profiles_select_own
  on profiles
  for select
  using (id = auth.uid());

create policy profiles_insert_own
  on profiles
  for insert
  with check (id = auth.uid());

create policy profiles_update_own
  on profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_delete_own
  on profiles
  for delete
  using (id = auth.uid());
