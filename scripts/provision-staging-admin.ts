/**
 * BFA HUB — STAGING ADMIN ACCOUNT PROVISIONING CLI SCRIPT
 * Mode: SECURE ADMIN PROVISIONING · STAGING ONLY · FAIL-CLOSED
 * Target Project ID: bfa-hub-staging
 * 
 * Cara menjalankan:
 * FIREBASE_STAGING_SERVICE_ACCOUNT_JSON='{...}' npx tsx scripts/provision-staging-admin.ts
 */

import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const STAGING_PROJECT_ID = 'bfa-hub-staging';
const TARGET_ADMIN_EMAIL = 'admin@bfahub.internal';
const DEFAULT_STAGING_ADMIN_PASSWORD = 'rahasiaAdmin2026';

async function provisionStagingAdmin() {
  console.log('======================================================================');
  console.log('BFA HUB — STAGING ADMIN ACCOUNT PROVISIONING & CLAIMS VERIFICATION');
  console.log('======================================================================');

  // 1. Fail-Closed Staging Credential Guard (Mandatory FIREBASE_STAGING_SERVICE_ACCOUNT_JSON)
  const env = process.env;
  const rawJsonEnv = env.FIREBASE_STAGING_SERVICE_ACCOUNT_JSON;
  
  if (!rawJsonEnv || !rawJsonEnv.trim().startsWith('{')) {
    console.error('[FATAL] Variabel lingkungan FIREBASE_STAGING_SERVICE_ACCOUNT_JSON wajib diisi dengan Service Account JSON staging resmi untuk bfa-hub-staging.');
    console.error('[FATAL] Fallback ke applicationDefault() ditolak keras untuk mencegah penggunaan ADC internal AI Studio.');
    process.exit(1);
  }

  let parsedCredential;
  try {
    parsedCredential = JSON.parse(rawJsonEnv.trim());
    if (parsedCredential.project_id === 'future-wonder-jwh4c' || parsedCredential.project_id === 'production') {
      console.error('[FATAL] Ditolak: Kredensial produksi terdeteksi!');
      process.exit(1);
    }
    if (parsedCredential.project_id && parsedCredential.project_id !== STAGING_PROJECT_ID) {
      console.error(`[FATAL] Ditolak: Project ID "${parsedCredential.project_id}" tidak sesuai dengan staging resmi ("${STAGING_PROJECT_ID}").`);
      process.exit(1);
    }
  } catch (e: any) {
    console.error('[FATAL] Gagal memparsing kredensial JSON:', e.message);
    process.exit(1);
  }

  // 2. Initialize Firebase Admin SDK for Staging using cert()
  const existingApps = getApps();
  const existingApp = existingApps.find(a => a.name === 'bfa-staging-provision-app');
  const app = existingApp || initializeApp({
    credential: cert(parsedCredential),
    projectId: STAGING_PROJECT_ID,
  }, 'bfa-staging-provision-app');

  const actualProjectId = app.options.projectId;
  console.log(`[Staging Admin Provision] Terhubung ke Firebase Project ID: "${actualProjectId}"`);

  // 3. Strict Project ID Validation
  if (actualProjectId !== STAGING_PROJECT_ID) {
    console.error(`[FATAL] Project ID aktif "${actualProjectId}" TIDAK SESUAI dengan target staging resmi ("${STAGING_PROJECT_ID}"). Eksekusi dihentikan.`);
    process.exit(1);
  }

  const authAdmin = getAuth(app);

  // 4. Fetch or Auto-Create User by Email
  console.log(`[Staging Admin Provision] Memeriksa akun dengan email: ${TARGET_ADMIN_EMAIL}...`);
  let userRecord;
  try {
    userRecord = await authAdmin.getUserByEmail(TARGET_ADMIN_EMAIL);
    console.log(`[SUCCESS] Akun sudah ada: UID = ${userRecord.uid}, Email = ${userRecord.email}`);
  } catch (err: any) {
    console.log(`[INFO] Akun ${TARGET_ADMIN_EMAIL} belum ada di project ${STAGING_PROJECT_ID}. Membuat akun baru otomatis...`);
    try {
      userRecord = await authAdmin.createUser({
        email: TARGET_ADMIN_EMAIL,
        password: DEFAULT_STAGING_ADMIN_PASSWORD,
        displayName: 'Administrator BFA Staging',
        emailVerified: true,
      });
      console.log(`[SUCCESS] Akun berhasil dibuat: UID = ${userRecord.uid}`);
    } catch (createErr: any) {
      console.error(`[FATAL] Gagal membuat akun admin:`, createErr.message);
      process.exit(1);
    }
  }

  // 5. Set Custom Claims (role: admin, admin: true)
  console.log(`[Staging Admin Provision] Menetapkan custom claims untuk UID ${userRecord.uid}...`);
  const customClaims = {
    role: 'admin',
    admin: true,
  };

  await authAdmin.setCustomUserClaims(userRecord.uid, customClaims);
  console.log('[SUCCESS] Custom claims berhasil ditetapkan.');

  // 6. Verify Claims using Admin SDK
  console.log(`[Staging Admin Provision] Memverifikasi ulang klaim pengguna...`);
  const refreshedUser = await authAdmin.getUser(userRecord.uid);
  console.log('----------------------------------------------------------------------');
  console.log('HASIL VERIFIKASI ADMIN SDK:');
  console.log(`- UID           : ${refreshedUser.uid}`);
  console.log(`- Email         : ${refreshedUser.email}`);
  console.log(`- Custom Claims :`, JSON.stringify(refreshedUser.customClaims, null, 2));
  console.log('----------------------------------------------------------------------');

  if (refreshedUser.customClaims?.role === 'admin' && refreshedUser.customClaims?.admin === true) {
    console.log('[STATUS: GO] Akun admin staging berhasil diprovisikan dan diverifikasi!');
  } else {
    console.error('[STATUS: NO-GO] Verifikasi klaim gagal.');
    process.exit(1);
  }
}

provisionStagingAdmin().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
