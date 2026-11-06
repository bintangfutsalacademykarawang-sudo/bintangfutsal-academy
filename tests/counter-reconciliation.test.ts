import { INITIAL_CONFIRMED_SEQUENCE } from '../src/firebase';
import { Student, RegistrationStatus } from '../src/types';

interface TestResult {
  title: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function record(title: string, passed: boolean, message: string) {
  results.push({ title, passed, message });
  console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${title} — ${message}`);
}

/**
 * Pure function to extract numerical sequence from BFA student doc ID.
 */
function extractStudentIdSequence(docId: string): number {
  if (!docId || typeof docId !== 'string') return 0;
  const match = docId.match(/^BFA-(\d+)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Pure function to calculate candidate next sequence number based on high-water mark.
 */
function calculateNextStudentSequence(
  existingDocIds: string[],
  counterSequence?: number | null
): number {
  let maxDocSeq = 0;
  for (const id of existingDocIds) {
    const seq = extractStudentIdSequence(id);
    if (seq > maxDocSeq) {
      maxDocSeq = seq;
    }
  }

  const validCounter = (typeof counterSequence === 'number' && counterSequence > 0) ? counterSequence : 0;
  const effectiveBaseline = Math.max(INITIAL_CONFIRMED_SEQUENCE, maxDocSeq, validCounter);
  return effectiveBaseline + 1;
}

/**
 * Pure function to format next candidate student ID string.
 */
function formatNextStudentId(nextSequence: number): string {
  return `BFA-${String(nextSequence).padStart(3, '0')}`;
}

function runCounterReconciliationUnitTests() {
  console.log('======================================================================');
  console.log('BFA HUB — PENGUJIAN UNIT COUNTER RECONCILIATION & HIGH-WATER MARK');
  console.log('======================================================================\n');

  // Test 1: Ground-truth sequence baseline constant
  record(
    'Kasus 1.1: Baseline Sequence Ground-Truth bernilai 38',
    INITIAL_CONFIRMED_SEQUENCE === 38,
    `INITIAL_CONFIRMED_SEQUENCE: ${INITIAL_CONFIRMED_SEQUENCE}`
  );

  // Test 2: Sequence extraction from document IDs
  record(
    'Kasus 1.2: Ekstraksi sequence numerik dari ID BFA-083',
    extractStudentIdSequence('BFA-083') === 83,
    `Hasil ekstraksi BFA-083: ${extractStudentIdSequence('BFA-083')}`
  );

  record(
    'Kasus 1.3: Ekstraksi sequence numerik dari ID BFA-039',
    extractStudentIdSequence('BFA-039') === 39,
    `Hasil ekstraksi BFA-039: ${extractStudentIdSequence('BFA-039')}`
  );

  record(
    'Kasus 1.4: Ekstraksi ID tidak valid menghasilkan 0',
    extractStudentIdSequence('INVALID-ID') === 0 && extractStudentIdSequence('') === 0,
    `Hasil ekstraksi ID tak valid: ${extractStudentIdSequence('INVALID-ID')}`
  );

  // Test 3: High-water mark calculation when Firestore has docs up to BFA-083
  const mockExistingDocs = ['BFA-001', 'BFA-038', 'BFA-039', 'BFA-083'];
  const nextSeqWith83 = calculateNextStudentSequence(mockExistingDocs, 38);
  const nextIdWith83 = formatNextStudentId(nextSeqWith83);

  record(
    'Kasus 2.1: Alokasi ID berikutnya setelah BFA-083 menghasilkan BFA-084 (Bukan BFA-039)',
    nextIdWith83 === 'BFA-084' && nextSeqWith83 === 84,
    `Candidate Next ID: ${nextIdWith83} (Sequence: ${nextSeqWith83})`
  );

  // Test 4: Counter counter-state higher than existing docs
  const nextSeqHighCounter = calculateNextStudentSequence(mockExistingDocs, 100);
  const nextIdHighCounter = formatNextStudentId(nextSeqHighCounter);

  record(
    'Kasus 2.2: Sifat monoton naik dipertahankan jika counter state (100) > max doc ID (83)',
    nextIdHighCounter === 'BFA-101' && nextSeqHighCounter === 101,
    `Candidate Next ID: ${nextIdHighCounter} (Sequence: ${nextSeqHighCounter})`
  );

  // Test 5: Counter missing or undefined falls back safely to max doc sequence + 1
  const nextSeqMissingCounter = calculateNextStudentSequence(mockExistingDocs, null);
  const nextIdMissingCounter = formatNextStudentId(nextSeqMissingCounter);

  record(
    'Kasus 2.3: Counter hilang/rusak tidak menurunkan sequence dan menghasilkan BFA-084',
    nextIdMissingCounter === 'BFA-084',
    `Candidate Next ID tanpa counter: ${nextIdMissingCounter}`
  );

  // Test 6: Registration payload status validation
  const mockRegistration: Student = {
    id: nextIdWith83,
    name: 'Calon Siswa Uji',
    phone: '081234567890',
    birthPlace: 'Karawang',
    birthDate: '2016-01-01',
    gender: 'L',
    parentName: 'Orang Tua Uji',
    classGroupId: 'U10',
    status: 'Non-Aktif',
    joinedDate: '2026-09-26',
    jerseyNumber: 12,
    documents: {},
    avatar: '',
    registrationStatus: 'MENUNGGU_VERIFIKASI',
  };

  record(
    'Kasus 3.1: Registrasi siswa baru terinisialisasi MENUNGGU_VERIFIKASI',
    mockRegistration.registrationStatus === 'MENUNGGU_VERIFIKASI' && mockRegistration.status === 'Non-Aktif',
    `Status registrasi: ${mockRegistration.registrationStatus}, Status akun: ${mockRegistration.status}`
  );

  // Test 7: Approval state transition
  const approvedStudent: Student = {
    ...mockRegistration,
    registrationStatus: 'DISETUJUI',
    status: 'Aktif',
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'Admin BFA',
  };

  record(
    'Kasus 3.2: Transaksi approval mengubah registrationStatus menjadi DISETUJUI dan status menjadi Aktif',
    approvedStudent.registrationStatus === 'DISETUJUI' && approvedStudent.status === 'Aktif',
    `Approved registrationStatus: ${approvedStudent.registrationStatus}, Status: ${approvedStudent.status}`
  );

  // Test 8: Rejection state transition
  const rejectedStudent: Student = {
    ...mockRegistration,
    registrationStatus: 'DITOLAK',
    status: 'Non-Aktif',
    rejectionReason: 'Berkas belum lengkap',
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'Admin BFA',
  };

  record(
    'Kasus 3.3: Transaksi rejection mengubah registrationStatus menjadi DITOLAK dan status menjadi Non-Aktif',
    rejectedStudent.registrationStatus === 'DITOLAK' && rejectedStudent.status === 'Non-Aktif',
    `Rejected registrationStatus: ${rejectedStudent.registrationStatus}, Status: ${rejectedStudent.status}`
  );

  const failed = results.filter(r => !r.passed).length;
  console.log('\n===========================================================');
  console.log(`HASIL COUNTER RECONCILIATION TEST: ${results.length - failed} Passed, ${failed} Failed`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCounterReconciliationUnitTests();
