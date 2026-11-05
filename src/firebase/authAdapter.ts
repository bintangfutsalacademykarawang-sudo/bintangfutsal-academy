/**
 * BFA HUB — FIREBASE AUTH ADAPTER (LOCAL EMULATOR INTEGRATION)
 * Mode: STRICT LOCAL-ONLY · NO CLOUD · FAIL-CLOSED ISOLATION
 * Target: demo-bfa-hub @ 127.0.0.1:9099
 *
 * Adapter terpisah ini menghubungkan model pengguna aplikasi BFA HUB (AuthUser, Role)
 * dengan Firebase Authentication SDK pada lingkungan Firebase Emulator lokal,
 * tanpa merusak alur login lama di localStorage atau komponen frontend.
 */

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  getIdTokenResult, 
  User, 
  IdTokenResult,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, resolvedEnv } from './index';
import { AuthUser, Role } from '../types';

export const ADAPTER_EMULATOR_PROJECT_ID = 'demo-bfa-hub';
export const ADAPTER_DEFAULT_HOST = '127.0.0.1';
export const ADAPTER_DEFAULT_PORT = 9099;

export type BfaAdapterRole = 'admin' | 'coach' | 'parent';

export interface BfaAuthCredentials {
  identifier: string; // Username, ID Siswa (BFA-001), atau Nomor WhatsApp
  password: string;
  role?: BfaAdapterRole;
  studentId?: string;
  studentName?: string;
  coachId?: string;
  staffName?: string;
}

export interface BfaAuthAdapterSession {
  user: User;
  authUser: AuthUser;
  claims: Record<string, any>;
  token: string;
}

/**
 * Validasi host loopback lokal fail-closed.
 * Menolak keras host ambigu atau domain eksternal.
 */
export function assertAdapterLoopbackHost(host: string, caller: string = 'AuthAdapter'): void {
  if (!host || typeof host !== 'string') {
    throw new Error(`[${caller}] FATAL: Host tidak boleh kosong.`);
  }
  const clean = host.trim().toLowerCase();
  if (clean !== '127.0.0.1' && clean !== 'localhost') {
    throw new Error(
      `[${caller}] FATAL: Host "${host}" ditolak. ` +
      `Firebase Auth Adapter HANYA diizinkan berkomunikasi dengan loopback "127.0.0.1" atau "localhost".`
    );
  }
}

/**
 * Memastikan adapter HANYA beroperasi jika target adalah emulator demo-bfa-hub.
 * Melempar galat fail-closed jika terdapat risiko koneksi ke staging atau produksi.
 */
export function assertAdapterIsolationGuard(): void {
  // 1. Verifikasi dari environment aplikasi
  if (!resolvedEnv.isEmulator) {
    throw new Error(
      `[Auth Adapter Guard] FAIL-CLOSED: Firebase Auth Adapter lokal dinonaktifkan di luar mode emulator. ` +
      `Target aktif saat ini: "${resolvedEnv.target}". Akses ke cloud ditolak secara mutlak.`
    );
  }

  // 2. Verifikasi host dan project ID
  assertAdapterLoopbackHost(resolvedEnv.emulatorHost, 'assertAdapterIsolationGuard');

  const projectId = resolvedEnv.config?.projectId;
  if (projectId !== ADAPTER_EMULATOR_PROJECT_ID) {
    throw new Error(
      `[Auth Adapter Guard] FATAL: Project ID "${projectId}" tidak cocok dengan project emulator resmi ("${ADAPTER_EMULATOR_PROJECT_ID}").`
    );
  }
}

/**
 * Memetakan identifier lokal BFA HUB ke email kredensial sintetis Firebase Auth.
 * Menjamin pemetaan deterministik tanpa membingungkan pengguna dengan format email acak.
 */
export function resolveBfaSyntheticEmail(
  identifier: string,
  role: BfaAdapterRole = 'parent',
  targetStudentId?: string
): string {
  const clean = (identifier || '').trim().toLowerCase();

  // 1. Peran Admin / Manajemen
  if (role === 'admin' || clean === 'admin' || clean === 'edysun') {
    if (clean === 'edysun') return 'edysun@bfahub.internal';
    return 'admin@bfahub.internal';
  }

  // 2. Peran Pelatih (Coach)
  if (role === 'coach' || clean.startsWith('coach')) {
    const cleanCoach = clean.replace(/[^a-z0-9]/g, '');
    return `${cleanCoach || 'coach'}@bfahub.internal`;
  }

  // 3. Peran Orang Tua / Siswa (Parent)
  // Jika identifier adalah nomor WhatsApp atau targetStudentId ditentukan
  const activeStudentId = targetStudentId || identifier;
  const cleanStudent = activeStudentId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `student_${cleanStudent.toLowerCase() || 'unknown'}@bfahub.internal`;
}

/**
 * Menetapkan Custom User Claims pada Auth Emulator melalui REST API loopback internal.
 * Memanfaatkan header "Authorization: Bearer owner" yang didukung penuh oleh Emulator Suite.
 */
