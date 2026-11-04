/**
 * BFA HUB — PRODUCTION ADMIN SECOND ACCOUNT PROVISIONING CLI
 * Target Project ID: future-wonder-jwh4c
 * Mode: DRY-RUN BY DEFAULT · STRICT SERVICE ACCOUNT FILE VALIDATION · CLI ONLY
 * 
 * Cara menjalankan dry-run:
 * GOOGLE_APPLICATION_CREDENTIALS='path/to/prod-sa.json' npx tsx scripts/provision-prod-admin.ts admin2@bfa.my.id
 * 
 * Cara menjalankan apply sungguhan:
 * GOOGLE_APPLICATION_CREDENTIALS='path/to/prod-sa.json' npx tsx scripts/provision-prod-admin.ts admin2@bfa.my.id --apply
 */

import fs from 'fs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const PROD_PROJECT_ID = 'future-wonder-jwh4c';

async function main() {
  const args = process.argv.slice(2);
  const targetEmail = args.find(arg => !arg.startsWith('--'));
  const isApply = args.includes('--apply');

  if (!targetEmail || !targetEmail.includes('@')) {
    console.error('[ERROR] Mohon masukkan email target admin sebagai argumen CLI.');
    console.error('Contoh: GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/provision-prod-admin.ts admin2@bfa.my.id [--apply]');
    process.exit(1);
  }

  console.log('======================================================================');
  console.log('BFA HUB — PRODUCTION ADMIN PROVISIONING CLI (future-wonder-jwh4c)');
  console.log(`Mode: ${isApply ? 'APPLY (Perubahan Aktif)' : 'DRY-RUN (Simulasi Saja)'}`);
  console.log('======================================================================');
  console.log(`Target Email: ${targetEmail}`);

  // 1. Strict Validation of GOOGLE_APPLICATION_CREDENTIALS File JSON before initializeApp
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath || !fs.existsSync(credPath)) {
    console.error('[FATAL] Variabel lingkungan GOOGLE_APPLICATION_CREDENTIALS wajib diisi dengan path ke file Service Account JSON produksi yang valid.');
    console.error('[FATAL] Fallback ke applicationDefault() ditolak keras untuk provisioning produksi.');
    process.exit(1);
  }

  let serviceAccount: any;
  try {
    const fileContent = fs.readFileSync(credPath, 'utf8');
    serviceAccount = JSON.parse(fileContent);
  } catch (err: any) {
    console.error('[FATAL] Gagal membaca atau memparsing file Service Account JSON dari path yang diberikan:', err.message);
    process.exit(1);
  }

  if (!serviceAccount.project_id || serviceAccount.project_id !== PROD_PROJECT_ID) {
    console.error(`[FATAL] Project ID di dalam Service Account file ("${serviceAccount.project_id}") TIDAK SESUAI dengan target produksi resmi ("${PROD_PROJECT_ID}"). Eksekusi dihentikan.`);
    process.exit(1);
  }

  console.log(`[Prod Provision] Verifikasi file Service Account sukses. Target Project ID: "${serviceAccount.project_id}"`);

  // 2. Initialize Firebase Admin SDK using verified cert() credential
  const existingApps = getApps();
  const existingApp = existingApps.find(a => a.name === 'bfa-prod-verified-provision-app');
  const app = existingApp || initializeApp({
    credential: cert(serviceAccount),
    projectId: PROD_PROJECT_ID,
  }, 'bfa-prod-verified-provision-app');

  const authAdmin = getAuth(app);

  // 3. Find User by Email via getUserByEmail
  console.log(`[Prod Provision] Mencari akun dengan email: ${targetEmail}...`);
  let userRecord;
  try {
    userRecord = await authAdmin.getUserByEmail(targetEmail);
    console.log(`[SUCCESS] Akun ditemukan!`);
    console.log(`- UID   : ${userRecord.uid}`);
    console.log(`- Email : ${userRecord.email}`);
  } catch (err: any) {
    console.error(`[FATAL] Akun dengan email ${targetEmail} tidak ditemukan di Firebase Auth project ${PROD_PROJECT_ID}.`);
    console.error('Silakan buat akun tersebut terlebih dahulu di Firebase Console Authentication sebelum menjalankan skrip ini.');
    process.exit(1);
  }

  // 4. Read Existing Custom Claims
  const existingClaims = userRecord.customClaims || {};
  console.log(`[Prod Provision] Custom claims saat ini:`, JSON.stringify(existingClaims));

  // 5. Build New Claims with Spread (preserving old claims)
  const newClaims = {
    ...existingClaims,
    role: 'admin',
    admin: true,
  };
  console.log(`[Prod Provision] Custom claims baru yang akan disematkan:`, JSON.stringify(newClaims));

  if (!isApply) {
    console.log('\n[INFO] Skrip berjalan dalam mode DRY-RUN (Simulasi). setCustomUserClaims TIDAK dipanggil.');
    console.log('Untuk menerapkan perubahan secara nyata, jalankan kembali dengan menyertakan argumen: --apply');
    console.log('Contoh: GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/provision-prod-admin.ts admin2@bfa.my.id --apply');
    process.exit(0);
  }

  // 6. Apply Changes only if --apply flag is present and verified
  console.log(`\n[APPLY] Menerapkan custom claims untuk UID ${userRecord.uid}...`);
  await authAdmin.setCustomUserClaims(userRecord.uid, newClaims);
  console.log('[SUCCESS] setCustomUserClaims berhasil dieksekusi.');

  // 7. Post-Verification
  console.log(`[APPLY] Memverifikasi ulang klaim akun dari server...`);
  const refreshedUser = await authAdmin.getUser(userRecord.uid);
  console.log('----------------------------------------------------------------------');
  console.log('HASIL VERIFIKASI AKHIR ADMIN SDK:');
  console.log(`- UID           : ${refreshedUser.uid}`);
  console.log(`- Email         : ${refreshedUser.email}`);
  console.log(`- Custom Claims :`, JSON.stringify(refreshedUser.customClaims, null, 2));
  console.log('----------------------------------------------------------------------');

  if (refreshedUser.customClaims?.role === 'admin' && refreshedUser.customClaims?.admin === true) {
    console.log('[STATUS: GO] Akun admin produksi kedua berhasil diprovisikan dengan hak penuh!');
  } else {
    console.error('[STATUS: NO-GO] Verifikasi klaim akhir gagal.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
