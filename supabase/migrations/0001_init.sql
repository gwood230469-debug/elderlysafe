-- Circles: a family group sharing a safe word and membership.
create table circles (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table circles enable row level security;

-- The creator can see and create their own circles. Other members read
-- circles via circle_members / the is_circle_member() helper introduced in
-- 0002_circle_members.sql.
create policy circles_select_own
  on circles
  for select
  using (created_by = auth.uid());

create policy circles_insert_own
  on circles
  for insert
  with check (created_by = auth.uid());
