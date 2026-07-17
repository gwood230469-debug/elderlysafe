// "Classical" design system: editorial, book-like — serif type, hairline
// rules, color used as stroke/outline rather than fill, quiet bordered
// surfaces. Every screen/component imports directly from here (no styled-
// components layer) — keep this file the single source of truth for the
// look, don't let screens invent one-off colors.

export const neutral = {
  100: '#f8f4f4',
  200: '#eae9e9',
  300: '#d9d7d6',
  400: '#b8b5b3',
  500: '#8f8b88',
  600: '#6b6763',
  700: '#4a4744',
  800: '#332f2c',
  900: '#2d2b2b',
} as const;

export const accent = {
  100: '#fff3e4',
  200: '#ffe3bf',
  300: '#facb8d',
  400: '#e1ad66',
  500: '#c28d41',
  600: '#a06f24',
  700: '#7d5411',
  800: '#5a3b0a',
  900: '#3a270d',
} as const;

export const colors = {
  bg: '#f3f2f2',
  surface: '#eae9e9',
  text: '#201f1d',
  // Single mono accent — accent2 is intentionally identical, not a second
  // hue, per the design system's mono-palette rule.
  accent: '#b68235',
  accent2: '#b68235',
  // accent-500 fails WCAG AA for body text on the light ground; use
  // accent-700 wherever accent-colored copy needs to be readable.
  accentText: accent[700],
  divider: 'rgba(32, 31, 29, 0.16)',
  neutral,
  accentRamp: accent,
  white: '#ffffff',
} as const;

export const typography = {
  // Cormorant Garamond, loaded via expo-font in App.tsx — 600 weight is the
  // ceiling for headings, never bold; bigger sizes trend toward the
  // lighter/normal cut rather than heavier.
  headingFamily: 'CormorantGaramond_600SemiBold',
  headingFamilyLight: 'CormorantGaramond_500Medium',
  // Lora, 400 weight, for all body copy.
  bodyFamily: 'Lora_400Regular',
  bodyFamilyMedium: 'Lora_500Medium',
  h1: 44,
  h2: 28, // handoff range 26-30
  h3: 19,
  body: 16, // handoff range 15-16
  bodyLarge: 17,
  small: 12, // handoff range 11-13
} as const;

// Standalone numeric figures (risk %, timers, call counts) should use this.
export const tabularNumbers = {
  fontVariant: ['tabular-nums' as const],
};

export const spacing = {
  xs: 4.6,
  sm: 9.2,
  md: 13.8,
  lg: 18.4,
  xl: 27.6,
  xxl: 36.8,
} as const;

export const radius = {
  sm: 2,
  md: 4,
  lg: 7,
} as const;

export const touchTarget = {
  // Family-facing default. Elderly-facing screens override this per-screen
  // to 56-64 (see the incoming-call/safeword/guided-call screens) rather
  // than raising the global default, since family-facing screens keep the
  // denser scale.
  minSize: 44,
  elderly: 64,
} as const;

export const shadow = {
  sm: {
    shadowColor: neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  touchTarget,
  shadow,
} as const;

export type Theme = typeof theme;
