import { useEffect, useState } from 'react';
import { getSafeWordUpdatedAt } from '../lib/circle';
import { getErrorMessage } from '../lib/errors';
import { listRecentCallEvents, listRehearsalEvents, RecentCallSummary } from '../lib/verification';

export type CircleReadiness = {
  recentCalls: RecentCallSummary[];
  lastRehearsedByMember: Map<string, string>;
  safeWordUpdatedAt: string | null;
  loading: boolean;
  error: string | null;
};

// Shared by HomeScreen (at-a-glance) and DashboardScreen (full history) so
// the fetch/aggregation logic exists in exactly one place.
export function useCircleReadiness(circleId: string | null): CircleReadiness {
  const [recentCalls, setRecentCalls] = useState<RecentCallSummary[]>([]);
  const [lastRehearsedByMember, setLastRehearsedByMember] = useState<Map<string, string>>(new Map());
  const [safeWordUpdatedAt, setSafeWordUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!circleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([listRecentCallEvents(circleId), listRehearsalEvents(circleId), getSafeWordUpdatedAt(circleId)])
      .then(([calls, rehearsals, updatedAt]) => {
        setRecentCalls(calls);
        setSafeWordUpdatedAt(updatedAt);
        const latestByMember = new Map<string, string>();
        // rehearsals is ordered newest-first, so the first entry seen per
        // member is their most recent one.
        for (const event of rehearsals) {
          if (!latestByMember.has(event.memberUserId)) latestByMember.set(event.memberUserId, event.createdAt);
        }
        setLastRehearsedByMember(latestByMember);
        setError(null);
      })
      .catch((e) => setError(getErrorMessage(e, 'Could not load your family circle.')))
      .finally(() => setLoading(false));
  }, [circleId]);

  return { recentCalls, lastRehearsedByMember, safeWordUpdatedAt, loading, error };
}
