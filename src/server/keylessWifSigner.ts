/**
 * BFA HUB — KEYLESS WORKLOAD IDENTITY FEDERATION (WIF) SIGNER
 * Mode: VERCEL OIDC -> GOOGLE STS -> SERVICE ACCOUNT IMPERSONATION -> IAM signBlob
 *
 * Mengimplementasikan alur keyless autentikasi resmi:
 * 1. Pengambilan Vercel OIDC Token via @vercel/oidc (getVercelOidcToken) atau header runtime.
 * 2. Penukaran OIDC Token dengan Google Federated Access Token via Google STS.
 * 3. Impersonasi Service Account BFA HUB via IAM Credentials API (generateAccessToken).
 * 4. Penandatanganan JWT Custom Token Firebase secara kriptografis via IAM Credentials API (signBlob).
 *
 * KEAMANAN:
 * - Tidak ada kunci privat (private key) yang disimpan di file repositori atau memory permanen.
 * - Eksekusi per-request strictly in-memory (bebas race condition antar-request serverless).
 * - Menolak input token dari parameter request/URL (hanya dari API runtime Vercel resmi).
 * - Tidak mencetak token atau kredensial rahasia ke log console.
 */

import { getVercelOidcToken } from '@vercel/oidc';

export interface WifSignerConfig {
  wifAudience?: string; // //iam.googleapis.com/projects/{PROJECT_NUMBER}/locations/global/workloadIdentityPools/{POOL}/providers/{PROVIDER}
  serviceAccountEmail?: string;
  projectId?: string;
  fetchFn?: typeof fetch;
}

export function base64UrlEncode(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 1. Mengambil Vercel OIDC token dari API resmi @vercel/oidc atau header request runtime.
 */
export async function getRuntimeVercelOidcToken(options?: {
  reqHeaders?: Record<string, string | string[] | undefined>;
}): Promise<string | null> {
  // A. Coba API resmi @vercel/oidc
  try {
    const token = await getVercelOidcToken();
    if (token && typeof token === 'string' && token.trim().length > 0) {
      return token.trim();
    }
  } catch (err: any) {
    // Abaikan jika tidak berjalan di environment Vercel runtime
  }

  // B. Fallback ke header resmi Vercel x-vercel-oidc-token jika diteruskan dari request handler
  if (options?.reqHeaders) {
    const headerVal = options.reqHeaders['x-vercel-oidc-token'];
    if (typeof headerVal === 'string' && headerVal.trim().length > 0) {
      return headerVal.trim();
    }
    if (Array.isArray(headerVal) && headerVal.length > 0 && typeof headerVal[0] === 'string') {
      return headerVal[0].trim();
    }
  }

  // C. Fallback ke environment variable VERCEL_OIDC_TOKEN (untuk local CLI vercel env pull)
  if (process.env.VERCEL_OIDC_TOKEN && process.env.VERCEL_OIDC_TOKEN.trim().length > 0) {
    return process.env.VERCEL_OIDC_TOKEN.trim();
  }

  return null;
}

/**
 * 2. Menukarkan Vercel OIDC Token dengan Google Federated Access Token via Google Security Token Service (STS).
 */
export async function exchangeOidcForGoogleStsToken(params: {
  oidcToken: string;
  wifAudience: string;
  fetchFn?: typeof fetch;
}): Promise<string> {
  const { oidcToken, wifAudience, fetchFn = fetch } = params;

  if (!oidcToken || !oidcToken.trim()) {
    throw new Error('Vercel OIDC token kosong atau tidak valid.');
  }
  if (!wifAudience || !wifAudience.trim() || !wifAudience.startsWith('//iam.googleapis.com/')) {
    throw new Error(`WIF Audience tidak valid: "${wifAudience}". Harus diawali dengan "//iam.googleapis.com/".`);
  }

  const stsBody = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    audience: wifAudience.trim(),
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    subject_token: oidcToken.trim(),
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
  });

  const res = await fetchFn('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: stsBody.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Google STS Token Exchange gagal (${res.status}): ${data.error_description || data.error || JSON.stringify(data)}`);
  }

  if (!data.access_token) {
    throw new Error('Google STS tidak mengembalikan access_token.');
  }

  return data.access_token;
}

/**
 * 3. Melakukan impersonasi Service Account target untuk mendapatkan Service Account Access Token.
 */
