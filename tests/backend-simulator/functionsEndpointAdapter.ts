/**
 * BFA HUB — LOCAL FUNCTIONS ENDPOINT ADAPTER (TAHAP 5B-7C)
 * Mode: STRICT LOCAL-ONLY · EMULATOR-ONLY · SYNTHETIC DATA ONLY · NO CLOUD/PRODUCTION
 * 
 * Modul ini mengekspos endpoint HTTP lokal (loopback 127.0.0.1:5001) untuk mensimulasikan
 * Firebase Cloud Functions / Callable Functions secara ketat di lingkungan lokal.
 * DILARANG MENGIMPOR MODUL INI KE DALAM src/ ATAU BUNDLE FRONTEND CLIENT.
 */

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import {
  EMULATOR_PROJECT_ID,
  EMULATOR_AUTH_HOST,
  EMULATOR_AUTH_PORT,
  EMULATOR_FIRESTORE_HOST,
  EMULATOR_FIRESTORE_PORT,
  AdminContext,
  assertTrustedBackendIsolationGuard,
  getTrustedAdminInstance,
  approveStudentAndProvisionAuth,
  resetStudentPasswordByAdmin,
} from './trustedBackend';

export const FUNCTIONS_EMULATOR_PORT = 5001;
export const FUNCTIONS_EMULATOR_HOST = '127.0.0.1';

export interface AuthenticatedRequest extends Request {
  adminContext?: AdminContext;
}

/**
 * Validasi port dan host Functions Emulator
 */
export function assertFunctionsLoopbackGuard(host: string, port: number): void {
  assertTrustedBackendIsolationGuard();

  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error(
      `[Functions Guard] FATAL: Host "${host}" ditolak. ` +
      `Functions Emulator HANYA diizinkan berjalan pada loopback 127.0.0.1 atau localhost.`
    );
  }

  if (port !== FUNCTIONS_EMULATOR_PORT) {
    throw new Error(
      `[Functions Guard] FATAL: Port "${port}" tidak sesuai spesifikasi loopback ${FUNCTIONS_EMULATOR_PORT}.`
    );
  }
}

/**
 * Middleware Server-Side: Verifikasi Token & Otorisasi Admin
 * PENTING: Dilarang keras menerima klaim peran 'admin' dari body JSON yang dikirimkan client.
 * Hak akses admin HANYA bersumber dari klaim kriptografis yang diverifikasi oleh Firebase Auth Emulator.
 */
export async function requireVerifiedAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Akses ditolak: Header Authorization Bearer wajib disertakan.',
      },
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Akses ditolak: Token autentikasi kosong.',
      },
    });
    return;
  }

  try {
    const { auth } = getTrustedAdminInstance();
    // Verifikasi token dengan pemeriksaan revokasi menggunakan Firebase Admin SDK terhadap Auth Emulator lokal
    const decodedToken = await auth.verifyIdToken(idToken, true);

    // Verifikasi klaim peran admin dari token resmi
    const isRoleAdmin = decodedToken.role === 'admin' || decodedToken.admin === true;
    if (!isRoleAdmin) {
      res.status(403).json({
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Akses ditolak: Operasi ini membutuhkan wewenang peran admin terverifikasi.',
        },
      });
      return;
    }

    // Set context admin tepercaya dari decoded token
    req.adminContext = {
      uid: decodedToken.uid,
      role: 'admin',
      email: decodedToken.email || 'admin@demo-bfa-hub.test',
      displayName: decodedToken.name,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: `Token tidak valid atau kedaluwarsa: ${err.message}`,
      },
    });
  }
}

/**
 * Membuat instance Express App untuk Functions Emulator lokal
 */
export function createFunctionsApp(): express.Express {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      service: 'bfa-hub-local-functions-emulator',
      status: 'ONLINE',
      project: EMULATOR_PROJECT_ID,
    });
  });

  // Handler untuk Approve Student & Provision Auth
  const handleApprove = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const adminContext = req.adminContext!;
      // Mendukung format payload direct ({ studentId, registrationId }) maupun Firebase Callable ({ data: { ... } })
      const body = req.body?.data || req.body || {};
      const { studentId, registrationId } = body;

      if (!studentId || !registrationId) {
        res.status(400).json({
          error: {
            code: 'INVALID_ARGUMENT',
            message: 'Parameter studentId dan registrationId wajib disertakan.',
          },
        });
        return;
      }

      const result = await approveStudentAndProvisionAuth(adminContext, {
        studentId,
        registrationId,
      });

      res.status(200).json({
        result,
      });
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('REGISTRATION_NOT_FOUND')) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: msg } });
      } else if (msg.includes('REGISTRATION_REJECTED') || msg.includes('INVALID_ARGUMENTS')) {
        res.status(400).json({ error: { code: 'FAILED_PRECONDITION', message: msg } });
      } else {
        res.status(500).json({ error: { code: 'INTERNAL', message: msg } });
      }
    }
  };

  // Handler untuk Reset Student Password
  const handleResetPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const adminContext = req.adminContext!;
      const body = req.body?.data || req.body || {};
      const { studentId } = body;

      if (!studentId) {
        res.status(400).json({
          error: {
            code: 'INVALID_ARGUMENT',
            message: 'Parameter studentId wajib disertakan.',
          },
        });
        return;
      }

      const result = await resetStudentPasswordByAdmin(adminContext, {
        studentId,
      });

      res.status(200).json({
        result,
      });
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('STUDENT_NOT_FOUND')) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: msg } });
      } else if (msg.includes('RATE_LIMIT_EXCEEDED')) {
        res.status(429).json({ error: { code: 'RESOURCE_EXHAUSTED', message: msg } });
      } else if (msg.includes('STUDENT_AUTH_NOT_PROVISIONED')) {
        res.status(400).json({ error: { code: 'FAILED_PRECONDITION', message: msg } });
      } else {
        res.status(500).json({ error: { code: 'INTERNAL', message: msg } });
      }
    }
  };

  // Endpoint dengan format Firebase Cloud Functions standard:
  // /<project-id>/us-central1/<functionName>
  app.post(
    `/${EMULATOR_PROJECT_ID}/us-central1/approveStudentAndProvisionAuth`,
    requireVerifiedAdminAuth,
    handleApprove
  );
  app.post(
    `/${EMULATOR_PROJECT_ID}/us-central1/resetStudentPasswordByAdmin`,
    requireVerifiedAdminAuth,
    handleResetPassword
  );

  // Alias REST routes
  app.post('/api/approveStudentAndProvisionAuth', requireVerifiedAdminAuth, handleApprove);
  app.post('/api/resetStudentPasswordByAdmin', requireVerifiedAdminAuth, handleResetPassword);

  return app;
}

export interface RunningFunctionsServer {
  server: http.Server;
  host: string;
  port: number;
  url: string;
  close: () => Promise<void>;
}

/**
 * Menjalankan server HTTP Functions Emulator lokal pada host loopback dan port 5001
 */
export async function startFunctionsEndpointServer(
  host: string = FUNCTIONS_EMULATOR_HOST,
  port: number = FUNCTIONS_EMULATOR_PORT
): Promise<RunningFunctionsServer> {
  assertFunctionsLoopbackGuard(host, port);

  const app = createFunctionsApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.listen(port, host, () => {
      resolve();
    });
    server.on('error', reject);
  });

  const url = `http://${host}:${port}`;

  return {
    server,
    host,
    port,
    url,
    close: async () => {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}
