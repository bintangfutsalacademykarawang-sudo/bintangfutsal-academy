/**
 * BFA HUB — FIRESTORE BACKEND STORE (STAGING IMPLEMENTATION)
 * Mode: STAGING-FIRST · ZERO-TRUST · FIREBASE ADMIN SDK · NO PRODUCTION
 * 
 * Lapisan repository nyata menggunakan Firebase Admin SDK untuk menghubungkan
 * backend staging ke Firestore project 'bfa-hub-staging'.
 */

import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore, Transaction } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from './firebaseAdminInit';
import { BackendDataStore } from './trustedBackendService';
import { Student, Invoice, Attendance, CashMutation, PaymentVerificationRequest, RegistrationStatus } from '../types';
import { InvoicePayment } from '../types/finance';

export const PRODUCTION_PROJECT_ID = 'future-wonder-jwh4c';
export const STAGING_PROJECT_ID = 'bfa-hub-staging';
export const PRODUCTION_DATABASE_ID = 'ai-studio-bfahubbintangfut-e02f4d35-ecd3-486e-9ee5-9fa8b9a78283';
export const STAGING_DATABASE_ID = '(default)';

export function assertStagingIsolationGuard(targetProject: string): void {
  const env = process.env;
  const configuredProject = env.GCLOUD_PROJECT || env.FIREBASE_PROJECT || env.VITE_FIREBASE_PROJECT_ID;
  const isProd = env.NODE_ENV === 'production' || targetProject === PRODUCTION_PROJECT_ID;

  if (!isProd && configuredProject === PRODUCTION_PROJECT_ID) {
    throw new Error('[Firestore Store Guard] FATAL: Proyek produksi "future-wonder-jwh4c" terdeteksi pada mode staging! Akses dilarang keras.');
  }
}

export class FirestoreBackendStore implements BackendDataStore {
  public readonly projectId: string;
  public readonly databaseId: string;
  private db: Firestore;

  constructor(projectId: string = PRODUCTION_PROJECT_ID) {
    assertStagingIsolationGuard(projectId);

    if (projectId !== PRODUCTION_PROJECT_ID && projectId !== STAGING_PROJECT_ID && projectId !== 'demo-bfa-hub') {
      throw new Error(`[Firestore Store] FATAL: Project ID "${projectId}" tidak valid.`);
    }

    this.projectId = projectId;

    if (projectId === PRODUCTION_PROJECT_ID) {
      this.databaseId = PRODUCTION_DATABASE_ID;
      const adminApp = initFirebaseAdmin();
      this.db = getFirestore(adminApp, PRODUCTION_DATABASE_ID);
    } else {
      this.databaseId = STAGING_DATABASE_ID;
      const apps = getApps();
      const existing = apps.find(a => a.name === 'bfa-staging-admin-app');
      let app: App;
      if (existing) {
        app = existing;
      } else {
        try {
          if (projectId === STAGING_PROJECT_ID) {
            const rawJsonEnv = process.env.FIREBASE_STAGING_SERVICE_ACCOUNT_JSON;
            const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;

            if (!rawJsonEnv || !rawJsonEnv.trim().startsWith('{')) {
              if (isProd) {
                throw new Error('FATAL: FIREBASE_STAGING_SERVICE_ACCOUNT_JSON wajib diisi untuk staging.');
              } else {
                console.warn('[FirestoreBackendStore] WARNING: Fallback applicationDefault() untuk preview lokal staging.');
                app = initializeApp({
                  credential: applicationDefault(),
                  projectId: STAGING_PROJECT_ID,
                }, 'bfa-staging-admin-app');
              }
            } else {
              const trimmed = rawJsonEnv.trim();
              const parsed = JSON.parse(trimmed);
              if (parsed.project_id === PRODUCTION_PROJECT_ID) {
                throw new Error('FATAL: Kredensial produksi terdeteksi pada konfigurasi staging! Akses ditolak.');
              }
              app = initializeApp({
                credential: cert(parsed),
                projectId: STAGING_PROJECT_ID,
              }, 'bfa-staging-admin-app');
            }
          } else {
            app = initializeApp({
              projectId: 'demo-bfa-hub',
            }, 'bfa-staging-admin-app');
          }
        } catch (err: any) {
          throw new Error(`[FirestoreBackendStore] FATAL: Gagal menginisialisasi Admin SDK: ${err.message}`);
        }
      }
      this.db = getFirestore(app);
    }
  }

  async getStudentCounter(): Promise<number> {
    const counterDocRef = this.db.collection('system').doc('student_counter');
    const snap = await counterDocRef.get();
    if (!snap.exists) {
      return 38; // Baseline default BFA-038
    }
    const data = snap.data();
    return typeof data?.value === 'number' ? data.value : 38;
  }

  async setStudentCounter(nextSeq: number): Promise<void> {
    const counterDocRef = this.db.collection('system').doc('student_counter');
    await counterDocRef.set({ value: nextSeq, updatedAt: new Date().toISOString() }, { merge: true });
  }

  async getStudent(id: string): Promise<Student | null> {
    const docRef = this.db.collection('students').doc(id);
    const snap = await docRef.get();
    return snap.exists ? (snap.data() as Student) : null;
  }

  async saveStudent(student: Student): Promise<void> {
    const docRef = this.db.collection('students').doc(student.id);
    await docRef.set(student, { merge: true });
  }

  async listStudents(): Promise<Student[]> {
    const snapshot = await this.db.collection('students').get();
    const students: Student[] = [];
    snapshot.forEach(doc => {
      students.push(doc.data() as Student);
    });
    return students;
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const docRef = this.db.collection('invoices').doc(id);
    const snap = await docRef.get();
    return snap.exists ? (snap.data() as Invoice) : null;
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    const docRef = this.db.collection('invoices').doc(invoice.id);
    await docRef.set(invoice, { merge: true });
  }

