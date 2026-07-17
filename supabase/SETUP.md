# Supabase backend setup

This directory contains the Postgres migrations for the SafeWord backend
(`supabase/migrations/`). Migrations `0001` through `0007` are numbered and
must be applied in order — each one depends on tables/functions created by
an earlier one (e.g. `0002_circle_members.sql` defines `is_circle_member()`,
which every later migration's RLS policies rely on).

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
  (`npm install -g supabase` or via Homebrew/Scoop).
- A Supabase project created in the dashboard, with its project ref handy
  (Project Settings → General → Reference ID).

## Link the project

From the repo root:

```sh
supabase link --project-ref <ref>
```

You'll be prompted for the database password you set when the project was
created.

## Apply the migrations

```sh
supabase db push
```

This applies every migration in `supabase/migrations/` in filename order
(`0001_init.sql` → `0007_verification_events.sql`) that hasn't already been
applied to the linked project.

## `pgcrypto` extension

The migrations use `gen_random_uuid()` (all primary keys) and
`gen_random_bytes()` (invite token generation in `0004_circle_invites.sql`),
both provided by the `pgcrypto` extension. New Supabase projects generally
have this enabled by default, but if `supabase db push` fails with something
like `function gen_random_bytes(integer) does not exist`, enable it manually
before re-running the push — either in the dashboard under
Database → Extensions, or via SQL:

```sql
create extension if not exists pgcrypto;
```

## Notes

- Every table has row level security enabled with explicit policies — there
  is no table left relying on default-deny-only RLS.
- `supabase/functions/` (Edge Functions, e.g. for sending push notifications
  on new `verification_events`) is intentionally out of scope here and is
  being handled separately.
