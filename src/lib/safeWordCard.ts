import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getLocales } from 'expo-localization';
import { copy } from '../constants/copy';
import { EMBASSY_GUIDANCE } from '../data/emergencyNumbers';
import { lookupEmergencyNumbers } from './emergencyNumbers';

export type SafeWordCardParams = {
  circleOwnerName: string;
  safeWord: string;
  /** ISO 3166-1 alpha-2 country code. Defaults to the device's own locale region if omitted. */
  countryCode?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Large print, high contrast, one page — this is meant to be printed and
// kept by a landline or on a fridge for the family member who won't
// reliably use the app itself, not viewed on a screen.
export function buildSafeWordCardHtml({ circleOwnerName, safeWord, countryCode }: SafeWordCardParams): string {
  const resolvedCountry = countryCode ?? getLocales()[0]?.regionCode ?? null;
  const numbers = lookupEmergencyNumbers(resolvedCountry);

  const stepsHtml = copy.verifyScript.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('\n');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 36px; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #111111;
    background: #ffffff;
    font-size: 20px;
    line-height: 1.4;
  }
  h1 {
    font-size: 30px;
    margin: 0 0 4px 0;
  }
  .subtitle {
    font-size: 16px;
    color: #444444;
    margin: 0 0 24px 0;
  }
  .safeword-box {
    border: 3px solid #111111;
    border-radius: 8px;
    padding: 20px 24px;
    text-align: center;
    margin-bottom: 28px;
  }
  .safeword-label {
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 8px 0;
  }
  .safeword-value {
    font-size: 44px;
    font-weight: bold;
    margin: 0;
    word-break: break-word;
  }
  h2 {
    font-size: 22px;
    border-bottom: 2px solid #111111;
    padding-bottom: 4px;
    margin: 28px 0 12px 0;
  }
  ol {
    padding-left: 24px;
    margin: 0;
  }
  li {
    margin-bottom: 12px;
  }
  .numbers-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 20px;
  }
  .numbers-table td {
    border: 1px solid #999999;
    padding: 10px 12px;
    vertical-align: top;
  }
  .numbers-table td.number {
    font-weight: bold;
    font-size: 26px;
    white-space: nowrap;
  }
  .note {
    font-size: 14px;
    color: #444444;
    margin-top: 16px;
  }
  .footer {
    font-size: 13px;
    color: #666666;
    margin-top: 24px;
    text-align: center;
  }
</style>
</head>
<body>
  <h1>${escapeHtml(circleOwnerName)}'s SafeWord family card</h1>
  <p class="subtitle">Keep this by your phone. It's here so you never have to remember any of this under pressure.</p>

  <div class="safeword-box">
    <p class="safeword-label">Your family safe word</p>
    <p class="safeword-value">${escapeHtml(safeWord)}</p>
  </div>

  <h2>${escapeHtml(copy.verifyScript.title)}</h2>
  <ol>
    ${stepsHtml}
  </ol>

  <h2>Numbers to know</h2>
  <table class="numbers-table">
    <tr>
      <td>Emergency (fire, police, ambulance)</td>
      <td class="number">${escapeHtml(numbers.emergency)}</td>
    </tr>
    <tr>
      <td>Non-emergency police${numbers.nonEmergencyNote ? ` — ${escapeHtml(numbers.nonEmergencyNote)}` : ''}</td>
      <td class="number">${escapeHtml(numbers.nonEmergencyPolice || '—')}</td>
    </tr>
  </table>
  ${numbers.emergencyNote ? `<p class="note">${escapeHtml(numbers.emergencyNote)}</p>` : ''}
  <p class="note">${escapeHtml(EMBASSY_GUIDANCE)}</p>

  <p class="footer">Made with SafeWord. Numbers shown are for ${escapeHtml(numbers.countryName)} — reprint this card if you move somewhere new.</p>
</body>
</html>`;
}

// Best-effort: a printing/sharing failure shouldn't be treated as data loss
// (the safe word itself is already saved via saveSafeWord before this is
// ever called) — callers should catch and show a simple retry message.
export async function exportSafeWordCard(params: SafeWordCardParams): Promise<void> {
  const html = buildSafeWordCardHtml(params);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: "Share your family's safe word card" });
  }
}
