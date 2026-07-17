// Display/dial-only normalization — not used for identity matching (a
// circle member's confirmed identity comes from their signed-in user_id,
// never from a phone number string).
export function normalizePhoneNumber(input: string): string {
  const trimmed = input.trim();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  return hasLeadingPlus ? `+${digits}` : digits;
}
