/**
 * BFA HUB — UNIT TEST FOR VERCEL WIF TOKEN SERVICE
 * Mode: SECURITY VERIFICATION · FAIL-CLOSED · IN-MEMORY TOKEN CACHING
 */

import { VercelWifTokenService } from '../src/server/vercelWifService';

async function runVercelWifServiceTests() {
  console.log('======================================================================');
  console.log('BFA HUB — SUITE PENGUJIAN VERCEL WIF TOKEN SERVICE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${desc} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Instansiasi dan Pengujian Evaluasi isWifConfigured()
  const emptyService = new VercelWifTokenService({ wifAudience: '', serviceAccountEmail: '' });
  assert(emptyService.isWifConfigured() === false, '1.1 isWifConfigured mengembalikan false bila env tidak lengkap');

  const configuredService = new VercelWifTokenService({
    wifAudience: '//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/provider',
    serviceAccountEmail: 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com',
  });
  assert(configuredService.isWifConfigured() === true, '1.2 isWifConfigured mengembalikan true bila env WIF valid');

  // 2. Pengujian Mock STS Token Exchange & Caching
  let mockFetchCallCount = 0;
  const mockSuccessFetch: typeof fetch = async (input) => {
    mockFetchCallCount++;
    const url = input.toString();

    if (url.includes('sts.googleapis.com')) {
      return new Response(
        JSON.stringify({
          access_token: 'mock_sts_access_token_123',
          expires_in: 3600,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes(':generateAccessToken')) {
      return new Response(
        JSON.stringify({
          accessToken: 'mock_sa_access_token_456',
          expireTime: new Date(Date.now() + 3600000).toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes(':signBlob')) {
      return new Response(
        JSON.stringify({
          keyId: 'test-key',
          signedBlob: Buffer.from('mock_signature').toString('base64'),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not found', { status: 404 });
  };

  const testService = new VercelWifTokenService({
    wifAudience: '//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/provider',
    serviceAccountEmail: 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com',
    fetchFn: mockSuccessFetch,
  });

  // Mock runtime Vercel OIDC token
  process.env.VERCEL_OIDC_TOKEN = 'mock.vercel.oidc.token';

  const stsToken1 = await testService.getGoogleStsAccessToken();
  assert(stsToken1 === 'mock_sts_access_token_123', '2.1 getGoogleStsAccessToken mengembalikan STS token');

  // Call again -> should hit cache without increasing fetchCallCount
  const countBefore = mockFetchCallCount;
  const stsToken2 = await testService.getGoogleStsAccessToken();
  assert(stsToken2 === 'mock_sts_access_token_123', '2.2 Membaca STS token dari cache in-memory');
  assert(mockFetchCallCount === countBefore, '2.3 In-memory token cache tidak melakukan HTTP request ulang');

  // 3. Impersonasi Service Account
  const saToken = await testService.getImpersonatedServiceAccountToken();
  assert(saToken === 'mock_sa_access_token_456', '3.1 getImpersonatedServiceAccountToken mengembalikan SA token');

  // 4. Penerbitan Custom Token Firebase
  const customJwt = await testService.issueFirebaseCustomToken({
    uid: 'parent_uid_123',
    claims: { role: 'parent', studentId: 'BFA-039' },
  });
  assert(Boolean(customJwt) && customJwt.split('.').length === 3, '4.1 Menerbitkan Custom Token JWT 3 bagian secara keyless');

  // Clean up
  delete process.env.VERCEL_OIDC_TOKEN;

  console.log(`\nHASIL AKHIR VERCEL WIF SERVICE TEST: ${passed} Lulus, ${failed} Gagal`);
  if (failed > 0) {
    process.exit(1);
  }
}

runVercelWifServiceTests().catch((err) => {
  console.error('Fatal Vercel WIF Service Test Error:', err);
  process.exit(1);
});
