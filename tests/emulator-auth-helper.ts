/**
 * BFA HUB — FIREBASE AUTH EMULATOR TEST HELPER
 * Mode: STRICT LOCAL-ONLY · SYNTHETIC DATA ONLY · NO PRODUCTION/CLOUD ACCESS
 * Target: demo-bfa-hub @ 127.0.0.1:9099
 */

import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  deleteUser, 
  updateProfile,
  getIdTokenResult,
  User,
  Auth
} from 'firebase/auth';

export const EMULATOR_PROJECT_ID = 'demo-bfa-hub';
export const EMULATOR_AUTH_HOST = '127.0.0.1';
export const EMULATOR_AUTH_PORT = 9099;
export const EMULATOR_AUTH_URL = `http://${EMULATOR_AUTH_HOST}:${EMULATOR_AUTH_PORT}`;

export type SyntheticRole = 'admin' | 'coach' | 'parent';

export interface SyntheticUserSpec {
  role: SyntheticRole;
  email: string;
  password: string;
  displayName: string;
  customClaims: Record<string, any>;
}

export interface SyntheticAuthSession {
  user: User;
  token: string;
  claims: Record<string, any>;
}

/**
 * Memvalidasi bahwa host jaringan adalah loopback lokal (127.0.0.1 atau localhost).
 * Menolak keras host kosong, ambigu, IP jaringan lain, atau domain internet eksternal.
 */
export function assertValidLoopbackHost(host: string, callerName: string = 'NetworkOperation'): void {
  if (!host || typeof host !== 'string') {
    throw new Error(`[${callerName}] FATAL: Host tidak boleh kosong atau tidak terdefinisi.`);
  }
  const cleanHost = host.trim().toLowerCase();
  if (cleanHost !== '127.0.0.1' && cleanHost !== 'localhost') {
    throw new Error(
      `[${callerName}] FATAL: Host "${host}" ditolak. ` +
      `Operasi Firebase Auth Emulator HANYA diizinkan pada loopback "127.0.0.1" atau "localhost".`
    );
  }
}

/**
 * Memvalidasi port jaringan agar berada pada rentang port TCP yang valid.
 */
export function assertValidPort(port: number, callerName: string = 'NetworkOperation'): void {
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`[${callerName}] FATAL: Port "${port}" tidak valid.`);
  }
}

/**
 * FAIL-CLOSED PREFLIGHT GUARD:
 * Memastikan pengujian HANYA berjalan pada loopback lokal dan project demo-bfa-hub.
 * Menerapkan STRICT ALLOWLIST: menolak keras setiap project ID yang tidak sama persis dengan demo-bfa-hub.
 */
export function assertEmulatorIsolationGuard(): void {
  const env = typeof process !== 'undefined' ? process.env : {};

  // 1. Strict Allowlist Project ID:
  // Seluruh variabel project lingkungan yang disetel HARUS sama persis dengan 'demo-bfa-hub'.
  const relevantProjectEnvVars = [
    'VITE_FIREBASE_PROJECT_ID',
    'FIREBASE_PROJECT',
    'GCLOUD_PROJECT',
    'GOOGLE_CLOUD_PROJECT',
  ];

  for (const varName of relevantProjectEnvVars) {
    const val = env[varName];
    if (val !== undefined && val !== null && typeof val === 'string' && val.trim() !== '') {
      if (val.trim() !== EMULATOR_PROJECT_ID) {
        throw new Error(
          `[Emulator Isolation Guard] FATAL: Variabel lingkungan "${varName}" bernilai "${val}", ` +
          `bukan project ID resmi emulator ("${EMULATOR_PROJECT_ID}"). ` +
          `Pengujian lokal dihentikan seketika untuk mencegah kebocoran cloud.`
        );
      }
    }
  }

  // 2. Cegah target env Cloud/Staging
  if (env.VITE_FIREBASE_ENV && env.VITE_FIREBASE_ENV !== 'emulator') {
    throw new Error(
      `[Emulator Isolation Guard] FATAL: VITE_FIREBASE_ENV terdeteksi "${env.VITE_FIREBASE_ENV}". ` +
      `Pengujian lokal hanya diizinkan dengan VITE_FIREBASE_ENV="emulator".`
    );
  }

  // 3. Verifikasi host loopback dari env
  const host = env.VITE_EMULATOR_HOST || EMULATOR_AUTH_HOST;
  assertValidLoopbackHost(host, 'assertEmulatorIsolationGuard');
}

