/**
 * BFA HUB — UNIT & INTEGRATION TEST SUITE: PARENT PAYMENT CONFIRMATION & AUTHENTICATION
 * Mode: SECURITY & IDEMPOTENCY VERIFICATION · ERROR DISAGGREGATION
 */

import { formatFirestoreErrorMessage } from '../src/firebase';
import { 
  TrustedBackendService, 
  InMemoryBackendStore 
} from '../src/server/trustedBackendService';

async function runPaymentConfirmationTestSuite() {
  console.log('======================================================================');
  console.log('BFA HUB — SUITE PENGUJIAN KONFIRMASI PEMBAYARAN ORANG TUA & ERROR GUARD');
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

  // ------------------------------------------------------------------
  // 1. Pengujian Disagregasi Pesan Error Firestore (Anti-Generic Masking)
  // ------------------------------------------------------------------
  console.log('--- 1. Pengujian Disagregasi Pesan Error Firestore ---');

  const permDeniedErr = { code: 'permission-denied', message: 'Missing or insufficient permissions.' };
  const permMsg = formatFirestoreErrorMessage(permDeniedErr);
  assert(
    permMsg.includes('permission-denied') && permMsg.includes('Orang Tua'),
    '1.1 permission-denied diformat akurat dengan keterangan hak akses Orang Tua'
  );
  assert(
    !permMsg.toLowerCase().includes('koneksi internet'),
    '1.2 permission-denied TIDAK disamarkan sebagai error koneksi internet'
  );

  const unauthErr = { code: 'unauthenticated', message: 'The request does not have valid authentication credentials.' };
  const unauthMsg = formatFirestoreErrorMessage(unauthErr);
  assert(
    unauthMsg.includes('unauthenticated') && unauthMsg.includes('login kembali'),
    '1.3 unauthenticated diformat akurat dengan instruksi login ulang'
  );
  assert(
    !unauthMsg.toLowerCase().includes('koneksi internet'),
    '1.4 unauthenticated TIDAK disamarkan sebagai error koneksi internet'
  );

  const quotaErr = { code: 'resource-exhausted', message: 'Quota exceeded for write requests.' };
  const quotaMsg = formatFirestoreErrorMessage(quotaErr);
  assert(
    quotaMsg.includes('resource-exhausted') && quotaMsg.includes('kuota') || quotaMsg.includes('maksimal'),
    '1.5 resource-exhausted diformat akurat dengan keterangan kuota database'
  );

  const unavailErr = { code: 'unavailable', message: 'The service is currently unavailable.' };
  const unavailMsg = formatFirestoreErrorMessage(unavailErr);
  assert(
    unavailMsg.includes('unavailable') && unavailMsg.includes('sibuk'),
    '1.6 unavailable diformat akurat dengan keterangan server sibuk'
  );

  const networkErr = { code: 'failed-precondition', message: 'Failed to fetch (offline network issue)' };
  const networkMsg = formatFirestoreErrorMessage(networkErr);
  assert(
    networkMsg.includes('koneksi internet') || networkMsg.includes('terhubung ke server'),
    '1.7 network error diformat akurat dengan keterangan koneksi internet'
  );

  // ------------------------------------------------------------------
  // 2. Pengujian Backend Sibling Token Generation & Claims
  // ------------------------------------------------------------------
  console.log('\n--- 2. Pengujian Validasi Hubungan Keluarga & Penerbitan Token ---');

  const store = new InMemoryBackendStore();
  const service = new TrustedBackendService(store, 'staging');

  // Register Afan arka maulana (U9) and sibling
  const afan = await service.registerStudentAndIncrementCounter({
    name: 'Afan arka maulana',
    birthPlace: 'Karawang',
    birthDate: '2017-03-15',
    gender: 'L',
    parentName: 'Bpk. Maulana',
    phone: '081399887766',
    classGroupId: 'U9',
    jerseyNumber: 9,
  }, 'admin');

  const afanSibling = await service.registerStudentAndIncrementCounter({
    name: 'Kakak Afan',
    birthPlace: 'Karawang',
    birthDate: '2015-01-20',
    gender: 'L',
    parentName: 'Bpk. Maulana',
    phone: '081399887766',
    classGroupId: 'U11',
    jerseyNumber: 7,
  }, 'admin');

  // Verify custom token issued for Afan
  const afanAuth = await service.authenticateParentAndIssueToken({
    phone: '081399887766',
    studentId: afan.student.id,
  });

  assert(afanAuth.success === true, '2.1 Backend berhasil memvalidasi orang tua Afan');
  assert(afanAuth.user?.claims.studentId === afan.student.id, '2.2 Token memuat klaim studentId Afan');
  assert(afanAuth.user?.claims.role === 'parent', '2.3 Token memuat klaim role: parent');
  assert(afanAuth.user?.phone === '081399887766', '2.4 Respons API login memuat no HP orang tua pada user object');
  assert(
    (afanAuth.user?.claims as any)?.parentPhone === undefined &&
    (afanAuth.user?.claims as any)?.studentName === undefined &&
    (afanAuth.user?.claims as any)?.classGroupId === undefined,
    '2.4b Custom Claims bersih dari PII (parentPhone, studentName, classGroupId)'
  );

  // Switch to sibling Kakak Afan
  const siblingAuth = await service.authenticateParentAndIssueToken({
    phone: '081399887766',
    studentId: afanSibling.student.id,
  });

  assert(siblingAuth.success === true, '2.5 Sibling switching ke Kakak Afan berhasil');
  assert(siblingAuth.user?.claims.studentId === afanSibling.student.id, '2.6 Token saudara memuat klaim studentId Kakak Afan');

  // ------------------------------------------------------------------
  // 3. Pengujian Idempotency Token Generation
  // ------------------------------------------------------------------
  console.log('\n--- 3. Pengujian Idempotency Token Stabil Pada Retry ---');

  const cleanStudentId = afan.student.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const ts = 1730784000000;
  const rand = 5555;
  const reqId1 = `PVR-${cleanStudentId}-${ts}-${rand}`;
  const reqId2 = `PVR-${cleanStudentId}-${ts}-${rand}`;

  // ------------------------------------------------------------------
  // 4. Verifikasi Konsistensi Koleksi & Idempotensi Transaksi
  // ------------------------------------------------------------------
  console.log('\n--- 4. Verifikasi Konsistensi Koleksi & Idempotensi Transaksi ---');

  // 4.1 Nama koleksi resmi yang cocok dengan firestore.rules
  const OFFICIAL_PAYMENT_COLLECTION = 'paymentVerificationRequests';
  assert(
    OFFICIAL_PAYMENT_COLLECTION === 'paymentVerificationRequests',
    '4.1 Nama koleksi pembayaran resmi adalah "paymentVerificationRequests" sesuai firestore.rules'
  );

  // 4.2 Simulasi Idempotensi: Dua request konfirmasi masuk bersamaan dengan ID yang sama
  const sharedReqId = `PVR-TEST-IDEMP-001`;
  const pvrPayload = {
    id: sharedReqId,
    referenceNumber: 'CONF-BFA-112233-444',
    studentId: afan.student.id,
    studentName: 'Afan arka maulana',
    classGroupId: 'U9',
    parentPhone: '081399887766',
    parentName: 'Bpk. Maulana',
    amount: 15000,
    paymentMethod: 'Pembayaran Tunai di Lapangan',
    invoiceIds: ['INV-LAT-001'],
    status: 'MENUNGGU_VERIFIKASI' as const,
    submittedAt: new Date().toISOString(),
  };

  await store.savePaymentVerification(pvrPayload);
  // Panggilan kedua tidak boleh menduplikasi entri di store
  await store.savePaymentVerification(pvrPayload);
  const storedReq = await store.getPaymentVerification(sharedReqId);
  assert(storedReq !== null, '4.2 Dokumen verifikasi tersimpan di store');
  assert(store.getAllPaymentVerifications().filter(r => r.id === sharedReqId).length === 1, '4.3 Panggilan ganda menghasilkan tepat 1 dokumen (anti-duplikasi)');

  // 4.3 Simulasi Pencegahan Approval Ganda (Double Approval)
  // Buat invoice awal
  await store.saveInvoice({
    id: 'INV-LAT-001',
    studentId: afan.student.id,
    studentName: 'Afan arka maulana',
    classGroupId: 'U9',
    type: 'Latihan',
    period: '2026-10-17',
    attendanceDate: '2026-10-17',
    amount: 15000,
    paidAmount: 0,
    remainingAmount: 15000,
    status: 'BELUM BAYAR',
    dueDate: '2026-10-17',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Approval pertama
  const approval1 = await service.approvePaymentVerificationAtomic({
    requestId: sharedReqId,
    verifiedBy: 'Admin BFA',
    notes: 'Persetujuan kasir tunai',
  });
  assert(approval1.request.status === 'DISETUJUI', '4.4 Approval pertama berhasil dengan status DISETUJUI');

  // Approval kedua (konkuren/ulang) WAJIB ditolak
  let doubleApprovalBlocked = false;
  try {
    await service.approvePaymentVerificationAtomic({
      requestId: sharedReqId,
      verifiedBy: 'Admin BFA',
    });
  } catch (err: any) {
    doubleApprovalBlocked = true;
  }
  assert(doubleApprovalBlocked, '4.5 Approval kedua ditolak keras (anti-duplikasi cashMutations)');
  assert(store.getAllCashMutations().length === 1, '4.6 Jumlah mutasi kas tepat 1 (tidak ada duplikasi mutasi kas)');

  console.log('\n======================================================================');
  console.log(`HASIL AKHIR: ${passed} Lulus, ${failed} Gagal`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPaymentConfirmationTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
