/**
 * BFA HUB — LOCAL FUNCTIONS ENDPOINT ADAPTER TEST SUITE (TAHAP 5B-7C)
 * Mode: STRICT LOCAL-ONLY · EMULATOR-ONLY · SYNTHETIC DATA ONLY · NO CLOUD/PRODUCTION
 * Target: demo-bfa-hub @ 127.0.0.1:5001 (Functions), 127.0.0.1:9099 (Auth), 127.0.0.1:8085 (Firestore)
 */

import {
  EMULATOR_PROJECT_ID,
  EMULATOR_AUTH_HOST,
  EMULATOR_AUTH_PORT,
  EMULATOR_FIRESTORE_HOST,
  EMULATOR_FIRESTORE_PORT,
  getTrustedAdminInstance,
  cleanupSyntheticBackendData,
} from './trustedBackend';
import {
  FUNCTIONS_EMULATOR_HOST,
  FUNCTIONS_EMULATOR_PORT,
  startFunctionsEndpointServer,
  assertFunctionsLoopbackGuard,
  RunningFunctionsServer,
} from './functionsEndpointAdapter';
import {
  setupEmulatorAuthClient,
  signInSyntheticAccount,
  createSyntheticAccount,
  SyntheticUserSpec,
} from '../emulator-auth-helper';

process.env.GCLOUD_PROJECT = EMULATOR_PROJECT_ID;
process.env.FIREBASE_PROJECT = EMULATOR_PROJECT_ID;
process.env.FIREBASE_AUTH_EMULATOR_HOST = `${EMULATOR_AUTH_HOST}:${EMULATOR_AUTH_PORT}`;
process.env.FIRESTORE_EMULATOR_HOST = `${EMULATOR_FIRESTORE_HOST}:${EMULATOR_FIRESTORE_PORT}`;

// Tracking untuk pembersihan sintetis
const tracker = {
  studentIds: [] as string[],
  registrationIds: [] as string[],
  authUids: [] as string[],
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const testResults: TestResult[] = [];

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    testResults.push({ name, passed: true, message: 'OK' });
    console.log(`✓ PASS: [${name}]`);
  } catch (err: any) {
    testResults.push({ name, passed: false, message: err.message || String(err) });
    console.error(`✗ FAIL: [${name}] — ${err.message}`);
  }
}

