/**
 * BFA HUB — UNIT & SECURITY TEST SUITE: PARENT CUSTOM TOKEN HARDENING
 * Mode: SECURITY VERIFICATION · FAIL-CLOSED · PRODUCTION READINESS
 */

import { 
  TrustedBackendService, 
  InMemoryBackendStore 
} from '../src/server/trustedBackendService';
import { signOutBfaAdapter, getBfaAdapterCurrentUser } from '../src/firebase/authAdapter';
import admin from 'firebase-admin';

async function runHardeningTestSuite() {
  console.log('======================================================================');
  console.log('BFA HUB — SUITE PENGUJIAN HARDENING CUSTOM TOKEN PARENT PRODUCTION');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${desc} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  const store = new InMemoryBackendStore();
  const service = new TrustedBackendService(store, 'staging');

  // Register two siblings under phone 081299990001
  const child1 = await service.registerStudentAndIncrementCounter({
    name: 'Anak Pertama Hardening',
    birthPlace: 'Karawang',
    birthDate: '2015-05-01',
    gender: 'L',
    parentName: 'Ibu Pertiwi',
    phone: '081299990001',
    classGroupId: 'U11',
    jerseyNumber: 10,
  }, 'admin');

  const child2 = await service.registerStudentAndIncrementCounter({
    name: 'Anak Kedua Hardening',
    birthPlace: 'Karawang',
    birthDate: '2017-08-10',
    gender: 'P',
    parentName: 'Ibu Pertiwi',
    phone: '081299990001',
    classGroupId: 'U9',
    jerseyNumber: 11,
  }, 'admin');

  // Register an unrelated child under phone 081288880002
  const unrelatedChild = await service.registerStudentAndIncrementCounter({
    name: 'Anak Keluarga Lain',
    birthPlace: 'Bandung',
    birthDate: '2016-02-02',
    gender: 'L',
    parentName: 'Bpk. Tetangga',
    phone: '081288880002',
    classGroupId: 'U10',
    jerseyNumber: 12,
  }, 'admin');

  // ------------------------------------------------------------------
  // 1. Sibling Switching & Hak Akses Saudara
  // ------------------------------------------------------------------
  console.log('--- 1. Pengujian Sibling Switching & Klaim StudentId ---');

  // Token untuk Anak 1
  const resChild1 = await service.authenticateParentAndIssueToken({
    phone: '081299990001',
    studentId: child1.student.id,
  });
  assert(resChild1.success === true, '1.1 Parent berhasil login untuk Anak 1');
  assert(resChild1.user?.claims.studentId === child1.student.id, '1.2 Klaim aktif berisi studentId Anak 1');
  assert(
    Boolean(
      resChild1.user?.claims.studentIds.includes(child1.student.id) &&
      resChild1.user?.claims.studentIds.includes(child2.student.id)
    ),
    '1.3 Klaim studentIds memuat kedua saudara yang terdaftar'
  );

  // Sibling switching: Token untuk Anak 2
  const resChild2 = await service.authenticateParentAndIssueToken({
    phone: '081299990001',
    studentId: child2.student.id,
  });
  assert(resChild2.success === true, '1.4 Sibling switching ke Anak 2 berhasil');
  assert(resChild2.user?.claims.studentId === child2.student.id, '1.5 Klaim aktif diperbarui persis ke studentId Anak 2');

  // ------------------------------------------------------------------
  // 2. Proteksi Akses Siswa Keluarga Lain (Negative Test)
  // ------------------------------------------------------------------
  console.log('\n--- 2. Proteksi Akses Siswa Keluarga Lain (Negative Test) ---');
  const resSteal = await service.authenticateParentAndIssueToken({
    phone: '081299990001',
    studentId: unrelatedChild.student.id, // ID anak keluarga lain
  });
  assert(
    resSteal.success === false && resSteal.status === 'NOT_FOUND',
    '2.1 Parent ditolak keras saat mencoba mengakses studentId milik keluarga lain'
  );

  // ------------------------------------------------------------------
  // 3. Opaque UID Verification (Tidak Membocorkan No HP)
  // ------------------------------------------------------------------
  console.log('\n--- 3. Verifikasi Opaque UID ---');
  // Mock createCustomToken to verify UID and claims passed to Admin SDK
  let capturedUid = '';
  let capturedClaims: any = null;
  const originalCreate = admin.auth ? admin.auth().createCustomToken : null;

  if (admin.apps.length) {
    (admin.auth() as any).createCustomToken = async (uid: string, claims: any) => {
      capturedUid = uid;
      capturedClaims = claims;
      return 'mocked_custom_token_xyz_123';
    };

    await service.authenticateParentAndIssueToken({
      phone: '081299990001',
      studentId: child1.student.id,
    });

    assert(capturedUid.startsWith('parent_'), '3.1 UID diawali prefix "parent_"');
    assert(!capturedUid.includes('081299990001'), '3.2 UID TIDAK memuat nomor WhatsApp mentah');
    assert(!capturedUid.includes('6281299990001'), '3.3 UID tidak memuat format internasional mentah');
    assert(capturedClaims.role === 'parent', '3.4 Klaim role adalah "parent"');
    assert(capturedClaims.studentId === child1.student.id, '3.5 Klaim studentId sesuai dengan anak aktif');
  }

  // ------------------------------------------------------------------
  // 4. Fail-Closed di Production Tanpa Izin Signing (No Synthetic Fallback)
  // ------------------------------------------------------------------
  console.log('\n--- 4. Fail-Closed Production Tanpa Izin Signing ---');
  const prevNodeEnv = process.env.NODE_ENV;
  const prevEmulator = process.env.VITE_USE_EMULATOR;
  const prevAuthHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;

  try {
    // Simulate pure Production environment
    process.env.NODE_ENV = 'production';
    delete process.env.VITE_USE_EMULATOR;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

    if (admin.apps.length) {
      (admin.auth() as any).createCustomToken = async () => {
        throw new Error('iam.serviceAccounts.signBlob permission denied in production');
      };
    }

    const prodFailRes = await service.authenticateParentAndIssueToken({
      phone: '081299990001',
      studentId: child1.student.id,
    });

    assert(prodFailRes.success === false, '4.1 Di Production, kegagalan signBlob ditolak (success === false)');
    assert(prodFailRes.status === 'AUTH_TOKEN_FAILED', '4.2 Status error adalah AUTH_TOKEN_FAILED');
    assert(
      !prodFailRes.token || !prodFailRes.token.startsWith('bfa_parent_token_'),
      '4.3 Di Production TIDAK ADA fallback ke token sintetis (tidak ada bfa_parent_token_...)'
    );
  } finally {
    process.env.NODE_ENV = prevNodeEnv;
    if (prevEmulator) process.env.VITE_USE_EMULATOR = prevEmulator;
    if (prevAuthHost) process.env.FIREBASE_AUTH_EMULATOR_HOST = prevAuthHost;
    if (originalCreate && admin.apps.length) {
      (admin.auth() as any).createCustomToken = originalCreate;
    }
  }

  // ------------------------------------------------------------------
  // 5. Logout Session Cleaning
  // ------------------------------------------------------------------
  console.log('\n--- 5. Pengujian Pembersihan Sesi Saat Logout ---');
  await signOutBfaAdapter();
  assert(getBfaAdapterCurrentUser() === null, '5.1 signOutBfaAdapter memastikan currentUser adalah null');

  console.log('\n======================================================================');
  console.log(`HASIL AKHIR: ${passed} Lulus, ${failed} Gagal`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHardeningTestSuite().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
