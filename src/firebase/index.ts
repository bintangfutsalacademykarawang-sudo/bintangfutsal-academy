import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocFromServer,
  getDocs,
  collection, 
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, StudentReport, Invoice, Attendance, TrainingSchedule } from '../types';

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
const SCHEDULES_COLLECTION = 'trainingSchedules';

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
    const studentRef = doc(db, STUDENTS_COLLECTION, student.id);
    await setDoc(studentRef, student, { merge: true });
  } catch (error) {
    console.error('Failed to save student to Firestore:', error);
    throw error;
  }
}

export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  try {
    const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
    await deleteDoc(studentRef);
    const reportRef = doc(db, REPORTS_COLLECTION, studentId);
    await deleteDoc(reportRef).catch(() => {});
  } catch (error) {
    console.error('Failed to delete student from Firestore:', error);
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

// --- SCHEDULE OPERATIONS ---
export async function saveScheduleToFirestore(schedule: TrainingSchedule): Promise<void> {
  try {
    const schRef = doc(db, SCHEDULES_COLLECTION, schedule.id);
    await setDoc(schRef, schedule, { merge: true });
  } catch (error) {
    console.error('Failed to save schedule to Firestore:', error);
    throw error;
  }
}

export async function deleteScheduleFromFirestore(scheduleId: string): Promise<void> {
  try {
    const schRef = doc(db, SCHEDULES_COLLECTION, scheduleId);
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

// Initial online data seeding if database is fresh
export async function seedInitialFirestoreDataIfEmpty(
  defaultStudents: Student[],
  defaultReports: Record<string, StudentReport>,
  defaultInvoices: Invoice[],
  defaultSchedules?: TrainingSchedule[]
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
    if (invSnapshot.empty && defaultInvoices.length > 0) {
      console.log('Seeding initial invoices to Firestore online...');
      for (const inv of defaultInvoices) {
        await setDoc(doc(db, INVOICES_COLLECTION, inv.id), inv);
      }
    }

    if (defaultSchedules && defaultSchedules.length > 0) {
      const schSnapshot = await getDocs(collection(db, SCHEDULES_COLLECTION));
      if (schSnapshot.empty) {
        console.log('Seeding initial training schedules to Firestore online...');
        for (const sch of defaultSchedules) {
          await setDoc(doc(db, SCHEDULES_COLLECTION, sch.id), sch);
        }
      }
    }
  } catch (err) {
    console.warn('Firestore seeding check:', err);
  }
}

// Clear demo data (September demo invoices & attendances) from Firestore to start clean from October
export async function wipeDemoDataFromFirestore(): Promise<void> {
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



