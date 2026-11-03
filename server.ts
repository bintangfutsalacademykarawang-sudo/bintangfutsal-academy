/**
 * BFA HUB — PRODUCTION SERVER ENTRYPOINT (EXPRESS + VITE / STATIC)
 * Mode: STAGING & PRODUCTION READY · CLOUD RUN COMPATIBLE · FIRESTORE BACKEND STORE WIRING
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createBackendRouter } from './src/server/backendRouter';
import { FirestoreBackendStore } from './src/server/firestoreBackendStore';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Inisialisasi FirestoreBackendStore nyata untuk Staging (bfa-hub-staging)
  // Gagal secara tertutup (Fail-Closed) jika kredensial / konfigurasi tidak tersedia.
  let store: FirestoreBackendStore;
  try {
    store = new FirestoreBackendStore('bfa-hub-staging');
    console.log('[BFA HUB Server] Berhasil menginisialisasi FirestoreBackendStore untuk bfa-hub-staging.');
  } catch (err: any) {
    console.error('[BFA HUB Server] FATAL: Gagal menghubungkan ke Firestore Staging Repository:', err.message);
    process.exit(1);
  }

  // Mount Trusted Backend API Router dengan FirestoreBackendStore
  const apiRouter = createBackendRouter({ store, env: 'staging' });
  app.use('/api', apiRouter);

  const isProd = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  if (isProd || fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))) {
    // Serve static frontend build in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Use Vite dev server middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[BFA HUB Production Server] Running on http://0.0.0.0:${port} (Production mode: ${isProd})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start BFA HUB server:', err);
  process.exit(1);
});