export async function impersonateServiceAccount(params: {
  stsAccessToken: string;
  serviceAccountEmail: string;
  fetchFn?: typeof fetch;
}): Promise<string> {
  const { stsAccessToken, serviceAccountEmail, fetchFn = fetch } = params;

  if (!serviceAccountEmail || !serviceAccountEmail.includes('@')) {
    throw new Error(`Email Service Account tidak valid: "${serviceAccountEmail}".`);
  }

  const url = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccountEmail)}:generateAccessToken`;
  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stsAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scope: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/identitytoolkit',
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Service Account impersonation gagal (${res.status}): ${data.error?.message || JSON.stringify(data)}`);
  }

  if (!data.accessToken) {
    throw new Error('IAM Credentials tidak mengembalikan accessToken impersonasi.');
  }

  return data.accessToken;
}

/**
 * 4. Menandatangani JWT Custom Token Firebase secara kriptografis menggunakan IAM Credentials API signBlob.
 */
export async function signCustomTokenWithIam(params: {
  saAccessToken: string;
  serviceAccountEmail: string;
  unsignedToken: string;
  fetchFn?: typeof fetch;
}): Promise<string> {
  const { saAccessToken, serviceAccountEmail, unsignedToken, fetchFn = fetch } = params;

  const url = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccountEmail)}:signBlob`;
  const base64Payload = Buffer.from(unsignedToken, 'utf8').toString('base64');

  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${saAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload: base64Payload,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`IAM signBlob gagal (${res.status}): ${data.error?.message || JSON.stringify(data)}`);
  }

  if (!data.signedBlob) {
    throw new Error('IAM signBlob tidak mengembalikan signature signedBlob.');
  }

  // Ubah standard base64 signature menjadi base64url
  const signatureUrlSafe = data.signedBlob
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${unsignedToken}.${signatureUrlSafe}`;
}

/**
 * 5. Pipeline lengkap penerbitan Custom Token Firebase secara keyless melalui Vercel OIDC + Google WIF.
 */
export async function generateFirebaseCustomTokenKeyless(params: {
  uid: string;
  claims: Record<string, any>;
  config?: WifSignerConfig;
  oidcToken?: string;
  fetchFn?: typeof fetch;
}): Promise<string> {
  const { uid, claims, config, fetchFn = fetch } = params;

  const wifAudience = config?.wifAudience || 
    process.env.GCP_WORKLOAD_IDENTITY_PROVIDER || 
    process.env.VERCEL_OIDC_AUDIENCE;

  const serviceAccountEmail = config?.serviceAccountEmail || 
    process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || 
    process.env.FIREBASE_SERVICE_ACCOUNT_ID;

  if (!wifAudience) {
    throw new Error('Konfigurasi WIF Audience (GCP_WORKLOAD_IDENTITY_PROVIDER) belum disetel.');
  }
  if (!serviceAccountEmail) {
    throw new Error('Konfigurasi Service Account Email (FIREBASE_SERVICE_ACCOUNT_EMAIL) belum disetel.');
  }

  // 1. Dapatkan Vercel OIDC token
  let oidcToken = params.oidcToken;
  if (!oidcToken) {
    oidcToken = await getRuntimeVercelOidcToken() || undefined;
  }
  if (!oidcToken) {
    throw new Error('OIDC Token Vercel tidak ditemukan pada runtime ini.');
  }

  // 2. Google STS Token Exchange
  const stsToken = await exchangeOidcForGoogleStsToken({
    oidcToken,
    wifAudience,
    fetchFn,
  });

  // 3. Service Account Impersonation
  const saToken = await impersonateServiceAccount({
    stsAccessToken: stsToken,
    serviceAccountEmail,
    fetchFn,
  });

  // 4. Susun struktur JWT Firebase Custom Token standar
  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const jwtPayload = {
    iss: serviceAccountEmail,
    sub: serviceAccountEmail,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
    claims,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(jwtHeader));
  const payloadEncoded = base64UrlEncode(JSON.stringify(jwtPayload));
  const unsignedToken = `${headerEncoded}.${payloadEncoded}`;

  // 5. Tandatangani secara resmi via IAM signBlob
  const customToken = await signCustomTokenWithIam({
    saAccessToken: saToken,
    serviceAccountEmail,
    unsignedToken,
    fetchFn,
  });

  return customToken;
}
