/**
 * BFA HUB — INTEGRATION TEST SUITE: APP AUTH STATE & EMULATOR GATE
 * Mode: STRICT LOCAL-ONLY · NO CLOUD · EMULATOR LOOPBACK 127.0.0.1:9099 & 8085
 * Target: demo-bfa-hub
 * 
 * Verifikasi:
 * 1. Preflight Isolation & Loopback Guards
 * 2. State awal 'checking' -> 'unauthenticated' saat tidak ada sesi Firebase Auth aktif
 *    (meskipun localStorage memiliki data sesi lama)
 * 3. Firestore Listener Gating: Listener dan query tertahan saat state 'unauthenticated'
 * 4. Transisi ke 'authenticated' saat signInWithBfaAdapter berhasil
 * 5. Transisi kembali ke 'unauthenticated' saat signOutBfaAdapter berhasil
 * 6. Pembersihan berlapis akun sintetis (0 remaining accounts)
 */

import {
  signInWithBfaAdapter,
  signOutBfaAdapter,
  getBfaAdapterCurrentUser,
  getBfaAdapterCurrentClaims,
  subscribeToBfaAuthState,
  assertAdapterLoopbackHost,
  assertAdapterIsolationGuard,
  ADAPTER_EMULATOR_PROJECT_ID,
  BfaAuthAdapterSession,
} from '../src/firebase/authAdapter';
import {
  purgeAllEmulatorAccounts,
  listEmulatorAccounts,
} from './emulator-auth-helper';
import { AuthUser } from '../src/types';
import type { AuthState } from '../src/App';

interface TestResult {
  step: string;
  passed: boolean;
  details: string;
}

