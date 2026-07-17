# SafeWord

An Android app pairing an elderly person's phone with their family members'
phones. It screens incoming calls for scam risk in real time, lets the
elderly user verify a caller by asking for a family safe word, and alerts
family — silently — when a call looks risky or a safe-word check fails.

Built from a high-fidelity 6-screen design handoff (the "Classical" design
system: serif type, hairline outlined buttons, a near-black call-chrome
palette, single gold accent). See "Design notes" below for where the build
deviates from that handoff and why.

## Tech stack

- **Frontend:** React Native + Expo (SDK 57), TypeScript, Android only
- **Backend/DB:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Auth:** Google Sign-In only (no Apple, no email/password)
- **Push notifications:** Expo push service
- **Native call screening:** a local Expo module (`modules/call-screening`)
  wrapping Android's `CallScreeningService` — see "Native call screening"
  below
- **Tests:** Vitest, for the pure-logic `src/lib/` modules

## Project structure

```
App.tsx                  App shell: font loading, auth/circle/profile gate,
                          deep-link + push-notification routing
modules/call-screening/   Local Expo module — Android CallScreeningService
  src/                     JS bridge (requestCallScreeningRole, configure, ...)
  android/                 Kotlin native side (CallScreenerService, RiskHeuristic, ...)
src/
  components/              Shared UI (Button, Card, Avatar, SafeWordForm, ...)
  context/                 React contexts: auth, circle, profile, pending invite
  lib/                     Supabase calls, safe-word hashing, invite links,
                            the call-risk heuristic, deep-link parsing
  navigation/               React Navigation stack
  screens/                  One file per screen (onboarding/ for first-run flow)
  theme/                    Classical design tokens (tokens.ts) + the dark
                             call-chrome palette (callTheme.ts)
supabase/
  migrations/               SQL migrations, applied in order (see SETUP.md)
  functions/                score-call-risk Edge Function
web/invite-redirect/        Static landing page for invite links (host on
                             GitHub Pages or similar — see EXPO_PUBLIC_INVITE_LANDING_URL)
```

## Running it locally

This app can't run in plain Expo Go — it uses native Google Sign-In and the
custom call-screening module, both of which need a "dev client" build.

1. Copy `.env.example` to `.env` and fill in the real values.
2. `npm install`
3. Add the missing app icons — see `assets/README.md`.
4. `npx expo prebuild` (generates the native `android/` project, pulling in
   `modules/call-screening` via Expo's default autolinking)
5. `npx expo run:android` (builds and installs the dev client on a
   connected device or emulator)

Run the test suite with `npm test`, and type-check with `npm run typecheck`.

## Database changes

Migrations in `supabase/migrations/` are applied in order — see
`supabase/SETUP.md` for linking the Supabase CLI.

## Native call screening

`modules/call-screening` is a local Expo module (not published to npm) that
wraps Android's `CallScreeningService` API:

- The service (`CallScreenerService.kt`) is registered via the module's own
  `AndroidManifest.xml` — Android's build-time manifest merger folds it into
  the app automatically, with no config-plugin manifest-editing code to
  maintain across Expo SDK bumps.
- It never blocks or silences a call — its only job is to score risk (via
  the `score-call-risk` Edge Function, with a local heuristic fallback if
  that network call fails or times out) and, above a risk threshold, show a
  full-screen notification that deep-links into the app's
  `IncomingCallRisk` screen.
- Users have to explicitly grant the app the `ROLE_CALL_SCREENING` role
  (Settings → Call protection) — nothing screens calls until that's done.

**This hasn't been verified on a real device or emulator** — there's no
Android build environment in the session that produced it. Before shipping,
build a dev client (`npx expo run:android`) and test with a simulated call
(`adb emu gsm call <number>` works on an emulator) end to end. The one piece
worth extra scrutiny is `CallScreeningModule.kt`'s `OnActivityResult` usage
for the role-request flow — cross-check it against the installed
`expo-modules-core` version's actual API shape (see the comment at the top
of that file).

## Play Store submission notes

- **Permissions Declaration**: requesting the call-screening role requires
  Google Play's Permissions Declaration Form, including a video demo, before
  the app can publish — "caller ID, spam detection and blocking" was a
  permitted use case as of this app's research, but call-related policy
  changes; re-check the live Play Console policy text before submitting, not
  this note.
- **App signing**: use Play App Signing (upload a key, Google re-signs for
  distribution) — don't lose the upload keystore, back it up outside the
  repo.
- **Privacy policy**: required given this app handles call/contact data —
  not written here, a content/legal task rather than a coding one.

## Design notes — where this deviates from the handoff, and why

The original handoff described the family member **silently joining an
in-progress phone call as an audible third participant**, and a **live,
continuously-updating risk score during the call**. Neither is achievable
against a real carrier phone call via any public Android or iOS API — there
is no third-party API on either platform for injecting a participant into an
already-connected call. This build's honest equivalent:

- The elderly-side "guided call" screen coaches the user to add the alerted
  family member themselves via their phone's own native 3-way calling,
  rather than the app silently doing it.
- The risk score is computed **once**, at ring time, by
  `CallScreeningService` — the live-ticking percentage shown after answering
  is a UI pacing effect on that one score, not a second live model call.

This is an Android-only app by design (no iOS build) — Apple gives
third-party apps no call-screening hook at all, so the "real-time risk
screening" feature that's this app's core value has no iOS equivalent to
build toward.
