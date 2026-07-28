import { describe, expect, it } from "vitest";
import { lookupEmergencyNumbers } from "../emergencyNumbers";

describe("lookupEmergencyNumbers", () => {
  it("returns the matching country's numbers, case-insensitively", () => {
    expect(lookupEmergencyNumbers("gb").emergency).toBe("999");
    expect(lookupEmergencyNumbers("GB").emergency).toBe("999");
  });

  it("falls back to generic 112 guidance for an unlisted country", () => {
    const result = lookupEmergencyNumbers("ZZ");
    expect(result.emergency).toBe("112");
    expect(result.countryCode).toBe("ZZ");
  });

  it("falls back to generic guidance when no country code is known at all", () => {
    const result = lookupEmergencyNumbers(null);
    expect(result.emergency).toBe("112");
    expect(result.countryCode).toBe("UNKNOWN");
  });
});
