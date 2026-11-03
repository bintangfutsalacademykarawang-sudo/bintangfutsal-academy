/**
 * BFA HUB — TRUSTED BACKEND SIMULATOR (TAHAP 5B-7B)
 * Mode: STRICT LOCAL-ONLY · EMULATOR-ONLY · SYNTHETIC DATA ONLY · NO PRODUCTION/CLOUD
 * 
 * Modul ini terisolasi di direktori tests/ dan HANYA berkomunikasi dengan Firebase Emulator Suite lokal.
 * DILARANG MENGIMPOR MODUL INI KE DALAM src/ ATAU BUNDLE FRONTEND CLIENT.
 */

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth, UserRecord } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

export const EMULATOR_PROJECT_ID = 'demo-bfa-hub';
export const EMULATOR_AUTH_HOST = '127.0.0.1';
export const EMULATOR_AUTH_PORT = 9099;
export const EMULATOR_FIRESTORE_HOST = '127.0.0.1';
export const EMULATOR_FIRESTORE_PORT = 8085;

export interface AdminContext {
  uid: string;
  role: 'admin' | 'coach' | 'parent';
  email: string;
  displayName?: string;
}

export interface RegistrationRecord {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  parentId?: string;
  familyId?: string;
  status: 'menunggu-verifikasi' | 'approved' | 'rejected';
  submittedAt: number;
}

export interface StudentRecord {
  id: string;
  name: string;
  authUid?: string;
  parentId: string;
  familyId?: string;
  status: 'menunggu-verifikasi' | 'aktif' | 'nonaktif';
  phone?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApprovalParams {
  registrationId: string;
  studentId: string;
  simulatePartialFailure?: boolean;
}

export interface ApprovalResult {
  success: boolean;
  status: 'SUCCESS_PROVISIONED' | 'ALREADY_APPROVED' | 'PARTIAL_FAILURE_AUTH_CREATED_FIRESTORE_PENDING';
  studentId: string;
  authUid?: string;
  isNewAccount?: boolean;
  activationQueued: boolean;
  message: string;
  recoveryNeeded?: boolean;
}

export interface ResetPasswordParams {
  studentId: string;
  simulateRateLimit?: boolean;
}

export interface ResetPasswordResult {
  success: boolean;
  studentId: string;
  authUid: string;
  resetQueued: boolean;
  message: string;
}

/**
 * FAIL-CLOSED PREFLIGHT ENVIRONMENT GUARD
 * Memastikan eksekusi hanya berjalan di Firebase Emulator lokal 'demo-bfa-hub'.
 * Menolak keras host selain 127.0.0.1 atau localhost, serta menolak jika terdapat kredensial cloud.
 */
export function assertTrustedBackendIsolationGuard(): void {
  const env = process.env;

  // 1. Validasi Project ID
  const project = env.GCLOUD_PROJECT || env.FIREBASE_PROJECT || env.VITE_FIREBASE_PROJECT_ID;
  if (!project || project.trim() !== EMULATOR_PROJECT_ID) {
    throw new Error(
      `[TrustedBackend Guard] FATAL: Project ID "${project}" tidak valid. ` +
      `Backend simulator HANYA diizinkan berjalan pada emulator project "${EMULATOR_PROJECT_ID}".`
    );
  }

  // 2. Validasi Auth Emulator Host
  const authHost = env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!authHost) {
    throw new Error(
      `[TrustedBackend Guard] FATAL: FIREBASE_AUTH_EMULATOR_HOST belum disetel. ` +
      `Wajib bernilai "${EMULATOR_AUTH_HOST}:${EMULATOR_AUTH_PORT}".`
    );
  }
  const [authIp, authPort] = authHost.split(':');
  if ((authIp !== '127.0.0.1' && authIp !== 'localhost') || authPort !== String(EMULATOR_AUTH_PORT)) {
    throw new Error(
      `[TrustedBackend Guard] FATAL: FIREBASE_AUTH_EMULATOR_HOST "${authHost}" ditolak. ` +
      `Hanya diizinkan pada loopback ${EMULATOR_AUTH_HOST}:${EMULATOR_AUTH_PORT}.`
    );
  }

