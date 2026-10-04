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
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  collection, 
  onSnapshot,
  query,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, StudentReport, Invoice, Attendance, TrainingSchedule } from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with configured databaseId and robust offline caching
// Safe fallback for InPrivate/Incognito where IndexedDB may be blocked or restricted
function initFirestoreInstance() {
  const dbId = firebaseConfig.firestoreDatabaseId;
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, dbId || undefined);
  } catch (err) {
    console.warn('[Firestore Init] Persistent local cache unavailable (e.g. InPrivate mode), falling back:', err);
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
  docIds?: string[];
}

// Validate connection to Firestore as per integration guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    console.log('Firebase Firestore database connected successfully!');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or connecting...');
    }
    return false;
  }
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
      console.warn('Firestore attendances subscription error:', err);
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
 * Direct fetch with server-first strategy and cache fallback, providing complete diagnostics.
 */
export async function fetchStudentsDirectly(): Promise<{
  students: Student[];
  meta: FirestoreDiagnosticInfo;
  error?: string;
}> {
  const collRef = collection(db, STUDENTS_COLLECTION);
  try {
    let snapshot;
    try {
      snapshot = await getDocsFromServer(collRef);
    } catch (serverErr) {
      console.warn('[Firestore Diagnostic] Direct server fetch fallback to general query:', serverErr);
      snapshot = await getDocs(collRef);
    }
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
      docIds
    };
    console.log(`[Firestore Diagnostic] Direct students fetch completed: ${snapshot.size} docs from ${meta.source}`);
    return { students: items, meta };
  } catch (err: any) {
    console.error('[Firestore Diagnostic] Direct students fetch failed:', err);
    return {
      students: [],
      meta: {
        source: 'cache',
        docCount: 0,
        fromCache: true,
        hasPendingWrites: false,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        error: err?.message || 'Error Firestore'
      },
      error: err?.message || 'Error Firestore'
    };
  }
}

export function subscribeToStudents(
  onData: (students: Student[], meta: FirestoreDiagnosticInfo) => void,
  onError?: (err: Error) => void
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
        docIds
      };
      console.log(`[Firestore Diagnostic] Realtime snapshot: ${snapshot.size} students from ${meta.source} (pending: ${meta.hasPendingWrites})`);
      onData(items, meta);
    },
    (err) => {
      console.error('[Firestore Diagnostic] Students subscription error:', err);
      onError?.(err);
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
      console.warn('Firestore reports subscription error:', err);
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
      console.warn('Firestore invoices subscription error:', err);
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
      console.warn('Firestore schedules subscription error:', err);
      onError?.(err);
    }
  );
}

// Initial online data seeding if database is fresh (Guarded with limit(1) to save quota)
export async function seedInitialFirestoreDataIfEmpty(
  defaultStudents: Student[],
  defaultReports: Record<string, StudentReport>,
  defaultInvoices: Invoice[],
  defaultSchedules?: TrainingSchedule[]
): Promise<void> {
  try {
    const seedCheckKey = 'bfa_firestore_seed_checked_v1';
    if (localStorage.getItem(seedCheckKey) === 'true') {
      return;
    }

    // Use limit(1) so we only read 1 document instead of the entire collection!
    const studentQuery = query(collection(db, STUDENTS_COLLECTION), limit(1));
    const studentSnapshot = await getDocs(studentQuery);
    if (studentSnapshot.empty) {
      console.log('Seeding initial students to Firestore online...');
      for (const st of defaultStudents) {
        if (st && st.id) {
          await setDoc(doc(db, STUDENTS_COLLECTION, st.id.trim()), cleanForFirestore(st));
        }
      }
    }

    const reportQuery = query(collection(db, REPORTS_COLLECTION), limit(1));
    const reportSnapshot = await getDocs(reportQuery);
    if (reportSnapshot.empty) {
      console.log('Seeding initial reports to Firestore online...');
      for (const [id, rep] of Object.entries(defaultReports)) {
        if (id) {
          await setDoc(doc(db, REPORTS_COLLECTION, id.trim()), cleanForFirestore(rep));
        }
      }
    }

    const invQuery = query(collection(db, INVOICES_COLLECTION), limit(1));
    const invSnapshot = await getDocs(invQuery);
    if (invSnapshot.empty && defaultInvoices.length > 0) {
      console.log('Seeding initial invoices to Firestore online...');
      for (const inv of defaultInvoices) {
        if (inv && inv.id) {
          await setDoc(doc(db, INVOICES_COLLECTION, inv.id.trim()), cleanForFirestore(inv));
        }
      }
    }

    if (defaultSchedules && defaultSchedules.length > 0) {
      const schQuery = query(collection(db, SCHEDULES_COLLECTION), limit(1));
      const schSnapshot = await getDocs(schQuery);
      if (schSnapshot.empty) {
        console.log('Seeding initial training schedules to Firestore online...');
        for (const sch of defaultSchedules) {
          if (sch && sch.id) {
            await setDoc(doc(db, SCHEDULES_COLLECTION, sch.id.trim()), cleanForFirestore(sch));
          }
        }
      }
    }

    localStorage.setItem(seedCheckKey, 'true');
  } catch (err) {
    console.warn('Firestore seeding check:', err);
  }
}

// Clear demo data once (guarded so it doesn't repeatedly scan every page load)
export async function wipeDemoDataFromFirestore(): Promise<void> {
  const wipeKey = 'bfa_firestore_demo_wipe_completed_v1';
  if (localStorage.getItem(wipeKey) === 'true') {
    return;
  }
  try {
    // 1. Wipe demo September invoices
    const invSnapshot = await getDocs(collection(db, INVOICES_COLLECTION));
    for (const d of invSnapshot.docs) {
      const data = d.data();
      if (
        data.period?.includes('September') || 
        data.createdAt?.includes('/09/2026') || 
        d.id.startsWith('INV-202609')
      ) {
        await deleteDoc(d.ref);
      }
    }

    // 2. Wipe demo September attendances
    const attSnapshot = await getDocs(collection(db, ATTENDANCES_COLLECTION));
    for (const d of attSnapshot.docs) {
      const data = d.data();
      if (data.date?.startsWith('2026-09') || d.id.startsWith('ATT-202609')) {
        await deleteDoc(d.ref);
      }
    }
    localStorage.setItem(wipeKey, 'true');
    console.log('Demo September data wiped from Firestore successfully.');
  } catch (err) {
    console.warn('Wipe demo data from Firestore:', err);
  }
}

// Completely wipe all existing invoices from Firestore to reset all invoice numbers to 0 for real bookkeeping
export async function wipeAllInvoicesFromFirestore(): Promise<void> {
  try {
    const invSnapshot = await getDocs(collection(db, INVOICES_COLLECTION));
    for (const d of invSnapshot.docs) {
      await deleteDoc(d.ref);
    }
    console.log('All invoices wiped from Firestore successfully.');
  } catch (err) {
    console.warn('Wipe all invoices error:', err);
  }
}



