// Fixed alternate palette for the screening/call-chrome screens only
// (incoming-call risk, ask-safeword, guided-call) — mirrors the design
// system's dark "colophon" slide-deck background with a gold ghost mark.
// This is NOT a dark-mode toggle; every other screen always uses the light
// tokens in tokens.ts regardless of system theme.
import { accent, typography } from './tokens';

export const callColors = {
  bg: '#1c1a19',
  text: '#f3f0ea',
  textMuted: 'rgba(243, 240, 234, 0.55)',
  accent: accent[300],
  accentText: accent[300],
  divider: 'rgba(243, 240, 234, 0.16)',
} as const;

export const callTheme = {
  colors: callColors,
  typography,
} as const;

export type CallTheme = typeof callTheme;
