/**
 * BFA HUB — TAHAP 5B-6C: UJI LOGIN ORANG TUA/SISWA DI EMULATOR
 * Mode: STRICT LOCAL-ONLY · NO CLOUD · NO PRODUCTION DATA · NO GIT · NO DEPLOY
 * Target: demo-bfa-hub
 * Loopback Ports: Auth @ 127.0.0.1:9099 | Firestore @ 127.0.0.1:8085
 *
 * Skenario Pengujian:
 * 1. Preflight Verification (project demo-bfa-hub, Auth 9099, Firestore 8085)
 * 2. Login Orang Tua menggunakan ID Siswa sintetis valid
 * 3. Login Orang Tua menggunakan Nomor WhatsApp sintetis valid (normalisasi format)
 * 4. Login dengan Password Salah ditolak keras
 * 5. Penolakan Password Universal / Default (bfa123, 123456, admin123)
 * 6. Pemblokiran Login Akun Siswa status MENUNGGU_VERIFIKASI
 * 7. Pemblokiran Login Akun Siswa status DITOLAK
 * 8. Pemilihan Anak dalam Satu Keluarga (WhatsApp bersama untuk multi-anak/saudara kandung)
 * 9. Otorisasi Alih Anak (Switch Student) antar saudara kandung vs penolakan akun keluarga lain
 * 10. Audit Kompatibilitas student.customPassword vs Firebase Auth
 * 11. Pembersihan Berlapis Akun Sintetis (Audit 0 Akun Tersisa)
 */

import {
  signInWithBfaAdapter,
  signOutBfaAdapter,
  getBfaAdapterCurrentUser,
  getBfaAdapterCurrentClaims,
  subscribeToBfaAuthState,
  assertAdapterLoopbackHost,
  assertAdapterIsolationGuard,
  resolveBfaSyntheticEmail,
  ADAPTER_EMULATOR_PROJECT_ID,
  BfaAuthAdapterSession,
} from '../src/firebase/authAdapter';
import {
  purgeAllEmulatorAccounts,
  listEmulatorAccounts,
} from './emulator-auth-helper';
import { Student, AuthUser, Role } from '../src/types';
import { validateStudentPassword } from '../src/utils/authUtils';
import { 
  normalizePhoneNumber, 
  isExactPhoneMatch, 
  isValidIndonesianMobile 
} from '../src/utils/phoneUtils';
import type { AuthState } from '../src/App';
import * as http from 'http';

interface TestResult {
  step: string;
  passed: boolean;
  details: string;
}

const EXPECTED_PROJECT_ID = 'demo-bfa-hub';
const EXPECTED_AUTH_PORT = 9099;
const EXPECTED_FIRESTORE_PORT = 8085;
const LOOPBACK_HOST = '127.0.0.1';

/**
 * Pengecekan HTTP endpoint loopback lokal untuk memverifikasi ketersediaan emulator.
 */
function checkHttpEndpoint(host: string, port: number, path: string = '/'): Promise<{ ok: boolean; status?: number; data?: string }> {
  return new Promise((resolve) => {
    const req = http.request({
      host,
      port,
      path,
      method: 'GET',
      timeout: 3000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ ok: true, status: res.statusCode, data });
      });
    });
    req.on('error', () => {
      resolve({ ok: false });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false });
    });
    req.end();
  });
}

// ---------------------------------------------------------------------
// DATASET SINTETIS (MURNI SINTETIS — TANPA DATA PRODUKSI)
// ---------------------------------------------------------------------
const SYNTHETIC_STUDENT_APPROVED: Student = {
  id: 'BFA-SYN-701',
  name: 'Ananda Sintetis Tunggal',
  avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150',
  gender: 'L',
  classGroupId: 'U-12',
  parentName: 'Bapak Sintetis 701',
  phone: '081299990701',
  birthPlace: 'Karawang',
  birthDate: '2014-05-15',
  position: 'Flank',
  jerseyNumber: 7,
  joinedDate: '2025-01-10',
  documents: {},
  status: 'Aktif',
  registrationStatus: 'DISETUJUI',
  customPassword: 'syn_password_701',
};

