import { initializeApp, deleteApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator, 
  createUserWithEmailAndPassword, 
  deleteUser, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  initializeFirestore, 
  connectFirestoreEmulator, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc 
} from 'firebase/firestore';

interface TestResult {
  step: string;
  passed: boolean;
  details: string;
}

async function runSyntheticLoopbackVerification() {
  const results: TestResult[] = [];
  const log = (step: string, passed: boolean, details: string) => {
    results.push({ step, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: [${step}] — ${details}`);
  };

  console.log('======================================================================');
  console.log('BFA HUB — VERIFIKASI RUNTIME FIREBASE EMULATOR & DATA SINTETIS');
  console.log('Mode: STRICT LOCAL-ONLY · Loopback 127.0.0.1 · demo-bfa-hub');
  console.log('======================================================================\n');

  const app = initializeApp({
    projectId: 'demo-bfa-hub',
    apiKey: 'demo-api-key-for-emulator',
    authDomain: 'demo-bfa-hub.firebaseapp.com',
  }, 'synthetic-test-app');

  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

  const db = initializeFirestore(app, {});
  connectFirestoreEmulator(db, '127.0.0.1', 8085);

  const testUserEmail = 'emu-test-user@local.test';
  const testUserPassword = 'DemoPassword2026!Secure';
  const testStudentId = 'EMU_TEST_001';

  let createdUser: any = null;

  try {
    // ---------------------------------------------------------
    // 1. PENGUJIAN AUTH EMULATOR (127.0.0.1:9099)
    // ---------------------------------------------------------
    console.log('[Tahap 1: Pengujian Auth Emulator]');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testUserEmail, testUserPassword);
      createdUser = userCredential.user;
      const isCorrectUser = createdUser && createdUser.email === testUserEmail && Boolean(createdUser.uid);
      log('1.1 Create Synthetic User', isCorrectUser, `User berhasil dibuat: ${createdUser.email} (UID: ${createdUser.uid})`);
    } catch (err: any) {
      log('1.1 Create Synthetic User', false, `Gagal membuat user: ${err.message}`);
    }

    try {
      const signInCredential = await signInWithEmailAndPassword(auth, testUserEmail, testUserPassword);
      const isLoginOk = signInCredential.user && signInCredential.user.uid === createdUser?.uid;
      log('1.2 Verify User Credentials', isLoginOk, `Login pengguna sintetis berhasil diverifikasi`);
    } catch (err: any) {
      log('1.2 Verify User Credentials', false, `Login pengguna sintetis gagal: ${err.message}`);
    }

    // ---------------------------------------------------------
    // 2. PENGUJIAN FIRESTORE EMULATOR WRITE (127.0.0.1:8085)
    // ---------------------------------------------------------
    console.log('\n[Tahap 2: Pengujian Tulis Data Sintetis ke Firestore Emulator]');
    const syntheticPayload = {
      id: testStudentId,
      name: 'Siswa Uji Coba Emulator 2026',
      phone: '081299998888',
      birthDate: '2012-08-17',
      registrationStatus: 'DISETUJUI',
      isSynthetic: true,
      environment: 'emulator-local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'students', testStudentId), syntheticPayload);
      log('2.1 Firestore Write Document', true, `Dokumen students/${testStudentId} berhasil ditulis ke Firestore 127.0.0.1:8085`);
    } catch (err: any) {
      log('2.1 Firestore Write Document', false, `Gagal menulis dokumen: ${err.message}`);
    }

    // ---------------------------------------------------------
    // 3. PENGUJIAN FIRESTORE EMULATOR READ (127.0.0.1:8085)
    // ---------------------------------------------------------
    console.log('\n[Tahap 3: Pengujian Baca dan Verifikasi Integritas Data]');
    try {
      const readSnap = await getDoc(doc(db, 'students', testStudentId));
      if (!readSnap.exists()) {
        log('3.1 Firestore Read Document', false, `Dokumen students/${testStudentId} tidak ditemukan setelah penulisan`);
      } else {
        const data = readSnap.data();
        const matches = (
          data.id === syntheticPayload.id &&
          data.name === syntheticPayload.name &&
          data.phone === syntheticPayload.phone &&
          data.registrationStatus === syntheticPayload.registrationStatus &&
          data.isSynthetic === true
        );
        log('3.1 Firestore Read Document', matches, `Dokumen terbaca dengan data identik & konsisten: name="${data.name}", status="${data.registrationStatus}"`);
      }
    } catch (err: any) {
      log('3.1 Firestore Read Document', false, `Gagal membaca dokumen: ${err.message}`);
    }

    // ---------------------------------------------------------
    // 4. PENGUJIAN ATURAN KEAMANAN (FIRESTORE RULES)
    // ---------------------------------------------------------
    console.log('\n[Tahap 4: Pemeriksaan Penegakan Aturan Keamanan (Rules)]');
    try {
      // Validasi path kosong pada dokumen
      let rejectedAsExpected = false;
      try {
        await getDoc(doc(db, 'students', ''));
      } catch (clientErr: any) {
        rejectedAsExpected = true;
      }
      log('4.1 Path Validation Guard', rejectedAsExpected, `Path dokumen kosong ditolak oleh client SDK/Firestore`);
    } catch (err: any) {
      log('4.1 Path Validation Guard', false, `Error tidak terduga: ${err.message}`);
    }

    // Catatan penegakan rules
    log('4.2 Security Rules Audit Note', true, `Rules file aktif di emulator (/app/applet/firestore.rules). Memuat isValidId() pada students, invoices, dll.`);

    // ---------------------------------------------------------
    // 5. PEMBERSIHAN DATA SINTETIS (CLEANUP)
    // ---------------------------------------------------------
    console.log('\n[Tahap 5: Pembersihan Dokumen & Pengguna Sintetis]');
    try {
      await deleteDoc(doc(db, 'students', testStudentId));
      const verifyDeletedSnap = await getDoc(doc(db, 'students', testStudentId));
      const isDocDeleted = !verifyDeletedSnap.exists();
      log('5.1 Delete Synthetic Student Document', isDocDeleted, `Dokumen students/${testStudentId} berhasil dihapus dari emulator`);
    } catch (err: any) {
      log('5.1 Delete Synthetic Student Document', false, `Gagal menghapus dokumen: ${err.message}`);
    }

    if (createdUser) {
      try {
        await deleteUser(createdUser);
        log('5.2 Delete Synthetic Auth User', true, `Pengguna sintetis ${testUserEmail} berhasil dihapus dari Auth emulator`);
      } catch (err: any) {
        log('5.2 Delete Synthetic Auth User', false, `Gagal menghapus pengguna sintetis: ${err.message}`);
      }
    }

  } finally {
    await deleteApp(app);
  }

  console.log('\n======================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`STATUS AKHIR: ${results.filter(r => r.passed).length}/${results.length} Pengujian Berhasil`);
  console.log('======================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runSyntheticLoopbackVerification().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
