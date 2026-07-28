// Pure and dependency-free by design (same reasoning as scoreCallRisk.ts
// and notificationPreferences.ts) — circle.ts pulls in supabase-js and
// async-storage, which vitest's plain node environment can't parse, so the
// row-mapping logic lives here instead to keep it unit-testable.
import { CircleMember } from '../types/models';

export type CircleMemberRow = {
  id: string;
  circle_id: string;
  user_id: string | null;
  phone_number: string | null;
  display_name: string;
  status: CircleMember['status'];
  invited_at: string;
  confirmed_at: string | null;
  safe_word_informed_at: string | null;
};

export function mapMemberRow(row: CircleMemberRow): CircleMember {
  return {
    id: row.id,
    circleId: row.circle_id,
    userId: row.user_id,
    phoneNumber: row.phone_number,
    displayName: row.display_name,
    status: row.status,
    invitedAt: row.invited_at,
    confirmedAt: row.confirmed_at,
    safeWordInformedAt: row.safe_word_informed_at,
  };
}
