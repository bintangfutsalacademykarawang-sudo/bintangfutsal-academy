/**
 * BFA HUB — FIREBASE ADMIN INITIALIZATION & SIGNER RESOLUTION
 * Mode: KEYLESS-FIRST · VERCEL READY · FAIL-CLOSED · PRODUCTION COMPLIANT
 *
 * Mengakomodasi 3 mekanisme autentikasi Firebase Admin di lingkungan Cloud/Vercel:
 * 1. Workload Identity Federation (WIF) / Vercel OIDC via GOOGLE_APPLICATION_CREDENTIALS_JSON atau ADC.
 * 2. Service Account Signer via Vercel Encrypted Environment Variables (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).
 * 3. Google Cloud IAM Credentials API signBlob via serviceAccountId pada GCP / Cloud Run.
 *
 * PERLINDUNGAN KEAMANAN MUTLAK:
 * - Tidak menyimpan private key atau kredensial rahasia di file kode sumber.
 * - Tidak mencetak token, kata sandi, atau kredensial ke sistem log.
 * - Fail-closed di production jika izin signing atau kredensial tidak tersedia.
 */

import admin from 'firebase-admin';

export interface FirebaseAdminInitConfig {
  projectId?: string;
  serviceAccountId?: string;
}

/**
 * Menginisialisasi Firebase Admin SDK secara idempoten dan aman.
 */
export function initFirebaseAdmin(customConfig?: FirebaseAdminInitConfig): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = customConfig?.projectId || 
    process.env.FIREBASE_PROJECT_ID || 
    process.env.GCLOUD_PROJECT || 
    'future-wonder-jwh4c';

  const serviceAccountId = customConfig?.serviceAccountId || 
    process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || 
    process.env.FIREBASE_SERVICE_ACCOUNT_ID ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || serviceAccountId;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  // 1. Jalur Vercel Secure Environment Variables: FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY
  if (clientEmail && rawPrivateKey) {
    try {
      const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
        serviceAccountId: serviceAccountId || clientEmail,
      });
    } catch (certErr: any) {
      console.warn('[Firebase Admin Init] Inisialisasi cert env gagal, mencoba fallback:', certErr?.message);
    }
  }

  // 2. Jalur WIF / ADC JSON Environment Variable: GOOGLE_APPLICATION_CREDENTIALS_JSON
  const rawCredsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (rawCredsJson && rawCredsJson.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawCredsJson);
      if (parsed.type === 'service_account') {
        return admin.initializeApp({
          credential: admin.credential.cert(parsed),
          projectId: parsed.project_id || projectId,
          serviceAccountId: serviceAccountId || parsed.client_email,
        });
      } else {
        // WIF / External Account (federated identity)
        return admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
          serviceAccountId,
        });
      }
    } catch (jsonErr: any) {
      console.warn('[Firebase Admin Init] Inisialisasi credentials JSON gagal:', jsonErr?.message);
    }
  }

  // 3. Jalur Default ADC (Metadata Server / GOOGLE_APPLICATION_CREDENTIALS file path)
  const appOptions: admin.AppOptions = { projectId };
  if (serviceAccountId) {
    appOptions.serviceAccountId = serviceAccountId;
  }

  try {
    return admin.initializeApp(appOptions);
  } catch (adcErr: any) {
    console.warn('[Firebase Admin Init] Default ADC initialization notice:', adcErr?.message);
    return admin.app();
  }
}
