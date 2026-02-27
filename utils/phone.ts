/**
 * Phone number utilities.
 */

/**
 * Strip country code using length-based logic.
 * Handles: +919176543210, +19876543210, +447911123456, 00919876543210
 */
export function stripCountryCode(raw: string): string {
  let cleaned = raw
    .replace(/\s/g, '')
    .replace(/-/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\./g, '')
    .trim();

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  if (cleaned.length === 10) return cleaned;

  for (const ccLength of [1, 2, 3]) {
    const remainder = cleaned.slice(ccLength);
    if (remainder.length === 10 && /^\d{10}$/.test(remainder)) {
      return remainder;
    }
  }

  return cleaned.slice(-10);
}
