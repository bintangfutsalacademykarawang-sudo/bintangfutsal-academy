import { 
  resolveFirebaseEnvironment, 
  emulatorConfig, 
  FirebaseEnvResolution 
} from '../src/firebase';
import prodConfig from '../firebase-applet-config.json';
import stagingConfig from '../firebase-staging-config.json';

function runEnvGuardTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  console.log('======================================================================');
  console.log('BFA HUB — SUITE PENGUJIAN ENVIRONMENT GUARD & EMULATOR ISOLATION');
  console.log('======================================================================');

  // --- KELOMPOK 1: MODE EMULATOR LOKAL ---
  console.log('\n[Grup 1] Pengujian Mode Emulator:');

  // 1.1 Emulator via VITE_USE_EMULATOR='true'
  const res1 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_USE_EMULATOR: 'true'
  });
  assert(res1.target === 'emulator' && res1.isEmulator === true, '1.1 VITE_USE_EMULATOR=true mengaktifkan target emulator');
  assert(res1.config.projectId === 'demo-bfa-hub', '1.2 Config emulator menggunakan demo project ID');
  assert(res1.emulatorHost === '127.0.0.1' && res1.emulatorFirestorePort === 8080 && res1.emulatorAuthPort === 9099, '1.3 Port default emulator sesuai spesifikasi');

  // 1.2 Emulator via MODE='emulator' (npm run dev:emulator)
  const res2 = resolveFirebaseEnvironment({
    MODE: 'emulator',
    DEV: true
  });
  assert(res2.target === 'emulator' && res2.isEmulator === true, '1.4 MODE=emulator mengaktifkan target emulator secara otomatis');

  // 1.3 Emulator via VITE_FIREBASE_ENV='emulator'
  const res3 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_FIREBASE_ENV: 'emulator'
  });
  assert(res3.target === 'emulator', '1.5 VITE_FIREBASE_ENV=emulator mengaktifkan target emulator');

  // 1.4 Custom Port & Host
  const res4 = resolveFirebaseEnvironment({
    VITE_USE_EMULATOR: 'true',
    VITE_EMULATOR_HOST: '0.0.0.0',
    VITE_EMULATOR_FIRESTORE_PORT: '8181',
    VITE_EMULATOR_AUTH_PORT: '9191'
  });
  assert(res4.emulatorHost === '0.0.0.0' && res4.emulatorFirestorePort === 8181 && res4.emulatorAuthPort === 9191, '1.6 Override port dan host emulator bekerja dengan presisi');

  // --- KELOMPOK 2: MODE STAGING ---
  console.log('\n[Grup 2] Pengujian Mode Staging:');

  // 2.1 Staging via VITE_USE_STAGING='true'
  const res5 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_USE_STAGING: 'true'
  });
  assert(res5.target === 'staging' && res5.isStaging === true, '2.1 VITE_USE_STAGING=true mengaktifkan target staging');
  assert(res5.config.projectId === 'bfa-hub-staging', '2.2 Config staging memuat projectId staging resmi');

  // 2.2 Staging via MODE='staging' (npm run build:staging)
  const res6 = resolveFirebaseEnvironment({
    MODE: 'staging',
    PROD: true
  });
  assert(res6.target === 'staging' && res6.config.projectId === 'bfa-hub-staging', '2.3 MODE=staging mengaktifkan target staging');

  // --- KELOMPOK 3: MODE PRODUCTION & PRODUCTION BUILD ---
  console.log('\n[Grup 3] Pengujian Mode Production & Build:');

  // 3.1 Production build resmi (npm run build)
  const res7 = resolveFirebaseEnvironment({
    MODE: 'production',
    PROD: true
  });
  assert(res7.target === 'production' && res7.isProduction === true, '3.1 Production build resmi (PROD=true, MODE=production) memilih target production');
  assert(res7.config.projectId === 'future-wonder-jwh4c', '3.2 Production build menggunakan prodConfig proyek future-wonder-jwh4c');

  // 3.2 Mode development dengan izin eksplisit VITE_ALLOW_PROD_IN_DEV='true'
  const res8 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_ALLOW_PROD_IN_DEV: 'true'
  });
  assert(res8.target === 'production' && res8.isProduction === true, '3.3 Development dengan VITE_ALLOW_PROD_IN_DEV=true mengizinkan koneksi production secara eksplisit');

  // 3.3 Mode development dengan izin eksplisit VITE_FIREBASE_ENV='production'
  const res9 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_FIREBASE_ENV: 'production'
  });
  assert(res9.target === 'production', '3.4 Development dengan VITE_FIREBASE_ENV=production mengizinkan koneksi production');

  // --- KELOMPOK 4: FAIL-CLOSED GUARD (PENCEGAHAN FALLBACK DIAM-DIAM KE PRODUKSI) ---
  console.log('\n[Grup 4] Pengujian Fail-Closed Guard (Pencegahan Fallback):');

  // 4.1 Mode development murni tanpa konfigurasi apa pun (Bare npm run dev)
  let failClosedTriggered = false;
  let failClosedMessage = '';
  try {
    resolveFirebaseEnvironment({
      MODE: 'development',
      DEV: true
      // Tidak ada flag emulator, staging, maupun prod
    });
  } catch (err: any) {
    failClosedTriggered = true;
    failClosedMessage = err.message || '';
  }
  assert(failClosedTriggered === true, '4.1 Development tanpa konfigurasi eksplisit MENOLAK koneksi ke production (FAIL-CLOSED)');
  assert(failClosedMessage.includes('[Firebase Guard] FAIL-CLOSED'), '4.2 Pesan error informatif dan memandu instruksi aktivasi');

  // 4.2 Parameter salah eja (misal typo VITE_USE_EMULATR) TIDAK boleh jatuh ke produksi diam-diam
  let typoProtected = false;
  try {
    resolveFirebaseEnvironment({
      MODE: 'development',
      DEV: true,
      VITE_USE_EMULATR: 'true' // Typo yang disengaja
    });
  } catch {
    typoProtected = true;
  }
  assert(typoProtected === true, '4.3 Typo variabel lingkungan ditangkap oleh Fail-Closed Guard tanpa bocor ke production');

  // --- KELOMPOK 5: TEST SUITE SAFEGUARD ---
  console.log('\n[Grup 5] Pengujian Lingkungan Test Suite:');

  const resTest = resolveFirebaseEnvironment({
    MODE: 'test'
  });
  assert(resTest.target === 'emulator' && resTest.config.projectId === 'demo-bfa-hub', '5.1 Test runner otomatis terisolasi ke emulator demo-bfa-hub');

  // --- KELOMPOK 6: PENGUJIAN KOMBINASI VARIABEL BERTENTANGAN & HARDENED PROJECT ID ---
  console.log('\n[Grup 6] Pengujian Kombinasi Variabel Bertentangan & Hardened Project ID:');

  // 6.1 VITE_USE_EMULATOR=true bersama VITE_ALLOW_PROD_IN_DEV=true
  const resConf1 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_USE_EMULATOR: 'true',
    VITE_ALLOW_PROD_IN_DEV: 'true'
  });
  assert(resConf1.target === 'emulator' && resConf1.config.projectId === 'demo-bfa-hub' && resConf1.isEmulator === true, '6.1 VITE_USE_EMULATOR=true mengalahkan VITE_ALLOW_PROD_IN_DEV=true (tetap emulator demo-bfa-hub)');

  // 6.2 VITE_USE_EMULATOR=true bersama VITE_FIREBASE_ENV=production
  const resConf2 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_USE_EMULATOR: 'true',
    VITE_FIREBASE_ENV: 'production'
  });
  assert(resConf2.target === 'emulator' && resConf2.config.projectId === 'demo-bfa-hub' && resConf2.isEmulator === true, '6.2 VITE_USE_EMULATOR=true mengalahkan VITE_FIREBASE_ENV=production');

  // 6.3 VITE_USE_EMULATOR=true bersama VITE_USE_STAGING=true
  const resConf3 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_USE_EMULATOR: 'true',
    VITE_USE_STAGING: 'true'
  });
  assert(resConf3.target === 'emulator' && resConf3.config.projectId === 'demo-bfa-hub' && resConf3.isEmulator === true, '6.3 VITE_USE_EMULATOR=true mengalahkan VITE_USE_STAGING=true');

  // 6.4 Project ID produksi diberikan saat emulator aktif (VITE_FIREBASE_PROJECT_ID=future-wonder-jwh4c)
  const resHardened1 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_USE_EMULATOR: 'true',
    VITE_FIREBASE_PROJECT_ID: 'future-wonder-jwh4c'
  });
  assert(resHardened1.target === 'emulator' && resHardened1.config.projectId === 'demo-bfa-hub', '6.4 Project ID produksi (future-wonder-jwh4c) diabaikan saat emulator aktif, selalu demo-bfa-hub');

  // 6.5 Mode emulator via VITE_FIREBASE_ENV=emulator dengan VITE_FIREBASE_PROJECT_ID produksi
  const resHardened2 = resolveFirebaseEnvironment({
    MODE: 'development',
    DEV: true,
    VITE_FIREBASE_ENV: 'emulator',
    VITE_FIREBASE_PROJECT_ID: 'future-wonder-jwh4c'
  });
  assert(resHardened2.target === 'emulator' && resHardened2.config.projectId === 'demo-bfa-hub', '6.5 VITE_FIREBASE_ENV=emulator mengabaikan project ID produksi dan selalu memakai demo-bfa-hub');

  // --- KELOMPOK 7: PENGUJIAN KEGAGALAN KONFIGURASI STAGING ---
  console.log('\n[Grup 7] Pengujian Kegagalan Konfigurasi Staging (Pencegahan Fallback):');

  // 7.1 Staging diminta tapi konfigurasi bernilai null
  let stagingNullCaught = false;
  let stagingNullErrorMsg = '';
  try {
    resolveFirebaseEnvironment({
      MODE: 'development',
      DEV: true,
      VITE_USE_STAGING: 'true',
      customStagingConfig: null
    });
  } catch (err: any) {
    stagingNullCaught = true;
    stagingNullErrorMsg = err.message || '';
  }
  assert(stagingNullCaught === true && stagingNullErrorMsg.includes('Staging configuration is missing or invalid'), '7.1 Konfigurasi staging null melempar fatal error dan TIDAK fallback ke produksi');

  // 7.2 Staging diminta tapi projectId salah
  let stagingWrongIdCaught = false;
  try {
    resolveFirebaseEnvironment({
      MODE: 'development',
      DEV: true,
      VITE_USE_STAGING: 'true',
      customStagingConfig: { projectId: 'salah-proyek-bfa' }
    });
  } catch {
    stagingWrongIdCaught = true;
  }
  assert(stagingWrongIdCaught === true, '7.2 Staging dengan projectId salah ditolak seketika');

  // --- KELOMPOK 8: PENGUJIAN NILAI BOOLEAN TIDAK VALID ---
  console.log('\n[Grup 8] Pengujian Nilai Boolean Tidak Valid (Eksplisit & Non-Ambigu):');

  // 8.1 VITE_USE_EMULATOR='false' pada development tanpa konfigurasi lain -> Fail-Closed
  let falseEmulatorCaught = false;
  try {
    resolveFirebaseEnvironment({
      MODE: 'development',
      DEV: true,
      VITE_USE_EMULATOR: 'false'
    });
  } catch {
    falseEmulatorCaught = true;
  }
  assert(falseEmulatorCaught === true, '8.1 VITE_USE_EMULATOR="false" dievaluasi non-aktif dan memicu Fail-Closed');

  // 8.2 VITE_USE_EMULATOR='0' pada development
  let zeroEmulatorCaught = false;
  try {
    resolveFirebaseEnvironment({
      MODE: 'development',
      DEV: true,
      VITE_USE_EMULATOR: '0'
    });
  } catch {
    zeroEmulatorCaught = true;
  }
  assert(zeroEmulatorCaught === true, '8.2 VITE_USE_EMULATOR="0" tidak dianggap true dan memicu Fail-Closed');

  // 8.3 VITE_USE_EMULATOR='TRUE' (huruf besar) pada development
  let uppercaseEmulatorCaught = false;
  try {
    resolveFirebaseEnvironment({
      MODE: 'development',
      DEV: true,
      VITE_USE_EMULATOR: 'TRUE'
    });
  } catch {
    uppercaseEmulatorCaught = true;
  }
  assert(uppercaseEmulatorCaught === true, '8.3 VITE_USE_EMULATOR="TRUE" (uppercase) dievaluasi strictly, memicu Fail-Closed');

  // 8.4 VITE_ALLOW_PROD_IN_DEV='false' pada development tanpa konfigurasi lain
  let falseProdDevCaught = false;
  try {
    resolveFirebaseEnvironment({
      MODE: 'development',
      DEV: true,
      VITE_ALLOW_PROD_IN_DEV: 'false'
    });
  } catch {
    falseProdDevCaught = true;
  }
  assert(falseProdDevCaught === true, '8.4 VITE_ALLOW_PROD_IN_DEV="false" tidak membuka akses produksi dan memicu Fail-Closed');

  // 8.5 VITE_USE_STAGING='false' pada development tanpa konfigurasi lain
  let falseStagingCaught = false;
  try {
    resolveFirebaseEnvironment({
      MODE: 'development',
      DEV: true,
      VITE_USE_STAGING: 'false'
    });
  } catch {
    falseStagingCaught = true;
  }
  assert(falseStagingCaught === true, '8.5 VITE_USE_STAGING="false" dievaluasi non-aktif dan memicu Fail-Closed');


  console.log('\n======================================================================');
  console.log(`RINGKASAN PENGUJIAN: ${passed} Lulus, ${failed} Gagal`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEnvGuardTests();
