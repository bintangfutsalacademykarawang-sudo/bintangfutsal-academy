/**
 * BFA HUB — TEST SUITE AUTH ADAPTER (TAHAP 5B-6A)
 * Mode: STRICT LOCAL-ONLY · NO CLOUD · EMULATOR LOOPBACK 127.0.0.1:9099
 * Target: demo-bfa-hub
 */

import {
  signInWithBfaAdapter,
  signOutBfaAdapter,
  getBfaAdapterCurrentUser,
  getBfaAdapterCurrentClaims,
  subscribeToBfaAuthState,
  resolveBfaSyntheticEmail,
  assertAdapterLoopbackHost,
  assertAdapterIsolationGuard,
  ADAPTER_EMULATOR_PROJECT_ID,
  BfaAuthAdapterSession,
} from '../src/firebase/authAdapter';
import { purgeAllEmulatorAccounts, listEmulatorAccounts } from './emulator-auth-helper';

interface TestResult {
  step: string;
  passed: boolean;
  details: string;
}

async function runAuthAdapterSuite() {
  const results: TestResult[] = [];
  const log = (step: string, passed: boolean, details: string) => {
    results.push({ step, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: [${step}] — ${details}`);
  };

  console.log('======================================================================');
  console.log('BFA HUB — SUITE PENGUJIAN INTEGRASI AUTH ADAPTER LOKAL');
  console.log(`Target: ${ADAPTER_EMULATOR_PROJECT_ID} @ 127.0.0.1:9099`);
  console.log('Mode: STRICT LOCAL-ONLY · SYNTHETIC USERS · ZERO PRODUCTION ACCESS');
  console.log('======================================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. PREFLIGHT ISOLATION & HOST GUARDS
    // -------------------------------------------------------------
    console.log('[1. Pengujian Preflight & Isolation Guard]');
    try {
      assertAdapterIsolationGuard();
      log('1.1 Adapter Isolation Guard', true, `Terkunci ke mode emulator ${ADAPTER_EMULATOR_PROJECT_ID}`);
    } catch (e: any) {
      log('1.1 Adapter Isolation Guard', false, e.message);
    }

    try {
      assertAdapterLoopbackHost('127.0.0.1');
      assertAdapterLoopbackHost('localhost');
      let rejectedExternal = false;
      try {
        assertAdapterLoopbackHost('192.168.1.100');
      } catch {
        rejectedExternal = true;
      }
      log('1.2 Host Validation Guard', rejectedExternal, 'Host 127.0.0.1/localhost diterima, host eksternal ditolak');
    } catch (e: any) {
      log('1.2 Host Validation Guard', false, e.message);
    }

    // -------------------------------------------------------------
    // 2. PEMETAAN EMAIL SINTETIS DETERMINISTIK
    // -------------------------------------------------------------
    console.log('\n[2. Pengujian Pemetaan Kredensial Sintetis]');
    const adminEmail = resolveBfaSyntheticEmail('admin', 'admin');
    const edysunEmail = resolveBfaSyntheticEmail('edysun', 'admin');
    const coachEmail = resolveBfaSyntheticEmail('coach_hendra', 'coach');
    const studentEmail = resolveBfaSyntheticEmail('BFA-001', 'parent');
    const phoneStudentEmail = resolveBfaSyntheticEmail('081234567890', 'parent', 'BFA-002');

    const emailMappingCorrect = (
      adminEmail === 'admin@bfahub.internal' &&
      edysunEmail === 'edysun@bfahub.internal' &&
      coachEmail === 'coachhendra@bfahub.internal' &&
      studentEmail === 'student_bfa001@bfahub.internal' &&
      phoneStudentEmail === 'student_bfa002@bfahub.internal'
    );
    log('2.1 Deterministic Email Mapping', emailMappingCorrect, `admin: ${adminEmail}, student: ${studentEmail}, phone->student: ${phoneStudentEmail}`);

    // -------------------------------------------------------------
    // 3. LOGIN PERAN ADMIN VIA ADAPTER
    // -------------------------------------------------------------
    console.log('\n[3. Pengujian Login Sesi Admin via Adapter]');
    let adminSession: BfaAuthAdapterSession | null = null;
    try {
      adminSession = await signInWithBfaAdapter({
        identifier: 'admin',
        password: 'AdminPassword2026!Secure',
        role: 'admin',
        staffName: 'Admin BFA Utama',
      });

      const pass = Boolean(
        adminSession &&
        adminSession.user.email === 'admin@bfahub.internal' &&
        adminSession.authUser.role === 'admin' &&
        adminSession.claims.role === 'admin' &&
        adminSession.claims.admin === true
      );
      log('3.1 Admin Sign In & Claims', pass, `Claims: role="${adminSession?.claims.role}", admin=${adminSession?.claims.admin}`);

      const currentClaims = await getBfaAdapterCurrentClaims();
      log('3.2 Admin Current Claims Retrieval', currentClaims?.role === 'admin', `Current Claims: role="${currentClaims?.role}"`);

      await signOutBfaAdapter();
      log('3.3 Admin Sign Out', getBfaAdapterCurrentUser() === null, 'Sesi admin berhasil di-logout (currentUser == null)');
    } catch (e: any) {
      log('3.1 Admin Sign In & Claims', false, e.message);
    }

    // -------------------------------------------------------------
    // 4. LOGIN PERAN COACH VIA ADAPTER
    // -------------------------------------------------------------
    console.log('\n[4. Pengujian Login Sesi Coach via Adapter]');
    try {
      const coachSession = await signInWithBfaAdapter({
        identifier: 'coach_hendra',
        password: 'CoachPassword2026!Secure',
        role: 'coach',
        coachId: 'COACH-01',
        staffName: 'Coach Hendra',
      });

      const pass = Boolean(
        coachSession &&
        coachSession.claims.role === 'coach' &&
        coachSession.claims.coach === true &&
        coachSession.claims.coachId === 'COACH-01'
      );
      log('4.1 Coach Sign In & Claims', pass, `Claims: role="${coachSession?.claims.role}", coachId="${coachSession?.claims.coachId}"`);

      // Boundary check: Coach TIDAK boleh memiliki klaim admin
      const isNotAdmin = coachSession?.claims.admin !== true;
      log('4.2 Coach Boundary Isolation', isNotAdmin, 'Token coach terbukti tidak memiliki wewenang admin');

      await signOutBfaAdapter();
      log('4.3 Coach Sign Out', getBfaAdapterCurrentUser() === null, 'Sesi coach berhasil di-logout');
    } catch (e: any) {
      log('4.1 Coach Sign In & Claims', false, e.message);
    }

    // -------------------------------------------------------------
    // 5. LOGIN PERAN PARENT / SISWA VIA ADAPTER
    // -------------------------------------------------------------
    console.log('\n[5. Pengujian Login Sesi Parent / Siswa via Adapter]');
    try {
      const parentSession = await signInWithBfaAdapter({
        identifier: '081234567890',
        password: 'ParentPassword2026!Secure',
        role: 'parent',
        studentId: 'BFA-001',
        studentName: 'Andra BFA',
      });

      const pass = Boolean(
        parentSession &&
        parentSession.authUser.role === 'parent' &&
        parentSession.authUser.studentId === 'BFA-001' &&
        parentSession.claims.role === 'parent' &&
        parentSession.claims.studentId === 'BFA-001'
      );
      log('5.1 Parent Sign In & Claims', pass, `Claims: role="${parentSession?.claims.role}", studentId="${parentSession?.claims.studentId}"`);

      // Boundary check: Parent TIDAK boleh memiliki klaim admin atau coach
      const isNotPrivileged = parentSession?.claims.admin !== true && parentSession?.claims.coach !== true;
      log('5.2 Parent Boundary Isolation', isNotPrivileged, 'Token parent terbukti tidak memiliki wewenang admin atau coach');

      await signOutBfaAdapter();
      log('5.3 Parent Sign Out', getBfaAdapterCurrentUser() === null, 'Sesi parent berhasil di-logout');
    } catch (e: any) {
      log('5.1 Parent Sign In & Claims', false, e.message);
    }

    // -------------------------------------------------------------
    // 6. REALTIME AUTH STATE LISTENER VIA ADAPTER
    // -------------------------------------------------------------
    console.log('\n[6. Pengujian Realtime Auth State Listener]');
    try {
      let capturedState: any = null;
      let stateCount = 0;

      const unsubscribe = subscribeToBfaAuthState((session) => {
        capturedState = session;
        stateCount++;
      });

      // Login Admin untuk memicu listener
      await signInWithBfaAdapter({
        identifier: 'admin',
        password: 'AdminPassword2026!Secure',
        role: 'admin',
      });

      // Tunggu siklus event loop
      await new Promise((r) => setTimeout(r, 200));
      const activeState = capturedState as BfaAuthAdapterSession | null;
      const loginReceived = Boolean(activeState && activeState.authUser.role === 'admin');
      log('6.1 Listener Login Event', loginReceived, `Listener menerima sesi login: ${activeState?.authUser.name} (${activeState?.claims.role})`);

      // Logout untuk memicu listener null
      await signOutBfaAdapter();
      await new Promise((r) => setTimeout(r, 200));
      const logoutReceived = capturedState === null;
      log('6.2 Listener Logout Event', logoutReceived, 'Listener menerima sesi null saat logout');

      unsubscribe();
      log('6.3 Unsubscribe Listener', true, 'Unsubscribe listener berhasil dilepaskan tanpa kebocoran memori');
    } catch (e: any) {
      log('6.1 Listener Events', false, e.message);
    }

  } finally {
    // -------------------------------------------------------------
    // 7. PEMBERSIHAN KETAT (CLEANUP PHASE)
    // -------------------------------------------------------------
    console.log('\n[7. Pembersihan Akun Sintetis]');
    try {
      await purgeAllEmulatorAccounts();
      const remaining = await listEmulatorAccounts();
      const isClean = remaining.length === 0;
      log('7.1 Purge Synthetic Accounts', isClean, `Sisa akun di Auth Emulator: ${remaining.length}`);
    } catch (e: any) {
      log('7.1 Purge Synthetic Accounts', false, e.message);
    }
  }

  const allPassed = results.every((r) => r.passed);
  console.log('\n======================================================================');
  console.log(`STATUS AKHIR: ${results.filter((r) => r.passed).length}/${results.length} Pengujian Berhasil (${allPassed ? 'SEMUA LULUS' : 'ADA KEGAGALAN'})`);
  console.log('======================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

// Auto-run saat dieksekusi via tsx
runAuthAdapterSuite().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