async function main() {
  console.log('======================================================================');
  console.log('BFA HUB — SUITE UJI INTEGRASI FUNCTIONS ENDPOINT LOKAL (TAHAP 5B-7C)');
  console.log(`Target Project: ${EMULATOR_PROJECT_ID}`);
  console.log(`Endpoint URL: http://${FUNCTIONS_EMULATOR_HOST}:${FUNCTIONS_EMULATOR_PORT}`);
  console.log('Mode: STRICT LOCAL-ONLY · EMULATOR-ONLY · ZERO CLOUD/PRODUCTION');
  console.log('======================================================================\n');

  // Preflight isolation check
  assertFunctionsLoopbackGuard(FUNCTIONS_EMULATOR_HOST, FUNCTIONS_EMULATOR_PORT);
  const { db, auth: adminAuth } = getTrustedAdminInstance();

  // 1. Jalankan server endpoint Functions lokal
  let functionsServer: RunningFunctionsServer;
  try {
    functionsServer = await startFunctionsEndpointServer(FUNCTIONS_EMULATOR_HOST, FUNCTIONS_EMULATOR_PORT);
    console.log(`[Functions Server] Berjalan pada ${functionsServer.url}`);
  } catch (err: any) {
    console.error('Gagal menjalankan server Functions Emulator:', err);
    process.exit(1);
  }

  // 2. Siapkan Akun Pengguna Sintetis untuk Pengujian Token Asli
  const { auth: clientAuth } = setupEmulatorAuthClient(`test-functions-runner-${Date.now()}`);

  // Akun Admin Sintetis
  const adminSpec: SyntheticUserSpec = {
    role: 'admin',
    email: `syn_admin_fn_${Date.now()}@local.test`,
    password: 'AdminPassword2026!Secure',
    displayName: 'Admin Endpoint Tester',
    customClaims: { role: 'admin', admin: true },
  };
  const adminUser = await createSyntheticAccount(clientAuth, adminSpec);
  tracker.authUids.push(adminUser.uid);
  const adminSession = await signInSyntheticAccount(clientAuth, adminSpec.email, adminSpec.password);
  const adminToken = adminSession.token;

  // Akun Coach Sintetis
  const coachSpec: SyntheticUserSpec = {
    role: 'coach',
    email: `syn_coach_fn_${Date.now()}@local.test`,
    password: 'CoachPassword2026!Secure',
    displayName: 'Coach Endpoint Tester',
    customClaims: { role: 'coach', coachId: 'COACH-SYN-501' },
  };
  const coachUser = await createSyntheticAccount(clientAuth, coachSpec);
  tracker.authUids.push(coachUser.uid);
  const coachSession = await signInSyntheticAccount(clientAuth, coachSpec.email, coachSpec.password);
  const coachToken = coachSession.token;

  // Akun Parent Sintetis
  const parentSpec: SyntheticUserSpec = {
    role: 'parent',
    email: `syn_parent_fn_${Date.now()}@local.test`,
    password: 'ParentPassword2026!Secure',
    displayName: 'Parent Endpoint Tester',
    customClaims: { role: 'parent', studentId: 'BFA-SYN-EXISTING' },
  };
  const parentUser = await createSyntheticAccount(clientAuth, parentSpec);
  tracker.authUids.push(parentUser.uid);
  const parentSession = await signInSyntheticAccount(clientAuth, parentSpec.email, parentSpec.password);
  const parentToken = parentSession.token;

  const baseEndpoint = `${functionsServer.url}/${EMULATOR_PROJECT_ID}/us-central1`;

  try {
    // -----------------------------------------------------------------------
    // TEST 1: GUARD LINGKUNGAN & HOST FUNCTIONS
    // -----------------------------------------------------------------------
    await runTest('Guard Lingkungan: Menolak port atau host selain 127.0.0.1:5001', async () => {
      let nonLoopbackCaught = false;
      try {
        assertFunctionsLoopbackGuard('192.168.1.50', 5001);
      } catch (err: any) {
        nonLoopbackCaught = true;
        assert(err.message.includes('ditolak'), 'Pesan error harus menolak host non-loopback');
      }
      assert(nonLoopbackCaught, 'Host non-loopback harus ditolak');

      let wrongPortCaught = false;
      try {
        assertFunctionsLoopbackGuard('127.0.0.1', 8080);
      } catch (err: any) {
        wrongPortCaught = true;
        assert(err.message.includes('tidak sesuai spesifikasi'), 'Pesan error harus menolak port selain 5001');
      }
      assert(wrongPortCaught, 'Port selain 5001 harus ditolak');
    });

    // -----------------------------------------------------------------------
    // TEST 2: REQUEST TANPA AUTENTIKASI DITOLAK (HTTP 401)
    // -----------------------------------------------------------------------
    await runTest('Autentikasi: Request tanpa header Authorization ditolak dengan HTTP 401', async () => {
      const resp = await fetch(`${baseEndpoint}/approveStudentAndProvisionAuth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: 'BFA-SYN-X', registrationId: 'REG-SYN-X' }),
      });

      assert(resp.status === 401, `Status harus 401, didapat ${resp.status}`);
      const body = await resp.json();
      assert(body.error?.code === 'UNAUTHENTICATED', 'Error code harus UNAUTHENTICATED');
    });

    // -----------------------------------------------------------------------
    // TEST 3: TOKEN PALSU / RUSAK DITOLAK (HTTP 401)
    // -----------------------------------------------------------------------
    await runTest('Autentikasi: Request dengan token palsu atau rusak ditolak dengan HTTP 401', async () => {
      const resp = await fetch(`${baseEndpoint}/approveStudentAndProvisionAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-invalid-token-string-xyz',
        },
        body: JSON.stringify({ studentId: 'BFA-SYN-X', registrationId: 'REG-SYN-X' }),
      });

      assert(resp.status === 401, `Status harus 401, didapat ${resp.status}`);
      const body = await resp.json();
      assert(body.error?.code === 'INVALID_TOKEN', 'Error code harus INVALID_TOKEN');
    });

    // -----------------------------------------------------------------------
    // TEST 4: OTORISASI NON-ADMIN (COACH) DITOLAK (HTTP 403)
    // -----------------------------------------------------------------------
    await runTest('Otorisasi: Token sah peran Coach ditolak dengan HTTP 403 PERMISSION_DENIED', async () => {
      const resp = await fetch(`${baseEndpoint}/approveStudentAndProvisionAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${coachToken}`,
        },
        body: JSON.stringify({ studentId: 'BFA-SYN-X', registrationId: 'REG-SYN-X' }),
      });

      assert(resp.status === 403, `Status harus 403, didapat ${resp.status}`);
      const body = await resp.json();
      assert(body.error?.code === 'PERMISSION_DENIED', 'Error code harus PERMISSION_DENIED');
    });

    // -----------------------------------------------------------------------
    // TEST 5: OTORISASI NON-ADMIN (PARENT) DITOLAK (HTTP 403)
    // -----------------------------------------------------------------------
    await runTest('Otorisasi: Token sah peran Parent ditolak dengan HTTP 403 PERMISSION_DENIED', async () => {
      const resp = await fetch(`${baseEndpoint}/approveStudentAndProvisionAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parentToken}`,
        },
        body: JSON.stringify({ studentId: 'BFA-SYN-X', registrationId: 'REG-SYN-X' }),
      });

      assert(resp.status === 403, `Status harus 403, didapat ${resp.status}`);
      const body = await resp.json();
      assert(body.error?.code === 'PERMISSION_DENIED', 'Error code harus PERMISSION_DENIED');
    });

    // -----------------------------------------------------------------------
    // TEST 6: PENOLAKAN SPOOFING PAYLOAD DI SISI CLIENT
    // -----------------------------------------------------------------------
    await runTest('Keamanan: Klaim admin di body request ditolak jika token milik akun non-admin', async () => {
      const resp = await fetch(`${baseEndpoint}/approveStudentAndProvisionAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${coachToken}`, // Token Coach
        },
        // Mencoba memalsukan wewenang admin melalui body request
        body: JSON.stringify({
          role: 'admin',
          isAdmin: true,
          adminContext: { role: 'admin', uid: 'spoofed_admin' },
          studentId: 'BFA-SYN-X',
          registrationId: 'REG-SYN-X',
        }),
      });

      assert(resp.status === 403, `Status harus 403, didapat ${resp.status}`);
      const body = await resp.json();
      assert(body.error?.code === 'PERMISSION_DENIED', 'Server harus menolak spoofing payload client');
    });

    // -----------------------------------------------------------------------
    // TEST 7: PERSETUJUAN PENDAFTARAN VALID OLEH ADMIN VIA HTTP
    // -----------------------------------------------------------------------
    const studentIdHttp1 = `BFA-SYN-HTTP-01`;
    const regIdHttp1 = `reg_syn_http_01_${Date.now()}`;

    await runTest('Persetujuan Sukses via HTTP: Endpoint memproses approval & provisioning', async () => {
      // Buat pendaftaran menunggu-verifikasi di Firestore
      await db.collection('registrations').doc(regIdHttp1).set({
        id: regIdHttp1,
        studentId: studentIdHttp1,
        studentName: 'Zaki HTTP Sintetis',
        parentName: 'Ibu Zaki',
        parentPhone: '081299997771',
        parentId: 'parent_zaki_fam',
        status: 'menunggu-verifikasi',
        submittedAt: Date.now(),
      });
      tracker.registrationIds.push(regIdHttp1);
      tracker.studentIds.push(studentIdHttp1);

      // Panggil endpoint dengan format Callable payload ({ data: { ... } })
      const resp = await fetch(`${baseEndpoint}/approveStudentAndProvisionAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          data: {
            studentId: studentIdHttp1,
            registrationId: regIdHttp1,
          },
        }),
      });

      assert(resp.status === 200, `Status harus 200, didapat ${resp.status}`);
      const body = await resp.json();
      assert(body.result?.success === true, 'Persetujuan harus sukses');
      assert(body.result?.status === 'SUCCESS_PROVISIONED', 'Status harus SUCCESS_PROVISIONED');
      assert(Boolean(body.result?.authUid), 'authUid harus ada');
      tracker.authUids.push(body.result.authUid);

      // Verifikasi di Firestore
      const sDoc = await db.collection('students').doc(studentIdHttp1).get();
      assert(sDoc.exists && sDoc.data()?.status === 'aktif', 'Siswa harus berstatus aktif di Firestore');
    });

    // -----------------------------------------------------------------------
    // TEST 8: IDEMPOTENSI VIA HTTP — PANGGILAN BERULANG AMAN
    // -----------------------------------------------------------------------
    await runTest('Idempotensi via HTTP: Panggilan ulang mengembalikan status ALREADY_APPROVED', async () => {
      const resp = await fetch(`${baseEndpoint}/approveStudentAndProvisionAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          studentId: studentIdHttp1,
          registrationId: regIdHttp1,
        }),
      });

      assert(resp.status === 200, `Status harus 200, didapat ${resp.status}`);
      const body = await resp.json();
      assert(body.result?.status === 'ALREADY_APPROVED', 'Status harus ALREADY_APPROVED');
      assert(body.result?.isNewAccount === false, 'Tidak boleh membuat akun ganda');
    });

    // -----------------------------------------------------------------------
    // TEST 9: KEGAGALAN REGISTRASI (STATUS DITOLAK & ID PALSU)
    // -----------------------------------------------------------------------
    await runTest('Validasi HTTP: Menolak pendaftaran status rejected dan pendaftaran tak ditemukan', async () => {
      // 9a. Pendaftaran tidak ada
      const respNotFound = await fetch(`${baseEndpoint}/approveStudentAndProvisionAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          studentId: 'BFA-SYN-NONE',
          registrationId: 'REG-NOT-EXISTING',
        }),
      });
      assert(respNotFound.status === 404, `Status harus 404, didapat ${respNotFound.status}`);

      // 9b. Pendaftaran ditolak
      const rejId = `reg_syn_http_rej_${Date.now()}`;
      const rejStudent = `BFA-SYN-HTTP-REJ`;
      await db.collection('registrations').doc(rejId).set({
        id: rejId,
        studentId: rejStudent,
        studentName: 'Siswa Rej HTTP',
        parentName: 'Wali Rej',
        parentPhone: '081299997772',
        status: 'rejected',
        submittedAt: Date.now(),
      });
      tracker.registrationIds.push(rejId);
      tracker.studentIds.push(rejStudent);

      const respRejected = await fetch(`${baseEndpoint}/approveStudentAndProvisionAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          studentId: rejStudent,
          registrationId: rejId,
        }),
      });
      assert(respRejected.status === 400, `Status harus 400, didapat ${respRejected.status}`);
    });

    // -----------------------------------------------------------------------
    // TEST 10: RESET PASSWORD OLEH ADMIN VIA HTTP
    // -----------------------------------------------------------------------
    await runTest('Reset Sandi via HTTP: Admin berhasil mereset password siswa terdaftar', async () => {
      const resp = await fetch(`${baseEndpoint}/resetStudentPasswordByAdmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          studentId: studentIdHttp1,
        }),
      });

      assert(resp.status === 200, `Status harus 200, didapat ${resp.status}`);
      const body = await resp.json();
      assert(body.result?.success === true, 'Reset password harus sukses');
      assert(body.result?.resetQueued === true, 'Event reset harus diantrekan');

      // Verifikasi Dokumen Antrean: Kata sandi TIDAK PERNAH disimpan
      const qDocs = await db.collection('activationQueue')
        .where('studentId', '==', studentIdHttp1)
        .where('type', '==', 'password_reset')
        .get();
      assert(qDocs.size > 0, 'Event reset harus ada di antrean');
      assert(qDocs.docs[0].data().password === undefined, 'KEAMANAN: Password tidak boleh disimpan di antrean');
    });

    // -----------------------------------------------------------------------
    // TEST 11: RATE LIMITING RESET PASSWORD VIA HTTP
    // -----------------------------------------------------------------------
    await runTest('Rate Limiting via HTTP: Menolak reset password berulang kali (HTTP 429)', async () => {
      // Kirim beberapa permintaan reset sekaligus hingga melebihi ambang batas
      let got429 = false;
      for (let i = 0; i < 4; i++) {
        const resp = await fetch(`${baseEndpoint}/resetStudentPasswordByAdmin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            studentId: studentIdHttp1,
          }),
        });

        if (resp.status === 429) {
          got429 = true;
          const body = await resp.json();
          assert(body.error?.code === 'RESOURCE_EXHAUSTED', 'Error code harus RESOURCE_EXHAUSTED');
          break;
        }
      }
      assert(got429, 'Rate limit harus terpicu dan menghasilkan HTTP 429');
    });

    // -----------------------------------------------------------------------
    // TEST 12: TOKEN REVOCATION SETELAH revokeRefreshTokens
    // -----------------------------------------------------------------------
    await runTest('Token Revocation: Token admin ditolak (HTTP 401) setelah refresh token dicabut di server', async () => {
      // Cabut refresh tokens admin via Firebase Admin SDK
      await adminAuth.revokeRefreshTokens(adminUser.uid);

      const resp = await fetch(`${baseEndpoint}/resetStudentPasswordByAdmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          studentId: studentIdHttp1,
        }),
      });

      assert(resp.status === 401, `Status harus 401 setelah revokasi, didapat ${resp.status}`);
      const body = await resp.json();
      assert(body.error?.code === 'INVALID_TOKEN', 'Error code harus INVALID_TOKEN akibat revokasi');
    });

    // -----------------------------------------------------------------------
    // TEST 13: CLEANUP BERLAPIS & VERIFIKASI ZERO RESIDUAL ACCOUNTS
    // -----------------------------------------------------------------------
    await runTest('Cleanup Berlapis: Membersihkan seluruh data sintetis & memverifikasi 0 residual akun', async () => {
      const cleanupReport = await cleanupSyntheticBackendData(
        tracker.studentIds,
        tracker.registrationIds,
        tracker.authUids
      );

      console.log(`[CLEANUP AUDIT] Siswa dihapus: ${cleanupReport.deletedStudents}`);
      console.log(`[CLEANUP AUDIT] Registrasi dihapus: ${cleanupReport.deletedRegistrations}`);
      console.log(`[CLEANUP AUDIT] Auth users dihapus: ${cleanupReport.deletedAuthUsers}`);
      console.log(`[CLEANUP AUDIT] Sisa akun di Auth Emulator: ${cleanupReport.remainingAuthUsersCount}`);

      assert(cleanupReport.remainingAuthUsersCount === 0, `Sisa akun di Auth Emulator HARUS 0, didapat ${cleanupReport.remainingAuthUsersCount}`);
    });

  } finally {
    // 3. Matikan server endpoint Functions lokal
    await functionsServer.close();
    console.log('[Functions Server] Server lokal ditutup.');
  }

  // -------------------------------------------------------------------------
  // RINGKASAN AKHIR
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('RINGKASAN HASIL TEST SUITE FUNCTIONS ENDPOINT LOKAL:');
  const allPassed = testResults.every(r => r.passed);
  console.log(`Total: ${testResults.length} | PASS: ${testResults.filter(r => r.passed).length} | FAIL: ${testResults.filter(r => !r.passed).length}`);
  console.log(`Status Keseluruhan: ${allPassed ? '✓ SEMUA PENGUJIAN LULUS (ALL PASSED)' : '✗ TERDAPAT PENGUJIAN GAGAL'}`);
  console.log('======================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal unhandled error in test suite:', err);
  process.exit(1);
});
