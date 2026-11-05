/**
 * BFA HUB — TEST SUITE: ADMIN & PARENT SESSION RECOVERY AFTER REFRESH
 * Mode: COMPREHENSIVE VERIFICATION · ISOLATION · FAIL-CLOSED
 * 
 * Skenario Pengujian:
 * 1. Admin 1 Login & Refresh:
 *    - Custom claims: { admin: true }
 *    - Email: admin@bfahub.internal atau admin@bfa.my.id
 *    - Hasil: Sesi dipulihkan sebagai role 'admin', route tetap di 'dashboard' / admin module, TIDAK terlempar ke parent-dashboard.
 * 2. Admin 2 Login & Refresh:
 *    - Custom claims: { role: 'admin' } atau { admin: true, role: 'admin' }
 *    - Email: edysun@bfahub.internal
 *    - Hasil: Sesi dipulihkan sebagai role 'admin', nama Coach Edysun, route tetap di 'dashboard'.
 * 3. Akun Firebase Auth Non-Admin:
 *    - Custom claims: {} / { role: 'viewer' }
 *    - Hasil: Ditolak fail-closed (unauthenticated), TIDAK DIJADIKAN PARENT secara diam-diam.
 * 4. Parent / Wali Siswa Login & Refresh:
 *    - Login via WhatsApp + NIS (bfa_parent_session).
 *    - Saat refresh, Firebase Auth mengembalikan null.
 *    - Hasil: Sesi dipulihkan sebagai role 'parent', route tetap 'parent-dashboard', tidak mengganggu sesi Admin.
 * 5. Route Guard Isolation:
 *    - Pengguna Admin tidak terperangkap di rute parent.
 *    - Pengguna Parent diblokir dari rute admin.
 * 6. Logout Bersih:
 *    - Memastikan seluruh kunci sesi (bfa_auth_user, bfa_parent_session, bfa_active_role, bfa_current_route) dihapus.
 */

import { isBfaAdminUser, resolveAdminDisplayName } from '../src/firebase/authAdapter';
import { AuthUser, Role, RouteId } from '../src/types';

interface MockFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