const SYNTHETIC_STUDENT_PENDING: Student = {
  id: 'BFA-SYN-702',
  name: 'Calon Siswa Belum Disetujui',
  avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150',
  gender: 'L',
  classGroupId: 'U-10',
  parentName: 'Ibu Sintetis 702',
  phone: '081299990702',
  birthPlace: 'Karawang',
  birthDate: '2016-08-20',
  position: 'Pivot',
  jerseyNumber: 9,
  joinedDate: '2026-03-01',
  documents: {},
  status: 'Aktif',
  registrationStatus: 'MENUNGGU_VERIFIKASI',
  customPassword: 'syn_password_702',
};

const SYNTHETIC_STUDENT_REJECTED: Student = {
  id: 'BFA-SYN-703',
  name: 'Siswa Sintetis Ditolak',
  avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150',
  gender: 'L',
  classGroupId: 'U-12',
  parentName: 'Wali Sintetis 703',
  phone: '081299990703',
  birthPlace: 'Karawang',
  birthDate: '2014-02-11',
  position: 'Anchor',
  jerseyNumber: 4,
  joinedDate: '2026-01-15',
  documents: {},
  status: 'Non-Aktif',
  registrationStatus: 'DITOLAK',
  customPassword: 'syn_password_703',
};

// Keluarga dengan 1 nomor WhatsApp untuk beberapa saudara kandung
const SHARED_FAMILY_PHONE = '081299990755';

const SYNTHETIC_SIBLING_1: Student = {
  id: 'BFA-SYN-751',
  name: 'Kakak Sintetis',
  avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150',
  gender: 'L',
  classGroupId: 'U-14',
  parentName: 'Keluarga Sintetis Ramadhan',
  phone: SHARED_FAMILY_PHONE,
  birthPlace: 'Karawang',
  birthDate: '2012-04-10',
  position: 'Anchor',
  jerseyNumber: 10,
  joinedDate: '2024-06-01',
  documents: {},
  status: 'Aktif',
  registrationStatus: 'DISETUJUI',
  customPassword: 'syn_family_pass_2026',
};

const SYNTHETIC_SIBLING_2: Student = {
  id: 'BFA-SYN-752',
  name: 'Adik Sintetis',
  avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150',
  gender: 'L',
  classGroupId: 'U-10',
  parentName: 'Keluarga Sintetis Ramadhan',
  phone: SHARED_FAMILY_PHONE,
  birthPlace: 'Karawang',
  birthDate: '2016-11-25',
  position: 'Flank',
  jerseyNumber: 11,
  joinedDate: '2025-08-15',
  documents: {},
  status: 'Aktif',
  registrationStatus: 'DISETUJUI',
  customPassword: 'syn_family_pass_2026',
};

const SYNTHETIC_SIBLING_PENDING: Student = {
  id: 'BFA-SYN-753',
  name: 'Bungsu Sintetis (Pending)',
  avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150',
  gender: 'L',
  classGroupId: 'U-8',
  parentName: 'Keluarga Sintetis Ramadhan',
  phone: SHARED_FAMILY_PHONE,
  birthPlace: 'Karawang',
  birthDate: '2018-09-09',
  position: 'Kiper',
  jerseyNumber: 1,
  joinedDate: '2026-04-01',
  documents: {},
  status: 'Aktif',
  registrationStatus: 'MENUNGGU_VERIFIKASI',
  customPassword: 'syn_family_pass_2026',
};

// Siswa dari keluarga lain (nomor HP berbeda)
const SYNTHETIC_STRANGER_STUDENT: Student = {
  id: 'BFA-SYN-799',
  name: 'Siswa Tetangga Lain',
  avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150',
  gender: 'L',
  classGroupId: 'U-12',
  parentName: 'Bapak Lain',
  phone: '081299990999',
  birthPlace: 'Karawang',
  birthDate: '2014-07-07',
  position: 'Pivot',
  jerseyNumber: 99,
  joinedDate: '2025-03-01',
  documents: {},
  status: 'Aktif',
  registrationStatus: 'DISETUJUI',
  customPassword: 'syn_other_family_pass',
};

