/**
 * BFA HUB — UNIT & INTEGRATION TEST SUITE: KEYLESS WIF SIGNER & VERCEL OIDC
 * Mode: SECURITY VERIFICATION · FAIL-CLOSED · IN-MEMORY CONCURRENCY ISOLATION
 */

import {
  base64UrlEncode,
  getRuntimeVercelOidcToken,
  exchangeOidcForGoogleStsToken,
  impersonateServiceAccount,
  signCustomTokenWithIam,
  generateFirebaseCustomTokenKeyless,
} from '../src/server/keylessWifSigner';

import {
  TrustedBackendService,
  InMemoryBackendStore,
} from '../src/server/trustedBackendService';

async function runKeylessWifTestSuite() {
  console.log('======================================================================');
  console.log('BFA HUB — SUITE PENGUJIAN KEYLESS WORKLOAD IDENTITY FEDERATION (WIF)');
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

  // ------------------------------------------------------------------
  // 1. Pengujian Pengambilan OIDC Token & Header Guard
  // ------------------------------------------------------------------
  console.log('--- 1. Pengujian Pengambilan OIDC Token & Header Guard ---');

  // 1.1 Return null jika tidak di environment Vercel dan tanpa header
  const prevOidcEnv = process.env.VERCEL_OIDC_TOKEN;
  delete process.env.VERCEL_OIDC_TOKEN;

  const noToken = await getRuntimeVercelOidcToken();
  assert(noToken === null, '1.1 getRuntimeVercelOidcToken mengembalikan null bila tidak ada token');

  // 1.2 Menerima token dari header runtime Vercel x-vercel-oidc-token
  const headerToken = await getRuntimeVercelOidcToken({
    reqHeaders: { 'x-vercel-oidc-token': 'sample.vercel.oidc.token' },
  });
  assert(headerToken === 'sample.vercel.oidc.token', '1.2 Menerima token resmi dari header runtime x-vercel-oidc-token');

  // 1.3 Menerima token dari environment variable jika disetel
  process.env.VERCEL_OIDC_TOKEN = 'env.vercel.oidc.token';
  const envToken = await getRuntimeVercelOidcToken();
  assert(envToken === 'env.vercel.oidc.token', '1.3 Menerima token dari VERCEL_OIDC_TOKEN environment variable');
  delete process.env.VERCEL_OIDC_TOKEN;
  if (prevOidcEnv) process.env.VERCEL_OIDC_TOKEN = prevOidcEnv;

  // ------------------------------------------------------------------
  // 2. Pengujian Validasi Parameter WIF & Audience Guard
  // ------------------------------------------------------------------
  console.log('\n--- 2. Pengujian Validasi Parameter WIF & Audience Guard ---');

  // 2.1 Rejection jika OIDC token kosong
  let oidcEmptyCaught = false;
  try {
    await exchangeOidcForGoogleStsToken({
      oidcToken: '',
      wifAudience: '//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/prov',
    });
  } catch (err: any) {
    oidcEmptyCaught = true;
    assert(err.message.includes('kosong'), '2.1 Menolak OIDC token kosong dengan pesan eksplisit');
  }
  assert(oidcEmptyCaught, '2.1 exchangeOidcForGoogleStsToken fail-closed pada OIDC token kosong');

  // 2.2 Rejection jika WIF audience tidak diawali //iam.googleapis.com/
  let invalidAudienceCaught = false;
  try {
    await exchangeOidcForGoogleStsToken({
      oidcToken: 'valid.oidc.token',
      wifAudience: 'invalid-audience-format',
    });
  } catch (err: any) {
    invalidAudienceCaught = true;
    assert(err.message.includes('//iam.googleapis.com/'), '2.2 Menolak audience yang tidak diawali //iam.googleapis.com/');
  }
  assert(invalidAudienceCaught, '2.2 exchangeOidcForGoogleStsToken fail-closed pada format audience yang tidak sah');

  // ------------------------------------------------------------------
  // 3. Pengujian Penanganan Kegagalan Google STS Token Exchange
  // ------------------------------------------------------------------
  console.log('\n--- 3. Pengujian Penanganan Kegagalan Google STS Token Exchange ---');

  const mockStsFailureFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'The provided subject token is expired or invalid.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  };

  let stsFailed = false;
  try {
    await exchangeOidcForGoogleStsToken({
      oidcToken: 'expired.token',
      wifAudience: '//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/prov',
      fetchFn: mockStsFailureFetch,
    });
  } catch (err: any) {
    stsFailed = true;
    assert(err.message.includes('Google STS Token Exchange gagal (400)'), '3.1 Menangkap status error HTTP STS');
    assert(err.message.includes('expired or invalid'), '3.2 Menampilkan deskripsi error STS tanpa membocorkan kredensial rahasia');
  }
  assert(stsFailed, '3.3 Fail-closed saat pertukaran token STS ditolak Google');

  // ------------------------------------------------------------------
  // 4. Pengujian Penanganan Kegagalan Service Account Impersonation
  // ------------------------------------------------------------------
  console.log('\n--- 4. Pengujian Kegagalan Impersonasi Service Account ---');

  // 4.1 Rejection jika email service account tidak valid
  let invalidSaCaught = false;
  try {
    await impersonateServiceAccount({
      stsAccessToken: 'sts.token',
      serviceAccountEmail: 'not-an-email',
    });
  } catch (err: any) {
    invalidSaCaught = true;
    assert(err.message.includes('tidak valid'), '4.1 Menolak format email Service Account yang salah');
  }
  assert(invalidSaCaught, '4.1 impersonateServiceAccount memvalidasi format email');

  // 4.2 Penanganan HTTP 403 saat IAM generateAccessToken ditolak
  const mockImpersonateFailureFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({
        error: {
          code: 403,
          message: 'Permission iam.serviceAccounts.getAccessToken denied on service account.',
          status: 'PERMISSION_DENIED',
        },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  };

  let impersonateFailed = false;
  try {
    await impersonateServiceAccount({
      stsAccessToken: 'sts.token',
      serviceAccountEmail: 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com',
      fetchFn: mockImpersonateFailureFetch,
    });
  } catch (err: any) {
    impersonateFailed = true;
    assert(err.message.includes('impersonation gagal (403)'), '4.2 Menangkap error 403 impersonasi');
  }
  assert(impersonateFailed, '4.3 Fail-closed saat Service Account impersonation ditolak');

  // ------------------------------------------------------------------
  // 5. Pengujian Penanganan Kegagalan IAM signBlob
  // ------------------------------------------------------------------
  console.log('\n--- 5. Pengujian Kegagalan IAM signBlob ---');

  const mockSignBlobFailureFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({
        error: {
          code: 403,
          message: 'Permission iam.serviceAccounts.signBlob denied on resource.',
        },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  };

  let signBlobFailed = false;
  try {
    await signCustomTokenWithIam({
      saAccessToken: 'sa.token',
      serviceAccountEmail: 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com',
      unsignedToken: 'header.payload',
      fetchFn: mockSignBlobFailureFetch,
    });
  } catch (err: any) {
    signBlobFailed = true;
    assert(err.message.includes('IAM signBlob gagal (403)'), '5.1 Menangkap error 403 signBlob');
  }
  assert(signBlobFailed, '5.2 Fail-closed saat IAM signBlob ditolak');

  // ------------------------------------------------------------------
  // 6. Pengujian End-to-End Keyless Token Generation (Sukses)
  // ------------------------------------------------------------------
  console.log('\n--- 6. Pengujian End-to-End Keyless Token Generation (Sukses) ---');

  const mockSuccessFetch: typeof fetch = async (input, init) => {
    const url = input.toString();

    // Route 1: Google STS Token Exchange
    if (url.includes('sts.googleapis.com')) {
      return new Response(
        JSON.stringify({
          access_token: 'mocked_sts_access_token_abc123',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Route 2: Service Account Impersonation (generateAccessToken)
    if (url.includes(':generateAccessToken')) {
      return new Response(
        JSON.stringify({
          accessToken: 'mocked_sa_access_token_def456',
          expireTime: new Date(Date.now() + 3600000).toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Route 3: IAM signBlob
    if (url.includes(':signBlob')) {
      const mockSignatureBuffer = Buffer.from('mock_cryptographic_rs256_signature_bytes');
      return new Response(
        JSON.stringify({
          keyId: 'projects/future-wonder-jwh4c/keys/test-key-1',
          signedBlob: mockSignatureBuffer.toString('base64'),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not found', { status: 404 });
  };

  const testUid = 'parent_test_opaque_uid_9876';
  const testClaims = {
    role: 'parent',
    studentId: 'BFA-039',
    studentIds: ['BFA-039'],
  };

  const generatedJwt = await generateFirebaseCustomTokenKeyless({
    uid: testUid,
    claims: testClaims,
    oidcToken: 'mock.vercel.oidc.token.jwt',
    config: {
      wifAudience: '//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel-pool/providers/vercel-prov',
      serviceAccountEmail: 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com',
    },
    fetchFn: mockSuccessFetch,
  });

  assert(Boolean(generatedJwt), '6.1 Token JWT berhasil diterbitkan');
  const jwtParts = generatedJwt.split('.');
  assert(jwtParts.length === 3, '6.2 Format token adalah JWT 3 bagian (header.payload.signature)');

  // Decode and verify header
  const decodedHeader = JSON.parse(Buffer.from(jwtParts[0], 'base64').toString('utf8'));
  assert(decodedHeader.alg === 'RS256' && decodedHeader.typ === 'JWT', '6.3 Header adalah RS256 JWT standar');

  // Decode and verify payload
  const decodedPayload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString('utf8'));
  assert(decodedPayload.iss === 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com', '6.4 Payload iss adalah Service Account Email');
  assert(decodedPayload.sub === 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com', '6.5 Payload sub adalah Service Account Email');
  assert(decodedPayload.aud === 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit', '6.6 Payload aud adalah IdentityToolkit endpoint');
  assert(decodedPayload.uid === testUid, '6.7 Payload uid sesuai dengan UID pemohon');
  assert(decodedPayload.claims?.studentId === 'BFA-039', '6.8 Klaim studentId terpasang akurat');
  assert(decodedPayload.claims?.role === 'parent', '6.9 Klaim role terpasang sebagai parent');
  assert(decodedPayload.claims?.studentName === undefined, '6.10 Custom claims bebas dari PII (studentName)');

  // Verify signature is URL safe
  assert(!jwtParts[2].includes('+') && !jwtParts[2].includes('/') && !jwtParts[2].includes('='), '6.11 Signature diformat base64url aman');

  // ------------------------------------------------------------------
  // 7. Pengujian Isolasi Konkurensi Antar-Request Serverless
  // ------------------------------------------------------------------
  console.log('\n--- 7. Pengujian Isolasi Konkurensi Antar-Request Serverless ---');

  // Eksekusi dua request secara simultan dengan UID dan siswa yang berbeda
  const req1Promise = generateFirebaseCustomTokenKeyless({
    uid: 'parent_uid_req_1',
    claims: { role: 'parent', studentId: 'BFA-001', studentIds: ['BFA-001'] },
    oidcToken: 'oidc.token.req.1',
    config: {
      wifAudience: '//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel-pool/providers/vercel-prov',
      serviceAccountEmail: 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com',
    },
    fetchFn: mockSuccessFetch,
  });

  const req2Promise = generateFirebaseCustomTokenKeyless({
    uid: 'parent_uid_req_2',
    claims: { role: 'parent', studentId: 'BFA-002', studentIds: ['BFA-002'] },
    oidcToken: 'oidc.token.req.2',
    config: {
      wifAudience: '//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel-pool/providers/vercel-prov',
      serviceAccountEmail: 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com',
    },
    fetchFn: mockSuccessFetch,
  });

  const [res1Token, res2Token] = await Promise.all([req1Promise, req2Promise]);

  const p1 = JSON.parse(Buffer.from(res1Token.split('.')[1], 'base64').toString('utf8'));
  const p2 = JSON.parse(Buffer.from(res2Token.split('.')[1], 'base64').toString('utf8'));

  assert(p1.uid === 'parent_uid_req_1' && p1.claims.studentId === 'BFA-001', '7.1 Request 1 memuat identitas Siswa Satu secara utuh');
  assert(p2.uid === 'parent_uid_req_2' && p2.claims.studentId === 'BFA-002', '7.2 Request 2 memuat identitas Siswa Dua secara utuh');
  assert(p1.uid !== p2.uid, '7.3 Dua token memiliki UID yang saling terisolasi');
  assert(p1.claims.studentId !== p2.claims.studentId, '7.4 Tidak ada cross-request pollution atau race condition');

  // ------------------------------------------------------------------
  // 8. Integrasi Langsung ke TrustedBackendService dengan WIF Config
  // ------------------------------------------------------------------
  console.log('\n--- 8. Integrasi Langsung ke TrustedBackendService dengan WIF ---');

  const backendStore = new InMemoryBackendStore();
  const backendService = new TrustedBackendService(backendStore, 'staging');

  const student = await backendService.registerStudentAndIncrementCounter({
    name: 'Afan Arka Maulana',
    birthPlace: 'Karawang',
    birthDate: '2017-01-01',
    gender: 'L',
    parentName: 'Bpk. Afan',
    phone: '081234567890',
    classGroupId: 'U9',
    jerseyNumber: 7,
  }, 'admin');

  // Mock customTokenSigner via keyless generator
  const authResult = await backendService.authenticateParentAndIssueToken({
    phone: '081234567890',
    studentId: student.student.id,
    customTokenSigner: async ({ uid, claims }) => {
      return generateFirebaseCustomTokenKeyless({
        uid,
        claims,
        oidcToken: 'injected.oidc.token',
        config: {
          wifAudience: '//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/p/providers/pr',
          serviceAccountEmail: 'bfa-backend@future-wonder-jwh4c.iam.gserviceaccount.com',
        },
        fetchFn: mockSuccessFetch,
      });
    },
  });

  assert(authResult.success === true, '8.1 authenticateParentAndIssueToken sukses menggunakan keyless signer');
  assert(authResult.status === 'AUTHENTICATED', '8.2 Status autentikasi adalah AUTHENTICATED');
  assert(Boolean(authResult.token && authResult.token.split('.').length === 3), '8.3 Token yang diterbitkan adalah JWT RS256 3 bagian');
  assert(authResult.user?.claims.studentId === student.student.id, '8.4 Klaim studentId sesuai dengan siswa aktif');

  console.log('\n======================================================================');
  console.log(`HASIL AKHIR KEYLESS WIF: ${passed} Lulus, ${failed} Gagal`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runKeylessWifTestSuite().catch((err) => {
  console.error('Fatal Keyless WIF Test Error:', err);
  process.exit(1);
});
