// Emergency / non-emergency contact reference, keyed by ISO 3166-1 alpha-2
// country code.
//
// NOT a complete list of the world's ~195 countries — v1 covers the
// regions this app's userbase is expected to be in, same reasoning as
// scoreCallRisk.ts's own GB-only region ruleset: an honest gap (falling
// back to the generic 112/911-style guidance below) is better than a
// guessed number that's wrong. Extend this per-country as real usage data
// shows it's worth it.
//
// SOURCE / LAST UPDATED: compiled by hand from each country's national
// emergency-services telephone authority listings, current as of the date
// below. Emergency numbers rarely change, but "rarely" isn't "never" —
// re-verify against an official source (e.g. the ITU's national numbering
// plans) before relying on this in a release older than ~12 months.
export const EMERGENCY_NUMBERS_LAST_UPDATED = '2026-01-01';

export type CountryEmergencyNumbers = {
  countryCode: string;
  countryName: string;
  /** Fire / police / ambulance — the number to use for an active emergency. */
  emergency: string;
  emergencyNote?: string;
  /** For welfare checks and non-urgent police contact — NOT for active emergencies. */
  nonEmergencyPolice: string;
  nonEmergencyNote?: string;
};

export const EMERGENCY_NUMBERS: Record<string, CountryEmergencyNumbers> = {
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    emergency: '999',
    emergencyNote: '112 also works from any phone.',
    nonEmergencyPolice: '101',
    nonEmergencyNote: 'For welfare checks and non-urgent police matters.',
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    emergency: '911',
    nonEmergencyPolice: '',
    nonEmergencyNote: "Search for your local police department's published non-emergency line — there's no single national number.",
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    emergency: '911',
    nonEmergencyPolice: '',
    nonEmergencyNote: "Search for your local police service's non-emergency line.",
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    emergency: '000',
    emergencyNote: '112 also works from a mobile.',
    nonEmergencyPolice: '131 444',
    nonEmergencyNote: 'Policelink — for non-urgent police assistance.',
  },
  IE: {
    countryCode: 'IE',
    countryName: 'Ireland',
    emergency: '112',
    emergencyNote: '999 also works.',
    nonEmergencyPolice: '',
    nonEmergencyNote: 'Contact your local Garda station directly.',
  },
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    emergency: '111',
    nonEmergencyPolice: '105',
    nonEmergencyNote: 'For non-urgent police reports.',
  },
};

// Used whenever the resolved country code has no entry above.
export const GENERIC_FALLBACK_NUMBERS: Omit<CountryEmergencyNumbers, 'countryCode' | 'countryName'> = {
  emergency: '112',
  emergencyNote: '112 works as an emergency number in the EU and in most countries worldwide, including from a mobile with no SIM or signal bars.',
  nonEmergencyPolice: '',
  nonEmergencyNote: "Search for your local police department's non-emergency contact line.",
};

// Deliberately not a bilateral embassy/consulate directory — maintaining an
// accurate "home country X in country Y" table for every pair would be
// its own large, decaying dataset, and a wrong embassy number in a safety
// app is worse than none. This is generic, always-correct guidance instead.
export const EMBASSY_GUIDANCE =
  "If you're outside your home country and need consular help, search \"[your home country] embassy\" plus the country you're currently in, or contact your home country's foreign affairs travel-help line.";
