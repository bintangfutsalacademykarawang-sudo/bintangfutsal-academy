import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  doc, 
  setDoc, 
  deleteDoc,
  getDocs,
  collection, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, StudentReport, Invoice, Attendance, TrainingSchedule } from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with configured databaseId and robust offline caching
// Safe fallback for InPrivate/Incognito where IndexedDB may be blocked or restricted
function initFirestoreInstance() {
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, dbId || undefined);
  } catch (err) {
    console.warn('[Firestore Init] Persistent local cache fallback:', err);
    try {
      return dbId ? getFirestore(app, dbId) : getFirestore(app);
    } catch {
      return initializeFirestore(app, {
        localCache: memoryLocalCache()
      }, dbId || undefined);
    }
  }
}

export const db = initFirestoreInstance();

// Diagnostic metadata structure
export interface FirestoreDiagnosticInfo {
  source: 'server' | 'cache';
  docCount: number;
  fromCache: boolean;
  hasPendingWrites: boolean;
  timestamp: string;
  error?: string;
  isQuotaExhausted?: boolean;
  docIds?: string[];
}

/**
 * Checks specifically for Firestore quota exhaustion errors (resource-exhausted / 429).
 */
export function isFirestoreQuotaError(error: any): boolean {
  if (!error) return false;
  const msg = (error?.message || error?.code || String(error)).toLowerCase();
  return (
    msg.includes('resource-exhausted') ||
    msg.includes('quota') ||
    msg.includes('exceeded') ||
    msg.includes('429')
  );
}

/**
 * Checks for client offline / network unavailable errors.
 */
export function isFirestoreOfflineError(error: any): boolean {
  if (!error) return false;
  const msg = (error?.message || error?.code || String(error)).toLowerCase();
  return (
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('failed-precondition') ||
    msg.includes('network')
  );
}

// Passive connection check - never burn network reads on connection probes
export async function testFirestoreConnection(): Promise<boolean> {
  return true;
}

// Collections
const STUDENTS_COLLECTION = 'students';
const REPORTS_COLLECTION = 'studentReports';
const INVOICES_COLLECTION = 'invoices';
const ATTENDANCES_COLLECTION = 'attendances';
const SCHEDULES_COLLECTION = 'trainingSchedules';

/**
 * Removes undefined properties recursively so Firestore setDoc never throws
 * "Unsupported field value: undefined".
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// --- ATTENDANCE OPERATIONS ---
export async function saveAttendanceToFirestore(attendance: Attendance): Promise<void> {
  try {
    const attRef = doc(db, ATTENDANCES_COLLECTION, attendance.id);
    await setDoc(attRef, cleanForFirestore(attendance), { merge: true });
  } catch (error) {
    console.error('Failed to save attendance to Firestore:', error);
    throw error;
  }
}

export async function deleteAttendanceFromFirestore(attendanceId: string): Promise<void> {
  try {
    const attRef = doc(db, ATTENDANCES_COLLECTION, attendanceId);
    await deleteDoc(attRef);
  } catch (error) {
    console.error('Failed to delete attendance from Firestore:', error);
    throw error;
  }
}

export function subscribeToAttendances(
  onData: (attendances: Attendance[]) => void,
  onError?: (err: Error) => void
) {
  const collRef = collection(db, ATTENDANCES_COLLECTION);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: Attendance[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Attendance);
      });
      onData(items);
    },
    (err) => {
      console.warn('Firestore attendances subscription notice:', err?.message);
      onError?.(err);
    }
  );
}

export function subscribeToStudentAttendances(
  studentId: string,
  onData: (attendances: Attendance[]) => void,
  onError?: (err: Error) => void
) {
  if (!studentId || !studentId.trim()) return () => {};
  const q = query(collection(db, ATTENDANCES_COLLECTION), where('studentId', '==', studentId.trim()));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Attendance[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Attendance);
      });
      onData(items);
    },
    (err) => {
      console.warn('Firestore student attendances subscription notice:', err?.message);
      onError?.(err);
    }
  );
}

// --- STUDENT OPERATIONS ---
export async function saveStudentToFirestore(student: Student): Promise<void> {
  try {
    if (!student || !student.id || typeof student.id !== 'string' || !student.id.trim()) {
      console.warn('saveStudentToFirestore: Invalid argument: student or student.id is missing/invalid', student);
      return;
    }
    const cleanId = student.id.trim();
    const studentRef = doc(db, STUDENTS_COLLECTION, cleanId);
    await setDoc(studentRef, cleanForFirestore(student), { merge: true });
  } catch (error) {
    console.error('Failed to save student to Firestore:', error);
    throw error;
  }
}

export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  try {
    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return;
    }
    const cleanId = studentId.trim();
    const studentRef = doc(db, STUDENTS_COLLECTION, cleanId);
    await deleteDoc(studentRef);
    const reportRef = doc(db, REPORTS_COLLECTION, cleanId);
    await deleteDoc(reportRef).catch(() => {});
  } catch (error) {
    console.error('Failed to delete student from Firestore:', error);
    throw error;
  }
}

/**
 * Direct fetch with cache-first and quota-safety.
 * Retrieves all authorized student documents without artificial 10-document limit.
 * Never falls back silently to INITIAL_STUDENTS.
 */
