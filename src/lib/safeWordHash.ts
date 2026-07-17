import * as Crypto from 'expo-crypto';

// A salted, stretched hash — adequate to keep the safe word unreadable if
// the database is exposed, NOT a real password KDF (no bcrypt/argon2
// available via expo-crypto) and not resistant to serious offline brute
// force. That's an acceptable tradeoff here: the actual verification step
// is always a human judging a spoken answer on a real phone call, never an
// automated check against this hash.
const SALT = 'safeword-app-v1';
const STRETCH_ROUNDS = 200;

export async function hashSafeWord(rawValue: string): Promise<string> {
  const normalized = rawValue.trim().toLowerCase();
  let value = `${SALT}:${normalized}`;
  for (let i = 0; i < STRETCH_ROUNDS; i++) {
    value = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
  }
  return value;
}