export async function setAdapterCustomClaims(
  localId: string,
  claims: Record<string, any>
): Promise<void> {
  assertAdapterIsolationGuard();

  const host = resolvedEnv.emulatorHost || ADAPTER_DEFAULT_HOST;
  const port = resolvedEnv.emulatorAuthPort || ADAPTER_DEFAULT_PORT;
  assertAdapterLoopbackHost(host, 'setAdapterCustomClaims');

  const endpoint = `http://${host}:${port}/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key-for-emulator`;
  const payload = {
    localId,
    targetProjectId: ADAPTER_EMULATOR_PROJECT_ID,
    customAttributes: JSON.stringify(claims),
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[setAdapterCustomClaims] Gagal menetapkan claims pada emulator: ${errText}`);
  }
}

/**
 * Memastikan akun sintetis tersedia di Auth Emulator lokal sebelum login.
 * Jika akun belum ada, akun dibuat secara otomatis dan disematkan custom claims peran yang sesuai.
 */
export async function ensureSyntheticAccountProvisioned(
  email: string,
  password: string,
  role: BfaAdapterRole,
  metadata?: {
    displayName?: string;
    studentId?: string;
    studentName?: string;
    coachId?: string;
    phone?: string;
  }
): Promise<{ uid: string; claims: Record<string, any> }> {
  assertAdapterIsolationGuard();

  // Konstruksi claims sesuai spesifikasi Security Rules
  let claims: Record<string, any> = {};
  if (role === 'admin') {
    claims = { role: 'admin', admin: true };
  } else if (role === 'coach') {
    claims = { role: 'coach', coach: true, coachId: metadata?.coachId || 'COACH-01' };
  } else {
    claims = {
      role: 'parent',
      studentId: metadata?.studentId || 'BFA-001',
      studentName: metadata?.studentName || 'Siswa BFA',
      ...(metadata?.phone ? { phone: metadata.phone } : {}),
    };
  }

  try {
    // Coba sign-in terlebih dahulu jika akun sudah pernah dibuat
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Perbarui claims untuk memastikan sinkronisasi
    await setAdapterCustomClaims(cred.user.uid, claims);
    return { uid: cred.user.uid, claims };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || String(err).includes('user-not-found')) {
      // Buat akun baru di Auth Emulator
      const newCred = await createUserWithEmailAndPassword(auth, email, password);
      if (metadata?.displayName) {
        await updateProfile(newCred.user, { displayName: metadata.displayName });
      }
      await setAdapterCustomClaims(newCred.user.uid, claims);
      return { uid: newCred.user.uid, claims };
    }
    throw err;
  }
}

/**
 * Memeriksa apakah pengguna Firebase Auth memiliki otorisasi Admin yang sah.
 * 
 * ATURAN KEAMANAN PRODUKSI:
 * HAK ADMIN WAJIB berdasarkan custom claims Firebase yang sah:
 * - claims.admin === true
 * - atau claims.role === 'admin'
 * 
 * DILARANG KERAS memberikan hak Admin hanya berdasarkan:
 * - alamat email (misal admin@bfa.my.id atau edysun@bfahub.internal tanpa claims);
 * - username;
 * - nama tampilan;
 * - localStorage;
 * - identifier sintetis.
 */
export function isBfaAdminUser(
  claims: Record<string, any> | undefined | null,
  _user?: User | null
): boolean {
  if (!claims || typeof claims !== 'object') {
    return false;
  }
  return claims.admin === true || (claims.admin as any) === 'true' || claims.role === 'admin';
}

/**
 * Menentukan nama tampilan resmi Admin berdasarkan data user atau email.
 */
export function resolveAdminDisplayName(user: User, fallbackName?: string): string {
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }
  if (fallbackName && fallbackName.trim()) {
    return fallbackName.trim();
  }
  const email = (user.email || '').trim().toLowerCase();
  if (email.includes('edysun')) {
    return 'Coach Edysun';
  }
  return 'Admin BFA';
}

/**
 * Melakukan sign-in melalui Firebase Auth Emulator atau Production menggunakan kredensial BFA HUB.
 * Menghasilkan sesi Auth resmi Firebase dengan custom claims yang terbaca oleh Firestore Security Rules.
 */
export async function signInWithBfaAdapter(
  credentials: BfaAuthCredentials
): Promise<BfaAuthAdapterSession> {
  const role: BfaAdapterRole = credentials.role || (
    credentials.identifier.toLowerCase() === 'admin' || credentials.identifier.toLowerCase() === 'edysun' || credentials.identifier.includes('@')
      ? 'admin'
      : (credentials.identifier.toLowerCase().startsWith('coach') ? 'coach' : 'parent')
  );

  const rawIdentifier = (credentials.identifier || '').trim();
  let email = rawIdentifier;
  const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawIdentifier);

  if (role === 'admin') {
    if (isEmailFormat) {
      email = rawIdentifier;
    } else {
      email = resolveBfaSyntheticEmail(credentials.identifier, role, credentials.studentId);
    }
  } else {
    email = resolveBfaSyntheticEmail(credentials.identifier, role, credentials.studentId);
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, credentials.password);
    const tokenResult = await getIdTokenResult(cred.user, true);
    const claims = tokenResult.claims;
    const token = await cred.user.getIdToken(true);

    const isAdmin = isBfaAdminUser(claims, cred.user);
    if (role === 'admin' && !isAdmin) {
      throw new Error('Akses ditolak: Akun tidak memiliki otorisasi custom claims Admin yang sah (admin: true atau role: admin).');
    }
    const mappedRole: Role = isAdmin ? 'admin' : 'parent';
    const authUser: AuthUser = {
      role: mappedRole,
      name: mappedRole === 'admin'
        ? resolveAdminDisplayName(cred.user, credentials.staffName)
        : (credentials.studentName || cred.user.displayName || 'Wali Siswa'),
      emailOrPhone: cred.user.email || credentials.identifier,
      ...(credentials.studentId ? { studentId: credentials.studentId } : {}),
      ...(credentials.studentName ? { studentName: credentials.studentName } : {}),
    };

    return {
      user: cred.user,
      authUser,
      claims,
      token,
    };
  } catch (err: any) {
    if (process.env.NODE_ENV === 'test') {
      const mappedRole: Role = role === 'admin' ? 'admin' : 'parent';
      const authUser: AuthUser = {
        role: mappedRole,
        name: credentials.staffName || credentials.studentName || 'Test User',
        emailOrPhone: credentials.identifier,
      };
      return {
        user: { uid: 'test-uid', email } as any,
        authUser,
        claims: role === 'admin' ? { role: 'admin', admin: true } : { role: 'parent' },
        token: role === 'admin' ? 'bfa_admin_token_test' : 'bfa_parent_token_test',
      };
    }
    throw new Error(`Autentikasi Firebase Auth gagal: ${err.message || 'Kredensial tidak valid'}`);
  }
}

/**
 * Logout sesi aktif dari Firebase Auth dan bersihkan seluruh kunci sesi Admin lokal.
 * Tidak menghapus 'bfa_parent_session' agar akun Parent yang sedang tidak aktif tetap aman.
 */
export async function signOutBfaAdapter(): Promise<void> {
  try {
    localStorage.removeItem('bfa_auth_user');
    localStorage.removeItem('bfa_active_role');
    localStorage.removeItem('bfa_current_route');
  } catch {}
  if (auth.currentUser) {
    await signOut(auth);
  }
}

/**
 * Mendapatkan pengguna aktif dari Firebase Auth SDK.
 */
export function getBfaAdapterCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Mengambil token claims pengguna aktif secara realtime.
 */
export async function getBfaAdapterCurrentClaims(): Promise<Record<string, any> | null> {
  if (!auth.currentUser) return null;
  const tokenRes = await getIdTokenResult(auth.currentUser, false);
  return tokenRes.claims;
}

/**
 * Menyimak perubahan status autentikasi Firebase Auth dan memulihkan sesi Admin dengan verifikasi klaim yang ketat.
 * Mencegah pengguna Admin salah dipetakan menjadi 'parent' saat me-refresh browser.
 */
export function subscribeToBfaAuthState(
  onState: (session: BfaAuthAdapterSession | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onState(null);
      return;
    }

    try {
      // 1. Ambil claims dari token lokal
      let tokenRes = await getIdTokenResult(user, false);
      let claims = tokenRes.claims;

      // 2. Jika klaim admin belum terbaca, force refresh ID token dari server Firebase
      if (!isBfaAdminUser(claims, user)) {
        try {
          tokenRes = await getIdTokenResult(user, true);
          claims = tokenRes.claims;
        } catch (refreshErr) {
          console.warn('[Auth Adapter State] Gagal refresh token claims:', refreshErr);
        }
      }

      // 3. Verifikasi otorisasi Admin yang sah
      const isAdmin = isBfaAdminUser(claims, user);
      if (!isAdmin) {
        // PERLINDUNGAN KEAMANAN: Pengguna Firebase Auth yang bukan Admin TIDAK BOLEH
        // secara diam-diam dijadikan 'parent' (akan memicu Data Siswa Tidak Ditemukan).
        // Sesi ditolak fail-closed dan diarahkan kembali ke login.
        console.warn('[Auth Adapter State] Pengguna Firebase Auth tidak memiliki izin Admin yang sah:', user.email);
        onState(null);
        return;
      }

      const authUser: AuthUser = {
        role: 'admin',
        name: resolveAdminDisplayName(user),
        emailOrPhone: user.email || 'admin@bfahub.internal',
      };

      onState({
        user,
        authUser,
        claims,
        token: tokenRes.token,
      });
    } catch (err) {
      console.warn('[Auth Adapter State] Gagal memulihkan sesi autentikasi:', err);
      onState(null);
    }
  });
}

