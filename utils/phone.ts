/**
 * Phone number utilities.
 * Handles stripping country codes from international phone numbers.
 */

/**
 * Strip country code from a phone number and return local digits only.
 *
 * Handles formats like:
 * +919176543210  → 9176543210
 * +19876543210   → 9876543210
 * +447911123456  → 7911123456  (UK)
 * 00919876543210 → 9876543210
 * 9876543210     → 9876543210  (already local)
 *
 * Strategy:
 * 1. Clean the number (remove spaces, dashes, brackets)
 * 2. Remove leading + or 00
 * 3. Try known country code lengths (1, 2, 3 digits)
 *    — check if remaining digits are 10 digits (most countries)
 * 4. Fallback: take last 10 digits
 */
export function stripCountryCode(raw: string): string {
  // Step 1: clean
  let cleaned = raw
    .replace(/\s/g, '')
    .replace(/-/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\./g, '')
    .trim();

  // Step 2: remove leading + or 00
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  // Step 3: if already 10 digits, return as-is
  if (cleaned.length === 10) {
    return cleaned;
  }

  // Step 4: try stripping 1, 2, or 3 digit country codes
  // and check if remainder is exactly 10 digits
  for (const ccLength of [1, 2, 3]) {
    const remainder = cleaned.slice(ccLength);
    if (remainder.length === 10 && /^\d{10}$/.test(remainder)) {
      return remainder;
    }
  }

  // Step 5: fallback — take last 10 digits
  return cleaned.slice(-10);
}