  // 3. Validasi Firestore Emulator Host
  const firestoreHost = env.FIRESTORE_EMULATOR_HOST;
  if (!firestoreHost) {
    throw new Error(
      `[TrustedBackend Guard] FATAL: FIRESTORE_EMULATOR_HOST belum disetel. ` +
      `Wajib bernilai "${EMULATOR_FIRESTORE_HOST}:${EMULATOR_FIRESTORE_PORT}".`
    );
  }
  const [fsIp, fsPort] = firestoreHost.split(':');
  if ((fsIp !== '127.0.0.1' && fsIp !== 'localhost') || fsPort !== String(EMULATOR_FIRESTORE_PORT)) {
    throw new Error(
      `[TrustedBackend Guard] FATAL: FIRESTORE_EMULATOR_HOST "${firestoreHost}" ditolak. ` +
      `Hanya diizinkan pada loopback ${EMULATOR_FIRESTORE_HOST}:${EMULATOR_FIRESTORE_PORT}.`
    );
  }

  // 4. Tolak kredensial cloud / Service Account eksternal
  if (env.GOOGLE_APPLICATION_CREDENTIALS && env.GOOGLE_APPLICATION_CREDENTIALS.trim() !== '') {
    throw new Error(
      `[TrustedBackend Guard] FATAL: GOOGLE_APPLICATION_CREDENTIALS terdeteksi. ` +
      `Backend simulator lokal dilarang menggunakan kunci service account eksternal.`
    );
  }
}

/**
 * Inisialisasi Firebase Admin App tunggal khusus simulator lokal
 */
let adminAppInstance: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

export function getTrustedAdminInstance(): {
  app: App;
  auth: Auth;
  db: Firestore;
} {
  assertTrustedBackendIsolationGuard();

  if (!adminAppInstance) {
    const apps = getApps();
    const existing = apps.find(a => a.name === 'bfa-trusted-backend-simulator');
    if (existing) {
      adminAppInstance = existing;
    } else {
      adminAppInstance = initializeApp(
        { projectId: EMULATOR_PROJECT_ID },
        'bfa-trusted-backend-simulator'
      );
    }
    adminAuthInstance = getAuth(adminAppInstance);
    adminDbInstance = getFirestore(adminAppInstance);
  }

  return {
    app: adminAppInstance,
    auth: adminAuthInstance!,
    db: adminDbInstance!,
  };
}

// In-memory rate limiting map for password resets (per studentId: timestamps[])
const passwordResetAttempts = new Map<string, number[]>();
const RESET_RATE_LIMIT_WINDOW_MS = 60000; // 1 menit
const MAX_RESETS_PER_WINDOW = 3;

/**
 * 1. APPROVE STUDENT AND PROVISION AUTH (SIMULATOR)
 * Menyetujui pendaftaran siswa, memvalidasi isolasi keluarga, membuat akun Auth jika belum ada,
 * dan memasukkan item ke antrean aktivasi sintetis tanpa mengekspos kata sandi.
 */
