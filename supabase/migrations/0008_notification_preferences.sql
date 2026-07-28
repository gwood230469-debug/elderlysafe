-- Per-user notification preferences, kept in their own table rather than
-- added to push_tokens: a preference needs to be readable (by a circle-mate
-- deciding whether to send) and settable even before a push token exists —
-- e.g. permission denied, no EAS project configured yet, or the user just
-- hasn't opened the app on a device yet — and push_tokens.expo_push_token
-- is not null, so it can't hold a preferences-only row.
create table notification_preferences (
  user_id uuid primary key references auth.users (id),
  notify_call_risk boolean not null default true,
  notify_family_requests boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;

create policy notification_preferences_select_own
  on notification_preferences
  for select
  using (user_id = auth.uid());

-- Needed so the sender of a circle-mate alert can check the recipient's
-- preference before sending (mirrors push_tokens_select_circle_mate, and
-- reuses the same shares_a_circle_with() helper from 0006_push_tokens.sql).
create policy notification_preferences_select_circle_mate
  on notification_preferences
  for select
  using (shares_a_circle_with(user_id));

create policy notification_preferences_insert_own
  on notification_preferences
  for insert
  with check (user_id = auth.uid());

create policy notification_preferences_update_own
  on notification_preferences
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
