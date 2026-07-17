-- Unified event log for everything that can trigger a family alert:
-- someone asking to loop in family on a live call, the native call-risk
-- screener flagging a suspicious caller, or a failed safe-word check.
-- Built in from the start rather than bolted on later, so call-risk
-- screening has a home from day one.
create table verification_events (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references circles (id) on delete cascade,
  triggered_by uuid references auth.users (id),
  type text not null check (type in ('loop_in_request', 'call_risk_alert', 'safeword_verification')),
  caller_number text,
  risk_score int check (risk_score is null or (risk_score between 0 and 100)),
  risk_reasons text[],
  resolution text check (resolution is null or resolution in ('declined', 'verified_safe', 'safeword_failed', 'ignored')),
  created_at timestamptz not null default now(),
  acknowledged_by uuid references auth.users (id),
  acknowledged_at timestamptz
);

create index verification_events_circle_id_idx on verification_events (circle_id);

alter table verification_events enable row level security;

create policy verification_events_select_member
  on verification_events
  for select
  using (is_circle_member(circle_id));

create policy verification_events_insert_self
  on verification_events
  for insert
  with check (triggered_by = auth.uid() and is_circle_member(circle_id));

create policy verification_events_update_member
  on verification_events
  for update
  using (is_circle_member(circle_id))
  with check (is_circle_member(circle_id));