export async function approveStudentAndProvisionAuth(
  adminContext: AdminContext,
  params: ApprovalParams
): Promise<ApprovalResult> {
  assertTrustedBackendIsolationGuard();

  // 1. Validasi Hak Akses Admin
  if (!adminContext || adminContext.role !== 'admin') {
    throw new Error(`[FORBIDDEN_NOT_ADMIN] Operasi persetujuan hanya diizinkan untuk peran admin terverifikasi.`);
  }

  const { studentId, registrationId, simulatePartialFailure } = params;
  if (!studentId || !registrationId) {
    throw new Error(`[INVALID_ARGUMENTS] studentId dan registrationId wajib disertakan.`);
  }

  const { auth, db } = getTrustedAdminInstance();

  // 2. Baca Dokumen Registrasi
  const regRef = db.collection('registrations').doc(registrationId);
  const regSnap = await regRef.get();
  if (!regSnap.exists) {
    throw new Error(`[REGISTRATION_NOT_FOUND] Dokumen pendaftaran "${registrationId}" tidak ditemukan.`);
  }

  const regData = regSnap.data() as RegistrationRecord;

  // 3. Validasi Status Registrasi
  if (regData.status === 'rejected') {
    throw new Error(`[REGISTRATION_REJECTED] Pendaftaran siswa telah ditolak dan tidak dapat disetujui.`);
  }

  // Idempotency: Jika sudah berstatus approved dan student sudah ada authUid
  if (regData.status === 'approved') {
    const studentRef = db.collection('students').doc(studentId);
    const studentSnap = await studentRef.get();
    if (studentSnap.exists && studentSnap.data()?.authUid) {
      return {
        success: true,
        status: 'ALREADY_APPROVED',
        studentId,
        authUid: studentSnap.data()?.authUid,
        isNewAccount: false,
        activationQueued: false,
        message: `Pendaftaran ${studentId} sudah disetujui sebelumnya (idempoten).`,
      };
    }
  }

  // 4. Isolasi Keluarga: Tentukan parentId yang valid
  // PENTING: Jangan menganggap nomor WhatsApp sama membuktikan hubungan keluarga tanpa verifikasi parentId/familyId.
  const parentId = regData.parentId || `parent_${regData.parentPhone.replace(/\D/g, '')}_${regData.familyId || 'fam1'}`;
  const parentEmail = `syn_parent_${parentId.toLowerCase()}@local.test`;

  // 5. Temukan atau Buat Akun Auth untuk Orang Tua
  let parentAuthUser: UserRecord;
  let isNewAccount = false;

  try {
    parentAuthUser = await auth.getUserByEmail(parentEmail);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      // Buat akun baru sintetis untuk orang tua
      parentAuthUser = await auth.createUser({
        email: parentEmail,
        displayName: regData.parentName,
        emailVerified: true,
      });
      isNewAccount = true;
    } else {
      throw err;
    }
  }

  // 6. Perbarui Custom Claims dengan relasi studentIds yang aman
  const existingClaims = (parentAuthUser.customClaims || {}) as Record<string, any>;
  const currentStudentIds: string[] = Array.isArray(existingClaims.studentIds) ? existingClaims.studentIds : [];
  if (!currentStudentIds.includes(studentId)) {
    currentStudentIds.push(studentId);
  }

  await auth.setCustomUserClaims(parentAuthUser.uid, {
    ...existingClaims,
    role: 'parent',
    parentId,
    studentIds: currentStudentIds,
    phone: regData.parentPhone,
  });

  // 7. Penanganan Kegagalan Parsial (Simulasi Error)
  if (simulatePartialFailure) {
    return {
      success: false,
      status: 'PARTIAL_FAILURE_AUTH_CREATED_FIRESTORE_PENDING',
      studentId,
      authUid: parentAuthUser.uid,
      isNewAccount,
      activationQueued: false,
      message: `Kegagalan parsial: Akun Auth telah dibuat (${parentAuthUser.uid}), namun sinkronisasi Firestore tertunda.`,
      recoveryNeeded: true,
    };
  }

  // 8. Tulis Dokumen Siswa dan Perbarui Status Registrasi di Firestore
  const studentRef = db.collection('students').doc(studentId);
  const now = Date.now();

  const batch = db.batch();
  batch.set(studentRef, {
    id: studentId,
    name: regData.studentName,
    authUid: parentAuthUser.uid,
    parentId,
    familyId: regData.familyId || null,
    phone: regData.parentPhone,
    status: 'aktif',
    createdAt: regData.submittedAt || now,
    updatedAt: now,
  }, { merge: true });

  batch.update(regRef, {
    status: 'approved',
    approvedBy: adminContext.uid,
    approvedAt: now,
    authUid: parentAuthUser.uid,
  });

  // 9. Antrean Aktivasi Sintetis (Tanpa Menyimpan Kata Sandi/Rahasia)
  const queueRef = db.collection('activationQueue').doc(`act_${studentId}_${now}`);
  batch.set(queueRef, {
    queueId: `act_${studentId}_${now}`,
    type: 'account_activation',
    studentId,
    parentId,
    parentEmail,
    status: 'ready_to_send',
    createdAt: now,
    processed: false,
  });

  await batch.commit();

  return {
    success: true,
    status: 'SUCCESS_PROVISIONED',
    studentId,
    authUid: parentAuthUser.uid,
    isNewAccount,
    activationQueued: true,
    message: `Siswa ${studentId} berhasil disetujui dan akun Auth terhubung.`,
  };
}

