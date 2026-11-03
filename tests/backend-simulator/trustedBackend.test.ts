/**
 * BFA HUB — TRUSTED BACKEND SIMULATOR TEST SUITE (TAHAP 5B-7B)
 * Mode: STRICT LOCAL-ONLY · EMULATOR-ONLY · SYNTHETIC DATA ONLY · NO CLOUD/PRODUCTION
 * Target: demo-bfa-hub @ 127.0.0.1:9099 (Auth) & 127.0.0.1:8085 (Firestore)
 */

import {
  EMULATOR_PROJECT_ID,
  EMULATOR_AUTH_HOST,
  EMULATOR_AUTH_PORT,
  EMULATOR_FIRESTORE_HOST,
  EMULATOR_FIRESTORE_PORT,
  AdminContext,
  assertTrustedBackendIsolationGuard,
  getTrustedAdminInstance,
  approveStudentAndProvisionAuth,
  repairPartialApproval,
  resetStudentPasswordByAdmin,
  cleanupSyntheticBackendData,
} from './trustedBackend';

// Set environment variables secara ketat untuk proses pengujian
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
  console.log('BFA HUB — SUITE UJI BACKEND TEPERCAYA & ONBOARDING (TAHAP 5B-7B)');
  console.log(`Target: ${EMULATOR_PROJECT_ID}`);
  console.log(`Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST} | Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log('Mode: STRICT LOCAL-ONLY · SYNTHETIC ONLY · ZERO PRODUCTION ACCESS');
  console.log('======================================================================\n');

  // Preflight isolation check
  assertTrustedBackendIsolationGuard();
  const { db, auth } = getTrustedAdminInstance();

  const adminCtx: AdminContext = {
    uid: 'syn_admin_super_01',
    role: 'admin',
    email: 'admin_test@bfa-local.test',
    displayName: 'Admin Synth BFA',
  };

  const coachCtx: AdminContext = {
    uid: 'syn_coach_01',
    role: 'coach',
    email: 'coach_test@bfa-local.test',
  };

  const parentCtx: AdminContext = {
    uid: 'syn_parent_01',
    role: 'parent',
    email: 'parent_test@bfa-local.test',
  };

  // -------------------------------------------------------------------------
  // TEST 1: GUARD LINGKUNGAN — FAIL-CLOSED PREFLIGHT
  // -------------------------------------------------------------------------
  await runTest('Guard Lingkungan: Mencegah eksekusi bila project bukan demo-bfa-hub', async () => {
    const original = process.env.GCLOUD_PROJECT;
    try {
      process.env.GCLOUD_PROJECT = 'cloud-production-project';
      let caught = false;
      try {
        assertTrustedBackendIsolationGuard();
      } catch (err: any) {
        caught = true;
        assert(err.message.includes('tidak valid'), 'Pesan error harus menolak project cloud');
      }
      assert(caught, 'Harus melempar error jika target bukan demo-bfa-hub');
    } finally {
      process.env.GCLOUD_PROJECT = original;
    }
  });

  await runTest('Guard Lingkungan: Menolak host non-loopback untuk Auth Emulator', async () => {
    const original = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    try {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = '192.168.1.100:9099';
      let caught = false;
      try {
        assertTrustedBackendIsolationGuard();
      } catch (err: any) {
        caught = true;
        assert(err.message.includes('ditolak'), 'Pesan error harus menolak host eksternal');
      }
      assert(caught, 'Harus melempar error untuk host non-loopback');
    } finally {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = original;
    }
  });

  // -------------------------------------------------------------------------
  // TEST 2: OTORISASI ADMIN — HAK AKSES KETAT
  // -------------------------------------------------------------------------
  await runTest('Otorisasi: Menolak eksekusi persetujuan oleh non-admin (Coach & Parent)', async () => {
    let coachCaught = false;
    try {
      await approveStudentAndProvisionAuth(coachCtx, {
        studentId: 'BFA-SYN-ERR1',
        registrationId: 'REG-SYN-ERR1',
      });
    } catch (err: any) {
      coachCaught = true;
      assert(err.message.includes('FORBIDDEN_NOT_ADMIN'), 'Harus mengembalikan error FORBIDDEN_NOT_ADMIN');
    }
    assert(coachCaught, 'Coach harus ditolak melakukan persetujuan');

    let parentCaught = false;
    try {
      await approveStudentAndProvisionAuth(parentCtx, {
        studentId: 'BFA-SYN-ERR2',
        registrationId: 'REG-SYN-ERR2',
      });
    } catch (err: any) {
      parentCaught = true;
      assert(err.message.includes('FORBIDDEN_NOT_ADMIN'), 'Harus mengembalikan error FORBIDDEN_NOT_ADMIN');
    }
    assert(parentCaught, 'Parent harus ditolak melakukan persetujuan');
  });

  // -------------------------------------------------------------------------
  // TEST 3: VALIDASI REGISTRASI — PENOLAKAN KONDISI ILEGAL
  // -------------------------------------------------------------------------
  await runTest('Validasi: Menolak registrasi fiktif atau yang sudah ditolak (rejected)', async () => {
    // 3a. Registrasi tidak ditemukan
    let notFoundCaught = false;
    try {
      await approveStudentAndProvisionAuth(adminCtx, {
        studentId: 'BFA-SYN-NF',
        registrationId: 'REG-NONEXISTENT',
      });
    } catch (err: any) {
      notFoundCaught = true;
      assert(err.message.includes('REGISTRATION_NOT_FOUND'), 'Harus mengembalikan REGISTRATION_NOT_FOUND');
    }
    assert(notFoundCaught, 'Pendaftaran fiktif harus ditolak');

    // 3b. Registrasi berstatus 'rejected'
    const rejRegId = `reg_syn_rej_${Date.now()}`;
    const rejStudentId = `bfa_syn_rej_${Date.now()}`;
    await db.collection('registrations').doc(rejRegId).set({
      id: rejRegId,
      studentId: rejStudentId,
      studentName: 'Siswa Ditolak Sintetis',
      parentName: 'Wali Ditolak',
      parentPhone: '081200000001',
      status: 'rejected',
      submittedAt: Date.now(),
    });
    tracker.registrationIds.push(rejRegId);
    tracker.studentIds.push(rejStudentId);

    let rejectedCaught = false;
    try {
      await approveStudentAndProvisionAuth(adminCtx, {
        studentId: rejStudentId,
        registrationId: rejRegId,
      });
    } catch (err: any) {
      rejectedCaught = true;
      assert(err.message.includes('REGISTRATION_REJECTED'), 'Harus menolak registrasi status rejected');
    }
    assert(rejectedCaught, 'Pendaftaran yang telah ditolak tidak boleh disetujui');
  });

  // -------------------------------------------------------------------------
  // TEST 4: PERSETUJUAN PENDAFTARAN NORMAL & PROVISIONING AUTH
  // -------------------------------------------------------------------------
  const regId1 = `reg_syn_01_${Date.now()}`;
  const studentId1 = `BFA-SYN-NORM-01`;

  await runTest('Persetujuan Sukses: Provisioning Auth & Aktivasi Tanpa Bocoran Rahasia', async () => {
    await db.collection('registrations').doc(regId1).set({
      id: regId1,
      studentId: studentId1,
      studentName: 'Rian Pratama Sintetis',
      parentName: 'Bambang Pratama',
      parentPhone: '081299991111',
      parentId: 'parent_bambang_p',
      familyId: 'fam_pratama',
      status: 'menunggu-verifikasi',
      submittedAt: Date.now(),
    });
    tracker.registrationIds.push(regId1);
    tracker.studentIds.push(studentId1);

    const res = await approveStudentAndProvisionAuth(adminCtx, {
      studentId: studentId1,
      registrationId: regId1,
    });

    assert(res.success === true, 'Persetujuan harus sukses');
    assert(res.status === 'SUCCESS_PROVISIONED', 'Status harus SUCCESS_PROVISIONED');
    assert(res.isNewAccount === true, 'Harus membuat akun Auth baru');
    assert(res.activationQueued === true, 'Event aktivasi harus diantrekan');
    assert(Boolean(res.authUid), 'authUid harus ada');
    tracker.authUids.push(res.authUid!);

    // Verifikasi Dokumen Siswa di Firestore
    const sDoc = await db.collection('students').doc(studentId1).get();
    assert(sDoc.exists, 'Dokumen siswa harus tercipta');
    assert(sDoc.data()?.status === 'aktif', 'Status siswa harus aktif');
    assert(sDoc.data()?.authUid === res.authUid, 'authUid di dokumen siswa harus cocok');

    // Verifikasi Dokumen Registrasi di Firestore
    const rDoc = await db.collection('registrations').doc(regId1).get();
    assert(rDoc.data()?.status === 'approved', 'Status registrasi harus approved');

    // Verifikasi Antrean Aktivasi (TIDAK MEMUAT PASSWORD RAHASIA)
    const qDocs = await db.collection('activationQueue').where('studentId', '==', studentId1).get();
    assert(qDocs.size > 0, 'Antrean aktivasi harus terdaftar');
    const queueData = qDocs.docs[0].data();
    assert(queueData.status === 'ready_to_send', 'Status antrean harus ready_to_send');
    assert(queueData.password === undefined, 'KEAMANAN: Password TIDAK boleh ada di antrean');
    assert(queueData.token === undefined, 'KEAMANAN: Token rahasia TIDAK boleh ada di antrean');

    // Verifikasi Custom Claims pada Akun Auth
    const authUser = await auth.getUser(res.authUid!);
    const claims = authUser.customClaims || {};
    assert(claims.role === 'parent', 'Claims role harus parent');
    assert(Array.isArray(claims.studentIds) && claims.studentIds.includes(studentId1), 'Claims harus mencakup studentId1');
  });

  // -------------------------------------------------------------------------
  // TEST 5: IDEMPOTENSI — PANGGILAN BERULANG AMAN
  // -------------------------------------------------------------------------
  await runTest('Idempotensi: Memanggil persetujuan ulang tidak menduplikasi akun', async () => {
    const resIdempotent = await approveStudentAndProvisionAuth(adminCtx, {
      studentId: studentId1,
      registrationId: regId1,
    });

    assert(resIdempotent.success === true, 'Panggilan ulang harus tetap sukses');
    assert(resIdempotent.status === 'ALREADY_APPROVED', 'Status harus ALREADY_APPROVED');
    assert(resIdempotent.isNewAccount === false, 'Tidak boleh membuat akun baru lagi');
    assert(resIdempotent.activationQueued === false, 'Tidak boleh mengantrekan aktivasi ganda');
  });

  // -------------------------------------------------------------------------
  // TEST 6: PERMINTAAN SIMULTAN / KONKUREN
  // -------------------------------------------------------------------------
  const regIdSim = `reg_syn_sim_${Date.now()}`;
  const studentIdSim = `BFA-SYN-SIM-01`;

  await runTest('Konkurensi: Dua permintaan persetujuan paralel diselesaikan secara atomik', async () => {
    await db.collection('registrations').doc(regIdSim).set({
      id: regIdSim,
      studentId: studentIdSim,
      studentName: 'Dimas Konkuren Sintetis',
      parentName: 'Hadi Konkuren',
      parentPhone: '081299992222',
      parentId: 'parent_hadi_sim',
      familyId: 'fam_sim',
      status: 'menunggu-verifikasi',
      submittedAt: Date.now(),
    });
    tracker.registrationIds.push(regIdSim);
    tracker.studentIds.push(studentIdSim);

    const [resA, resB] = await Promise.all([
      approveStudentAndProvisionAuth(adminCtx, { studentId: studentIdSim, registrationId: regIdSim }),
      approveStudentAndProvisionAuth(adminCtx, { studentId: studentIdSim, registrationId: regIdSim }),
    ]);

    assert(resA.success && resB.success, 'Kedua permintaan harus berakhir sukses');
    assert(resA.authUid === resB.authUid, 'Kedua panggilan harus merujuk ke authUid yang sama persis');
    tracker.authUids.push(resA.authUid!);
  });

  // -------------------------------------------------------------------------
  // TEST 7: ISOLASI KELUARGA — NOMOR SAMA DENGAN UNIT KELUARGA BERBEDA
  // -------------------------------------------------------------------------
  const regIdIso1 = `reg_syn_iso1_${Date.now()}`;
  const regIdIso2 = `reg_syn_iso2_${Date.now()}`;
  const studentIdIso1 = `BFA-SYN-ISO-A`;
  const studentIdIso2 = `BFA-SYN-ISO-B`;
  const sharedPhone = '081299993333'; // Misalnya nomor telepon wali asrama/kantor

  await runTest('Isolasi Keluarga: Nomor telepon sama tapi beda familyId TIDAK digabung', async () => {
    // Siswa A
    await db.collection('registrations').doc(regIdIso1).set({
      id: regIdIso1,
      studentId: studentIdIso1,
      studentName: 'Siswa Unit A',
      parentName: 'Wali Unit A',
      parentPhone: sharedPhone,
      parentId: 'parent_unit_alpha',
      familyId: 'fam_unit_alpha',
      status: 'menunggu-verifikasi',
      submittedAt: Date.now(),
    });

    // Siswa B (nomor hp sama, tapi parentId & familyId beda)
    await db.collection('registrations').doc(regIdIso2).set({
      id: regIdIso2,
      studentId: studentIdIso2,
      studentName: 'Siswa Unit B',
      parentName: 'Wali Unit B',
      parentPhone: sharedPhone,
      parentId: 'parent_unit_beta',
      familyId: 'fam_unit_beta',
      status: 'menunggu-verifikasi',
      submittedAt: Date.now(),
    });

    tracker.registrationIds.push(regIdIso1, regIdIso2);
    tracker.studentIds.push(studentIdIso1, studentIdIso2);

    const resA = await approveStudentAndProvisionAuth(adminCtx, { studentId: studentIdIso1, registrationId: regIdIso1 });
    const resB = await approveStudentAndProvisionAuth(adminCtx, { studentId: studentIdIso2, registrationId: regIdIso2 });

    tracker.authUids.push(resA.authUid!, resB.authUid!);

    assert(resA.authUid !== resB.authUid, 'Kedua akun Auth orang tua HARUS terpisah karena beda familyId/parentId');
  });

  // -------------------------------------------------------------------------
  // TEST 8: PENGGABUNGAN KELUARGA SAH (SAUDARA KANDUNG)
  // -------------------------------------------------------------------------
  const regIdSib1 = `reg_syn_sib1_${Date.now()}`;
  const regIdSib2 = `reg_syn_sib2_${Date.now()}`;
  const studentIdSib1 = `BFA-SYN-SIB-KAKAK`;
  const studentIdSib2 = `BFA-SYN-SIB-ADIK`;
  const siblingParentId = 'parent_fam_wijaya_legit';

  await runTest('Penggabungan Sah: Dua siswa satu parentId dihubungkan ke 1 akun orang tua', async () => {
    // Kakak
    await db.collection('registrations').doc(regIdSib1).set({
      id: regIdSib1,
      studentId: studentIdSib1,
      studentName: 'Wijaya Kakak Sintetis',
      parentName: 'Pak Wijaya',
      parentPhone: '081299994444',
      parentId: siblingParentId,
      familyId: 'fam_wijaya',
      status: 'menunggu-verifikasi',
      submittedAt: Date.now(),
    });

    // Adik
    await db.collection('registrations').doc(regIdSib2).set({
      id: regIdSib2,
      studentId: studentIdSib2,
      studentName: 'Wijaya Adik Sintetis',
      parentName: 'Pak Wijaya',
      parentPhone: '081299994444',
      parentId: siblingParentId,
      familyId: 'fam_wijaya',
      status: 'menunggu-verifikasi',
      submittedAt: Date.now(),
    });

    tracker.registrationIds.push(regIdSib1, regIdSib2);
    tracker.studentIds.push(studentIdSib1, studentIdSib2);

    const resKakak = await approveStudentAndProvisionAuth(adminCtx, { studentId: studentIdSib1, registrationId: regIdSib1 });
    const resAdik = await approveStudentAndProvisionAuth(adminCtx, { studentId: studentIdSib2, registrationId: regIdSib2 });

    tracker.authUids.push(resKakak.authUid!);

    assert(resKakak.authUid === resAdik.authUid, 'Kakak dan Adik HARUS berbagi 1 authUid orang tua');
    assert(resKakak.isNewAccount === true, 'Kakak membuat akun baru');
    assert(resAdik.isNewAccount === false, 'Adik menautkan ke akun orang tua yang sudah ada');

    // Periksa Custom Claims Orang Tua: Harus memuat kedua ID siswa
    const parentAuth = await auth.getUser(resKakak.authUid!);
    const claims = parentAuth.customClaims || {};
    assert(claims.studentIds.includes(studentIdSib1), 'Claims harus mencakup siswa Kakak');
    assert(claims.studentIds.includes(studentIdSib2), 'Claims harus mencakup siswa Adik');
  });

  // -------------------------------------------------------------------------
  // TEST 9: PENANGANAN KEGAGALAN PARSIAL DAN PEMULIHAN
  // -------------------------------------------------------------------------
  const regIdPart = `reg_syn_part_${Date.now()}`;
  const studentIdPart = `BFA-SYN-PART-01`;

  await runTest('Kegagalan Parsial & Pemulihan: Status recovery jelas dan dapat diperbaiki', async () => {
    await db.collection('registrations').doc(regIdPart).set({
      id: regIdPart,
      studentId: studentIdPart,
      studentName: 'Siswa Parsial Sintetis',
      parentName: 'Ibu Parsial',
      parentPhone: '081299995555',
      parentId: 'parent_parsial_01',
      status: 'menunggu-verifikasi',
      submittedAt: Date.now(),
    });
    tracker.registrationIds.push(regIdPart);
    tracker.studentIds.push(studentIdPart);

    // Simulasi kegagalan parsial
    const resPart = await approveStudentAndProvisionAuth(adminCtx, {
      studentId: studentIdPart,
      registrationId: regIdPart,
      simulatePartialFailure: true,
    });

    assert(resPart.success === false, 'Panggilan harus mengembalikan success: false saat simulasi gagal');
    assert(resPart.status === 'PARTIAL_FAILURE_AUTH_CREATED_FIRESTORE_PENDING', 'Status harus mencatat kegagalan parsial');
    assert(resPart.recoveryNeeded === true, 'Harus menandai perlunya recovery');
    assert(Boolean(resPart.authUid), 'authUid tetap tersimpan untuk keperluan perbaikan');
    tracker.authUids.push(resPart.authUid!);

    // Jalankan operasi pemulihan
    const resRepair = await repairPartialApproval(adminCtx, studentIdPart, regIdPart, resPart.authUid!);
    assert(resRepair.success === true, 'Operasi perbaikan harus sukses');

    // Verifikasi siswa sekarang aktif di Firestore
    const sDoc = await db.collection('students').doc(studentIdPart).get();
    assert(sDoc.exists && sDoc.data()?.status === 'aktif', 'Siswa harus aktif setelah pemulihan');
  });

  // -------------------------------------------------------------------------
  // TEST 10: RESET PASSWORD OLEH ADMIN — AMAN & BERSIH
  // -------------------------------------------------------------------------
  await runTest('Reset Sandi Admin: Berhasil memperbarui Auth tanpa menyimpan sandi di database', async () => {
    const resReset = await resetStudentPasswordByAdmin(adminCtx, {
      studentId: studentId1,
    });

    assert(resReset.success === true, 'Reset sandi harus sukses');
    assert(resReset.resetQueued === true, 'Event reset harus diantrekan');

    // Verifikasi Dokumen Antrean: Kata sandi TIDAK PERNAH disimpan
    const qDocs = await db.collection('activationQueue')
      .where('studentId', '==', studentId1)
      .where('type', '==', 'password_reset')
      .get();
    
    assert(qDocs.size > 0, 'Event reset sandi harus tercatat di antrean');
    const queueData = qDocs.docs[0].data();
    assert(queueData.password === undefined, 'KEAMANAN: Kata sandi baru dilarang disimpan di Firestore');
    assert(queueData.tempPassword === undefined, 'KEAMANAN: Temp password dilarang disimpan di Firestore');
  });

  // -------------------------------------------------------------------------
  // TEST 11: RATE LIMITING RESET PASSWORD
  // -------------------------------------------------------------------------
  await runTest('Rate Limiting: Mencegah spam reset password berturut-turut', async () => {
    let rateLimitCaught = false;
    try {
      await resetStudentPasswordByAdmin(adminCtx, {
        studentId: studentId1,
        simulateRateLimit: true,
      });
    } catch (err: any) {
      rateLimitCaught = true;
      assert(err.message.includes('RATE_LIMIT_EXCEEDED'), 'Harus melempar error RATE_LIMIT_EXCEEDED');
    }
    assert(rateLimitCaught, 'Rate limit harus aktif dan menolak permintaan berlebih');
  });

  // -------------------------------------------------------------------------
  // TEST 12: CLEANUP BERLAPIS & VERIFIKASI ZERO RESIDUAL ACCOUNTS
  // -------------------------------------------------------------------------
  await runTest('Cleanup Berlapis: Menghapus seluruh data sintetis & memverifikasi 0 residual akun', async () => {
    const cleanupReport = await cleanupSyntheticBackendData(
      tracker.studentIds,
      tracker.registrationIds,
      tracker.authUids
    );

    console.log(`[CLEANUP AUDIT] Siswa dihapus: ${cleanupReport.deletedStudents}`);
    console.log(`[CLEANUP AUDIT] Registrasi dihapus: ${cleanupReport.deletedRegistrations}`);
    console.log(`[CLEANUP AUDIT] Auth users dihapus: ${cleanupReport.deletedAuthUsers}`);
    console.log(`[CLEANUP AUDIT] Sisa akun di Auth Emulator: ${cleanupReport.remainingAuthUsersCount}`);

    assert(cleanupReport.remainingAuthUsersCount === 0, `Sisa akun di Auth Emulator HARUS 0, ditemukan ${cleanupReport.remainingAuthUsersCount}`);
  });

  // -------------------------------------------------------------------------
  // RINGKASAN AKHIR
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('RINGKASAN HASIL TEST SUITE BACKEND TEPERCAYA:');
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
