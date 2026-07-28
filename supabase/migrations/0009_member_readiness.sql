-- Per-member "readiness" tracking, added for the caregiver dashboard
-- (safe word informed status + rehearsal history) and the rehearsal/drill
-- feature. Safe word AGE (for rotation reminders) needs no new column --
-- safe_words.updated_at already tracks that.
--
-- safe_word_informed_at is deliberately NOT inferred from confirmed_at on
-- an ongoing basis: it's set once, either automatically the first time a
-- circle's safe word is ever created (see setSafeWord in circle.ts -- every
-- already-confirmed member was there when it was set "together", per
-- OnboardingSafeWordScreen's own gating), or cleared to null for every
-- confirmed member whenever the word is later rotated, requiring an
-- explicit "mark as told" (or a fresh rotation) before it's set again.
alter table circle_members add column safe_word_informed_at timestamptz;

-- Rehearsal/drill mode: a new verification_event type (subject = the
-- member being trained, via the existing triggered_by column -- same
-- pattern call_risk_alert already uses to mean "this event is about this
-- person", not "this person caused this event") plus a 'completed'
-- resolution alongside the existing ones.
alter table verification_events drop constraint verification_events_type_check;
alter table verification_events add constraint verification_events_type_check
  check (type in ('loop_in_request', 'call_risk_alert', 'safeword_verification', 'rehearsal_prompt'));

alter table verification_events drop constraint verification_events_resolution_check;
alter table verification_events add constraint verification_events_resolution_check
  check (resolution is null or resolution in ('declined', 'verified_safe', 'safeword_failed', 'ignored', 'completed'));