/**
 * Inisialisasi Firebase App khusus pengujian Auth Emulator lokal.
 */
export function setupEmulatorAuthClient(appName: string = 'bfa-emu-auth-helper'): {
  app: FirebaseApp;
  auth: Auth;
} {
  assertEmulatorIsolationGuard();

  const app = initializeApp({
    projectId: EMULATOR_PROJECT_ID,
    apiKey: 'demo-api-key-for-emulator',
    authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
  }, appName);

  const auth = getAuth(app);
  connectAuthEmulator(auth, EMULATOR_AUTH_URL, { disableWarnings: true });

  return { app, auth };
}

/**
 * Menetapkan Custom User Claims pada Firebase Auth Emulator menggunakan REST API internal.
 * Membutuhkan header "Authorization: Bearer owner" yang didukung oleh emulator lokal.
 * Tidak memerlukan private key atau Firebase Admin SDK di frontend.
 */
export async function setEmulatorCustomClaims(
  localId: string,
  customClaims: Record<string, any>,
  host: string = EMULATOR_AUTH_HOST,
  port: number = EMULATOR_AUTH_PORT
): Promise<void> {
  assertValidLoopbackHost(host, 'setEmulatorCustomClaims');
  assertValidPort(port, 'setEmulatorCustomClaims');
  assertEmulatorIsolationGuard();

  const endpoint = `http://${host}:${port}/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key-for-emulator`;
  const payload = {
    localId,
    targetProjectId: EMULATOR_PROJECT_ID,
    customAttributes: JSON.stringify(customClaims),
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`[setEmulatorCustomClaims] Gagal menetapkan claims untuk ${localId}: ${errorBody}`);
  }
}

/**
 * Membuat pengguna sintetis di Auth Emulator dan menetapkan claims sesuai peran.
 */
export async function createSyntheticAccount(
  auth: Auth,
  spec: SyntheticUserSpec
): Promise<User> {
  assertEmulatorIsolationGuard();

  const cred = await createUserWithEmailAndPassword(auth, spec.email, spec.password);
  const user = cred.user;

  if (spec.displayName) {
    await updateProfile(user, { displayName: spec.displayName });
  }

  if (spec.customClaims && Object.keys(spec.customClaims).length > 0) {
    await setEmulatorCustomClaims(user.uid, spec.customClaims);
  }

  return user;
}

/**
 * Melakukan sign-in pengguna sintetis dan membaca kembali token serta custom claims terverifikasi.
 */
export async function signInSyntheticAccount(
  auth: Auth,
  email: string,
  password: string
): Promise<SyntheticAuthSession> {
  assertEmulatorIsolationGuard();

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // Force token refresh (true) untuk memastikan token baru memuat custom claims
  const tokenResult = await getIdTokenResult(user, true);

  return {
    user,
    token: tokenResult.token,
    claims: tokenResult.claims,
  };
}

/**
 * Sign out sesi pengguna dari Auth Emulator.
 */
export async function signOutSyntheticAccount(auth: Auth): Promise<void> {
  await signOut(auth);
}

/**
 * Menghapus akun pengguna sintetis tertentu dari Auth Emulator.
 */
export async function deleteSyntheticAccount(user: User): Promise<void> {
  await deleteUser(user);
}

/**
 * Membersihkan seluruh akun pengguna di project demo-bfa-hub pada Auth Emulator.
 */
export async function purgeAllEmulatorAccounts(
  host: string = EMULATOR_AUTH_HOST,
  port: number = EMULATOR_AUTH_PORT
): Promise<void> {
  assertValidLoopbackHost(host, 'purgeAllEmulatorAccounts');
  assertValidPort(port, 'purgeAllEmulatorAccounts');
  assertEmulatorIsolationGuard();

  const endpoint = `http://${host}:${port}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/accounts`;
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer owner',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`[purgeAllEmulatorAccounts] Gagal membersihkan akun: ${errorBody}`);
  }
}

