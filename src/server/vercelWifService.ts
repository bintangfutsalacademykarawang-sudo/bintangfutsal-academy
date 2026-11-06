/**
 * BFA HUB — VERCEL OIDC & GOOGLE CLOUD WORKLOAD IDENTITY FEDERATION (WIF) SERVICE
 * Mode: KEYLESS-FIRST · ZERO-TRUST · IN-MEMORY TOKEN CACHING · FAIL-CLOSED
 *
 * Service ini mengelola lifecycle Vercel OIDC token, pertukaran token Google STS,
 * impersonasi Service Account, dan penerbitan Firebase Custom Token tanpa kunci privat lokal.
 */

import {
  getRuntimeVercelOidcToken,
  exchangeOidcForGoogleStsToken,
  impersonateServiceAccount,
  signCustomTokenWithIam,
  generateFirebaseCustomTokenKeyless,
  WifSignerConfig,
} from './keylessWifSigner';

export interface VercelWifServiceOptions {
  wifAudience?: string;
  serviceAccountEmail?: string;
  projectId?: string;
  fetchFn?: typeof fetch;
}

export interface CachedTokenEntry {
  accessToken: string;
  expiresAt: number; // Unix timestamp dalam ms
}

export class VercelWifTokenService {
  private wifAudience?: string;
  private serviceAccountEmail?: string;
  private projectId?: string;
  private fetchFn: typeof fetch;

  private stsTokenCache: CachedTokenEntry | null = null;
  private saTokenCache: CachedTokenEntry | null = null;

  constructor(options: VercelWifServiceOptions = {}) {
    this.wifAudience = options.wifAudience || process.env.GCP_WORKLOAD_IDENTITY_PROVIDER || process.env.VERCEL_OIDC_AUDIENCE;
    this.serviceAccountEmail = options.serviceAccountEmail || process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_SERVICE_ACCOUNT_ID || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.projectId = options.projectId || process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'future-wonder-jwh4c';
    this.fetchFn = options.fetchFn || fetch;
  }

  /**
   * Memeriksa apakah variabel lingkungan WIF terkonfigurasi.
   */
  public isWifConfigured(): boolean {
    return Boolean(
      this.wifAudience && 
      this.wifAudience.startsWith('//iam.googleapis.com/') && 
      this.serviceAccountEmail && 
      this.serviceAccountEmail.includes('@')
    );
  }

  /**
   * Mengambil Vercel OIDC Token dari API resmi atau request header.
   */
  public async getVercelOidcToken(options?: { reqHeaders?: Record<string, string | string[] | undefined> }): Promise<string> {
    const token = await getRuntimeVercelOidcToken(options);
    if (!token) {
      throw new Error('[VercelWifService] FATAL: Vercel OIDC Token tidak ditemukan di runtime ini.');
    }
    return token;
  }

  /**
   * Menukarkan Vercel OIDC Token dengan Access Token Google STS (dengan caching in-memory).
   */
  public async getGoogleStsAccessToken(options?: { oidcToken?: string; reqHeaders?: any }): Promise<string> {
    if (!this.wifAudience) {
      throw new Error('[VercelWifService] FATAL: WIF Audience (GCP_WORKLOAD_IDENTITY_PROVIDER) belum disetel.');
    }

    const now = Date.now();
    if (this.stsTokenCache && this.stsTokenCache.expiresAt > now + 30000) {
      return this.stsTokenCache.accessToken;
    }

    const oidcToken = options?.oidcToken || (await this.getVercelOidcToken(options));
    const accessToken = await exchangeOidcForGoogleStsToken({
      oidcToken,
      wifAudience: this.wifAudience,
      fetchFn: this.fetchFn,
    });

    // Cache selama 55 menit (default Google STS expires in 3600 detik)
    this.stsTokenCache = {
      accessToken,
      expiresAt: now + 55 * 60 * 1000,
    };

    return accessToken;
  }

  /**
   * Melakukan impersonasi Service Account untuk mendapatkan Service Account Access Token.
   */
  public async getImpersonatedServiceAccountToken(options?: { oidcToken?: string; reqHeaders?: any }): Promise<string> {
    if (!this.serviceAccountEmail) {
      throw new Error('[VercelWifService] FATAL: Service Account Email (FIREBASE_SERVICE_ACCOUNT_EMAIL) belum disetel.');
    }

    const now = Date.now();
    if (this.saTokenCache && this.saTokenCache.expiresAt > now + 30000) {
      return this.saTokenCache.accessToken;
    }

    const stsAccessToken = await this.getGoogleStsAccessToken(options);
    const accessToken = await impersonateServiceAccount({
      stsAccessToken,
      serviceAccountEmail: this.serviceAccountEmail,
      fetchFn: this.fetchFn,
    });

    this.saTokenCache = {
      accessToken,
      expiresAt: now + 55 * 60 * 1000,
    };

    return accessToken;
  }

  /**
   * Menerbitkan Firebase Custom Token yang ditandatangani via IAM signBlob secara keyless.
   */
  public async issueFirebaseCustomToken(params: {
    uid: string;
    claims: Record<string, any>;
    oidcToken?: string;
    reqHeaders?: any;
  }): Promise<string> {
    const config: WifSignerConfig = {
      wifAudience: this.wifAudience,
      serviceAccountEmail: this.serviceAccountEmail,
      projectId: this.projectId,
      fetchFn: this.fetchFn,
    };

    return await generateFirebaseCustomTokenKeyless({
      uid: params.uid,
      claims: params.claims,
      config,
      oidcToken: params.oidcToken,
      fetchFn: this.fetchFn,
    });
  }

  /**
   * Menghapus cache token lokal (misal saat rotasi atau error terdeteksi).
   */
  public clearCache(): void {
    this.stsTokenCache = null;
    this.saTokenCache = null;
  }
}

// Instansi singleton default untuk penggunaan backend
export const vercelWifService = new VercelWifTokenService();
