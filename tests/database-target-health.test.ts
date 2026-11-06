/**
 * BFA HUB — DATABASE TARGET & HEALTH ENDPOINT VERIFICATION TEST
 * Mode: UNIT / INTEGRATION TEST FOR FIRESTORE DATABASE ID & HEALTH ROUTE
 */

import assert from 'assert';
import { 
  PRODUCTION_PROJECT_ID, 
  STAGING_PROJECT_ID, 
  PRODUCTION_DATABASE_ID, 
  STAGING_DATABASE_ID,
  assertStagingIsolationGuard 
} from '../src/server/firestoreBackendStore';
import { createBackendRouter } from '../src/server/backendRouter';
import { InMemoryBackendStore } from '../src/server/trustedBackendService';

async function runDatabaseTargetHealthTests() {
  let passed = 0;
  let failed = 0;

  function testAssert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  console.log('======================================================================');
  console.log('BFA HUB — SUITE AUDIT DATABASE TARGET & HEALTH ENDPOINT');
  console.log('======================================================================');

  // 1. Verifikasi Konstanta Database ID
  testAssert(PRODUCTION_PROJECT_ID === 'future-wonder-jwh4c', '1.1 PRODUCTION_PROJECT_ID bernilai future-wonder-jwh4c');
  testAssert(
    PRODUCTION_DATABASE_ID === 'ai-studio-bfahubbintangfut-e02f4d35-ecd3-486e-9ee5-9fa8b9a78283',
    '1.2 PRODUCTION_DATABASE_ID bernilai ai-studio-bfahubbintangfut-e02f4d35-ecd3-486e-9ee5-9fa8b9a78283'
  );
  testAssert(STAGING_PROJECT_ID === 'bfa-hub-staging', '1.3 STAGING_PROJECT_ID bernilai bfa-hub-staging');
  testAssert(STAGING_DATABASE_ID === '(default)', '1.4 STAGING_DATABASE_ID bernilai (default)');

  // 2. Isolasi Guard Test
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  process.env.GCLOUD_PROJECT = 'future-wonder-jwh4c';

  let guardBlocked = false;
  try {
    assertStagingIsolationGuard('bfa-hub-staging');
  } catch (err: any) {
    if (err.message.includes('Proyek produksi "future-wonder-jwh4c" terdeteksi pada mode staging')) {
      guardBlocked = true;
    }
  }
  testAssert(guardBlocked, '2.1 Staging isolation guard memblokir project produksi pada mode dev/staging');

  process.env.NODE_ENV = originalEnv;
  delete process.env.GCLOUD_PROJECT;

  // 3. Health Endpoint Reporting Actual Target
  class CustomMockStore extends InMemoryBackendStore {
    public override readonly projectId = 'future-wonder-jwh4c';
    public override readonly databaseId = 'ai-studio-bfahubbintangfut-e02f4d35-ecd3-486e-9ee5-9fa8b9a78283';
  }

  const mockStore = new CustomMockStore();
  const router = createBackendRouter({ store: mockStore, env: 'production' });

  let capturedStatus: number = 0;
  let capturedJson: any = null;

  const req: any = { method: 'GET', url: '/health' };
  const res: any = {
    status: (code: number) => {
      capturedStatus = code;
      return res;
    },
    json: (data: any) => {
      capturedJson = data;
      return res;
    }
  };

  const healthRoute = (router as any).stack.find((layer: any) => layer.route?.path === '/health');
  if (healthRoute) {
    await healthRoute.route.stack[0].handle(req, res, () => {});
  }

  testAssert(capturedStatus === 200, '3.1 Status HTTP /api/health bernilai 200 saat Firestore terhubung');
  testAssert(capturedJson?.status === 'READY', '3.2 Health status bernilai READY');
  testAssert(capturedJson?.projectId === 'future-wonder-jwh4c', '3.3 Health endpoint mengembalikan projectId Production');
  testAssert(
    capturedJson?.databaseId === 'ai-studio-bfahubbintangfut-e02f4d35-ecd3-486e-9ee5-9fa8b9a78283',
    '3.4 Health endpoint mengembalikan databaseId Production spesifik'
  );
  testAssert(capturedJson?.firestoreAccessible === true, '3.5 firestoreAccessible bernilai true');

  // 4. Health Endpoint Failing Store Test
  class FailingStore extends InMemoryBackendStore {
    public override async getStudentCounter(): Promise<number> {
      throw new Error('NETWORK_TIMEOUT_SIMULATED');
    }
  }

  const failingStore = new FailingStore();
  const failingRouter = createBackendRouter({ store: failingStore, env: 'production' });

  let failingStatus: number = 0;
  let failingJson: any = null;

  const reqFail: any = { method: 'GET', url: '/health' };
  const resFail: any = {
    status: (code: number) => {
      failingStatus = code;
      return resFail;
    },
    json: (data: any) => {
      failingJson = data;
      return resFail;
    }
  };

  const failingRoute = (failingRouter as any).stack.find((layer: any) => layer.route?.path === '/health');
  if (failingRoute) {
    await failingRoute.route.stack[0].handle(reqFail, resFail, () => {});
  }

  testAssert(failingStatus === 503, '4.1 Status HTTP /api/health bernilai 503 saat Firestore gagal terhubung');
  testAssert(failingJson?.status === 'DEGRADED', '4.2 Health status bernilai DEGRADED saat koneksi terputus');
  testAssert(failingJson?.firestoreAccessible === false, '4.3 firestoreAccessible bernilai false saat koneksi terputus');

  console.log(`\nHASIL AKHIR DATABASE TARGET TEST: ${passed} Lulus, ${failed} Gagal`);
  if (failed > 0) {
    process.exit(1);
  }
}

runDatabaseTargetHealthTests().catch((err) => {
  console.error('Fatal error in database target health test:', err);
  process.exit(1);
});
