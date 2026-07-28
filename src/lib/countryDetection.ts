import { getLocales } from 'expo-localization';
import * as Location from 'expo-location';

/** Locale-based country guess — no permission needed, always available. */
export function getLocaleCountryCode(): string | null {
  return getLocales()[0]?.regionCode ?? null;
}

/**
 * GPS fallback, used only when the user explicitly asks for it (e.g.
 * they're travelling and the locale-based guess is wrong) — this always
 * requests permission itself rather than assuming it's already granted.
 * Returns null on denial or any failure so callers can fall back to the
 * locale-based guess rather than blocking the screen.
 */
export async function detectCountryByGps(): Promise<string | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const results = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    return results[0]?.isoCountryCode ?? null;
  } catch {
    return null;
  }
}
