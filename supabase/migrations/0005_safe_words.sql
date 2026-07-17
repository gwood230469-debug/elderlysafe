-- The circle's shared safe word. Never stored in plaintext: encrypted_value
-- actually holds a salted hash (not reversible encryption) — named this way
-- for consistency with the app's TypeScript-side field naming.
create table safe_words (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid unique references circles (id) on delete cascade,
  encrypted_value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

alter table safe_words enable row level security;

create policy safe_words_select_member
  on safe_words
  for select
  using (is_circle_member(circle_id));

create policy safe_words_insert_member
  on safe_words
  for insert
  with check (is_circle_member(circle_id));

create policy safe_words_update_member
  on safe_words
  for update
  using (is_circle_member(circle_id))
  with check (is_circle_member(circle_id));
