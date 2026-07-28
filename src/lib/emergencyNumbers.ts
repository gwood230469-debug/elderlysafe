// Pure and dependency-free by design (same reasoning as scoreCallRisk.ts
// and notificationPreferences.ts) — country *detection* (locale/GPS) lives
// in the screen that calls this, since that needs expo-localization/
// expo-location; this file is just the lookup, so it stays unit-testable.
import { CountryEmergencyNumbers, EMERGENCY_NUMBERS, GENERIC_FALLBACK_NUMBERS } from '../data/emergencyNumbers';

export function lookupEmergencyNumbers(countryCode: string | null | undefined): CountryEmergencyNumbers {
  const code = (countryCode ?? '').trim().toUpperCase();
  const match = code ? EMERGENCY_NUMBERS[code] : undefined;
  if (match) return match;
  return {
    countryCode: code || 'UNKNOWN',
    countryName: code ? code : 'your country',
    ...GENERIC_FALLBACK_NUMBERS,
  };
}