/**
 * Mengambil daftar seluruh akun yang tersisa di Auth Emulator untuk verifikasi kebersihan (cleanup audit).
 */
export async function listEmulatorAccounts(
  host: string = EMULATOR_AUTH_HOST,
  port: number = EMULATOR_AUTH_PORT
): Promise<any[]> {
  assertValidLoopbackHost(host, 'listEmulatorAccounts');
  assertValidPort(port, 'listEmulatorAccounts');
  assertEmulatorIsolationGuard();

  const endpoint = `http://${host}:${port}/identitytoolkit.googleapis.com/v1/projects/${EMULATOR_PROJECT_ID}/accounts:query?key=demo-api-key-for-emulator`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.users || [];
}

/**
 * STANDALONE TEST RUNNER:
 * Memverifikasi pembuatan akun, klaim, login, logout, dan pembersihan untuk 3 peran:
 * 1. Admin
 * 2. Coach
 * 3. Parent
 */
export async function runAuthEmulatorVerificationSuite(): Promise<{
  allPassed: boolean;
  results: Array<{ test: string; passed: boolean; details: string }>;
}> {
  const results: Array<{ test: string; passed: boolean; details: string }> = [];
  const log = (test: string, passed: boolean, details: string) => {
    results.push({ test, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: [${test}] — ${details}`);
  };

  console.log('======================================================================');
  console.log('BFA HUB — VERIFIKASI EMULATOR AUTH HELPER (TAHAP 5B-5B)');
  console.log(`Target: ${EMULATOR_PROJECT_ID} @ ${EMULATOR_AUTH_URL}`);
  console.log('Mode: STRICT LOCAL-ONLY · SYNTHETIC USERS · ZERO PRODUCTION ACCESS');
  console.log('======================================================================\n');

  // 1. Guard Isolation Check
  try {
    assertEmulatorIsolationGuard();
    log('Preflight: Isolation Guard', true, `Target terkunci ke ${EMULATOR_PROJECT_ID} loopback ${EMULATOR_AUTH_HOST}:${EMULATOR_AUTH_PORT}`);
  } catch (err: any) {
    log('Preflight: Isolation Guard', false, err.message);
    return { allPassed: false, results };
  }

  // 2. Setup Client
  const { app, auth } = setupEmulatorAuthClient(`test-suite-${Date.now()}`);

  // Definisi Spesifikasi Akun Sintetis
  const syntheticAdmin: SyntheticUserSpec = {
    role: 'admin',
    email: 'syn-admin-2026@local.test',
    password: 'AdminPassword2026!Secure',
    displayName: 'Admin Sintetis BFA',
    customClaims: {
      role: 'admin',
      admin: true,
      staffLevel: 'superadmin',
    },
  };

  const syntheticCoach: SyntheticUserSpec = {
    role: 'coach',
    email: 'syn-coach-2026@local.test',
    password: 'CoachPassword2026!Secure',
    displayName: 'Coach Sintetis Hendra',
    customClaims: {
      role: 'coach',
      coach: true,
      coachId: 'COACH-SYN-001',
    },
  };

  const syntheticParent: SyntheticUserSpec = {
    role: 'parent',
    email: 'syn-parent-2026@local.test',
    password: 'ParentPassword2026!Secure',
    displayName: 'Wali Siswa Sintetis',
    customClaims: {
      role: 'parent',
      studentId: 'BFA-SYN-001',
      studentName: 'Andra Sintetis',
      phone: '081299990001',
    },
  };

  const createdUsers: User[] = [];

  try {
    // -------------------------------------------------------------
    // PENGUJIAN 1: PERAN ADMIN SINTETIS
    // -------------------------------------------------------------
    console.log('\n[1. Pengujian Peran Admin]');
    try {
      const adminUser = await createSyntheticAccount(auth, syntheticAdmin);
      createdUsers.push(adminUser);
      log('1.1 Create Admin User', Boolean(adminUser.uid), `UID: ${adminUser.uid}, Email: ${adminUser.email}`);
    } catch (e: any) {
      log('1.1 Create Admin User', false, e.message);
    }

    try {
      const session = await signInSyntheticAccount(auth, syntheticAdmin.email, syntheticAdmin.password);
      const hasAdminRole = session.claims.role === 'admin';
      const hasAdminFlag = session.claims.admin === true;
      const pass = hasAdminRole && hasAdminFlag;
      log('1.2 Verify Admin Token Claims', pass, `Claims: role="${session.claims.role}", admin=${session.claims.admin}`);
      await signOutSyntheticAccount(auth);
      log('1.3 Admin Sign Out', auth.currentUser === null, 'Sesi admin berhasil di-logout (auth.currentUser == null)');
    } catch (e: any) {
      log('1.2 Verify Admin Token Claims', false, e.message);
    }

    // -------------------------------------------------------------
    // PENGUJIAN 2: PERAN COACH SINTETIS
    // -------------------------------------------------------------
    console.log('\n[2. Pengujian Peran Coach]');
    try {
      const coachUser = await createSyntheticAccount(auth, syntheticCoach);
      createdUsers.push(coachUser);
      log('2.1 Create Coach User', Boolean(coachUser.uid), `UID: ${coachUser.uid}, Email: ${coachUser.email}`);
    } catch (e: any) {
      log('2.1 Create Coach User', false, e.message);
    }

    try {
      const session = await signInSyntheticAccount(auth, syntheticCoach.email, syntheticCoach.password);
      const hasCoachRole = session.claims.role === 'coach';
      const hasCoachFlag = session.claims.coach === true;
      const hasCoachId = session.claims.coachId === 'COACH-SYN-001';
      const pass = hasCoachRole && hasCoachFlag && hasCoachId;
      log('2.2 Verify Coach Token Claims', pass, `Claims: role="${session.claims.role}", coachId="${session.claims.coachId}"`);
      await signOutSyntheticAccount(auth);
      log('2.3 Coach Sign Out', auth.currentUser === null, 'Sesi coach berhasil di-logout');
    } catch (e: any) {
      log('2.2 Verify Coach Token Claims', false, e.message);
    }

    // -------------------------------------------------------------
    // PENGUJIAN 3: PERAN PARENT / SISWA SINTETIS
    // -------------------------------------------------------------
    console.log('\n[3. Pengujian Peran Parent / Siswa]');
    try {
      const parentUser = await createSyntheticAccount(auth, syntheticParent);
      createdUsers.push(parentUser);
      log('3.1 Create Parent User', Boolean(parentUser.uid), `UID: ${parentUser.uid}, Email: ${parentUser.email}`);
    } catch (e: any) {
      log('3.1 Create Parent User', false, e.message);
    }

    try {
      const session = await signInSyntheticAccount(auth, syntheticParent.email, syntheticParent.password);
      const hasParentRole = session.claims.role === 'parent';
      const hasStudentId = session.claims.studentId === 'BFA-SYN-001';
      const hasPhone = session.claims.phone === '081299990001';
      const pass = hasParentRole && hasStudentId && hasPhone;
      log('3.2 Verify Parent Token Claims', pass, `Claims: role="${session.claims.role}", studentId="${session.claims.studentId}", phone="${session.claims.phone}"`);
      await signOutSyntheticAccount(auth);
      log('3.3 Parent Sign Out', auth.currentUser === null, 'Sesi parent berhasil di-logout');
    } catch (e: any) {
      log('3.2 Verify Parent Token Claims', false, e.message);
    }

    // -------------------------------------------------------------
    // PENGUJIAN 4: ISOLASI PERAN & EVALUASI TOKEN
    // -------------------------------------------------------------
    console.log('\n[4. Verifikasi Isolasi Hak Akses Claims]');
    try {
      // Re-login Parent, buktikan token parent TIDAK memiliki claim admin atau coach
      const parentSession = await signInSyntheticAccount(auth, syntheticParent.email, syntheticParent.password);
      const parentIsNotAdmin = parentSession.claims.admin !== true && parentSession.claims.role !== 'admin';
      const parentIsNotCoach = parentSession.claims.coach !== true && parentSession.claims.role !== 'coach';
      log('4.1 Parent Claim Boundary', parentIsNotAdmin && parentIsNotCoach, 'Token parent terbukti TIDAK memiliki wewenang admin atau coach');
      await signOutSyntheticAccount(auth);

      // Re-login Coach, buktikan token coach TIDAK memiliki claim admin
      const coachSession = await signInSyntheticAccount(auth, syntheticCoach.email, syntheticCoach.password);
      const coachIsNotAdmin = coachSession.claims.admin !== true && coachSession.claims.role !== 'admin';
      log('4.2 Coach Claim Boundary', coachIsNotAdmin, 'Token coach terbukti TIDAK memiliki wewenang admin');
      await signOutSyntheticAccount(auth);
    } catch (e: any) {
      log('4.1/4.2 Claim Boundary', false, e.message);
    }

  } finally {
    // -------------------------------------------------------------
    // PEMBERSIHAN KETAT BERLAPIS (MULTI-LAYERED CLEANUP PHASE - F-03)
    // -------------------------------------------------------------
    console.log('\n[5. Pembersihan Akun Sintetis (Strict Multi-layered Cleanup)]');

    let purgeSuccess = false;
    let fallbackCleanupErrors: string[] = [];

    // Lapis 1: Penghapusan massal via endpoint emulator demo-bfa-hub
    try {
      await purgeAllEmulatorAccounts();
      purgeSuccess = true;
    } catch (purgeErr: any) {
      console.warn('[Cleanup Lapis 1] Penghapusan massal emulator gagal, mencoba fallback individual:', purgeErr?.message);
      // Lapis 2: Hapus satu per satu akun yang dibuat selama pengujian ini via SDK
      for (const user of createdUsers) {
        try {
          await deleteSyntheticAccount(user);
        } catch (delErr: any) {
          fallbackCleanupErrors.push(`Gagal menghapus akun ${user.email || user.uid}: ${delErr?.message}`);
        }
      }
    }

    // Lapis 3: Audit verifikasi akun yang tersisa di Auth Emulator
    let remainingAccounts: any[] = [];
    let auditError: string | null = null;
    try {
      remainingAccounts = await listEmulatorAccounts();
    } catch (listErr: any) {
      auditError = listErr?.message || 'Error pembacaan akun emulator';
    }

    // Evaluasi kebersihan: Tidak boleh ada akun sintetis yang tersisa
    const isClean = remainingAccounts.length === 0 && auditError === null && fallbackCleanupErrors.length === 0;
    if (isClean) {
      log(
        '5.1 Multi-layered Account Cleanup',
        true,
        `Seluruh akun sintetis berhasil dibersihkan (${purgeSuccess ? 'Metode Massal Lapis 1' : 'Metode Fallback Lapis 2'}). Sisa akun: 0`
      );
    } else {
      const details = auditError
        ? `Gagal memverifikasi kebersihan akun: ${auditError}`
        : `CLEANUP GAGAL: Masih terdapat ${remainingAccounts.length} akun tersisa di emulator (${remainingAccounts.map((a: any) => a.email).join(', ')})${fallbackCleanupErrors.length > 0 ? ` | Errors: ${fallbackCleanupErrors.join('; ')}` : ''}`;
      log('5.1 Multi-layered Account Cleanup', false, details);
    }

    try {
      await deleteApp(app);
      log('5.2 Dispose Test Firebase App', true, 'Aplikasi Firebase test berhasil ditutup.');
    } catch (appErr: any) {
      log('5.2 Dispose Test Firebase App', false, `Gagal menutup app: ${appErr?.message}`);
    }
  }

  const allPassed = results.every(r => r.passed);
  console.log('\n======================================================================');
  console.log(`STATUS AKHIR: ${results.filter(r => r.passed).length}/${results.length} Pengujian Berhasil (${allPassed ? 'SEMUA LULUS' : 'ADA KEGAGALAN'})`);
  console.log('======================================================================');

  return { allPassed, results };
}

// Auto-run jika file dieksekusi langsung
const isDirectExecution = typeof process !== 'undefined' && 
  Boolean(process.argv && process.argv[1] && (
    process.argv[1].endsWith('emulator-auth-helper.ts') || 
    process.argv[1].endsWith('emulator-auth-helper.js')
  ));

if (isDirectExecution) {
  runAuthEmulatorVerificationSuite().then(({ allPassed }) => {
    process.exit(allPassed ? 0 : 1);
  }).catch((err) => {
    console.error('Fatal suite execution error:', err);
    process.exit(1);
  });
}

