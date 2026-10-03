/**
 * Utility functions for strict, consistent Indonesian phone number normalization and validation.
 * Prevents account collisions and ensures exact identity mapping.
 */

/**
 * Normalizes Indonesian phone numbers into canonical '08xxxxxxxxxx' format.
 * Examples:
 * - '+62 812-3456-7890' -> '081234567890'
 * - '6281234567890'     -> '081234567890'
 * - '081234567890'      -> '081234567890'
 * - '81234567890'       -> '081234567890'
 */
export function normalizePhoneNumber(rawPhone: string | undefined | null): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // Handle international prefix 0062 e.g. 0062812...
  if (digits.startsWith('0062')) {
    digits = digits.slice(4);
    if (!digits.startsWith('8') && !digits.startsWith('08')) {
      digits = '8' + digits;
    }
  }

  // Handle common typo variant e.g. +62 08xxx -> digits: 6208xxx -> 08xxx
  if (digits.startsWith('6208')) {
    return '08' + digits.slice(4);
  }

  if (digits.startsWith('628')) {
    return '0' + digits.slice(2);
  }
  if (digits.startsWith('8')) {
    return '0' + digits;
  }
  if (digits.startsWith('08')) {
    return digits;
  }
  return digits;
}

/**
 * Validates if a phone number is a valid Indonesian mobile number:
 * Starts with 08, followed by a non-zero digit [1-9], with a total length of 10 to 14 digits.
 * Placeholder values like '08', '081', '0', '-' return false.
 */
export function isValidIndonesianMobile(rawPhone: string | undefined | null): boolean {
  if (!rawPhone || typeof rawPhone !== 'string') return false;
  const normalized = normalizePhoneNumber(rawPhone);
  return /^08[1-9]\d{7,11}$/.test(normalized);
}

/**
 * Compares two phone numbers for exact identity match after normalization.
 * Returns false if either phone number is invalid, placeholder, or empty.
 * Never performs partial or substring matching.
 */
export function isExactPhoneMatch(
  phoneA: string | undefined | null,
  phoneB: string | undefined | null
): boolean {
  if (!isValidIndonesianMobile(phoneA) || !isValidIndonesianMobile(phoneB)) {
    return false;
  }
  return normalizePhoneNumber(phoneA) === normalizePhoneNumber(phoneB);
}
