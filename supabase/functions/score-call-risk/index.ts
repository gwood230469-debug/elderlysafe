// score-call-risk — Supabase Edge Function
//
// v1 scam-call risk scoring backend. IMPORTANT: this wraps a hand-written
// v1 heuristic, NOT a trained ML model — see the scoring comment block
// below for the exact rules. It should be revisited once the app has real
// usage data (confirmed scam reports, false-positive rates, etc).
//
// NOTE ON THE DUPLICATED SCORING LOGIC:
// The scoring logic below is intentionally a byte-for-byte-equivalent copy
// of src/lib/scoreCallRisk.ts, kept in sync BY HAND for now. We looked into
// importing that module directly via a relative path
// (e.g. `import { scoreCallRisk } from "../../../src/lib/scoreCallRisk.ts"`)
// so there'd be one copy of the logic instead of two, but the Supabase CLI
// has long-standing, documented problems bundling/serving relative imports
// that reach outside the `supabase/` directory (see
// https://github.com/supabase/cli/issues/1028 and
// https://github.com/supabase/cli/issues/2862) — `supabase functions serve`
// runs functions in Docker with only `./supabase` mounted into the
// container, so an import that climbs out to `../../../src/...` can fail
// locally even if it happens to bundle for a remote deploy. The officially
// recommended pattern is to keep anything shared between functions inside
// `supabase/functions/_shared/`, which doesn't help us here since the
// canonical copy needs to live in `src/lib` for the RN app to import it as
// a normal TS module.
//
// If this drifts, the tests in src/lib/__tests__/scoreCallRisk.test.ts are
// the source of truth for what the "real" heuristic (src/lib/scoreCallRisk.ts)
// currently does — diff this file against that one when in doubt.

type CallVerificationStatus = "passed" | "failed" | "unverified";

type CallRiskInput = {
  callerNumber: string;
  verificationStatus: CallVerificationStatus;
  contactMatch: boolean;
  userRegion: string;
};

type CallRiskResult = {
  riskScore: number;
  riskReasons: string[];
};

const MAX_RISK_SCORE = 91;
const MIN_RISK_SCORE = 0;

const VERIFICATION_BASE_SCORE: Record<CallVerificationStatus, number> = {
  passed: 25,
  unverified: 45,
  failed: 75,
};

const VERIFICATION_REASON: Record<CallVerificationStatus, string> = {
  passed: "STIR/SHAKEN verification passed",
  unverified: "Caller ID could not be verified",
  failed: "Caller ID verification failed — likely spoofed",
};

const REGION_MISMATCH_ADJUSTMENT = 18;

function isNumberShapeConsistentWithRegion(
  callerNumber: string,
  userRegion: string,
): boolean {
  const normalized = callerNumber.replace(/[\s\-().]/g, "");

  if (userRegion === "GB") {
    const ukPrefixes = ["+44", "07", "01", "02"];
    return ukPrefixes.some((prefix) => normalized.startsWith(prefix));
  }

  return true;
}

function scoreCallRisk(input: CallRiskInput): CallRiskResult {
  const { callerNumber, verificationStatus, contactMatch, userRegion } = input;

  let score = VERIFICATION_BASE_SCORE[verificationStatus];
  const reasons: string[] = [VERIFICATION_REASON[verificationStatus]];

  if (!isNumberShapeConsistentWithRegion(callerNumber, userRegion)) {
    score += REGION_MISMATCH_ADJUSTMENT;
    reasons.push("Number format doesn't match your region");
  }

  if (contactMatch) {
    return {
      riskScore: 8,
      riskReasons: ["Matches a saved contact"],
    };
  }

  const riskScore = Math.max(MIN_RISK_SCORE, Math.min(MAX_RISK_SCORE, score));

  return { riskScore, riskReasons: reasons };
}

const VALID_VERIFICATION_STATUSES: CallVerificationStatus[] = [
  "passed",
  "failed",
  "unverified",
];

function isValidCallRiskInput(body: unknown): body is CallRiskInput {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;

  return (
    typeof b.callerNumber === "string" &&
    b.callerNumber.length > 0 &&
    typeof b.verificationStatus === "string" &&
    VALID_VERIFICATION_STATUSES.includes(
      b.verificationStatus as CallVerificationStatus,
    ) &&
    typeof b.contactMatch === "boolean" &&
    typeof b.userRegion === "string" &&
    b.userRegion.length > 0
  );
}

const JSON_HEADERS = { "Content-Type": "application/json" };

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: JSON_HEADERS },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Malformed JSON body." }),
      { status: 400, headers: JSON_HEADERS },
    );
  }

  if (!isValidCallRiskInput(body)) {
    return new Response(
      JSON.stringify({
        error:
          "Invalid request body. Expected { callerNumber: string, verificationStatus: 'passed' | 'failed' | 'unverified', contactMatch: boolean, userRegion: string }.",
      }),
      { status: 400, headers: JSON_HEADERS },
    );
  }

  const result = scoreCallRisk(body);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: JSON_HEADERS,
  });
});