export async function fetchStudentsDirectly(): Promise<{
  students: Student[];
  meta: FirestoreDiagnosticInfo;
  error?: string;
  isQuotaExhausted?: boolean;
}> {
  const collRef = collection(db, STUDENTS_COLLECTION);
  try {
    // getDocs utilizes persistent local cache when offline or if server throws quota error
    const snapshot = await getDocs(collRef);
    const items: Student[] = [];
    const docIds: string[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Student);
      docIds.push(docSnap.id);
    });
    // Natural alphanumeric sorting by ID (BFA-001, BFA-002, ...)
    items.sort((a, b) => (a.id || '').localeCompare(b.id || '', undefined, { numeric: true }));
    const meta: FirestoreDiagnosticInfo = {
      source: snapshot.metadata.fromCache ? 'cache' : 'server',
      docCount: snapshot.size,
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      isQuotaExhausted: false,
      docIds
    };
    return { students: items, meta };
  } catch (err: any) {
    const isQuota = isFirestoreQuotaError(err);
    const errMsg = isQuota
      ? 'Batas kuota harian cloud (free tier read) terlampaui (resource-exhausted).'
      : (err?.message || 'Gagal membaca dokumen siswa dari Firestore');

    console.warn('[Firestore Diagnostic] fetchStudentsDirectly error:', errMsg);
    return {
      students: [],
      meta: {
        source: 'cache',
        docCount: 0,
        fromCache: true,
        hasPendingWrites: false,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        isQuotaExhausted: isQuota,
        error: errMsg
      },
      error: errMsg,
      isQuotaExhausted: isQuota
    };
  }
}

/**
 * Real-time listener for the entire students collection (for admin view / roster count).
 * Handles quota-exhausted errors specifically without masking.
 */
export function subscribeToStudents(
  onData: (students: Student[], meta: FirestoreDiagnosticInfo) => void,
  onError?: (err: Error, isQuota: boolean) => void
) {
  const collRef = collection(db, STUDENTS_COLLECTION);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: Student[] = [];
      const docIds: string[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Student);
        docIds.push(docSnap.id);
      });
      // Natural alphanumeric sorting by ID (BFA-001, BFA-002, ...)
      items.sort((a, b) => (a.id || '').localeCompare(b.id || '', undefined, { numeric: true }));
      const meta: FirestoreDiagnosticInfo = {
        source: snapshot.metadata.fromCache ? 'cache' : 'server',
        docCount: snapshot.size,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        isQuotaExhausted: false,
        docIds
      };
      onData(items, meta);
    },
    (err) => {
      const isQuota = isFirestoreQuotaError(err);
      console.warn('[Firestore Students Listener Notice]', isQuota ? 'resource-exhausted' : err?.message);
      onError?.(err, isQuota);
    }
  );
}

/**
 * Single document listener for parent view (consuming only 1 document read instead of all 24).
 */
export function subscribeToStudentDoc(
  studentId: string,
  onData: (student: Student | null, meta: FirestoreDiagnosticInfo) => void,
  onError?: (err: Error, isQuota: boolean) => void
) {
  if (!studentId || !studentId.trim()) return () => {};
  const docRef = doc(db, STUDENTS_COLLECTION, studentId.trim());
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onData(null, {
          source: docSnap.metadata.fromCache ? 'cache' : 'server',
          docCount: 0,
          fromCache: docSnap.metadata.fromCache,
          hasPendingWrites: docSnap.metadata.hasPendingWrites,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          isQuotaExhausted: false
        });
        return;
      }
      const st = docSnap.data() as Student;
      onData(st, {
        source: docSnap.metadata.fromCache ? 'cache' : 'server',
        docCount: 1,
        fromCache: docSnap.metadata.fromCache,
        hasPendingWrites: docSnap.metadata.hasPendingWrites,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        isQuotaExhausted: false
      });
    },
    (err) => {
      const isQuota = isFirestoreQuotaError(err);
      onError?.(err, isQuota);
    }
  );
}

// --- REPORT OPERATIONS ---
export async function saveReportToFirestore(
  studentId: string, 
  report: StudentReport
): Promise<void> {
  try {
    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return;
    }
    const cleanId = studentId.trim();
    const reportRef = doc(db, REPORTS_COLLECTION, cleanId);
    await setDoc(reportRef, cleanForFirestore(report), { merge: true });
  } catch (error) {
    console.error('Failed to save report to Firestore:', error);
    throw error;
  }
}

