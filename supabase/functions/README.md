# Supabase Edge Functions

## score-call-risk

Scores an incoming phone call's scam risk. This is the backend counterpart
to the Android `CallScreeningService`, used when the app wants a
server-side score (e.g. for logging, or as a fallback if the on-device
scoring in `src/lib/scoreCallRisk.ts` isn't available).

**v1 heuristic, not ML.** The scoring logic is a small, hand-written set of
rules over four inputs (verification status, contact match, region/number
shape) — it is not a trained model, and there's no crowd-sourced
scam-number database behind it yet. See the comment block at the top of
`score-call-risk/index.ts` (and its canonical copy,
`src/lib/scoreCallRisk.ts`) for exactly what the rules are. Revisit this
once the app has real usage data.

The score is an integer from 0 to 91 (91 is an intentional cap, leaving
headroom above it for higher-confidence signals in a future version).

### Request

`POST /functions/v1/score-call-risk`

```json
{
  "callerNumber": "+15551234567",
  "verificationStatus": "failed",
  "contactMatch": false,
  "userRegion": "GB"
}
```

- `callerNumber` — string, the caller's phone number as reported by the
  platform.
- `verificationStatus` — `"passed" | "failed" | "unverified"`. STIR/SHAKEN
  attestation status from Android's
  `Call.Details.getCallerNumberVerificationStatus()` (API 30+). Use
  `"unverified"` for both "not supported on this device" and the explicit
  NOT_VERIFIED status.
- `contactMatch` — boolean, true if the number matches an on-device
  contact.
- `userRegion` — ISO 3166-1 alpha-2 region code, e.g. `"GB"`.

### Response

`200 OK`

```json
{
  "riskScore": 91,
  "riskReasons": [
    "Caller ID verification failed — likely spoofed",
    "Number format doesn't match your region"
  ]
}
```

Malformed or missing fields return `400`:

```json
{ "error": "Invalid request body. Expected { callerNumber: string, verificationStatus: 'passed' | 'failed' | 'unverified', contactMatch: boolean, userRegion: string }." }
```

### Deploy

```sh
supabase functions deploy score-call-risk
```

### Example

```sh
curl -i --location --request POST \
  'https://<project-ref>.supabase.co/functions/v1/score-call-risk' \
  --header 'Authorization: Bearer <anon-or-service-key>' \
  --header 'Content-Type: application/json' \
  --data '{
    "callerNumber": "+15551234567",
    "verificationStatus": "failed",
    "contactMatch": false,
    "userRegion": "GB"
  }'
```

Sample response:

```json
{
  "riskScore": 91,
  "riskReasons": [
    "Caller ID verification failed — likely spoofed",
    "Number format doesn't match your region"
  ]
}
```

### Why the scoring logic is duplicated, not imported

`score-call-risk/index.ts` contains a hand-synced copy of the logic in
`src/lib/scoreCallRisk.ts` rather than importing it directly. We looked at
importing across the boundary (`../../../src/lib/scoreCallRisk.ts`), but
the Supabase CLI has long-standing, documented issues bundling/serving
relative imports that reach outside the `supabase/` directory (see
[supabase/cli#1028](https://github.com/supabase/cli/issues/1028) and
[supabase/cli#2862](https://github.com/supabase/cli/issues/2862)) —
`supabase functions serve` only mounts `./supabase` into its Docker
container, so a climb out to `../../../src/...` can break locally even if
it happens to bundle for a remote deploy. If the two copies drift, treat
`src/lib/scoreCallRisk.ts` (and its tests in
`src/lib/__tests__/scoreCallRisk.test.ts`) as the source of truth.
