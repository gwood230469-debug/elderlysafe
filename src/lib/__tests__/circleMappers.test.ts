import { describe, expect, it } from "vitest";
import { mapMemberRow } from "../circleMappers";

describe("mapMemberRow", () => {
  it("maps every snake_case DB column to its camelCase field", () => {
    const row = {
      id: "member-1",
      circle_id: "circle-1",
      user_id: "user-1",
      phone_number: "+447911123456",
      display_name: "Mum",
      status: "confirmed" as const,
      invited_at: "2026-01-01T00:00:00Z",
      confirmed_at: "2026-01-02T00:00:00Z",
      safe_word_informed_at: "2026-01-03T00:00:00Z",
    };

    expect(mapMemberRow(row)).toEqual({
      id: "member-1",
      circleId: "circle-1",
      userId: "user-1",
      phoneNumber: "+447911123456",
      displayName: "Mum",
      status: "confirmed",
      invitedAt: "2026-01-01T00:00:00Z",
      confirmedAt: "2026-01-02T00:00:00Z",
      safeWordInformedAt: "2026-01-03T00:00:00Z",
    });
  });

  it("passes through nulls for optional fields", () => {
    const row = {
      id: "member-2",
      circle_id: "circle-1",
      user_id: null,
      phone_number: null,
      display_name: "Uncle Joe",
      status: "invited" as const,
      invited_at: "2026-01-01T00:00:00Z",
      confirmed_at: null,
      safe_word_informed_at: null,
    };

    const mapped = mapMemberRow(row);
    expect(mapped.userId).toBeNull();
    expect(mapped.confirmedAt).toBeNull();
    expect(mapped.safeWordInformedAt).toBeNull();
  });
});