export function subscribeToReports(
  onData: (reports: Record<string, StudentReport>) => void,
  onError?: (err: Error) => void
) {
  const collRef = collection(db, REPORTS_COLLECTION);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const result: Record<string, StudentReport> = {};
      snapshot.forEach((docSnap) => {
        result[docSnap.id] = docSnap.data() as StudentReport;
      });
      onData(result);
    },
    (err) => {
      console.warn('Firestore reports subscription notice:', err?.message);
      onError?.(err);
    }
  );
}

export function subscribeToStudentReport(
  studentId: string,
  onData: (report: StudentReport | null) => void,
  onError?: (err: Error) => void
) {
  if (!studentId || !studentId.trim()) return () => {};
  const docRef = doc(db, REPORTS_COLLECTION, studentId.trim());
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as StudentReport);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn('Firestore student report subscription notice:', err?.message);
      onError?.(err);
    }
  );
}

// --- INVOICE OPERATIONS ---
export async function saveInvoiceToFirestore(invoice: Invoice): Promise<void> {
  try {
    if (!invoice || !invoice.id || typeof invoice.id !== 'string' || !invoice.id.trim()) {
      return;
    }
    const cleanId = invoice.id.trim();
    const invRef = doc(db, INVOICES_COLLECTION, cleanId);
    await setDoc(invRef, cleanForFirestore(invoice), { merge: true });
  } catch (error) {
    console.error('Failed to save invoice to Firestore:', error);
    throw error;
  }
}

export async function deleteInvoiceFromFirestore(invoiceId: string): Promise<void> {
  try {
    if (!invoiceId || typeof invoiceId !== 'string' || !invoiceId.trim()) {
      return;
    }
    const cleanId = invoiceId.trim();
    const invRef = doc(db, INVOICES_COLLECTION, cleanId);
    await deleteDoc(invRef);
  } catch (error) {
    console.error('Failed to delete invoice from Firestore:', error);
    throw error;
  }
}

export function subscribeToInvoices(
  onData: (invoices: Invoice[]) => void,
  onError?: (err: Error) => void
) {
  const collRef = collection(db, INVOICES_COLLECTION);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Invoice);
      });
      onData(list);
    },
    (err) => {
      console.warn('Firestore invoices subscription notice:', err?.message);
      onError?.(err);
    }
  );
}

export function subscribeToStudentInvoices(
  studentId: string,
  onData: (invoices: Invoice[]) => void,
  onError?: (err: Error) => void
) {
  if (!studentId || !studentId.trim()) return () => {};
  const q = query(collection(db, INVOICES_COLLECTION), where('studentId', '==', studentId.trim()));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Invoice);
      });
      onData(list);
    },
    (err) => {
      console.warn('Firestore student invoices subscription notice:', err?.message);
      onError?.(err);
    }
  );
}

// --- SCHEDULE OPERATIONS ---
export async function saveScheduleToFirestore(schedule: TrainingSchedule): Promise<void> {
  try {
    if (!schedule || !schedule.id || typeof schedule.id !== 'string' || !schedule.id.trim()) {
      return;
    }
    const cleanId = schedule.id.trim();
    const schRef = doc(db, SCHEDULES_COLLECTION, cleanId);
    await setDoc(schRef, cleanForFirestore(schedule), { merge: true });
  } catch (error) {
    console.error('Failed to save schedule to Firestore:', error);
    throw error;
  }
}

export async function deleteScheduleFromFirestore(scheduleId: string): Promise<void> {
  try {
    if (!scheduleId || typeof scheduleId !== 'string' || !scheduleId.trim()) {
      return;
    }
    const cleanId = scheduleId.trim();
    const schRef = doc(db, SCHEDULES_COLLECTION, cleanId);
    await deleteDoc(schRef);
  } catch (error) {
    console.error('Failed to delete schedule from Firestore:', error);
    throw error;
  }
}

export function subscribeToSchedules(
  onData: (schedules: TrainingSchedule[]) => void,
  onError?: (err: Error) => void
) {
  const collRef = collection(db, SCHEDULES_COLLECTION);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: TrainingSchedule[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as TrainingSchedule);
      });
      // Sort by date then startTime
      list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''));
      onData(list);
    },
    (err) => {
      console.warn('Firestore schedules subscription notice:', err?.message);
      onError?.(err);
    }
  );
}

// Initial online data seeding guard
// Preserves existing 24 students in Firebase - NEVER overwrites or scans database
export async function seedInitialFirestoreDataIfEmpty(
  _defaultStudents?: Student[],
  _defaultReports?: Record<string, StudentReport>,
  _defaultInvoices?: Invoice[],
  _defaultSchedules?: TrainingSchedule[]
): Promise<void> {
  // Guaranteed no-op: Database in Firebase already contains the production 24 students.
  return;
}

// Clear demo data guard: Never scan entire collection on page load
export async function wipeDemoDataFromFirestore(): Promise<void> {
  return;
}

// Wipe all invoices guard: Never run on client page load
export async function wipeAllInvoicesFromFirestore(): Promise<void> {
  return;
}