  async listInvoicesByStudent(studentId: string): Promise<Invoice[]> {
    const snapshot = await this.db.collection('invoices').where('studentId', '==', studentId).get();
    const invoices: Invoice[] = [];
    snapshot.forEach(doc => {
      invoices.push(doc.data() as Invoice);
    });
    return invoices;
  }

  async getAttendance(id: string): Promise<Attendance | null> {
    const docRef = this.db.collection('attendances').doc(id);
    const snap = await docRef.get();
    return snap.exists ? (snap.data() as Attendance) : null;
  }

  async saveAttendance(attendance: Attendance): Promise<void> {
    const docRef = this.db.collection('attendances').doc(attendance.id);
    await docRef.set(attendance, { merge: true });
  }

  async saveInvoicePayment(payment: InvoicePayment): Promise<void> {
    const docRef = this.db.collection('invoicePayments').doc(payment.id);
    await docRef.set(payment, { merge: true });
  }

  async saveCashMutation(mutation: CashMutation): Promise<void> {
    const docRef = this.db.collection('cashMutations').doc(mutation.id);
    await docRef.set(mutation, { merge: true });
  }

  async getPaymentVerification(id: string): Promise<PaymentVerificationRequest | null> {
    const docRef = this.db.collection('paymentVerificationRequests').doc(id);
    const snap = await docRef.get();
    return snap.exists ? (snap.data() as PaymentVerificationRequest) : null;
  }

  async savePaymentVerification(request: PaymentVerificationRequest): Promise<void> {
    const docRef = this.db.collection('paymentVerificationRequests').doc(request.id);
    await docRef.set(request, { merge: true });
  }

  /**
   * Jalankan transaksi Firestore sungguhan menggunakan Firebase Admin SDK.
   */
  async runTransactionInFirestore<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T> {
    return await this.db.runTransaction(updateFunction);
  }

  /**
   * ATOMIC STUDENT REGISTRATION & COUNTER INCREMENT (FIREBASE ADMIN SDK TRANSACTION)
   * Menjamin keterbacaan counter dan dokumen siswa secara atomik dalam 1 transaksi db.runTransaction().
   * Invariansi Read-Before-Write dipatuhi secara ketat: seluruh transaction.get dilakukan sebelum transaction.set.
   */
  async registerStudentAtomic(
    payload: Partial<Student>,
    registeredByRole: 'admin' | 'public' = 'public'
  ): Promise<{ student: Student; generatedId: string }> {
    return await this.db.runTransaction(async (transaction: Transaction) => {
      const counterRef = this.db.collection('system').doc('student_counter');
      const studentsCollRef = this.db.collection('students');

      // 1. READ PHASE: Read system counter doc inside transaction
      const counterSnap = await transaction.get(counterRef);

      // 2. READ PHASE: Scan existing students inside transaction to establish high-water mark sequence
      let maxDocSeq = 0;
      try {
        const studentsSnap = await transaction.get(studentsCollRef);
        studentsSnap.forEach((docSnap) => {
          const rawId = docSnap.id || docSnap.data()?.id || '';
          const match = String(rawId).match(/^BFA-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxDocSeq) {
              maxDocSeq = num;
            }
          }
        });
      } catch (err: any) {
        throw new Error(
          `[Atomic Transaction] Gagal membaca koleksi siswa dari Firestore Admin SDK: ${err?.message || err}. Registrasi dibatalkan untuk mencegah duplikasi.`
        );
      }

      let currentSequence = Math.max(38, maxDocSeq);

      if (counterSnap.exists) {
        const data = counterSnap.data();
        const dataSeq = typeof data?.lastSequence === 'number' ? data.lastSequence : (typeof data?.value === 'number' ? data.value : 0);
        if (dataSeq > currentSequence) {
          currentSequence = dataSeq;
        }
      }

      let nextSequence = currentSequence + 1;
      let candidateId = `BFA-${String(nextSequence).padStart(3, '0')}`;
      let candidateRef = studentsCollRef.doc(candidateId);

      // 3. READ PHASE: Check candidate document ID uniqueness inside transaction
      let candidateSnap = await transaction.get(candidateRef);
      let attempts = 0;
      while (candidateSnap.exists && attempts < 100) {
        attempts++;
        nextSequence++;
        candidateId = `BFA-${String(nextSequence).padStart(3, '0')}`;
        candidateRef = studentsCollRef.doc(candidateId);
        candidateSnap = await transaction.get(candidateRef);
      }

      if (candidateSnap.exists) {
        throw new Error(`[Atomic Transaction] Konflik keunikan ID: Gagal menemukan ID siswa unik setelah ${attempts} percobaan.`);
      }

      const nowIso = new Date().toISOString();
      const initialRegStatus: RegistrationStatus = registeredByRole === 'admin' ? 'DISETUJUI' : 'MENUNGGU_VERIFIKASI';

      const finalStudent: Student = {
        ...payload,
        id: candidateId,
        joinedDate: payload.joinedDate || nowIso.split('T')[0],
        registrationStatus: initialRegStatus,
        status: (payload.status as any) || 'Aktif',
      } as Student;

      // 4. WRITE PHASE: Execute all atomic commits (transaction.set) after all reads finish
      transaction.set(
        counterRef,
        {
          value: nextSequence,
          lastSequence: nextSequence,
          lastAllocatedId: candidateId,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      transaction.set(candidateRef, finalStudent, { merge: true });

      return { student: finalStudent, generatedId: candidateId };
    });
  }
}

