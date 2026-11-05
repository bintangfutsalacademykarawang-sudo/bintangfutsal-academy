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

export default app;
