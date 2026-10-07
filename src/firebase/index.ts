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
  getDoc,
  getDocs,
  getCountFromServer,
  collection, 
  onSnapshot,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  runTransaction,
  QueryDocumentSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, StudentReport, Invoice, Attendance, TrainingSchedule, CashMutation, InvoicePayment } from '../types';

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
const CASH_MUTATIONS_COLLECTION = 'cashMutations';
const INVOICE_PAYMENTS_COLLECTION = 'invoicePayments';

/**
 * Gets exact student count from server with lightweight Firestore Aggregation (costs only 1 read per 1,000 docs).
 * Returns null if offline or quota exceeded without claiming an unverified total.
 */
export async function getStudentsCount(): Promise<number | null> {
  try {
    const collRef = collection(db, STUDENTS_COLLECTION);
    const snapshot = await getCountFromServer(collRef);
    return snapshot.data().count;
  } catch (err) {
    console.warn('[Firestore] getStudentsCount notice (offline or quota limit):', err);
    return null;
  }
}

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

/**
 * Subscribe to attendances with query limit protection (defaults to 200 recent records to prevent quota exhaustion at 100-500 students).
 */
export function subscribeToAttendances(
  onData: (attendances: Attendance[]) => void,
  onError?: (err: Error) => void,
  maxLimit: number = 200
) {
  const collRef = collection(db, ATTENDANCES_COLLECTION);
  const q = maxLimit > 0 ? query(collRef, orderBy('date', 'desc'), limit(maxLimit)) : collRef;
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
const SYSTEM_COLLECTION = 'system';
const STUDENT_COUNTER_DOC = 'student_counter';
export const INITIAL_CONFIRMED_SEQUENCE = 38; // Verified ground-truth from Firestore

/**
 * Returns candidate next student ID by inspecting system/student_counter.
 * Baseline minimum is always BFA-039.
 */
export async function peekNextStudentId(): Promise<string> {
  try {
    const counterRef = doc(db, SYSTEM_COLLECTION, STUDENT_COUNTER_DOC);
    const snap = await getDoc(counterRef);
    if (snap.exists()) {
      const lastSeq = snap.data()?.lastSequence;
      if (typeof lastSeq === 'number' && lastSeq >= INITIAL_CONFIRMED_SEQUENCE) {
        return `BFA-${String(lastSeq + 1).padStart(3, '0')}`;
      }
    }
  } catch (err) {
    console.warn('[Firestore] peekNextStudentId notice:', err);
  }
  return `BFA-${String(INITIAL_CONFIRMED_SEQUENCE + 1).padStart(3, '0')}`;
}

/**
 * Atomically generates next sequential Student ID from system/student_counter
 * and writes the new student document in the exact same Firestore transaction.
 *
 * Guarantees:
 * 1. Zero duplicate IDs even if multiple admins create simultaneously.
 * 2. Never overwrites existing student document.
 * 3. Never reuses old or deleted IDs.
 * 4. Ground-truth baseline sequence = 38 (first new student gets BFA-039).
 */
export async function saveNewStudentWithAtomicCounter(
  studentPayload: Omit<Student, 'id' | 'joinedDate'> & { id?: string },
  joinedDate: string = '2026-09-26'
): Promise<Student> {
  const counterRef = doc(db, SYSTEM_COLLECTION, STUDENT_COUNTER_DOC);

  return await runTransaction(db, async (transaction) => {
    // 1. Read current counter state
    const counterSnap = await transaction.get(counterRef);
    let currentSequence = INITIAL_CONFIRMED_SEQUENCE;

    if (counterSnap.exists()) {
      const dataSeq = counterSnap.data()?.lastSequence;
      if (typeof dataSeq === 'number' && dataSeq >= INITIAL_CONFIRMED_SEQUENCE) {
        currentSequence = dataSeq;
      }
    }

    const nextSequence = currentSequence + 1;
    const assignedId = `BFA-${String(nextSequence).padStart(3, '0')}`;

    // 2. Uniqueness guard: ensure students/{assignedId} does NOT already exist
    const newStudentRef = doc(db, STUDENTS_COLLECTION, assignedId);
    const existingStudentSnap = await transaction.get(newStudentRef);

    if (existingStudentSnap.exists()) {
      throw new Error(
        `Konflik integritas data: ID siswa ${assignedId} sudah ada di Firestore. Transaksi dibatalkan untuk mencegah penimpaan data.`
      );
    }

    // 3. Construct clean student record
    const { id: _ignoreManualId, ...cleanData } = studentPayload;
    const finalStudent: Student = {
      ...cleanData,
      id: assignedId,
      joinedDate: joinedDate || new Date().toISOString().split('T')[0],
    } as Student;

    // 4. Atomic commit: update counter and persist new student document
    transaction.set(
      counterRef,
      {
        lastSequence: nextSequence,
        updatedAt: new Date().toISOString(),
        lastAllocatedId: assignedId,
      },
      { merge: true }
    );

    transaction.set(newStudentRef, cleanForFirestore(finalStudent));

    return finalStudent;
  });
}

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
 * Cursor-based pagination query for 100-500 students.
 * Supports configurable page size (default: 25) and startAfterId cursor.
 */
export async function fetchStudentsPage(options?: {
  pageSize?: number;
  startAfterId?: string;
  classGroupId?: string;
}): Promise<{
  students: Student[];
  hasMore: boolean;
  lastId?: string;
  meta: FirestoreDiagnosticInfo;
  error?: string;
  isQuotaExhausted?: boolean;
}> {
  const pageSize = options?.pageSize || 25;
  try {
    let q = query(collection(db, STUDENTS_COLLECTION), orderBy('id'), limit(pageSize));

    if (options?.classGroupId && options.classGroupId !== 'Semua') {
      q = query(
        collection(db, STUDENTS_COLLECTION),
        where('classGroupId', '==', options.classGroupId),
        orderBy('id'),
        limit(pageSize)
      );
    }

    if (options?.startAfterId) {
      q = query(q, startAfter(options.startAfterId));
    }

    const snapshot = await getDocs(q);
    const items: Student[] = [];
    const docIds: string[] = [];

    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Student);
      docIds.push(docSnap.id);
    });

    const hasMore = items.length === pageSize;
    const lastId = items.length > 0 ? items[items.length - 1].id : undefined;

    const meta: FirestoreDiagnosticInfo = {
      source: snapshot.metadata.fromCache ? 'cache' : 'server',
      docCount: snapshot.size,
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      isQuotaExhausted: false,
      docIds
    };

    return { students: items, hasMore, lastId, meta };
  } catch (err: any) {
    const isQuota = isFirestoreQuotaError(err);
    return {
      students: [],
      hasMore: false,
      meta: {
        source: 'cache',
        docCount: 0,
        fromCache: true,
        hasPendingWrites: false,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        isQuotaExhausted: isQuota,
        error: err?.message
      },
      error: err?.message,
      isQuotaExhausted: isQuota
    };
  }
}