/**
 * RECOVERY HELPER UNTUK KEGAGALAN PARSIAL
 * Menyelesaikan sinkronisasi dokumen siswa yang tertunda tanpa membuat akun Auth baru.
 */
export async function repairPartialApproval(
  adminContext: AdminContext,
  studentId: string,
  registrationId: string,
  authUid: string
): Promise<ApprovalResult> {
  assertTrustedBackendIsolationGuard();

  if (!adminContext || adminContext.role !== 'admin') {
    throw new Error(`[FORBIDDEN_NOT_ADMIN] Operasi pemulihan hanya diizinkan untuk admin.`);
  }

  const { db } = getTrustedAdminInstance();
  const regRef = db.collection('registrations').doc(registrationId);
  const studentRef = db.collection('students').doc(studentId);

  const regSnap = await regRef.get();
  if (!regSnap.exists) {
    throw new Error(`[REGISTRATION_NOT_FOUND] Dokumen pendaftaran "${registrationId}" tidak ditemukan.`);
  }
  const regData = regSnap.data() as RegistrationRecord;
  const now = Date.now();

  const batch = db.batch();
  batch.set(studentRef, {
    id: studentId,
    name: regData.studentName,
    authUid,
    parentId: regData.parentId || `parent_${studentId}`,
    status: 'aktif',
    updatedAt: now,
  }, { merge: true });

  batch.update(regRef, {
    status: 'approved',
    approvedBy: adminContext.uid,
    approvedAt: now,
    authUid,
  });

  const queueRef = db.collection('activationQueue').doc(`act_${studentId}_repaired_${now}`);
  batch.set(queueRef, {
    queueId: `act_${studentId}_repaired_${now}`,
    type: 'account_activation_repaired',
    studentId,
    authUid,
    status: 'ready_to_send',
    createdAt: now,
    processed: false,
  });

  await batch.commit();

  return {
    success: true,
    status: 'SUCCESS_PROVISIONED',
    studentId,
    authUid,
    isNewAccount: false,
    activationQueued: true,
    message: `Pemulihan kegagalan parsial untuk siswa ${studentId} berhasil diselesaikan.`,
  };
}

/**
 * 2. RESET STUDENT PASSWORD BY ADMIN (SIMULATOR)
 * Mereset password akun siswa secara aman:
 * - Otorisasi admin ketat
 * - Rate limiting
 * - Memperbarui Auth langsung tanpa menyimpan password baru di Firestore/log
 * - Mengantrekan notifikasi sintetis
 */
