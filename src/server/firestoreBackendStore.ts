/**
 * BFA HUB — FIRESTORE BACKEND STORE (STAGING IMPLEMENTATION)
 * Mode: STAGING-FIRST · ZERO-TRUST · FIREBASE ADMIN SDK · NO PRODUCTION
 * 
 * Lapisan repository nyata menggunakan Firebase Admin SDK untuk menghubungkan
 * backend staging ke Firestore project 'bfa-hub-staging'.
 */

import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore, Transaction } from 'firebase-admin/firestore';
import { BackendDataStore } from './trustedBackendService';
import { Student, Invoice, Attendance, CashMutation, PaymentVerificationRequest } from '../types';
import { InvoicePayment } from '../types/finance';

export const STAGING_PROJECT_ID = 'bfa-hub-staging';

export function assertStagingIsolationGuard(): void {
  const env = process.env;
  const project = env.GCLOUD_PROJECT || env.FIREBASE_PROJECT || env.VITE_FIREBASE_PROJECT_ID;
  if (project === 'future-wonder-jwh4c') {
    throw new Error('[Firestore Store Guard] FATAL: Proyek produksi "future-wonder-jwh4c" terdeteksi! Akses dilarang keras.');
  }
}

export class FirestoreBackendStore implements BackendDataStore {
  private db: Firestore;

  constructor(projectId: string = STAGING_PROJECT_ID) {
    assertStagingIsolationGuard();
    if (projectId !== STAGING_PROJECT_ID && projectId !== 'demo-bfa-hub') {
      throw new Error(`[Firestore Store] FATAL: Project ID "${projectId}" tidak valid untuk staging.`);
    }

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
              throw new Error('FATAL: Variabel lingkungan FIREBASE_STAGING_SERVICE_ACCOUNT_JSON wajib diisi dengan Service Account JSON staging yang valid untuk bfa-hub-staging di production/cloud staging. Fallback ke applicationDefault() dilarang keras.');
            } else {
              console.warn('[FirestoreBackendStore] WARNING: FIREBASE_STAGING_SERVICE_ACCOUNT_JSON tidak ditemukan di development. Menggunakan applicationDefault() untuk preview lokal.');
              app = initializeApp({
                credential: applicationDefault(),
                projectId: STAGING_PROJECT_ID,
              }, 'bfa-staging-admin-app');
            }
          } else {
            const trimmed = rawJsonEnv.trim();
            const parsed = JSON.parse(trimmed);
            if (parsed.project_id === 'future-wonder-jwh4c' || parsed.project_id === 'production') {
              throw new Error('FATAL: Kredensial produksi terdeteksi pada konfigurasi staging! Akses ditolak secara mutlak.');
            }
            if (parsed.project_id && parsed.project_id !== STAGING_PROJECT_ID) {
              throw new Error(`FATAL: Project ID "${parsed.project_id}" tidak cocok dengan project staging resmi ("${STAGING_PROJECT_ID}").`);
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

        const activeProjId = app.options.projectId;
        if (activeProjId === 'future-wonder-jwh4c') {
          throw new Error('FATAL: Firebase Admin terinisialisasi ke project produksi future-wonder-jwh4c!');
        }
      } catch (err: any) {
        throw new Error(
          `[FirestoreBackendStore] FATAL: Gagal menginisialisasi Firebase Admin SDK untuk project "${projectId}". ` +
          `Pastikan FIREBASE_STAGING_SERVICE_ACCOUNT_JSON disetel dengan benar. Detail: ${err.message}`
        );
      }
    }
    this.db = getFirestore(app);
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
}