function runSessionRecoveryTests() {
  console.log('======================================================================');
  console.log('BFA HUB — SUITE PENGUJIAN PEMULIHAN SESI SETELAH REFRESH (EMERGENCY FIX)');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, desc: string) => {
    if (condition) {
      console.log(`✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${desc}`);
      failed++;
    }
  };

  // ------------------------------------------------------------------
  // 1. Verifikasi Admin 1 Claims & Email
  // ------------------------------------------------------------------
  console.log('--- 1. Verifikasi Penentuan Role Admin 1 (admin@bfahub.internal / admin@bfa.my.id) ---');

  const admin1User: MockFirebaseUser = {
    uid: 'admin-1-uid',
    email: 'admin@bfahub.internal',
    displayName: null,
  };

  // Kasus: Claims hanya memuat { admin: true } tanpa claims.role
  const claimsAdminTrueOnly = { admin: true };
  assert(
    isBfaAdminUser(claimsAdminTrueOnly, admin1User as any),
    'Admin 1 dengan custom claims { admin: true } berhasil dikenali sebagai Admin yang sah'
  );

  // Kasus: Claims memuat { admin: "true" } (string boolean) - HARUS DITOLAK
  const claimsAdminStringTrue = { admin: 'true' };
  assert(
    !isBfaAdminUser(claimsAdminStringTrue, admin1User as any),
    'Admin 1 dengan custom claims { admin: "true" } (string) DITOLAK sebagai Admin (harus boolean true)'
  );

  // Kasus: Email admin@bfa.my.id dengan claims { admin: true }
  const admin1ProdUser: MockFirebaseUser = {
    uid: 'admin-1-prod-uid',
    email: 'admin@bfa.my.id',
    displayName: 'Admin BFA Karawang',
  };
  assert(
    isBfaAdminUser(claimsAdminTrueOnly, admin1ProdUser as any),
    'Admin 1 Production (admin@bfa.my.id) berhasil dikenali sebagai Admin yang sah'
  );
  assert(
    resolveAdminDisplayName(admin1ProdUser as any) === 'Admin BFA Karawang',
    'Display name Admin 1 berhasil diekstrak sesuai profil pengguna'
  );

  // ------------------------------------------------------------------
  // 2. Verifikasi Admin 2 Claims & Email (Coach Edysun)
  // ------------------------------------------------------------------
  console.log('\n--- 2. Verifikasi Penentuan Role Admin 2 (edysun@bfahub.internal) ---');

  const admin2User: MockFirebaseUser = {
    uid: 'admin-2-uid',
    email: 'edysun@bfahub.internal',
    displayName: null,
  };

  // Kasus: Claims memuat { role: 'admin' }
  const claimsRoleAdminOnly = { role: 'admin' };
  assert(
    isBfaAdminUser(claimsRoleAdminOnly, admin2User as any),
    'Admin 2 dengan custom claims { role: "admin" } berhasil dikenali sebagai Admin yang sah'
  );

  // Kasus: Claims memuat keduanya { role: 'admin', admin: true }
  const claimsBoth = { role: 'admin', admin: true };
  assert(
    isBfaAdminUser(claimsBoth, admin2User as any),
    'Admin 2 dengan custom claims lengkap { role: "admin", admin: true } berhasil dikenali'
  );

  assert(
    resolveAdminDisplayName(admin2User as any) === 'Coach Edysun',
    'Display name Admin 2 otomatis dialokasikan sebagai "Coach Edysun"'
  );

  // ------------------------------------------------------------------
  // 3. Pencegahan Fallback Hak Admin (Email, Username, Display Name, LocalStorage DITOLAK Tanpa Klaim Sah)
  // ------------------------------------------------------------------
  console.log('\n--- 3. Perlindungan Keamanan: Hak Admin WAJIB Berdasarkan Custom Claims Sah ---');

  const randomUser: MockFirebaseUser = {
    uid: 'random-user-uid',
    email: 'hacker@randomdomain.com',
    displayName: 'Penyusup',
  };
  assert(
    !isBfaAdminUser({}, randomUser as any),
    'Pengguna luar tanpa klaim admin ditolak sebagai Admin'
  );

  // ------------------------------------------------------------------
  // 3.1. Pengujian Temporary Admin Allowlist UIDs (Admin 1 & Admin 2 tanpa claims)
  // ------------------------------------------------------------------
  console.log('\n--- 3.1 Pengujian Temporary Admin Allowlist UIDs ---');

  const tempAdmin1User: MockFirebaseUser = {
    uid: 'UbYPHGfX3gTL8H38GTg50nATd042',
    email: 'admin1.temp@bfa.my.id',
    displayName: 'Admin 1 Temp',
  };
  const tempAdmin2User: MockFirebaseUser = {
    uid: 'h826b0NzwyRePEG2TvWCekIw7AG2',
    email: 'admin2.temp@bfa.my.id',
    displayName: 'Admin 2 Temp',
  };

  assert(
    isBfaAdminUser({}, tempAdmin1User as any),
    'Admin 1 UID (UbYPHGfX3gTL8H38GTg50nATd042) diterima sebagai Admin via Temporary Allowlist'
  );
  assert(
    isBfaAdminUser({}, tempAdmin2User as any),
    'Admin 2 UID (h826b0NzwyRePEG2TvWCekIw7AG2) diterima sebagai Admin via Temporary Allowlist'
  );

  // Uji kadaluarsa (mocking date after Feb 13, 2027)
  const originalDate = Date;
  class MockDate extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super('2027-02-14T00:00:00Z');
      } else {
        super(...(args as [any]));
      }
    }
  }
  (global as any).Date = MockDate;

  assert(
    !isBfaAdminUser({}, tempAdmin1User as any),
    'Admin 1 UID ditolak setelah melewati tanggal kadaluarsa (Feb 13, 2027)'
  );
  assert(
    !isBfaAdminUser({}, tempAdmin2User as any),
    'Admin 2 UID ditolak setelah melewati tanggal kadaluarsa (Feb 13, 2027)'
  );

  (global as any).Date = originalDate;
  const adminEmailNoClaims: MockFirebaseUser = {
    uid: 'admin-fake-uid',
    email: 'admin@bfahub.internal',
    displayName: 'Admin BFA',
  };
  assert(
    !isBfaAdminUser({}, adminEmailNoClaims as any),
    'Akun email admin@bfahub.internal TANPA custom claims sah WAJIB DITOLAK sebagai Admin'
  );
  assert(
    !isBfaAdminUser(null, adminEmailNoClaims as any),
    'Akun email admin@bfahub.internal dengan claims null WAJIB DITOLAK sebagai Admin'
  );

  const edysunEmailNoClaims: MockFirebaseUser = {
    uid: 'edysun-fake-uid',
    email: 'edysun@bfahub.internal',
    displayName: 'Coach Edysun',
  };
  assert(
    !isBfaAdminUser({}, edysunEmailNoClaims as any),
    'Akun email edysun@bfahub.internal TANPA custom claims sah WAJIB DITOLAK sebagai Admin'
  );

  const prodAdminEmailNoClaims: MockFirebaseUser = {
    uid: 'admin-prod-fake-uid',
    email: 'admin@bfa.my.id',
    displayName: 'Administrator',
  };
  assert(
    !isBfaAdminUser({}, prodAdminEmailNoClaims as any),
    'Akun email admin@bfa.my.id TANPA custom claims sah WAJIB DITOLAK sebagai Admin'
  );

  // Akun dengan role selain admin (misal parent atau coach) walaupun email admin WAJIB DITOLAK
  assert(
    !isBfaAdminUser({ role: 'parent' }, adminEmailNoClaims as any),
    'Akun email admin dengan klaim { role: "parent" } DITOLAK sebagai Admin'
  );
  assert(
    !isBfaAdminUser({ role: 'coach' }, edysunEmailNoClaims as any),
    'Akun email edysun dengan klaim { role: "coach" } DITOLAK sebagai Admin'
  );

  // Penolakan berdasarkan username sintetis atau display name
  const syntheticAdminUser: MockFirebaseUser = {
    uid: 'synthetic-user-uid',
    email: 'user@external.com',
    displayName: 'admin',
  };
  assert(
    !isBfaAdminUser(undefined, syntheticAdminUser as any),
    'Username atau nama tampilan "admin" tanpa custom claims DITOLAK sebagai Admin'
  );

  // ------------------------------------------------------------------
  // 4. Simulasi Pemulihan Sesi State Machine pada Browser Refresh
  // ------------------------------------------------------------------
  console.log('\n--- 4. Simulasi Pemulihan Sesi State Machine pada Refresh ---');

  // Helper simulasi logic App.tsx saat onAuthStateChanged
  function simulateAuthObserver(
    firebaseSession: { user: MockFirebaseUser; authUser: AuthUser; claims: any } | null,
    mockLocalStorage: Record<string, string>,
    currentSavedRoute: RouteId
  ): {
    state: 'checking' | 'authenticated' | 'unauthenticated';
    role: Role;
    currentUser: AuthUser | null;
    activeRoute: RouteId;
  } {
    if (firebaseSession && firebaseSession.authUser) {
      // Admin session verified
      let activeRoute = currentSavedRoute;
      if (!activeRoute || activeRoute.startsWith('parent-')) {
        activeRoute = 'dashboard';
      }
      return {
        state: 'authenticated',
        role: 'admin',
        currentUser: firebaseSession.authUser,
        activeRoute,
      };
    } else {
      // Firebase auth is null -> Check for valid Parent session in localStorage
      let recoveredParent: AuthUser | null = null;
      try {
        const raw = mockLocalStorage['bfa_parent_session'] || mockLocalStorage['bfa_auth_user'];
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.role === 'parent' && (parsed.studentId || parsed.emailOrPhone)) {
            recoveredParent = parsed;
          }
        }
      } catch {}

      if (recoveredParent) {
        return {
          state: 'authenticated',
          role: 'parent',
          currentUser: recoveredParent,
          activeRoute: currentSavedRoute.startsWith('parent-') ? currentSavedRoute : 'parent-dashboard',
        };
      }

      return {
        state: 'unauthenticated',
        role: 'admin',
        currentUser: null,
        activeRoute: 'dashboard',
      };
    }
  }

  // Uji Skenario 4.1: Admin 1 refresh saat berada di rute 'dashboard'
  const admin1Session = {
    user: admin1User,
    authUser: { role: 'admin' as Role, name: 'Admin BFA', emailOrPhone: 'admin@bfahub.internal' },
    claims: { admin: true },
  };
  const resAdmin1 = simulateAuthObserver(admin1Session, {}, 'dashboard');
  assert(resAdmin1.state === 'authenticated', 'Skenario 4.1: Admin 1 state "authenticated"');
  assert(resAdmin1.role === 'admin', 'Skenario 4.1: Admin 1 role tetap "admin" (TIDAK menjadi parent)');
  assert(resAdmin1.activeRoute === 'dashboard', 'Skenario 4.1: Admin 1 tetap di rute "dashboard"');

  // Uji Skenario 4.2: Admin 1 refresh saat berada di rute 'students'
  const resAdmin1Students = simulateAuthObserver(admin1Session, {}, 'students');
  assert(resAdmin1Students.role === 'admin', 'Skenario 4.2: Admin 1 role tetap "admin"');
  assert(resAdmin1Students.activeRoute === 'students', 'Skenario 4.2: Admin 1 tetap di modul "students"');

  // Uji Skenario 4.3: Admin 1 sebelumnya sempat membuka simulasi parent-dashboard lalu refresh
  const resAdmin1RecoverFromParentRoute = simulateAuthObserver(admin1Session, {}, 'parent-dashboard');
  assert(resAdmin1RecoverFromParentRoute.role === 'admin', 'Skenario 4.3: Admin 1 dipulihkan sebagai "admin"');
  assert(
    resAdmin1RecoverFromParentRoute.activeRoute === 'dashboard',
    'Skenario 4.3: Admin 1 otomatis dikembalikan ke Dashboard Admin (tidak terjebak di parent-dashboard)'
  );

  // Uji Skenario 4.4: Admin 2 (Coach Edysun) refresh saat berada di rute 'keuangan'
  const admin2Session = {
    user: admin2User,
    authUser: { role: 'admin' as Role, name: 'Coach Edysun', emailOrPhone: 'edysun@bfahub.internal' },
    claims: { role: 'admin' },
  };
  const resAdmin2Keuangan = simulateAuthObserver(admin2Session, {}, 'keuangan');
  assert(resAdmin2Keuangan.state === 'authenticated', 'Skenario 4.4: Admin 2 state "authenticated"');
  assert(resAdmin2Keuangan.role === 'admin', 'Skenario 4.4: Admin 2 role tetap "admin"');
  assert(resAdmin2Keuangan.currentUser?.name === 'Coach Edysun', 'Skenario 4.4: Nama Admin 2 adalah "Coach Edysun"');
  assert(resAdmin2Keuangan.activeRoute === 'keuangan', 'Skenario 4.4: Admin 2 tetap di modul "keuangan"');

  // Uji Skenario 4.5: Parent refresh (Firebase session is null)
  const mockStorageParent: Record<string, string> = {
    bfa_parent_session: JSON.stringify({
      role: 'parent',
      name: 'Wali Ahmad',
      emailOrPhone: '081234567890',
      studentId: 'BFA-001',
      studentName: 'Ahmad Futsal',
    }),
  };
  const resParentRefresh = simulateAuthObserver(null, mockStorageParent, 'parent-attendance');
  assert(resParentRefresh.state === 'authenticated', 'Skenario 4.5: Parent state "authenticated"');
  assert(resParentRefresh.role === 'parent', 'Skenario 4.5: Parent role dipulihkan sebagai "parent"');
  assert(resParentRefresh.currentUser?.studentId === 'BFA-001', 'Skenario 4.5: ID Siswa Parent tetap BFA-001');
  assert(resParentRefresh.activeRoute === 'parent-attendance', 'Skenario 4.5: Parent tetap di rute "parent-attendance"');

  // Uji Skenario 4.6: Pengguna Logout / Sesi Tidak Ada (Keduanya null)
  const resUnauth = simulateAuthObserver(null, {}, 'dashboard');
  assert(resUnauth.state === 'unauthenticated', 'Skenario 4.6: State "unauthenticated" jika tidak ada sesi');
  assert(resUnauth.currentUser === null, 'Skenario 4.6: currentUser bernilai null');

  // ------------------------------------------------------------------
  // 5. Route Guard Isolation
  // ------------------------------------------------------------------
  console.log('\n--- 5. Isolasi Route Boundary Guard ---');

  function evaluateRouteGuard(userRole: Role, targetRoute: RouteId): RouteId {
    if (userRole === 'parent' && !targetRoute.startsWith('parent-')) {
      return 'parent-dashboard';
    }
    if (userRole === 'admin' && targetRoute.startsWith('parent-')) {
      return 'dashboard';
    }
    return targetRoute;
  }

  assert(
    evaluateRouteGuard('admin', 'students') === 'students',
    'Admin diizinkan mengakses modul "students"'
  );
  assert(
    evaluateRouteGuard('admin', 'parent-dashboard') === 'dashboard',
    'Admin diarahkan kembali ke "dashboard" jika rute yang dituju adalah parent-dashboard'
  );
  assert(
    evaluateRouteGuard('parent', 'students') === 'parent-dashboard',
    'Parent diblokir dari modul admin "students" dan diarahkan ke "parent-dashboard"'
  );
  assert(
    evaluateRouteGuard('parent', 'parent-attendance') === 'parent-attendance',
    'Parent diizinkan mengakses modul "parent-attendance"'
  );

  // ------------------------------------------------------------------
  // 6. Uji Isolasi Logout & Perlindungan Sesi Parent (Add-Only / Security Review)
  // ------------------------------------------------------------------
  console.log('\n--- 6. Uji Isolasi Logout & Perlindungan Sesi Parent ---');

  function simulateLogout(
    currentRole: Role,
    storage: Record<string, string>
  ): Record<string, string> {
    const nextStorage = { ...storage };
    // Admin logout clears admin keys, but MUST NOT disturb bfa_parent_session
    delete nextStorage['bfa_auth_user'];
    delete nextStorage['bfa_active_role'];
    delete nextStorage['bfa_current_route'];
    if (currentRole === 'parent') {
      delete nextStorage['bfa_parent_session'];
    }
    return nextStorage;
  }

  const initialStorageWithBoth: Record<string, string> = {
    bfa_auth_user: JSON.stringify({ role: 'admin', name: 'Admin BFA', emailOrPhone: 'admin@bfa.my.id' }),
    bfa_active_role: 'admin',
    bfa_current_route: 'dashboard',
    bfa_parent_session: JSON.stringify({ role: 'parent', name: 'Wali Ahmad', studentId: 'BFA-001' }),
  };

  // Simulasi: Admin melakukan Logout
  const storageAfterAdminLogout = simulateLogout('admin', initialStorageWithBoth);
  assert(
    !storageAfterAdminLogout['bfa_auth_user'],
    'Logout Admin menghapus bfa_auth_user'
  );
  assert(
    !storageAfterAdminLogout['bfa_active_role'],
    'Logout Admin menghapus bfa_active_role'
  );
  assert(
    storageAfterAdminLogout['bfa_parent_session'] !== undefined,
    'Logout Admin TIDAK MENGGANGGU / TIDAK MENGHAPUS bfa_parent_session akun Parent yang tidak aktif'
  );

  // Simulasi: Parent melakukan Logout
  const storageAfterParentLogout = simulateLogout('parent', storageAfterAdminLogout);
  assert(
    !storageAfterParentLogout['bfa_parent_session'],
    'Logout Parent menghapus bfa_parent_session miliknya secara bersih'
  );

  console.log('\n======================================================================');
  console.log(`HASIL AKHIR: ${passed} Lulus, ${failed} Gagal`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSessionRecoveryTests();

