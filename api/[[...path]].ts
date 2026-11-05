/**
 * BFA HUB — VERCEL SERVERLESS CATCH-ALL ROUTING FUNCTION
 * Mode: STAGING-FIRST · SERVERLESS · FAIL-CLOSED ISOLATION
 */

import express from 'express';
import { createBackendRouter } from '../src/server/backendRouter';
import { FirestoreBackendStore } from '../src/server/firestoreBackendStore';
import { initFirebaseAdmin } from '../src/server/firebaseAdminInit';

// Inisialisasi Firebase Admin untuk lingkungan Vercel Serverless
initFirebaseAdmin();

const app = express();
app.use(express.json());

let store: FirestoreBackendStore | undefined;
try {
  store = new FirestoreBackendStore('bfa-hub-staging');
  console.log('[Vercel Catch-All] Successfully initialized FirestoreBackendStore for bfa-hub-staging.');
} catch (err: any) {
  console.error('[Vercel Catch-All] FATAL: Failed to initialize FirestoreBackendStore:', err.message);
}

const apiRouter = createBackendRouter({ store: store as any, env: 'staging' });
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Express Catch-All 404 & Error Handler for Vercel Serverless Function
app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint API Vercel tidak ditemukan.',
    },
  });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  const statusCode = err?.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: err?.code || 'INTERNAL_ERROR',
      message: err?.message || 'Terjadi kesalahan internal pada Vercel Serverless Function.',
    },
  });
});

export default app;
