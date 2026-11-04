/**
 * BFA HUB — COMPREHENSIVE STAGING BACKEND & SECURITY VERIFICATION SUITE
 * Mode: STAGING-FIRST · ZERO-TRUST · ATOMICITY · STRICT SECURITY & NEGATIVE TESTING
 */

import { 
  TrustedBackendService, 
  InMemoryBackendStore, 
  assertStagingBackendIsolation,
  INITIAL_CONFIRMED_SEQUENCE 
} from '../src/server/trustedBackendService';
import { createBackendRouter } from '../src/server/backendRouter';
import { normalizePhoneNumber } from '../src/utils/phoneUtils';
import { Student, Invoice, PaymentVerificationRequest } from '../src/types';
import request from 'supertest';
import express from 'express';

async function runStagingTestSuite() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  console.log('======================================================================');
  console.log('BFA HUB — STAGING BACKEND & SECURITY VERIFICATION SUITE (WITH NEGATIVE TESTS)');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // GRUP 1: PENGUJIAN FAIL-CLOSED ENVIRONMENT GUARD (NEGATIVE)
  // -------------------------------------------------------------------------
  console.log('[Grup 1] Pengujian Fail-Closed Environment Guard (Negative):');
  try {
    assertStagingBackendIsolation('production');
    assert(false, '1.1 Eksekusi langsung ke production harus ditolak keras');
  } catch (err: any) {
    assert(err.message.includes('future-wonder-jwh4c DITOLAK'), '1.1 Eksekusi langsung ke target production ditolak keras (Fail-Closed)');
  }

  try {
    assertStagingBackendIsolation('staging');
    assert(true, '1.2 Eksekusi pada target staging diizinkan');
  } catch (err: any) {
    assert(false, '1.2 Eksekusi pada target staging gagal', err.message);
  }

  // -------------------------------------------------------------------------
  // GRUP 2: AUTENTIKASI ADMIN & GUARD AKUN NON-AKTIF (NEGATIVE)
  // -------------------------------------------------------------------------
  console.log('\n[Grup 2] Pengujian Autentikasi Admin & Guard Akun Non-Aktif (Negative):');
  const store = new InMemoryBackendStore();
  const service = new TrustedBackendService(store, 'staging');

  const adminActiveRes = await service.authenticateAdminAndIssueToken({
    email: 'admin@bfa.my.id',
    password: 'adminbfa',
    isActive: true,
  });
  assert(adminActiveRes.success === true && adminActiveRes.user?.claims.admin === true, '2.1 Admin aktif berhasil login');

  const adminInactiveRes = await service.authenticateAdminAndIssueToken({
    email: 'admin@bfa.my.id',
    password: 'adminbfa',
    isActive: false,
  });
  assert(adminInactiveRes.success === false && adminInactiveRes.status === 'INACTIVE_ACCOUNT', '2.2 [NEGATIVE] Admin non-aktif ditolak login (INACTIVE_ACCOUNT)');

  const adminWrongPassRes = await service.authenticateAdminAndIssueToken({
    email: 'admin@bfa.my.id',
    password: 'salahPasswordAdmin',
    isActive: true,
  });
  assert(adminWrongPassRes.success === false && adminWrongPassRes.status === 'INVALID_CREDENTIALS', '2.3 [NEGATIVE] Password admin salah ditolak');

  // -------------------------------------------------------------------------
  // GRUP 3: PENDAFTARAN SISWA & ATOMIC COUNTER & CONCURRENCY
  // -------------------------------------------------------------------------
  console.log('\n[Grup 3] Pengujian Atomic Counter & Pendaftaran Siswa (Concurrent Race-Condition Test):');
  const initialCounter = await store.getStudentCounter();
  assert(initialCounter === INITIAL_CONFIRMED_SEQUENCE && initialCounter === 38, '3.1 Baseline counter NIS terverifikasi persis pada angka 38');

  // Registrasi 2 siswa bersamaan secara konkuren (Concurrent registrations)
  const [concReg1, concReg2] = await Promise.all([
    service.registerStudentAndIncrementCounter({
      name: 'Anak Konkuren Satu',
      birthPlace: 'Karawang',
      birthDate: '2015-01-01',
      gender: 'L',
      parentName: 'Bpk. Test',
      phone: '081111111111',
      classGroupId: 'U11',
      jerseyNumber: 10,
    }, 'public'),
    service.registerStudentAndIncrementCounter({
      name: 'Anak Konkuren Dua',
      birthPlace: 'Karawang',
      birthDate: '2016-01-01',
      gender: 'P',
      parentName: 'Bpk. Test',
      phone: '081111111111',
      classGroupId: 'U10',
      jerseyNumber: 11,
    }, 'public'),
  ]);

  assert(
    (concReg1.generatedId === 'BFA-039' && concReg2.generatedId === 'BFA-040') ||
    (concReg1.generatedId === 'BFA-040' && concReg2.generatedId === 'BFA-039'),
    '3.2 [ATOMIC] Registrasi konkuren menghasilkan ID unik berurutan tanpa tabrakan'
  );
  assert(await store.getStudentCounter() === 40, '3.3 Counter akhir database tepat bernilai 40');

  // Validasi Input Kosong (Negative)
  try {
    await service.registerStudentAndIncrementCounter({
      name: '',
      birthPlace: 'Jakarta',
      birthDate: '2015-01-01',
      gender: 'L',
      parentName: 'Ayah',
      phone: '08123456789',
      classGroupId: 'U10',
      jerseyNumber: 1,
    });
    assert(false, '3.4 Nama kosong harus ditolak');
  } catch (err: any) {
    assert(err.message.includes('VALIDATION_ERROR'), '3.4 [NEGATIVE] Nama siswa kosong ditolak dengan validasi error');
  }

  // -------------------------------------------------------------------------
  // GRUP 4: AUTENTIKASI PARENT, SIBLING SELECTION & UNAUTHORIZED CHILD ACCESS (NEGATIVE)
  // -------------------------------------------------------------------------
  console.log('\n[Grup 4] Pengujian Autentikasi Parent & Proteksi Akses Anak Tak Terkait (Negative):');
  
  // Registrasi Farhan (BFA-041) dan Siti (BFA-042) untuk nomor 081234567890
  const regFarhan = await service.registerStudentAndIncrementCounter({
    name: 'Farhan',
    birthPlace: 'Karawang',
    birthDate: '2015-04-12',
    gender: 'L',
    parentName: 'Bpk. Ridwan',
    phone: '081234567890',
    classGroupId: 'U11',
    jerseyNumber: 7,
  }, 'admin'); // Admin setuju langsung

  const regSiti = await service.registerStudentAndIncrementCounter({
    name: 'Siti',
    birthPlace: 'Karawang',
    birthDate: '2016-09-01',
    gender: 'P',
    parentName: 'Bpk. Ridwan',
    phone: '081234567890',
    classGroupId: 'U10',
    jerseyNumber: 9,
  }, 'admin');

  // Parent login tanpa studentId, mendeteksi multiple children
  const siblingCheck = await service.authenticateParentAndIssueToken({
    phone: '081234567890',
  });
  assert(siblingCheck.status === 'MULTIPLE_CHILDREN', '4.1 Mendeteksi saudara kandung (MULTIPLE_CHILDREN)');

  // [NEGATIVE]: Parent mencoba memaksa masuk ke studentId yang TIDAK terkait dengan nomor WhatsApp-nya (misal BFA-001 Andra)
  const unauthorizedChildAccess = await service.authenticateParentAndIssueToken({
    phone: '081234567890',
    studentId: 'BFA-001', // Milik Bpk. Bambang, bukan Ridwan
  });
  assert(unauthorizedChildAccess.success === false && unauthorizedChildAccess.status === 'NOT_FOUND', '4.2 [NEGATIVE] Parent tidak dapat mengakses ID anak yang tidak terdaftar pada nomor WhatsApp-nya');

  // Login sah untuk Farhan (BFA-041)
  const loginFarhan = await service.authenticateParentAndIssueToken({
    phone: '081234567890',
    studentId: regFarhan.student.id,
  });
  assert(loginFarhan.success === true && loginFarhan.status === 'AUTHENTICATED', '4.3 Parent berhasil login ke anak yang sah');
  assert(loginFarhan.user?.claims.studentIds.includes(regFarhan.student.id) === true, '4.4 Custom claims memuat studentIds yang valid');

  // -------------------------------------------------------------------------
  // GRUP 5: PRESENSI & ATOMIC TRAINING INVOICE (Rp 15.000) & IDEMPOTENCY
  // -------------------------------------------------------------------------
  console.log('\n[Grup 5] Pengujian Presensi & Invoice Latihan Rp 15.000 (Idempotent):');
  
  const attHadir = await service.recordAttendanceWithFeeTransaction({
    studentId: regFarhan.student.id,
    date: '2026-11-03',
    status: 'HADIR',
    method: 'BARCODE',
  });
  assert(attHadir.attendance.status === 'HADIR', '5.1 Presensi HADIR berhasil dicatat');
  assert(attHadir.feeGenerated === true && attHadir.invoice?.amount === 15000, '5.2 Invoice latihan Rp 15.000 diterbitkan secara atomik');

  // Idempotensi: Panggilan ulang presensi tanggal sama tidak menduplikasi invoice
  const attDuplicate = await service.recordAttendanceWithFeeTransaction({
    studentId: regFarhan.student.id,
    date: '2026-11-03',
    status: 'HADIR',
    method: 'BARCODE',
  });
  assert(attDuplicate.invoice?.id === attHadir.invoice?.id, '5.3 [IDEMPOTENT] Panggilan ulang presensi mengembalikan ID invoice yang sama tanpa duplikasi');

  // -------------------------------------------------------------------------
  // GRUP 6: PEMBAYARAN INVOICE, ANTI-OVERPAYMENT & IDEMPOTENT PAYMENTS (NEGATIVE)
  // -------------------------------------------------------------------------
  console.log('\n[Grup 6] Pengujian Pembayaran Invoice & Anti-Overpayment (Negative):');
  const invoiceId = attHadir.invoice!.id;

  // Cicilan sebagian
  const payPartial = await service.processInvoicePaymentAtomic({
    invoiceId,
    amount: 5000,
    method: 'Tunai',
    staff: 'Admin Staging',
  });
  assert(payPartial.invoice.remainingAmount === 10000, '6.1 Sisa tagihan menjadi Rp 10.000');

  // [NEGATIVE]: Percobaan overpayment (membayar lebih dari sisa tagihan Rp 10.000)
  try {
    await service.processInvoicePaymentAtomic({
      invoiceId,
      amount: 25000,
      method: 'Tunai',
      staff: 'Admin Staging',
    });
    assert(false, '6.2 Overpayment harus ditolak');
  } catch (err: any) {
    assert(err.message.includes('OVERPAYMENT_NOT_ALLOWED'), '6.2 [NEGATIVE] Guard Anti-Overpayment berhasil menolak pembayaran melebihi sisa tagihan');
  }

  // Pelunasan sisa
  const payFull = await service.processInvoicePaymentAtomic({
    invoiceId,
    amount: 10000,
    method: 'Transfer Bank',
    staff: 'Admin Staging',
  });
  assert(payFull.invoice.status === 'LUNAS', '6.3 Tagihan sukses terlunasi (LUNAS)');

  // -------------------------------------------------------------------------
  // GRUP 7: PENGUJIAN NEGATIF API ROUTER (EXPRESS ENDPOINTS & RBAC)
  // -------------------------------------------------------------------------
  console.log('\n[Grup 7] Pengujian Negatif API Router & RBAC (Supertest):');
  const app = express();
  app.use(express.json());
  app.use('/api', createBackendRouter({ store, service, env: 'staging' }));

  // Test 7.1: User tanpa token mengakses endpoint privat /api/invoices/pay -> 401 / 403
  const resNoAuth = await request(app)
    .post('/api/invoices/pay')
    .send({ invoiceId, amount: 5000, method: 'Tunai', staff: 'Admin' });
  assert(resNoAuth.status === 403 || resNoAuth.status === 401, '7.1 [NEGATIVE] Akses endpoint privat tanpa token berwenang ditolak');

  // Test 7.2: Token dengan peran parent mencoba mengakses endpoint khusus admin -> 403
  const parentToken = loginFarhan.token;
  const resParentForbidden = await request(app)
    .post('/api/invoices/pay')
    .set('Authorization', `Bearer ${parentToken}`)
    .send({ invoiceId, amount: 5000, method: 'Tunai', staff: 'Parent' });
  console.log('STATUS 7.2:', resParentForbidden.status, resParentForbidden.body);
  assert(resParentForbidden.status === 403, '7.2 [NEGATIVE] Token parent mencoba mengakses endpoint admin ditolak (403 Forbidden)');

  // Test 7.3: Health check saat store error mengembalikan status 503 dan status DEGRADED
  const brokenStore = new InMemoryBackendStore();
  brokenStore.getStudentCounter = async () => { throw new Error('Firestore Connection Lost'); };
  const brokenApp = express();
  brokenApp.use(express.json());
  brokenApp.use('/api', createBackendRouter({ store: brokenStore, service, env: 'staging' }));

  const resHealth = await request(brokenApp).get('/api/health');
  assert(resHealth.status === 503 && resHealth.body.status === 'DEGRADED', '7.3 [NEGATIVE] Health check mendeteksi kegagalan Firestore dan mengembalikan status 503 DEGRADED');

  // -------------------------------------------------------------------------
  // RINGKASAN PENGUJIAN STAGING
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`RINGKASAN PENGUJIAN STAGING: ${passed} Lulus, ${failed} Gagal`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStagingTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
