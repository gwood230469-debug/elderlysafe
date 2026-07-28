import { describe, expect, it } from "vitest";
import { daysSince, isRotationDue, ROTATION_REMINDER_DAYS, suggestSafeWord } from "../safeWordRotation";

describe("daysSince", () => {
  it("computes whole days between two dates", () => {
    const now = new Date("2026-04-10T00:00:00Z");
    expect(daysSince("2026-04-01T00:00:00Z", now)).toBe(9);
  });

  it("never returns negative days for a date in the future", () => {
    const now = new Date("2026-04-01T00:00:00Z");
    expect(daysSince("2026-04-10T00:00:00Z", now)).toBe(0);
  });
});

describe("isRotationDue", () => {
  it("is false when there's no safe word yet", () => {
    expect(isRotationDue(null)).toBe(false);
  });

  it("is false just under the reminder threshold", () => {
    const now = new Date("2026-04-10T00:00:00Z");
    const justUnder = new Date(now.getTime() - (ROTATION_REMINDER_DAYS - 1) * 24 * 60 * 60 * 1000).toISOString();
    expect(isRotationDue(justUnder, now)).toBe(false);
  });

  it("is true at or past the reminder threshold", () => {
    const now = new Date("2026-04-10T00:00:00Z");
    const atThreshold = new Date(now.getTime() - ROTATION_REMINDER_DAYS * 24 * 60 * 60 * 1000).toISOString();
    expect(isRotationDue(atThreshold, now)).toBe(true);
  });
});

describe("suggestSafeWord", () => {
  it("always returns a non-empty two-word phrase", () => {
    for (const random of [0, 0.5, 0.999]) {
      const suggestion = suggestSafeWord(() => random);
      expect(suggestion.split(" ").length).toBeGreaterThanOrEqual(2);
    }
  });
});
