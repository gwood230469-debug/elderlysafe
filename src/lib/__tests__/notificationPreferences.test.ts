import { describe, expect, it } from "vitest";
import { shouldSendForCategory } from "../notificationPreferences";

// Regression coverage for the notification-preferences gating logic — the
// part of the notification pipeline that's pure and testable without
// mocking Supabase/Expo/fetch. The channel-registration and actual-send
// halves of this fix are covered by the manual smoke-test checklist
// instead, since they need a real Android device to observe.
describe("shouldSendForCategory", () => {
  it("gates call_risk_alert on notifyCallRisk only", () => {
    expect(shouldSendForCategory({ notifyCallRisk: true, notifyFamilyRequests: false }, "call_risk_alert")).toBe(true);
    expect(shouldSendForCategory({ notifyCallRisk: false, notifyFamilyRequests: true }, "call_risk_alert")).toBe(false);
  });

  it("gates family_request on notifyFamilyRequests only", () => {
    expect(shouldSendForCategory({ notifyCallRisk: false, notifyFamilyRequests: true }, "family_request")).toBe(true);
    expect(shouldSendForCategory({ notifyCallRisk: true, notifyFamilyRequests: false }, "family_request")).toBe(false);
  });
});
