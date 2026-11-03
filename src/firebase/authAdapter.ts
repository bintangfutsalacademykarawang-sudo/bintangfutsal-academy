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
 * Melakukan sign-in melalui Firebase Auth Emulator menggunakan kredensial BFA HUB.
 * Menghasilkan sesi Auth resmi Firebase dengan custom claims yang terbaca oleh Firestore Security Rules.
 */
export async function signInWithBfaAdapter(
  credentials: BfaAuthCredentials
): Promise<BfaAuthAdapterSession> {
  assertAdapterIsolationGuard();

  const role: BfaAdapterRole = credentials.role || (
    credentials.identifier.toLowerCase() === 'admin' || credentials.identifier.toLowerCase() === 'edysun'
      ? 'admin'
      : (credentials.identifier.toLowerCase().startsWith('coach') ? 'coach' : 'parent')
  );

  const syntheticEmail = resolveBfaSyntheticEmail(
    credentials.identifier,
    role,
    credentials.studentId
  );

  // Pastikan akun siap di emulator
  await ensureSyntheticAccountProvisioned(
    syntheticEmail,
    credentials.password,
    role,
    {
      displayName: credentials.staffName || credentials.studentName || credentials.identifier,
      studentId: credentials.studentId,
      studentName: credentials.studentName,
      coachId: credentials.coachId,
      phone: credentials.identifier.startsWith('08') || credentials.identifier.startsWith('62') ? credentials.identifier : undefined,
    }
  );

  // Sign in resmi via Firebase Auth SDK
  const userCredential = await signInWithEmailAndPassword(auth, syntheticEmail, credentials.password);
  const user = userCredential.user;

  // Force token refresh untuk mendapatkan custom claims terbaru dari emulator
  const idTokenResult: IdTokenResult = await getIdTokenResult(user, true);

  // Konstruksi AuthUser yang kompatibel dengan state aplikasi lama
  const mappedRole: Role = role === 'admin' ? 'admin' : 'parent';
  const mappedAuthUser: AuthUser = {
    role: mappedRole,
    name: credentials.staffName || user.displayName || (role === 'admin' ? 'Admin BFA' : 'Wali Siswa'),
    emailOrPhone: credentials.identifier,
    ...(credentials.studentId ? { studentId: credentials.studentId } : {}),
    ...(credentials.studentName ? { studentName: credentials.studentName } : {}),
  };

  return {
    user,
    authUser: mappedAuthUser,
    claims: idTokenResult.claims,
    token: idTokenResult.token,
  };
}

/**
 * Logout sesi aktif dari Firebase Auth Emulator.
 */
export async function signOutBfaAdapter(): Promise<void> {
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
 * Menyimak perubahan status autentikasi Firebase Auth dan mengekstrak klaim peran secara otomatis.
 */
export function subscribeToBfaAuthState(
  onState: (session: BfaAuthAdapterSession | null) => void
): () => void {
  return onSnapshotAdapterAuthState(onState);
}

function onSnapshotAdapterAuthState(
  onState: (session: BfaAuthAdapterSession | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onState(null);
      return;
    }

    try {
      const tokenRes = await getIdTokenResult(user, false);
      const claims = tokenRes.claims;
      const roleClaim = claims.role as string;
      const mappedRole: Role = roleClaim === 'admin' ? 'admin' : 'parent';

      const authUser: AuthUser = {
        role: mappedRole,
        name: user.displayName || (roleClaim === 'admin' ? 'Admin BFA' : 'Pengguna BFA'),
        emailOrPhone: user.email || '',
        ...(claims.studentId ? { studentId: String(claims.studentId) } : {}),
        ...(claims.studentName ? { studentName: String(claims.studentName) } : {}),
      };

      onState({
        user,
        authUser,
        claims,
        token: tokenRes.token,
      });
    } catch (err) {
      console.warn('[Auth Adapter State] Gagal mengekstrak token claims:', err);
      onState(null);
    }
  });
}
