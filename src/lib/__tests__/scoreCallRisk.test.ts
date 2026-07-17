import { describe, expect, it } from "vitest";
import { scoreCallRisk } from "../scoreCallRisk";

describe("scoreCallRisk", () => {
  it("scores a saved contact low regardless of other bad signals", () => {
    // Worst-case verification + region mismatch, but it's a saved contact.
    const result = scoreCallRisk({
      callerNumber: "+15551234567", // not GB-shaped
      verificationStatus: "failed",
      contactMatch: true,
      userRegion: "GB",
    });

    expect(result.riskScore).toBeLessThanOrEqual(15);
    expect(result.riskReasons).toContain("Matches a saved contact");
  });

  it("scores verified caller + non-contact as moderate", () => {
    const result = scoreCallRisk({
      callerNumber: "+447911123456",
      verificationStatus: "passed",
      contactMatch: false,
      userRegion: "GB",
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(15);
    expect(result.riskScore).toBeLessThanOrEqual(35);
    expect(result.riskReasons).toContain("STIR/SHAKEN verification passed");
  });

  it("scores failed verification + region mismatch near the risk cap", () => {
    const result = scoreCallRisk({
      callerNumber: "+15551234567", // not GB-shaped
      verificationStatus: "failed",
      contactMatch: false,
      userRegion: "GB",
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(85);
    expect(result.riskScore).toBeLessThanOrEqual(91);
    expect(result.riskReasons).toContain(
      "Caller ID verification failed — likely spoofed",
    );
    expect(result.riskReasons).toContain(
      "Number format doesn't match your region",
    );
  });

  it("clamps a score that would mathematically exceed 91 down to exactly 91", () => {
    // failed base (75) + region mismatch (18) = 93 before clamping.
    const result = scoreCallRisk({
      callerNumber: "+15551234567",
      verificationStatus: "failed",
      contactMatch: false,
      userRegion: "GB",
    });

    expect(result.riskScore).toBe(91);
  });

  it("flags a non-UK-shaped number for a GB user", () => {
    const result = scoreCallRisk({
      callerNumber: "+15551234567",
      verificationStatus: "unverified",
      contactMatch: false,
      userRegion: "GB",
    });

    expect(result.riskReasons).toContain(
      "Number format doesn't match your region",
    );
  });

  it("does not flag a +44 number for a GB user", () => {
    const result = scoreCallRisk({
      callerNumber: "+447911123456",
      verificationStatus: "unverified",
      contactMatch: false,
      userRegion: "GB",
    });

    expect(result.riskReasons).not.toContain(
      "Number format doesn't match your region",
    );
  });

  it("never returns a score outside [0, 91]", () => {
    const result = scoreCallRisk({
      callerNumber: "07911123456",
      verificationStatus: "unverified",
      contactMatch: false,
      userRegion: "GB",
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(91);
  });
});
