import { Student } from '../types';

/**
 * Validasi kata sandi akun Siswa / Orang Tua.
 * 
 * ATURAN KEAMANAN KETAT:
 * 1. Password universal ('bfa123', '123456', 'admin123') DILARANG keras sebagai fallback.
 * 2. Tanggal lahir DILARANG keras sebagai pengganti password bawaan.
 * 3. HANYA kata sandi khusus (customPassword) yang telah didaftarkan secara sah yang diterima.
 * 4. Jika akun belum memiliki custom password, autentikasi GAGAL (returns isValid: false).
 */
export function validateStudentPassword(
  student: Student,
  inputPass: string,
  savedCustomPasswords?: Record<string, string>
): {
  isValid: boolean;
  reason: 'MATCH' | 'NO_CUSTOM_PASSWORD' | 'INCORRECT_PASSWORD' | 'EMPTY_INPUT';
} {
  const cleanPass = (inputPass || '').trim();
  if (!cleanPass) {
    return { isValid: false, reason: 'EMPTY_INPUT' };
  }

  // SUMBER KEBENARAN UTAMA:
  // 1. Gunakan student.customPassword dari dokumen database resmi jika tersedia.
  // 2. Cache localStorage (savedCustomPasswords) hanya digunakan sebagai cadangan sekunder
  //    apabila properti di objek student kosong (misal transisi atau mode offline).
  const customPass = (student.customPassword && student.customPassword.trim())
    ? student.customPassword.trim()
    : ((savedCustomPasswords && savedCustomPasswords[student.id]) || '');

  // Akun belum memiliki kata sandi khusus
  if (!customPass || !customPass.trim()) {
    return { isValid: false, reason: 'NO_CUSTOM_PASSWORD' };
  }

  // Verifikasi pencocokan kata sandi khusus (case-insensitive)
  if (cleanPass.toLowerCase() === customPass.trim().toLowerCase()) {
    return { isValid: true, reason: 'MATCH' };
  }

  return { isValid: false, reason: 'INCORRECT_PASSWORD' };
}
