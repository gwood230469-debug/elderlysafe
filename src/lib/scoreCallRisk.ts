/**
 * scoreCallRisk — v1 scam-call risk heuristic.
 *
 * IMPORTANT: This is a hand-written v1 heuristic, NOT a trained ML model.
 * It is a small set of if/else rules over four signals available on-device
 * at call-screening time. It is deliberately simple so its behaviour is
 * predictable and auditable — do not describe it as "AI" or "machine
 * learning" in product copy. Once the app has real usage data (confirmed
 * scam reports, false-positive rates, etc.) this should be revisited and
 * likely replaced or supplemented with a model trained on that data.
 *
 * This module is pure and dependency-free on purpose: it is used both from
 * the React Native app (via the Android CallScreeningService bridge) and
 * from the Supabase Edge Function in
 * supabase/functions/score-call-risk/index.ts, and it needs to run under
 * whatever minimal JS runtime is available in both places without pulling
 * in any package-specific APIs.
 */

/** STIR/SHAKEN-derived verification status for the incoming call. */
export type CallVerificationStatus = "passed" | "failed" | "unverified";

export type CallRiskInput = {
  /** Raw caller number as reported by the platform, e.g. "+447911123456". */
  callerNumber: string;
  /**
   * STIR/SHAKEN attestation status, read from Android's
   * Call.Details.getCallerNumberVerificationStatus() (API 30+ only).
   * 'unverified' covers both "not supported on this device" and the
   * explicit NOT_VERIFIED status — the app can't act differently on those
   * two cases anyway, so they're collapsed into one value here.
   */
  verificationStatus: CallVerificationStatus;
  /** True if the number matches an on-device contact. */
  contactMatch: boolean;
  /** User's home region, ISO 3166-1 alpha-2 (e.g. "GB"). */
  userRegion: string;
};

export type CallRiskResult = {
  /** Integer risk score in the range [0, 91]. Higher = more likely a scam call. */
  riskScore: number;
  /** Human-readable reasons behind the score, for display/debugging. */
  riskReasons: string[];
};

/**
 * Intentional score ceiling for v1. Reserving 92-100 leaves headroom for a
 * future, more confident signal (e.g. a corroborated scam report) to stand
 * out above anything this heuristic alone can produce. This mirrors a fixed
 * reference design's stated risk ceiling — not an arbitrary number.
 */
const MAX_RISK_SCORE = 91;
const MIN_RISK_SCORE = 0;

/** Base score + reason applied when the caller isn't a saved contact. */
const VERIFICATION_BASE_SCORE: Record<CallVerificationStatus, number> = {
  passed: 25, // lower-moderate: STIR/SHAKEN attested the number, but attestation alone doesn't rule out scams
  unverified: 45, // moderate: no signal either way
  failed: 75, // high: the network itself flagged this as likely spoofed
};

const VERIFICATION_REASON: Record<CallVerificationStatus, string> = {
  passed: "STIR/SHAKEN verification passed",
  unverified: "Caller ID could not be verified",
  failed: "Caller ID verification failed — likely spoofed",
};

/** Score bump applied when the number's shape doesn't match the user's region. */
const REGION_MISMATCH_ADJUSTMENT = 18;

/**
 * Very simple, best-effort check of whether `callerNumber`'s shape is
 * consistent with `userRegion`. This is intentionally NOT a full E.164/NANP
 * prefix database — it's a small allowlist for the regions we've bothered
 * to hand-write a rule for. If we don't have a rule for a region, we treat
 * the number as "consistent" (i.e. skip the adjustment) rather than guess:
 * a false "mismatch" flag is worse than no flag at all, and skipping keeps
 * this function total (it never throws on unexpected input).
 *
 * Extend this per-region as real usage data shows it's worth it, or replace
 * it wholesale with a proper phone-number-parsing library — deliberately
 * not doing that here to keep v1's dependency footprint at zero.
 */
function isNumberShapeConsistentWithRegion(
  callerNumber: string,
  userRegion: string,
): boolean {
  const normalized = callerNumber.replace(/[\s\-().]/g, "");

  if (userRegion === "GB") {
    // Common UK mobile/landline prefixes. Not exhaustive (e.g. non-geographic
    // 03/08/09 ranges, or numbers dialled without a leading 0 in some
    // contexts aren't covered) — deliberately simple for v1.
    const ukPrefixes = ["+44", "07", "01", "02"];
    return ukPrefixes.some((prefix) => normalized.startsWith(prefix));
  }

  // No hand-written rule for this region yet — skip the adjustment rather
  // than apply a guess (see doc comment above).
  return true;
}

/**
 * Compute a v1 scam-risk score for an incoming call.
 *
 * Precedence, read top to bottom:
 *   1. Start from a base score driven by STIR/SHAKEN verification status.
 *   2. Adjust for a region/number-shape mismatch.
 *   3. If the caller matches a saved contact, THROW AWAY steps 1-2 and
 *      short-circuit to a fixed low score instead. A known contact is
 *      essentially never the scam vector this app targets, so contactMatch
 *      overrides the other signals rather than merely discounting them —
 *      otherwise a contact somehow flagged "failed" verification could
 *      still end up with a misleadingly high score.
 *   4. Clamp to [0, 91].
 */
export function scoreCallRisk(input: CallRiskInput): CallRiskResult {
  const { callerNumber, verificationStatus, contactMatch, userRegion } = input;

  // --- Step 1: verification-based base score ---
  let score = VERIFICATION_BASE_SCORE[verificationStatus];
  const reasons: string[] = [VERIFICATION_REASON[verificationStatus]];

  // --- Step 2: region/number-shape adjustment ---
  if (!isNumberShapeConsistentWithRegion(callerNumber, userRegion)) {
    score += REGION_MISMATCH_ADJUSTMENT;
    reasons.push("Number format doesn't match your region");
  }

  // --- Step 3: contact match short-circuit (overrides everything above) ---
  if (contactMatch) {
    return {
      riskScore: 8,
      riskReasons: ["Matches a saved contact"],
    };
  }

  // --- Step 4: clamp ---
  const riskScore = Math.max(MIN_RISK_SCORE, Math.min(MAX_RISK_SCORE, score));

  return { riskScore, riskReasons: reasons };
}
