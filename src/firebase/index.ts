import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocFromServer,
  getDocs,
  collection, 
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, StudentReport, Invoice, Attendance } from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with configured databaseId
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

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

// --- ATTENDANCE OPERATIONS ---
export async function saveAttendanceToFirestore(attendance: Attendance): Promise<void> {
  try {
    const attRef = doc(db, ATTENDANCES_COLLECTION, attendance.id);
    await setDoc(attRef, attendance, { merge: true });
  } catch (error) {
    console.error('Failed to save attendance to Firestore:', error);
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
    const studentRef = doc(db, STUDENTS_COLLECTION, student.id);
    await setDoc(studentRef, student, { merge: true });
  } catch (error) {
    console.error('Failed to save student to Firestore:', error);
    throw error;
  }
}

export function subscribeToStudents(
  onData: (students: Student[]) => void,
  onError?: (err: Error) => void
) {
  const collRef = collection(db, STUDENTS_COLLECTION);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: Student[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Student);
      });
      onData(items);
    },
    (err) => {
      console.warn('Firestore students subscription error:', err);
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
    const reportRef = doc(db, REPORTS_COLLECTION, studentId);
    await setDoc(reportRef, report, { merge: true });
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
    const invRef = doc(db, INVOICES_COLLECTION, invoice.id);
    await setDoc(invRef, invoice, { merge: true });
  } catch (error) {
    console.error('Failed to save invoice to Firestore:', error);
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

// Initial online data seeding if database is fresh
export async function seedInitialFirestoreDataIfEmpty(
  defaultStudents: Student[],
  defaultReports: Record<string, StudentReport>,
  defaultInvoices: Invoice[]
): Promise<void> {
  try {
    const studentSnapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
    if (studentSnapshot.empty) {
      console.log('Seeding initial students to Firestore online...');
      for (const st of defaultStudents) {
        await setDoc(doc(db, STUDENTS_COLLECTION, st.id), st);
      }
    }

    const reportSnapshot = await getDocs(collection(db, REPORTS_COLLECTION));
    if (reportSnapshot.empty) {
      console.log('Seeding initial reports to Firestore online...');
      for (const [id, rep] of Object.entries(defaultReports)) {
        await setDoc(doc(db, REPORTS_COLLECTION, id), rep);
      }
    }

    const invSnapshot = await getDocs(collection(db, INVOICES_COLLECTION));
    if (invSnapshot.empty) {
      console.log('Seeding initial invoices to Firestore online...');
      for (const inv of defaultInvoices) {
        await setDoc(doc(db, INVOICES_COLLECTION, inv.id), inv);
      }
    }
  } catch (err) {
    console.warn('Firestore seeding check:', err);
  }
}