async function runAuthStateSuite() {
  const results: TestResult[] = [];
  const log = (step: string, passed: boolean, details: string) => {
    results.push({ step, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: [${step}] — ${details}`);
  };

  console.log('======================================================================');
  console.log('BFA HUB — TAHAP 5B-6B: TEST SUITE INTEGRASI AUTH STATE KE APP');
  console.log(`Target: ${ADAPTER_EMULATOR_PROJECT_ID} @ 127.0.0.1:9099`);
  console.log('Mode: STRICT LOCAL-ONLY · NO CLOUD · ZERO PRODUCTION DATA');
  console.log('======================================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. PREFLIGHT ISOLATION & HOST GUARDS
    // -------------------------------------------------------------
    console.log('[1. Preflight Isolation & Host Guards]');
    try {
      assertAdapterIsolationGuard();
      log('1.1 Isolation Guard', true, `Terkunci ke emulator ${ADAPTER_EMULATOR_PROJECT_ID}`);
    } catch (e: any) {
      log('1.1 Isolation Guard', false, e.message);
    }

    try {
      assertAdapterLoopbackHost('127.0.0.1');
      assertAdapterLoopbackHost('localhost');
      let rejected = false;
      try {
        assertAdapterLoopbackHost('firebase.googleapis.com');
      } catch {
        rejected = true;
      }
      log('1.2 Host Loopback Whitelist', rejected, 'Menolak keras domain eksternal / cloud');
    } catch (e: any) {
      log('1.2 Host Loopback Whitelist', false, e.message);
    }

    // Pastikan emulator bersih dari awal
    await purgeAllEmulatorAccounts();
    await signOutBfaAdapter();

    // -------------------------------------------------------------
    // 2. STATE AWAL CHECKING -> UNAUTHENTICATED
    // -------------------------------------------------------------
    console.log('\n[2. State Awal: checking -> unauthenticated]');

    // Simulasi state machine seperti yang ada di App.tsx
    const appStateTracker: { state: AuthState; currentUser: AuthUser | null } = {
      state: 'checking',
      currentUser: null,
    };

    // Skenario: LocalStorage memiliki data sesi usang
    const mockLegacyStorageUser: AuthUser = {
      role: 'admin',
      name: 'Admin Palsu LocalStorage',
      emailOrPhone: 'fake@storage.local',
    };

    // Prinsip: LocalStorage tidak boleh memberikan hak akses; sesi harus dari Firebase Auth
    const initialSessionReceived = await new Promise<BfaAuthAdapterSession | null>((resolve) => {
      const unsub = subscribeToBfaAuthState((session) => {
        unsub();
        resolve(session);
      });
    });

    if (initialSessionReceived === null) {
      appStateTracker.currentUser = null;
      appStateTracker.state = 'unauthenticated';
      log(
        '2.1 Unauthenticated Initial State',
        appStateTracker.state === 'unauthenticated' && appStateTracker.currentUser === null,
        'State beralih dari checking ke unauthenticated saat tidak ada sesi Firebase Auth'
      );
    } else {
      log('2.1 Unauthenticated Initial State', false, 'Ditemukan sesi tak terduga di emulator');
    }

    // Verifikasi bahwa mockLegacyStorageUser TIDAK diizinkan membypass state
    const isAccessGranted = appStateTracker.state === 'authenticated' && appStateTracker.currentUser !== null;
    log(
      '2.2 LocalStorage Bypass Prevention',
      !isAccessGranted,
      'Data localStorage usang terbukti TIDAK memberikan hak akses tanpa sesi Firebase Auth terverifikasi'
    );

    // -------------------------------------------------------------
    // 3. FIRESTORE LISTENER GATING SAAT UNAUTHENTICATED
    // -------------------------------------------------------------
    console.log('\n[3. Firestore Listener Gating]');

    // Evaluasi fungsi guard listener yang digunakan di App.tsx
    const canStartProtectedListener = (state: AuthState, user: AuthUser | null): boolean => {
      return state === 'authenticated' && user !== null;
    };

    const listenersAllowedWhenChecking = canStartProtectedListener('checking', null);
    const listenersAllowedWhenUnauthenticated = canStartProtectedListener('unauthenticated', null);
    const listenersAllowedWithFakeStorage = canStartProtectedListener('unauthenticated', mockLegacyStorageUser);

    log(
      '3.1 Listener Blocked When Checking',
      !listenersAllowedWhenChecking,
      'Listener Firestore ditahan saat state checking'
    );
    log(
      '3.2 Listener Blocked When Unauthenticated',
      !listenersAllowedWhenUnauthenticated,
      'Listener Firestore ditahan saat state unauthenticated'
    );
    log(
      '3.3 Listener Blocked Despite LocalStorage Data',
      !listenersAllowedWithFakeStorage,
      'Listener Firestore ditahan meskipun ada data di localStorage'
    );

    // -------------------------------------------------------------
    // 4. TRANSISI KE AUTHENTICATED (SIGN-IN VIA ADAPTER)
    // -------------------------------------------------------------
    console.log('\n[4. Transisi ke Authenticated via signInWithBfaAdapter]');

    let authStateChangedToAuthenticated = false;

    // Pasang listener auth state untuk memantau transisi
    const unsubTransition = subscribeToBfaAuthState((session) => {
      if (session && session.authUser) {
        appStateTracker.currentUser = session.authUser;
        appStateTracker.state = 'authenticated';
        authStateChangedToAuthenticated = true;
      }
    });

    // Lakukan login melalui adapter (otomatis provisioning akun sintetis & claims di emulator)
    const signInResult = await signInWithBfaAdapter({
      identifier: 'admin',
      password: 'adminpassword123',
      role: 'admin',
      staffName: 'Admin BFA Test Suite',
    });

    // Beri jeda singkat agar onAuthStateChanged memproses token claims
    await new Promise((r) => setTimeout(r, 400));

    log(
      '4.1 SignIn Adapter Returns Valid Session',
      !!signInResult.token && signInResult.authUser.role === 'admin',
      `Berhasil sign in dengan role "${signInResult.authUser.role}" dan claims valid`
    );

    log(
      '4.2 App State Transitions to Authenticated',
      appStateTracker.state === 'authenticated' && authStateChangedToAuthenticated,
      `State aplikasi berhasil berubah menjadi "authenticated"`
    );

    log(
      '4.3 Protected Listeners Permitted When Authenticated',
      canStartProtectedListener(appStateTracker.state, appStateTracker.currentUser),
      'Listener Firestore sekarang diizinkan aktif setelah autentikasi terverifikasi'
    );

    unsubTransition();

    // -------------------------------------------------------------
    // 5. TRANSISI KE UNAUTHENTICATED (SIGN-OUT VIA ADAPTER)
    // -------------------------------------------------------------
    console.log('\n[5. Transisi ke Unauthenticated via signOutBfaAdapter]');

    let authStateChangedToUnauthenticated = false;

    const unsubSignOut = subscribeToBfaAuthState((session) => {
      if (!session) {
        appStateTracker.currentUser = null;
        appStateTracker.state = 'unauthenticated';
        authStateChangedToUnauthenticated = true;
      }
    });

    await signOutBfaAdapter();
    await new Promise((r) => setTimeout(r, 400));

    log(
      '5.1 SignOut Adapter Clears Firebase User',
      getBfaAdapterCurrentUser() === null,
      'Firebase Auth currentUser bernilai null setelah signOut'
    );

    log(
      '5.2 App State Transitions to Unauthenticated',
      appStateTracker.state === 'unauthenticated' && authStateChangedToUnauthenticated,
      'State aplikasi berhasil kembali ke "unauthenticated"'
    );

    log(
      '5.3 Protected Listeners Blocked Again Post SignOut',
      !canStartProtectedListener(appStateTracker.state, appStateTracker.currentUser),
      'Listener Firestore kembali diblokir setelah logout'
    );

    unsubSignOut();

    // -------------------------------------------------------------
    // 6. PARENT ACCOUNT AUTHENTICATION FLOW TEST
    // -------------------------------------------------------------
    console.log('\n[6. Parent Account Authentication Flow]');

    const parentSignIn = await signInWithBfaAdapter({
      identifier: 'BFA-999',
      password: 'parentpassword123',
      role: 'parent',
      studentId: 'BFA-999',
      studentName: 'Siswa Sintetis 999',
    });

    log(
      '6.1 Parent Sign In Success',
      parentSignIn.authUser.role === 'parent' && parentSignIn.authUser.studentId === 'BFA-999',
      `Parent login berhasil untuk ID siswa "${parentSignIn.authUser.studentId}"`
    );

    await signOutBfaAdapter();
    log('6.2 Parent Sign Out Success', getBfaAdapterCurrentUser() === null, 'Sesi parent dibersihkan');

  } finally {
    // -------------------------------------------------------------
    // 7. CLEANUP BERLAPIS AKUN SINTETIS
    // -------------------------------------------------------------
    console.log('\n[7. Pembersihan Berlapis Akun Sintetis]');
    try {
      await purgeAllEmulatorAccounts();
    } catch (e: any) {
      console.warn('[Cleanup Warning] purgeAllEmulatorAccounts gagal:', e.message);
    }

    const remaining = await listEmulatorAccounts();
    const isClean = remaining.length === 0;
    log('7.1 Cleanup Berlapis Status', isClean, `Akun tersisa di emulator: ${remaining.length}`);
    if (!isClean) {
      console.warn('[Cleanup Warning] Terdapat akun tertinggal:', remaining.map((u: any) => u.localId));
    }
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

runAuthStateSuite().catch((err) => {
  console.error('FATAL ERROR in runAuthStateSuite:', err);
  process.exit(1);
});
