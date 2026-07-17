// Parses the deep link CallScreenerService's full-screen-intent notification
// launches: safeword://incoming-call-risk?callerNumber=...&riskScore=NN&reasons=a|b|c
export function parseIncomingCallRiskUrl(
  url: string
): { callerNumber: string; riskScore: number; riskReasons: string[] } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'incoming-call-risk' && parsed.pathname !== '//incoming-call-risk') return null;
    const callerNumber = parsed.searchParams.get('callerNumber');
    const riskScoreRaw = parsed.searchParams.get('riskScore');
    const reasonsRaw = parsed.searchParams.get('reasons');
    if (!callerNumber || !riskScoreRaw) return null;
    const riskScore = Number(riskScoreRaw);
    if (!Number.isFinite(riskScore)) return null;
    const riskReasons = reasonsRaw ? reasonsRaw.split('|').filter(Boolean) : [];
    return { callerNumber, riskScore, riskReasons };
  } catch {
    return null;
  }
}
