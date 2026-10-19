/**
 * BFA HUB - Firestore Quota Protection Helpers
 * Mencegah siklus reload/retry berulang saat kuota server Firestore (resource-exhausted / HTTP 429) tercapai.
 * Menggunakan batas kedaluwarsa waktu lokal yang aman dan dapat dipulihkan kapan saja.
 */

const BFA_QUOTA_COOLDOWN_KEY = 'bfa_quota_cooldown_until';
const BFA_QUOTA_LAST_MSG_KEY = 'bfa_quota_last_error_msg';
const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000; // 15 menit masa jeda aman pasca-kuota habis

/**
 * Menyimpan waktu kedaluwarsa jeda kuota ke localStorage.
 * Hanya dipanggil ketika teridentifikasi error kuota Firestore (resource-exhausted).
 */
export function setBfaQuotaCooldown(errorMsg?: string, durationMs: number = DEFAULT_COOLDOWN_MS): void {
  try {
    const expireAt = Date.now() + durationMs;
    localStorage.setItem(BFA_QUOTA_COOLDOWN_KEY, String(expireAt));
    if (errorMsg) {
      localStorage.setItem(BFA_QUOTA_LAST_MSG_KEY, errorMsg);
    }
  } catch {}
}

/**
 * Memeriksa apakah masa jeda kuota masih aktif.
 * Jika sudah lewat dari batas waktu, otomatis membersihkan flag agar aplikasi dapat mencoba tersambung kembali.
 */
export function isBfaQuotaCooldownActive(): boolean {
  try {
    const raw = localStorage.getItem(BFA_QUOTA_COOLDOWN_KEY);
    if (!raw) return false;
    const expireAt = Number(raw);
    if (!expireAt || isNaN(expireAt)) {
      clearBfaQuotaCooldown();
      return false;
    }
    if (Date.now() < expireAt) {
      return true;
    }
    // Masa jeda telah berakhir secara alami
    clearBfaQuotaCooldown();
    return false;
  } catch {
    return false;
  }
}

/**
 * Menghapus proteksi jeda kuota secara aman (misal saat admin meminta cek koneksi manual).
 */
export function clearBfaQuotaCooldown(): void {
  try {
    localStorage.removeItem(BFA_QUOTA_COOLDOWN_KEY);
    localStorage.removeItem(BFA_QUOTA_LAST_MSG_KEY);
  } catch {}
}

/**
 * Mengambil sisa waktu jeda kuota dalam menit (untuk informasi UI).
 */
export function getBfaQuotaCooldownRemainingMinutes(): number {
  try {
    const raw = localStorage.getItem(BFA_QUOTA_COOLDOWN_KEY);
    if (!raw) return 0;
    const expireAt = Number(raw);
    if (!expireAt || isNaN(expireAt) || Date.now() >= expireAt) {
      return 0;
    }
    return Math.ceil((expireAt - Date.now()) / (60 * 1000));
  } catch {
    return 0;
  }
}

/**
 * Mengambil pesan error kuota terakhir yang tersimpan.
 */
export function getBfaQuotaLastErrorMessage(): string | null {
  try {
    return localStorage.getItem(BFA_QUOTA_LAST_MSG_KEY);
  } catch {
    return null;
  }
}