export async function resetStudentPasswordByAdmin(
  adminContext: AdminContext,
  params: ResetPasswordParams
): Promise<ResetPasswordResult> {
  assertTrustedBackendIsolationGuard();

  // 1. Validasi Admin
  if (!adminContext || adminContext.role !== 'admin') {
    throw new Error(`[FORBIDDEN_NOT_ADMIN] Reset sandi hanya diizinkan untuk peran admin.`);
  }

  const { studentId, simulateRateLimit } = params;
  if (!studentId) {
    throw new Error(`[INVALID_ARGUMENTS] studentId wajib disertakan.`);
  }

  // 2. Rate Limiting Check
  const now = Date.now();
  const attempts = passwordResetAttempts.get(studentId) || [];
  const recentAttempts = attempts.filter(t => (now - t) < RESET_RATE_LIMIT_WINDOW_MS);

  if (simulateRateLimit || recentAttempts.length >= MAX_RESETS_PER_WINDOW) {
    throw new Error(
      `[RATE_LIMIT_EXCEEDED] Batas frekuensi reset kata sandi tercapai untuk siswa ${studentId}. Coba lagi nanti.`
    );
  }

  recentAttempts.push(now);
  passwordResetAttempts.set(studentId, recentAttempts);

  const { auth, db } = getTrustedAdminInstance();

  // 3. Cari Siswa di Firestore
  const studentRef = db.collection('students').doc(studentId);
  const studentSnap = await studentRef.get();
  if (!studentSnap.exists) {
    throw new Error(`[STUDENT_NOT_FOUND] Siswa dengan ID "${studentId}" tidak ditemukan.`);
  }

  const studentData = studentSnap.data() as StudentRecord;
  if (!studentData.authUid) {
    throw new Error(`[STUDENT_AUTH_NOT_PROVISIONED] Siswa "${studentId}" belum memiliki akun Firebase Auth terhubung.`);
  }

  // 4. Perbarui Password di Firebase Auth Langsung
  // Buat kata sandi sintetis yang aman
  const tempSyntheticPassword = `SynTempPass!2026_${Math.random().toString(36).slice(2, 10)}`;
  await auth.updateUser(studentData.authUid, {
    password: tempSyntheticPassword,
  });

  // 5. Antrekan Notifikasi Reset Sintetis (DILARANG MENYIMPAN SANDI DI FIRESTORE ATAU LOG)
  const queueRef = db.collection('activationQueue').doc(`reset_${studentId}_${now}`);
  await queueRef.set({
    queueId: `reset_${studentId}_${now}`,
    type: 'password_reset',
    studentId,
    authUid: studentData.authUid,
    status: 'queued',
    createdAt: now,
    processed: false,
    // CATATAN KEAMANAN: Kata sandi TIDAK PERNAH disimpan di dokumen ini.
  });

  return {
    success: true,
    studentId,
    authUid: studentData.authUid,
    resetQueued: true,
    message: `Kata sandi akun siswa ${studentId} berhasil direset dan event notifikasi diantrekan secara aman.`,
  };
}

/**
 * PEMBERSIHAN DATA SINTETIS BERLAPIS (ISOLATED CLEANUP)
 * Menghapus HANYA data dan akun Auth yang dibuat oleh runner pengujian ini.
 */
export async function cleanupSyntheticBackendData(
  createdStudentIds: string[],
  createdRegistrationIds: string[],
  createdAuthUids: string[]
): Promise<{
  deletedStudents: number;
  deletedRegistrations: number;
  deletedAuthUsers: number;
  remainingAuthUsersCount: number;
}> {
  assertTrustedBackendIsolationGuard();
  const { auth, db } = getTrustedAdminInstance();

  let deletedStudents = 0;
  let deletedRegistrations = 0;
  let deletedAuthUsers = 0;

  // 1. Hapus Dokumen Siswa Sintetis
  for (const sId of createdStudentIds) {
    try {
      await db.collection('students').doc(sId).delete();
      deletedStudents++;
    } catch (_) {}
  }

  // 2. Hapus Dokumen Registrasi Sintetis
  for (const rId of createdRegistrationIds) {
    try {
      await db.collection('registrations').doc(rId).delete();
      deletedRegistrations++;
    } catch (_) {}
  }

  // 3. Hapus Dokumen Antrean Aktivasi Sintetis untuk Siswa yang Dibuat
  for (const sId of createdStudentIds) {
    try {
      const qSnaps = await db.collection('activationQueue').where('studentId', '==', sId).get();
      for (const doc of qSnaps.docs) {
        await doc.ref.delete();
      }
    } catch (_) {}
  }

  // 4. Hapus Akun Auth Sintetis
  const uniqueUids = Array.from(new Set(createdAuthUids));
  for (const uid of uniqueUids) {
    try {
      await auth.deleteUser(uid);
      deletedAuthUsers++;
    } catch (_) {}
  }

  // 5. Audit Jumlah Akun Auth Tersisa pada Emulator
  let remainingAuthUsersCount = 0;
  try {
    const listRes = await auth.listUsers(100);
    remainingAuthUsersCount = listRes.users.length;
  } catch (err: any) {
    console.error('[cleanupSyntheticBackendData] Gagal mengaudit sisa akun:', err);
  }

  return {
    deletedStudents,
    deletedRegistrations,
    deletedAuthUsers,
    remainingAuthUsersCount,
  };
}