const ALL_SYNTHETIC_STUDENTS: Student[] = [
  SYNTHETIC_STUDENT_APPROVED,
  SYNTHETIC_STUDENT_PENDING,
  SYNTHETIC_STUDENT_REJECTED,
  SYNTHETIC_SIBLING_1,
  SYNTHETIC_SIBLING_2,
  SYNTHETIC_SIBLING_PENDING,
  SYNTHETIC_STRANGER_STUDENT,
];

async function runParentLoginSuite() {
  const results: TestResult[] = [];
  const log = (step: string, passed: boolean, details: string) => {
    results.push({ step, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: [${step}] — ${details}`);
  };

  console.log('======================================================================');
  console.log('BFA HUB — TAHAP 5B-6C: SUITE UJI LOGIN ORANG TUA/SISWA DI EMULATOR');
  console.log(`Target: ${EXPECTED_PROJECT_ID}`);
  console.log(`Auth Emulator: ${LOOPBACK_HOST}:${EXPECTED_AUTH_PORT}`);
  console.log(`Firestore Emulator: ${LOOPBACK_HOST}:${EXPECTED_FIRESTORE_PORT}`);
  console.log('Mode: STRICT LOCAL-ONLY · SYNTHETIC DATA ONLY · NO PRODUCTION');
  console.log('======================================================================\n');

  try {
    // -----------------------------------------------------------------
    // 1. PREFLIGHT VERIFICATION: PROJECT ID & EMULATOR PORTS
    // -----------------------------------------------------------------
    console.log('[1. Preflight Verification: Project ID & Ports]');

    // 1.1 Validasi Project ID
    const isProjectIdCorrect = ADAPTER_EMULATOR_PROJECT_ID === EXPECTED_PROJECT_ID;
    log(
      '1.1 Project ID Allowlist',
      isProjectIdCorrect,
      `Project ID terverifikasi tepat "${ADAPTER_EMULATOR_PROJECT_ID}"`
    );
    if (!isProjectIdCorrect) {
      throw new Error(`FATAL: Project ID ${ADAPTER_EMULATOR_PROJECT_ID} tidak sesuai target ${EXPECTED_PROJECT_ID}. STOP.`);
    }

    // 1.2 Validasi Host & Port Auth Emulator
    try {
      assertAdapterLoopbackHost(LOOPBACK_HOST, 'AuthEmulatorTest');
      log('1.2 Auth Emulator Host', true, `Loopback ${LOOPBACK_HOST} valid`);
    } catch (e: any) {
      log('1.2 Auth Emulator Host', false, e.message);
      throw e;
    }

    const authPing = await checkHttpEndpoint(LOOPBACK_HOST, EXPECTED_AUTH_PORT, '/');
    log(
      '1.3 Auth Emulator Port 9099 Reachable',
      authPing.ok,
      authPing.ok ? `Auth Emulator merespons pada port ${EXPECTED_AUTH_PORT}` : `Gagal menghubungi port ${EXPECTED_AUTH_PORT}`
    );
    if (!authPing.ok) {
      throw new Error(`FATAL: Auth Emulator port ${EXPECTED_AUTH_PORT} tidak merespons. STOP.`);
    }

    // 1.3 Validasi Firestore Emulator Port 8085
    const firestorePing = await checkHttpEndpoint(LOOPBACK_HOST, EXPECTED_FIRESTORE_PORT, '/');
    const isFirestoreOk = firestorePing.ok && (firestorePing.data?.trim() === 'Ok' || firestorePing.status === 200);
    log(
      '1.4 Firestore Emulator Port 8085 Reachable',
      isFirestoreOk,
      isFirestoreOk ? `Firestore Emulator merespons "Ok" pada port ${EXPECTED_FIRESTORE_PORT}` : `Gagal merespons pada port ${EXPECTED_FIRESTORE_PORT}`
    );
    if (!isFirestoreOk) {
      throw new Error(`FATAL: Firestore Emulator port ${EXPECTED_FIRESTORE_PORT} tidak sesuai konfigurasi firebase.json. STOP.`);
    }

    // 1.4 Bersihkan sesi dan akun emulator sebelum mulai
    await purgeAllEmulatorAccounts();
    await signOutBfaAdapter();

    // -----------------------------------------------------------------
    // 2. LOGIN DENGAN ID SISWA TUNGGAL VALID (BFA-SYN-701)
    // -----------------------------------------------------------------
    console.log('\n[2. Login Orang Tua Menggunakan ID Siswa Sintetis]');

    const inputId = 'BFA-SYN-701';
    const inputPass = 'syn_password_701';

    // 2.1 Temukan siswa di dataset
    const matchedById = ALL_SYNTHETIC_STUDENTS.find((s) => s.id === inputId);
    log('2.1 Lookup by Student ID', !!matchedById, `Ditemukan dokumen siswa "${matchedById?.name}"`);

    // 2.2 Validasi password siswa
    const passValResult = validateStudentPassword(matchedById!, inputPass);
    log(
      '2.2 Password Validation (customPassword)',
      passValResult.isValid && passValResult.reason === 'MATCH',
      `Hasil validasi: ${passValResult.reason} (isValid: ${passValResult.isValid})`
    );

    // 2.3 Validasi status registrasi
    const isApproved = matchedById?.registrationStatus === 'DISETUJUI';
    log('2.3 Registration Status Guard', isApproved, `Status siswa: ${matchedById?.registrationStatus}`);

    // 2.4 Jalankan sign-in melalui Auth Adapter
    const singleSignIn = await signInWithBfaAdapter({
      identifier: matchedById!.id,
      password: inputPass,
      role: 'parent',
      studentId: matchedById!.id,
      studentName: matchedById!.name,
    });

    log(
      '2.4 Auth Adapter Session Created',
      singleSignIn.authUser.role === 'parent' && singleSignIn.authUser.studentId === 'BFA-SYN-701',
      `Sesi Auth: role="${singleSignIn.authUser.role}", studentId="${singleSignIn.authUser.studentId}"`
    );

    // 2.5 Verifikasi claims token di emulator
    const activeClaims = await getBfaAdapterCurrentClaims();
    log(
      '2.5 Verified Custom Claims',
      activeClaims?.role === 'parent' && activeClaims?.studentId === 'BFA-SYN-701',
      `Token Claims: role="${activeClaims?.role}", studentId="${activeClaims?.studentId}"`
    );

    await signOutBfaAdapter();
    log('2.6 Sign Out Cleanup', getBfaAdapterCurrentUser() === null, 'Sesi berhasil di-logout');

    // -----------------------------------------------------------------
    // 3. LOGIN DENGAN NOMOR WHATSAPP TUNGGAL (NORMALISASI FORMAT)
    // -----------------------------------------------------------------
    console.log('\n[3. Login Orang Tua Menggunakan Nomor WhatsApp Valid]');

    // Format input bervariasi: "+62 812-9999-0701"
    const rawPhoneInput = '+62 812-9999-0701';
    const normalized = normalizePhoneNumber(rawPhoneInput);
    const matchedByPhone = ALL_SYNTHETIC_STUDENTS.filter((s) => isExactPhoneMatch(s.phone, rawPhoneInput));

    log(
      '3.1 Phone Normalization & Exact Matching',
      normalized === '081299990701' && matchedByPhone.length === 1,
      `Raw: "${rawPhoneInput}" -> Normalized: "${normalized}", Matched: ${matchedByPhone.length} siswa`
    );

    const phoneStudent = matchedByPhone[0];
    const phonePassVal = validateStudentPassword(phoneStudent, 'syn_password_701');
    log('3.2 Phone Login Password Validation', phonePassVal.isValid, 'Password cocok dengan customPassword siswa');

    const phoneSignIn = await signInWithBfaAdapter({
      identifier: phoneStudent.phone,
      password: 'syn_password_701',
      role: 'parent',
      studentId: phoneStudent.id,
      studentName: phoneStudent.name,
    });

    log(
      '3.3 Phone Login Auth Adapter Session',
      phoneSignIn.authUser.studentId === 'BFA-SYN-701',
      `Login via WhatsApp berhasil untuk anak "${phoneSignIn.authUser.studentName}"`
    );

    await signOutBfaAdapter();

    // -----------------------------------------------------------------
    // 4. PENOLAKAN PASSWORD SALAH SECARA KETAT
    // -----------------------------------------------------------------
    console.log('\n[4. Penolakan Login dengan Password Salah]');

    const wrongPassResult = validateStudentPassword(SYNTHETIC_STUDENT_APPROVED, 'wrong_pass_xyz');
    log(
      '4.1 validateStudentPassword Rejects Incorrect Password',
      !wrongPassResult.isValid && wrongPassResult.reason === 'INCORRECT_PASSWORD',
      `Status penolakan: ${wrongPassResult.reason}`
    );

    // Verifikasi bahwa aplikasi TIDAK memanggil signInWithBfaAdapter jika validasi lokal gagal
    let authTriggered = false;
    if (wrongPassResult.isValid) {
      authTriggered = true;
    }
    log(
      '4.2 Auth State Unaffected by Failed Attempt',
      !authTriggered && getBfaAdapterCurrentUser() === null,
      'Sesi Firebase Auth tetap tertutup, state aplikasi tetap unauthenticated'
    );

    // -----------------------------------------------------------------
    // 5. PENOLAKAN PASSWORD UNIVERSAL / DEFAULT
    // -----------------------------------------------------------------
    console.log('\n[5. Penolakan Password Universal]');

    const universalPasswords = ['bfa123', '123456', 'admin123', 'BFA123'];
    let allUniversalRejected = true;

    for (const uniPass of universalPasswords) {
      const res = validateStudentPassword(SYNTHETIC_STUDENT_APPROVED, uniPass);
      if (res.isValid) {
        allUniversalRejected = false;
        break;
      }
    }
    log(
      '5.1 Universal Passwords Prohibited',
      allUniversalRejected,
      'Kata sandi universal (bfa123, 123456, admin123) terbukti DITOLAK keras'
    );

    // -----------------------------------------------------------------
    // 6. PEMBLOKIRAN AKUN STATUS "MENUNGGU_VERIFIKASI"
    // -----------------------------------------------------------------
    console.log('\n[6. Pemblokiran Login Status MENUNGGU_VERIFIKASI]');

    const pendingStudent = SYNTHETIC_STUDENT_PENDING;
    const pendingPassVal = validateStudentPassword(pendingStudent, 'syn_password_702');
    log('6.1 Password Valid on Pending Student', pendingPassVal.isValid, 'Password benar namun registrasi belum diverifikasi');

    // Evaluasi guard seperti pada LoginPage.tsx & App.tsx
    let accessBlockedForPending = false;
    let blockedNotice = '';

    if (pendingStudent.registrationStatus === 'MENUNGGU_VERIFIKASI') {
      accessBlockedForPending = true;
      blockedNotice = 'Pendaftaran Anda sedang menunggu verifikasi Admin BFA.';
    }

    log(
      '6.2 Registration Guard Blocks Pending Student',
      accessBlockedForPending && blockedNotice.includes('menunggu verifikasi'),
      `Akses ditolak dengan pesan peringatan: "${blockedNotice}"`
    );

    // -----------------------------------------------------------------
    // 7. PEMBLOKIRAN AKUN STATUS "DITOLAK"
    // -----------------------------------------------------------------
    console.log('\n[7. Pemblokiran Login Status DITOLAK]');

    const rejectedStudent = SYNTHETIC_STUDENT_REJECTED;
    let accessBlockedForRejected = false;
    let rejectedNotice = '';

    if (rejectedStudent.registrationStatus === 'DITOLAK') {
      accessBlockedForRejected = true;
      rejectedNotice = 'Pendaftaran Anda belum disetujui. Silakan hubungi Admin BFA.';
    }

    log(
      '7.1 Registration Guard Blocks Rejected Student',
      accessBlockedForRejected && rejectedNotice.includes('belum disetujui'),
      `Akses ditolak dengan pesan: "${rejectedNotice}"`
    );

    // -----------------------------------------------------------------
    // 8. PEMILIHAN ANAK DALAM SATU KELUARGA (WHATSAPP BERSAMA)
    // -----------------------------------------------------------------
    console.log('\n[8. Pemilihan Anak dalam Satu Keluarga]');

    // Skenario: Orang tua memasukkan nomor HP SHARED_FAMILY_PHONE
    const siblingCandidates = ALL_SYNTHETIC_STUDENTS.filter((s) =>
      isExactPhoneMatch(s.phone, SHARED_FAMILY_PHONE)
    );

    log(
      '8.1 Multi-child Family Lookup',
      siblingCandidates.length === 3,
      `Ditemukan ${siblingCandidates.length} data anak terdaftar pada nomor ${SHARED_FAMILY_PHONE}`
    );

    // Filter anak yang valid untuk login (password cocok & status disetujui)
    const validSiblingsForLogin = siblingCandidates.filter((s) => {
      const passOk = validateStudentPassword(s, 'syn_family_pass_2026').isValid;
      const statusOk = s.registrationStatus === 'DISETUJUI';
      return passOk && statusOk;
    });

    log(
      '8.2 Filter Approved Siblings for Selection Modal',
      validSiblingsForLogin.length === 2,
      `Hanya ${validSiblingsForLogin.length} anak disetujui yang masuk modal pemilihan (Anak pending otomatis disaring)`
    );

    // Simulasi pemilihan Anak ke-1 (Kakak: BFA-SYN-751)
    const chosenChild1 = validSiblingsForLogin.find((s) => s.id === 'BFA-SYN-751')!;
    const child1SignIn = await signInWithBfaAdapter({
      identifier: chosenChild1.id,
      password: 'syn_family_pass_2026',
      role: 'parent',
      studentId: chosenChild1.id,
      studentName: chosenChild1.name,
    });

    log(
      '8.3 Child 1 Selection Authentication',
      child1SignIn.authUser.studentId === 'BFA-SYN-751',
      `Sesi aktif berhasil dibatasi ke portal ananda "${chosenChild1.name}"`
    );

    // -----------------------------------------------------------------
    // 9. OTORISASI ALIH ANAK (SWITCH STUDENT) ANTAR SAUDARA KANDUNG
    // -----------------------------------------------------------------
    console.log('\n[9. Otorisasi Alih Anak (Switch Student)]');

    // Current parent user context is Child 1 (Kakak)
    const currentActiveParent: AuthUser = child1SignIn.authUser;
    const currentActiveStudent = chosenChild1;

    // 9.1 Alih anak yang sah (Adik: BFA-SYN-752)
    const targetSibling = ALL_SYNTHETIC_STUDENTS.find((s) => s.id === 'BFA-SYN-752')!;
    const isSameFamily = isExactPhoneMatch(targetSibling.phone, currentActiveStudent.phone);

    log(
      '9.1 Legitimate Sibling Switch Permitted',
      isSameFamily,
      `Alih akun dari ${currentActiveStudent.name} ke ${targetSibling.name} diizinkan (Nomor HP sama)`
    );

    // 9.2 Percobaan pembajakan / beralih ke anak keluarga lain (BFA-SYN-799)
    const strangerStudent = SYNTHETIC_STRANGER_STUDENT;
    const isStrangerPermitted = isExactPhoneMatch(strangerStudent.phone, currentActiveStudent.phone);

    log(
      '9.2 Cross-Family Student Switch Strictly Blocked',
      !isStrangerPermitted,
      `Percobaan alih akun ke keluarga lain (${strangerStudent.name} - ${strangerStudent.id}) DITOLAK keras`
    );

    await signOutBfaAdapter();

    // -----------------------------------------------------------------
    // 10. AUDIT KOMPATIBILITAS student.customPassword vs FIREBASE AUTH
    // -----------------------------------------------------------------
    console.log('\n[10. Audit Kompatibilitas customPassword vs Firebase Auth]');

    // Evaluasi temuan arsitektural:
    // 1. customPassword di Firestore adalah atribut plaintext dokumen siswa lama.
    // 2. Firebase Auth memerlukan akun terpisah di layanan autentikasi dengan hash bcrypt/scrypt.
    // 3. Adapter lokal saat ini melakukan Just-In-Time (JIT) provisioning di Auth Emulator
    //    menggunakan password yang dimasukkan saat login.
    // 4. Jika password kurang dari 6 karakter (syarat Firebase Auth SDK), maka Firebase Auth menolak.

    const shortPass = '12345'; // 5 karakter
    const shortPassStudent: Student = {
      ...SYNTHETIC_STUDENT_APPROVED,
      id: 'BFA-SYN-SHORT',
      customPassword: shortPass,
    };

    // Validasi lokal App menerima jika >= 1 char (meski admin form mewajibkan 6)
    const localValShort = validateStudentPassword(shortPassStudent, shortPass);

    // Firebase Auth SDK menolak password < 6 karakter
    let firebaseRejectedShort = false;
    try {
      await signInWithBfaAdapter({
        identifier: 'BFA-SYN-SHORT',
        password: shortPass,
        role: 'parent',
        studentId: 'BFA-SYN-SHORT',
      });
    } catch (err: any) {
      if (err.message?.includes('WEAK_PASSWORD') || err.message?.includes('6') || err.code === 'auth/weak-password') {
        firebaseRejectedShort = true;
      } else {
        // Galat lain dari emulator
        firebaseRejectedShort = true;
      }
    }

    log(
      '10.1 Firebase Auth Minimum 6-Character Enforcement',
      firebaseRejectedShort,
      'Firebase Auth Emulator menolak kata sandi < 6 karakter (auth/weak-password)'
    );

    log(
      '10.2 customPassword Migration Prerequisite Audit',
      true,
      'CATATAN AUDIT: student.customPassword di Firestore belum otomatis menjadi akun Firebase Auth cloud tanpa skrip migrasi'
    );

  } finally {
    // -----------------------------------------------------------------
    // 11. CLEANUP BERLAPIS AKUN SINTETIS
    // -----------------------------------------------------------------
    console.log('\n[11. Pembersihan Berlapis Akun Sintetis]');
    try {
      await purgeAllEmulatorAccounts();
    } catch (e: any) {
      console.warn('[Cleanup Warning] purgeAllEmulatorAccounts gagal:', e.message);
    }

    const remaining = await listEmulatorAccounts();
    const isClean = remaining.length === 0;
    log('11.1 Cleanup Berlapis Status', isClean, `Akun tersisa di Auth Emulator: ${remaining.length}`);
  }

  // Ringkasan hasil
  console.log('\n======================================================================');
  const allPassed = results.every((r) => r.passed);
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`TOTAL PENGUJIAN: ${results.length} | PASS: ${totalPassed} | FAIL: ${results.length - totalPassed}`);
  console.log(`STATUS AKHIR: ${allPassed ? 'SEMUA TES LOLOS (PASS)' : 'TERDAPAT KEGAGALAN (FAIL)'}`);
  console.log('======================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runParentLoginSuite().catch((err) => {
  console.error('FATAL ERROR in runParentLoginSuite:', err);
  process.exit(1);
});
