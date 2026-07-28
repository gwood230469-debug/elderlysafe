// Pure and dependency-free by design (same reasoning as scoreCallRisk.ts)
// so the rotation-due and suggestion logic is unit-testable without
// mocking Supabase/Date-in-a-timezone weirdness beyond passing `now` in.

// Soft reminder only — 90 days is a nudge the dashboard/safe-word screen
// surfaces, never an enforced expiry. The safe word only ever changes when
// someone explicitly saves a new one.
export const ROTATION_REMINDER_DAYS = 90;

export function daysSince(isoDate: string, now: Date = new Date()): number {
  const then = new Date(isoDate).getTime();
  const diffMs = now.getTime() - then;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function isRotationDue(safeWordUpdatedAt: string | null, now?: Date): boolean {
  if (!safeWordUpdatedAt) return false;
  return daysSince(safeWordUpdatedAt, now) >= ROTATION_REMINDER_DAYS;
}

// Deliberately ordinary, memorable two-word phrases — never auto-applied.
// This is a starting point for someone stuck on what to pick, not a
// generated secret: the safe word only works if the whole family actually
// remembers it, so a random high-entropy string would defeat the point.
const SUGGESTION_WORDS = [
  'harbor lantern',
  'quiet meadow',
  'copper thistle',
  'blue almanac',
  'wandering heron',
  'velvet compass',
  'amber orchard',
  'silver kestrel',
  'winter violet',
  'maple compass',
  'paper lighthouse',
  'garden ember',
];

export function suggestSafeWord(random: () => number = Math.random): string {
  const index = Math.floor(random() * SUGGESTION_WORDS.length);
  return SUGGESTION_WORDS[index];
}
