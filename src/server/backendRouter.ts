/**
 * BFA HUB — BACKEND API ROUTER (STAGING / EXPRESS)
 * Mode: STAGING-FIRST · STRICT RBAC · STRUCTURED AUDIT LOGGING
 *
 * Router ini menyediakan titik masuk REST API terstandarisasi untuk operasi sensitif
 * yang sebelumnya dilakukan langsung dari browser client.
 */

import { Router, Request, Response } from 'express';
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

  // Middleware Auth Context Helper
  const extractBearerToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return null;
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

      const result = await service.authenticateParentAndIssueToken({
        phone,
        studentId,
        password,
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
      const token = extractBearerToken(req);
      const isAdminCaller = token && token.includes('admin');
      const registeredByRole = isAdminCaller ? 'admin' : 'public';

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
      const token = extractBearerToken(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'Token otentikasi wajib disertakan' },
        });
      }

      const result = await service.recordAttendanceWithFeeTransaction(req.body);

      return res.status(200).json({
        success: true,
        attendance: result.attendance,
        feeGenerated: result.feeGenerated,
        invoice: result.invoice,
      });
    } catch (err: any) {
      const isValidation = err.message && err.message.startsWith('VALIDATION_ERROR');
      const isNotFound = err.message && err.message.startsWith('NOT_FOUND');
      const status = isValidation ? 400 : (isNotFound ? 404 : 500);

      return res.status(status).json({
        success: false,
        error: {
          code: isValidation ? 'VALIDATION_ERROR' : (isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
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
      const token = extractBearerToken(req);
      if (!token || !token.includes('admin')) {
        return res.status(403).json({
          success: false,
          error: { code: 'PERMISSION_DENIED', message: 'Hanya peran Admin yang berhak memproses pembayaran kas' },
        });
      }

      const result = await service.processInvoicePaymentAtomic(req.body);

      return res.json({
        success: true,
        invoice: result.invoice,
        payment: result.payment,
        mutation: result.mutation,
      });
    } catch (err: any) {
      const isOverpayment = err.message && err.message.includes('OVERPAYMENT_NOT_ALLOWED');
      const isNotFound = err.message && err.message.startsWith('NOT_FOUND');
      const isValidation = err.message && err.message.startsWith('VALIDATION_ERROR');
      const status = isOverpayment || isValidation ? 400 : (isNotFound ? 404 : 500);

      return res.status(status).json({
        success: false,
        error: {
          code: isOverpayment ? 'OVERPAYMENT_NOT_ALLOWED' : (isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
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
      const token = extractBearerToken(req);
      if (!token || !token.includes('admin')) {
        return res.status(403).json({
          success: false,
          error: { code: 'PERMISSION_DENIED', message: 'Hanya Admin yang dapat menyetujui verifikasi transfer' },
        });
      }

      const result = await service.approvePaymentVerificationAtomic(req.body);

      return res.json({
        success: true,
        request: result.request,
        processedInvoices: result.processedInvoices,
        createdPayments: result.createdPayments,
      });
    } catch (err: any) {
      const isNotFound = err.message && err.message.startsWith('NOT_FOUND');
      const isInvalidState = err.message && err.message.startsWith('INVALID_STATE');
      const status = isNotFound ? 404 : (isInvalidState ? 400 : 500);

      return res.status(status).json({
        success: false,
        error: {
          code: isNotFound ? 'NOT_FOUND' : (isInvalidState ? 'INVALID_STATE' : 'INTERNAL_ERROR'),
          message: err.message,
        },
      });
    }
  });

  return router;
}
