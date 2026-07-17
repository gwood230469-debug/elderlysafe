import { Share } from 'react-native';

const LANDING_URL = process.env.EXPO_PUBLIC_INVITE_LANDING_URL ?? '';

export function buildInviteUrl(token: string): string {
  const base = LANDING_URL || 'safeword://invite';
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

export async function shareInvite(circleOwnerName: string, memberName: string, token: string): Promise<void> {
  const url = buildInviteUrl(token);
  // Android's share sheet handles `message` and `url` as separate fields
  // inconsistently across target apps (some append url, some drop it) — the
  // reliable approach is to fold the link into the message body itself.
  const message = `${circleOwnerName} added you to their SafeWord family circle. Tap to join, ${memberName}: ${url}`;
  await Share.share({ message });
}

export function parseInviteToken(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('token');
  } catch {
    return null;
  }
}