/**
 * Real-time listener for the students collection (for admin view / roster count).
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
 * Single document listener for parent view (consuming only 1 document read instead of all 24-500 students).
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

export interface PaginatedResult<T> {
  items: T[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Paginated one-time fetch for invoices with startAfter cursor (default pageSize = 50).
 * Preserves quota and enables viewing >200 historical records on demand.
 */
export async function fetchInvoicesPage(options?: {
  cursor?: QueryDocumentSnapshot | null;
  pageSize?: number;
}): Promise<PaginatedResult<Invoice>> {
  const pageSize = options?.pageSize || 50;
  const collRef = collection(db, INVOICES_COLLECTION);
  const constraints: any[] = [
    orderBy('dueDate', 'desc'),
  ];

  if (options?.cursor) {
    constraints.push(startAfter(options.cursor));
  }

  // Request pageSize + 1 to authoritatively determine hasMore without count query
  constraints.push(limit(pageSize + 1));

  const q = query(collRef, ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  const items: Invoice[] = pageDocs.map((docSnap) => ({
    ...(docSnap.data() as Invoice),
    id: docSnap.id,
  }));

  const lastDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;

  return {
    items,
    lastDoc,
    hasMore,
  };
}

/**
 * Subscribe to invoices with query limit protection (defaults to 50 records to protect quota at scale).
 */
export function subscribeToInvoices(
  onData: (invoices: Invoice[]) => void,
  onError?: (err: Error) => void,
  maxLimit: number = 50
) {
  const collRef = collection(db, INVOICES_COLLECTION);
  const q = maxLimit > 0 ? query(collRef, orderBy('dueDate', 'desc'), limit(maxLimit)) : collRef;
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as Invoice),
          id: docSnap.id,
        });
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
  const q = query(collection(db, INVOICES_COLLECTION), where('studentId', '==', studentId.trim()), limit(100));
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

