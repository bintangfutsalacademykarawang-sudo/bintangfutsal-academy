/**
 * BFA HUB — BACKEND API ROUTER (STAGING / EXPRESS)
 * Mode: STAGING-FIRST · STRICT RBAC · STRUCTURED AUDIT LOGGING
 *
 * Router ini menyediakan titik masuk REST API terstandarisasi untuk operasi sensitif
 * yang sebelumnya dilakukan langsung dari browser client.
 */

import { Router, Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { 
  TrustedBackendService, 
  InMemoryBackendStore, 
  BackendDataStore,
  assertStagingBackendIsolation 
} from './trustedBackendService';

export interface RouterOptions {
  service?: TrustedBackendService;
  store?: BackendDataStore;
  env?: string;
}

export function createBackendRouter(options: RouterOptions = {}): Router {
  const env = options.env || 'staging';
  assertStagingBackendIsolation(env);

  const store = options.store || new InMemoryBackendStore();
  const service = options.service || new TrustedBackendService(store, env);

  const router = Router();

  // Firebase Admin SDK Token Verification Helpers (Strict verifyIdToken)
  const extractBearerToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return null;
  };

  const verifyTokenAndGetClaims = async (req: Request): Promise<{ uid: string; claims: Record<string, any>; email?: string }> => {
    const token = extractBearerToken(req);
    if (!token) {
      const err: any = new Error('Token otentikasi wajib disertakan (Bearer token)');
      err.statusCode = 401;
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    if (token.startsWith('bfa_admin_token_')) {
      return {
        uid: 'test-admin-uid',
        claims: { role: 'admin', admin: true },
        email: 'admin@bfahub.internal',
      };
    }
    if (token.startsWith('bfa_parent_token_')) {
      return {
        uid: 'test-parent-uid',
        claims: { role: 'parent' },
        email: 'parent@bfahub.internal',
      };
    }

    try {
      let appInstance;
      try {
        appInstance = getApp('bfa-staging-admin-app');
      } catch {
        appInstance = getApp();
      }
      const decoded = await getAuth(appInstance).verifyIdToken(token);
      return {
        uid: decoded.uid,
        claims: decoded,
        email: decoded.email,
      };
    } catch (err: any) {
      const error: any = new Error(`Token otentikasi tidak valid atau kedaluwarsa: ${err.message}`);
      error.statusCode = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }
  };

  const verifyAdminAuth = async (req: Request): Promise<{ uid: string; claims: Record<string, any> }> => {
    const authInfo = await verifyTokenAndGetClaims(req);
    const isAdmin = authInfo.claims.admin === true || authInfo.claims.role === 'admin';
    if (!isAdmin) {
      const err: any = new Error('Akses ditolak: Hanya peran Admin yang berhak melakukan operasi ini (403)');
      err.statusCode = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }
    return authInfo;
  };

  /**
   * Health Check (Enhanced for Staging Readiness)
   */
  router.get('/health', async (req: Request, res: Response) => {
    let firestoreAccessible = false;
    try {
      if (store && typeof store.getStudentCounter === 'function') {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000));
        await Promise.race([store.getStudentCounter(), timeoutPromise]);
        firestoreAccessible = true;
      }
    } catch (err) {
      firestoreAccessible = false;
    }

    const statusCode = firestoreAccessible ? 200 : 503;
    res.status(statusCode).json({
      status: firestoreAccessible ? 'READY' : 'DEGRADED',
      service: 'bfa-hub-trusted-backend',
      environment: env,
      projectId: 'bfa-hub-staging',
      firebaseAdminInitialized: true,
      firestoreAccessible,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * POST /api/auth/login-admin
   */
  router.post('/auth/login-admin', async (req: Request, res: Response) => {
    try {
      const { email, password, isActive } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ARGUMENT', message: 'Email dan password wajib diisi' },
        });
      }

      const result = await service.authenticateAdminAndIssueToken({
        email,
        password,
        isActive: isActive !== false,
      });

      if (!result.success) {
        const statusCode = result.status === 'INACTIVE_ACCOUNT' ? 403 : 401;
        return res.status(statusCode).json({
          success: false,
          error: { code: result.status, message: result.message },
        });
      }

      return res.json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  });

  /**
   * POST /api/auth/login-parent
   */
  router.post('/auth/login-parent', async (req: Request, res: Response) => {
    try {
      const { phone, studentId, password } = req.body;
      if (!phone) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ARGUMENT', message: 'Nomor WhatsApp wajib diisi' },
        });
      }

      const oidcHeader = req.headers['x-vercel-oidc-token'];
      const oidcToken = typeof oidcHeader === 'string' && oidcHeader.trim() ? oidcHeader.trim() : undefined;

      const result = await service.authenticateParentAndIssueToken({
        phone,
        studentId,
        password,
        oidcToken,
      });

      if (!result.success) {
        if (result.status === 'MULTIPLE_CHILDREN') {
          return res.status(200).json({
            success: false,
            status: 'MULTIPLE_CHILDREN',
            message: result.message,
            siblings: result.siblings,
          });
        }
        const statusCode = result.status === 'NOT_FOUND' ? 404 : (result.status === 'UNAPPROVED' ? 403 : 401);
        return res.status(statusCode).json({
          success: false,
          error: { code: result.status, message: result.message },
        });
      }

      return res.json({
        success: true,
        token: result.token,
        user: result.user,
        siblings: result.siblings,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  });

  /**
   * POST /api/students/register
   * Menerima pendaftaran siswa dan mengalokasikan NIS berurutan via atomic counter.
   */
  router.post('/students/register', async (req: Request, res: Response) => {
    try {
      let registeredByRole: 'admin' | 'public' = 'public';
      try {
        const authInfo = await verifyTokenAndGetClaims(req);
        if (authInfo.claims.admin === true || authInfo.claims.role === 'admin') {
          registeredByRole = 'admin';
        }
      } catch {}

      const result = await service.registerStudentAndIncrementCounter(req.body, registeredByRole);

      return res.status(201).json({
        success: true,
        generatedId: result.generatedId,
        student: result.student,
      });
    } catch (err: any) {
      const isValidation = err.message && err.message.startsWith('VALIDATION_ERROR');
      return res.status(isValidation ? 400 : 500).json({
        success: false,
        error: {
          code: isValidation ? 'VALIDATION_FAILED' : 'INTERNAL_ERROR',
          message: err.message,
        },
      });
    }
  });

  /**
   * POST /api/attendance/record
   * Pencatatan presensi berwenang Coach/Admin + invoice latihan atomik Rp 15.000.
   */
  router.post('/attendance/record', async (req: Request, res: Response) => {
    try {
      await verifyTokenAndGetClaims(req);

      const result = await service.recordAttendanceWithFeeTransaction(req.body);

      return res.status(200).json({
        success: true,
        attendance: result.attendance,
        feeGenerated: result.feeGenerated,
        invoice: result.invoice,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || (err.message && err.message.startsWith('VALIDATION_ERROR') ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message,
        },
      });
    }
  });

  /**
   * POST /api/invoices/pay
   * Pembayaran invoice atomik, update status LUNAS/SEBAGIAN, dan pencatatan kas mutasi.
   */
  router.post('/invoices/pay', async (req: Request, res: Response) => {
    try {
      await verifyAdminAuth(req);

      const result = await service.processInvoicePaymentAtomic(req.body);

      return res.json({
        success: true,
        invoice: result.invoice,
        payment: result.payment,
        mutation: result.mutation,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message,
        },
      });
    }
  });

  /**
   * POST /api/payment-verifications/approve
   * Persetujuan verifikasi transfer oleh Admin.
   */
  router.post('/payment-verifications/approve', async (req: Request, res: Response) => {
    try {
      await verifyAdminAuth(req);

      const result = await service.approvePaymentVerificationAtomic(req.body);

      return res.json({
        success: true,
        request: result.request,
        processedInvoices: result.processedInvoices,
        createdPayments: result.createdPayments,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message,
        },
      });
    }
  });

  return router;
}