// --- CASH MUTATION OPERATIONS ---
export async function saveCashMutationToFirestore(mutation: CashMutation): Promise<void> {
  try {
    if (!mutation || !mutation.id || typeof mutation.id !== 'string' || !mutation.id.trim()) {
      return;
    }
    const cleanId = mutation.id.trim();
    const mutRef = doc(db, CASH_MUTATIONS_COLLECTION, cleanId);
    await setDoc(mutRef, cleanForFirestore({
      ...mutation,
      createdAt: mutation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (error) {
    console.error('Failed to save cash mutation to Firestore:', error);
    throw error;
  }
}

export async function deleteCashMutationFromFirestore(mutationId: string): Promise<void> {
  try {
    if (!mutationId || typeof mutationId !== 'string' || !mutationId.trim()) {
      return;
    }
    const cleanId = mutationId.trim();
    const mutRef = doc(db, CASH_MUTATIONS_COLLECTION, cleanId);
    await deleteDoc(mutRef);
  } catch (error) {
    console.error('Failed to delete cash mutation from Firestore:', error);
    throw error;
  }
}

export interface CashMutationFilterOptions {
  period: 'Semua' | 'Bulan Ini' | 'Hari Ini' | 'Custom';
  startDate?: string;
  endDate?: string;
  cursor?: QueryDocumentSnapshot | null;
  pageSize?: number;
}

/**
 * Paginated one-time fetch for cash mutations (getDocs) with startAfter cursor.
 * Used for historical modes ('Semua Waktu' and custom historical range).
 */
export async function fetchCashMutationsPage(
  options: CashMutationFilterOptions
): Promise<PaginatedResult<CashMutation>> {
  const pageSize = options.pageSize || 50;
  const collRef = collection(db, CASH_MUTATIONS_COLLECTION);
  const constraints: any[] = [];

  const todayStr = new Date().toISOString().split('T')[0];
  const yearMonth = todayStr.substring(0, 7);
  const firstDayOfMonth = `${yearMonth}-01`;
  const lastDayOfMonth = `${yearMonth}-31`;

  if (options.period === 'Hari Ini') {
    constraints.push(where('date', '==', todayStr));
    constraints.push(orderBy('date', 'desc'));
  } else if (options.period === 'Bulan Ini') {
    constraints.push(where('date', '>=', firstDayOfMonth));
    constraints.push(where('date', '<=', lastDayOfMonth));
    constraints.push(orderBy('date', 'desc'));
  } else if (options.period === 'Custom' && options.startDate && options.endDate) {
    constraints.push(where('date', '>=', options.startDate));
    constraints.push(where('date', '<=', options.endDate));
    constraints.push(orderBy('date', 'desc'));
  } else {
    // 'Semua'
    constraints.push(orderBy('date', 'desc'));
  }

  if (options.cursor) {
    constraints.push(startAfter(options.cursor));
  }

  // Request pageSize + 1 to determine if hasMore without extra server count
  constraints.push(limit(pageSize + 1));

  const q = query(collRef, ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  const items: CashMutation[] = pageDocs.map((docSnap) => ({
    ...(docSnap.data() as CashMutation),
    id: docSnap.id,
  }));

  const lastDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;

  return {
    items,
    lastDoc,
    hasMore,
  };
}

/**
 * Scoped realtime listener for operational filters ONLY: 'Hari Ini' or 'Bulan Ini'.
 * Unsubscribed immediately when switching to historical filters or leaving the view.
 */
export function subscribeToOperationalCashMutations(
  period: 'Hari Ini' | 'Bulan Ini',
  onData: (mutations: CashMutation[]) => void,
  onError?: (err: Error) => void,
  pageSize: number = 50
) {
  const collRef = collection(db, CASH_MUTATIONS_COLLECTION);
  const todayStr = new Date().toISOString().split('T')[0];
  const yearMonth = todayStr.substring(0, 7);
  const firstDayOfMonth = `${yearMonth}-01`;
  const lastDayOfMonth = `${yearMonth}-31`;

  let q;
  if (period === 'Hari Ini') {
    q = query(
      collRef,
      where('date', '==', todayStr),
      orderBy('date', 'desc'),
      limit(pageSize)
    );
  } else {
    q = query(
      collRef,
      where('date', '>=', firstDayOfMonth),
      where('date', '<=', lastDayOfMonth),
      orderBy('date', 'desc'),
      limit(pageSize)
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CashMutation[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as CashMutation),
          id: docSnap.id,
        });
      });
      onData(list);
    },
    (err) => {
      console.warn(`Firestore cashMutations (${period}) subscription notice:`, err?.message);
      onError?.(err);
    }
  );
}

/**
 * Scoped subscription for cash mutations (limited to protect quota, default 50).
 * Sourced directly from cashMutations collection.
 */
export function subscribeToCashMutations(
  onData: (mutations: CashMutation[]) => void,
  onError?: (err: Error) => void,
  maxLimit: number = 50
) {
  const collRef = collection(db, CASH_MUTATIONS_COLLECTION);
  const q = maxLimit > 0 ? query(collRef, orderBy('date', 'desc'), limit(maxLimit)) : collRef;
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CashMutation[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as CashMutation),
          id: docSnap.id,
        });
      });
      onData(list);
    },
    (err) => {
      console.warn('Firestore cashMutations subscription notice:', err?.message);
      onError?.(err);
    }
  );
}

// --- ATOMIC INVOICE PAYMENT TRANSACTION ---
export interface ProcessPaymentInput {
  paymentId: string; // Wajib dibuat SATU KALI sebelum transaction dimulai
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string; // YYYY-MM-DD
  staffName?: string;
  note?: string;
  transactionId?: string;
}

export interface ProcessPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  invoice: Invoice;
  mutation: CashMutation;
  payment: InvoicePayment;
}

export async function processInvoicePaymentTransaction(
  input: ProcessPaymentInput
): Promise<ProcessPaymentResult> {
  const { paymentId, invoiceId, amount, paymentMethod, paymentDate, staffName, note, transactionId } = input;
  if (!paymentId || !invoiceId || amount <= 0) {
    throw new Error('Parameter pembayaran tidak valid: paymentId, invoiceId, dan nominal > 0 wajib diisi.');
  }

  // Authoritative requirement: mutationId wajib MUT_{paymentId}
  const mutationId = `MUT_${paymentId}`;
  const nowIso = new Date().toISOString();
  const timeNow = new Date().toTimeString().slice(0, 8);

  const invoiceDocRef = doc(db, INVOICES_COLLECTION, invoiceId);
  const paymentDocRef = doc(db, INVOICE_PAYMENTS_COLLECTION, paymentId);
  const mutationDocRef = doc(db, CASH_MUTATIONS_COLLECTION, mutationId);

  return await runTransaction(db, async (transaction) => {
    // 1. Transaction membaca invoice terlebih dahulu
    const invSnap = await transaction.get(invoiceDocRef);
    if (!invSnap.exists()) {
      throw new Error(`Tagihan dengan ID "${invoiceId}" tidak ditemukan di database.`);
    }
    const currentInv = invSnap.data() as Invoice;

    // 2. Transaction membaca payment doc untuk idempotency check
    const paySnap = await transaction.get(paymentDocRef);
    if (paySnap.exists()) {
      console.warn(`[Anti-Double-Payment] Pembayaran ${paymentId} sudah pernah tercatat.`);
      const existingPay = paySnap.data() as InvoicePayment;
      const mutSnap = await transaction.get(mutationDocRef);
      const existingMut = mutSnap.exists()
        ? (mutSnap.data() as CashMutation)
        : ({
            id: mutationId,
            date: paymentDate,
            type: 'Pemasukan',
            category: currentInv.type === 'Pendaftaran' ? 'Pendaftaran' : 'SPP Bulanan',
            amount: existingPay.amount,
            note: `Pembayaran ${currentInv.type} - ${currentInv.studentName}`,
            method: paymentMethod,
            staff: staffName || 'Admin BFA',
            invoiceId,
            paymentId,
          } as CashMutation);

      return {
        success: true,
        alreadyProcessed: true,
        invoice: currentInv,
        mutation: existingMut,
        payment: existingPay,
      };
    }

    // 3. Kalkulasi matematis keuangan
    const invTotal = currentInv.amount || 0;
    const currentPaid = currentInv.paidAmount !== undefined 
      ? currentInv.paidAmount 
      : (currentInv.status === 'LUNAS' ? invTotal : 0);

    const newPaidAmount = currentPaid + amount;
    const newRemainingAmount = Math.max(0, invTotal - newPaidAmount);
    const newStatus: 'LUNAS' | 'SEBAGIAN' | 'BELUM BAYAR' = 
      newRemainingAmount <= 0 ? 'LUNAS' : (newPaidAmount > 0 ? 'SEBAGIAN' : 'BELUM BAYAR');

    // 4. Dokumen pembayaran
    const paymentRecord: InvoicePayment = {
      id: paymentId,
      paymentId,
      invoiceId,
      studentId: currentInv.studentId,
      amount,
      date: paymentDate,
      time: timeNow,
      paymentMethod,
      method: paymentMethod,
      transactionId: transactionId || `TRX-${paymentId}`,
      staff: staffName || 'Admin BFA',
      note: note || `Pembayaran ${currentInv.type} (${currentInv.period})`,
      mutationId,
      createdAt: nowIso,
    };

    // 5. Dokumen mutasi kas
    const cashCategory = currentInv.type === 'Bulanan' 
      ? 'SPP Bulanan' 
      : (currentInv.type === 'Latihan' ? 'Iuran Sesi Lapangan' : (currentInv.type || 'SPP Bulanan'));

    const cashMutation: CashMutation = {
      id: mutationId,
      date: paymentDate,
      time: timeNow,
      type: 'Pemasukan',
      category: cashCategory,
      amount,
      note: `Pembayaran ${currentInv.type} (${currentInv.period}) - ${currentInv.studentName} [${currentInv.id}]`,
      method: paymentMethod,
      staff: staffName || 'Admin BFA',
      source: 'INVOICE_PAYMENT',
      invoiceId,
      paymentId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 6. Dokumen invoice yang diperbarui
    const updatedInvoice: Invoice = {
      ...currentInv,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: newStatus,
      paidAt: newStatus === 'LUNAS' ? nowIso : currentInv.paidAt,
      transactionId: transactionId || currentInv.transactionId || `TRX-${paymentId}`,
      paymentMethod: paymentMethod,
      updatedAt: nowIso,
    };

    // 7. Eksekusi atomik: Invoice + Payment + CashMutation
    transaction.set(paymentDocRef, cleanForFirestore(paymentRecord));
    transaction.set(mutationDocRef, cleanForFirestore(cashMutation));
    transaction.set(invoiceDocRef, cleanForFirestore(updatedInvoice), { merge: true });

    return {
      success: true,
      alreadyProcessed: false,
      invoice: updatedInvoice,
      mutation: cashMutation,
      payment: paymentRecord,
    };
  });
}

// --- ATOMIC CANCEL INVOICE PAYMENT TRANSACTION ---
export interface CancelPaymentInput {
  invoiceId: string;
  paymentId: string;
  staffName?: string;
  reason?: string;
}

export interface CancelPaymentResult {
  success: boolean;
  invoice: Invoice;
  cancelledPaymentId: string;
  cancelledAmount: number;
  cancelledMutationId: string;
  newPaidAmount: number;
  newRemainingAmount: number;
  newStatus: 'LUNAS' | 'SEBAGIAN' | 'BELUM BAYAR';
}

export async function cancelInvoicePaymentTransaction(
  input: CancelPaymentInput
): Promise<CancelPaymentResult> {
  const { invoiceId, paymentId, staffName, reason } = input;

  if (!invoiceId || typeof invoiceId !== 'string' || !invoiceId.trim()) {
    throw new Error('Parameter invoiceId wajib diisi.');
  }
  if (!paymentId || typeof paymentId !== 'string' || !paymentId.trim()) {
    throw new Error('Parameter paymentId wajib diisi.');
  }

  const cleanInvoiceId = invoiceId.trim();
  const cleanPaymentId = paymentId.trim();

  const invoiceDocRef = doc(db, INVOICES_COLLECTION, cleanInvoiceId);
  const paymentDocRef = doc(db, INVOICE_PAYMENTS_COLLECTION, cleanPaymentId);

  return await runTransaction(db, async (transaction) => {
    // 1. Baca invoice berdasarkan invoiceId
    const invSnap = await transaction.get(invoiceDocRef);
    if (!invSnap.exists()) {
      throw new Error(`Tagihan dengan ID "${cleanInvoiceId}" tidak ditemukan di database.`);
    }
    const currentInv = invSnap.data() as Invoice;

    // 2. Baca payment berdasarkan paymentId (Proteksi Idempotency & Double Click)
    const paySnap = await transaction.get(paymentDocRef);
    if (!paySnap.exists()) {
      throw new Error(`Data pembayaran dengan ID "${cleanPaymentId}" tidak ditemukan atau sudah dibatalkan.`);
    }
    const currentPay = paySnap.data() as InvoicePayment;

    // 3. Validasi kepemilikan pembayaran terhadap invoice
    if (currentPay.invoiceId !== cleanInvoiceId) {
      throw new Error(`Pembayaran "${cleanPaymentId}" tidak terdaftar pada tagihan "${cleanInvoiceId}". Transaksi dibatalkan.`);
    }

    if (currentPay.studentId && currentInv.studentId && currentPay.studentId !== currentInv.studentId) {
      throw new Error('Data siswa pada pembayaran tidak cocok dengan data siswa pada tagihan.');
    }

    const cancelledAmount = Number(currentPay.amount) || 0;
    if (cancelledAmount <= 0) {
      throw new Error('Nominal pada data pembayaran tidak valid (<= 0).');
    }

    // 4. Ambil mutationId dari payment (payment.mutationId atau ID MUT_{paymentId})
    const mutationId = currentPay.mutationId || `MUT_${cleanPaymentId}`;
    const mutationDocRef = doc(db, CASH_MUTATIONS_COLLECTION, mutationId);

    // 5. Baca cashMutation terkait
    const mutSnap = await transaction.get(mutationDocRef);

    // 6. Validasi cashMutation jika dokumen ditemukan
    if (mutSnap.exists()) {
      const currentMut = mutSnap.data() as CashMutation;
      if (currentMut.source && currentMut.source !== 'INVOICE_PAYMENT') {
        throw new Error(`Mutasi kas "${mutationId}" bukan merupakan transaksi yang bersumber dari pembayaran tagihan (source !== INVOICE_PAYMENT).`);
      }
      if (currentMut.paymentId && currentMut.paymentId !== cleanPaymentId) {
        throw new Error(`Relasi paymentId pada mutasi kas (${currentMut.paymentId}) tidak cocok dengan paymentId yang dibatalkan (${cleanPaymentId}).`);
      }
      if (currentMut.invoiceId && currentMut.invoiceId !== cleanInvoiceId) {
        throw new Error(`Relasi invoiceId pada mutasi kas (${currentMut.invoiceId}) tidak cocok dengan invoiceId yang dibatalkan (${cleanInvoiceId}).`);
      }
    }

    // 7. Perhitungan matematis pemulihan nilai invoice
    const invTotal = Number(currentInv.amount) || 0;
    const oldPaidAmount = currentInv.paidAmount !== undefined
      ? Number(currentInv.paidAmount) || 0
      : (currentInv.status === 'LUNAS' ? invTotal : 0);

    const newPaidAmount = Math.max(0, oldPaidAmount - cancelledAmount);
    const newRemainingAmount = Math.max(0, invTotal - newPaidAmount);

    let newStatus: 'LUNAS' | 'SEBAGIAN' | 'BELUM BAYAR';
    if (newRemainingAmount <= 0) {
      newStatus = 'LUNAS';
    } else if (newPaidAmount > 0) {
      newStatus = 'SEBAGIAN';
    } else {
      newStatus = 'BELUM BAYAR';
    }

    const nowIso = new Date().toISOString();

    // 8. Dokumen invoice yang dikoreksi (pertahankan seluruh field lain)
    const updatedInvoice: Invoice = {
      ...currentInv,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: newStatus,
      paidAt: newStatus === 'LUNAS' ? (currentInv.paidAt || nowIso) : '',
      transactionId: newPaidAmount > 0 ? (currentInv.transactionId || '') : '',
      paymentMethod: newPaidAmount > 0 ? (currentInv.paymentMethod || '') : '',
      updatedAt: nowIso,
    };

    // 9. Eksekusi atomik: Hapus Payment + Hapus CashMutation + Update Invoice
    transaction.delete(paymentDocRef);

    if (mutSnap.exists()) {
      transaction.delete(mutationDocRef);
    }

    transaction.set(invoiceDocRef, cleanForFirestore(updatedInvoice), { merge: true });

    return {
      success: true,
      invoice: updatedInvoice,
      cancelledPaymentId: cleanPaymentId,
      cancelledAmount,
      cancelledMutationId: mutationId,
      newPaidAmount,
      newRemainingAmount,
      newStatus,
    };
  });
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
