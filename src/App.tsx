/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, LogOut } from 'lucide-react';
import { 
  Role, 
  RouteId, 
  Student, 
  CashMutation, 
  Invoice, 
  Attendance, 
  SkillIndicator, 
  ToastMessage, 
  AuthUser, 
  StudentReport, 
  TrainingSchedule 
} from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_CASH_MUTATIONS, 
  INITIAL_INVOICES, 
  INITIAL_ATTENDANCES, 
  INITIAL_SKILL_INDICATORS, 
  INITIAL_STUDENT_REPORTS, 
  INITIAL_SCHEDULES, 
  createDefaultReport, 
  formatDateIndo, 
  getNextStudentId, 
  sanitizeStudentsList 
} from './data/initialData';
import { isExactPhoneMatch, isValidIndonesianMobile } from './utils/phoneUtils';

import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';

import { AdminDashboardView } from './components/views/AdminDashboardView';
import { AdminStudentsView } from './components/views/AdminStudentsView';
import { AdminKeuanganView } from './components/views/AdminKeuanganView';
import { AdminERapportView } from './components/views/AdminERapportView';
import { AdminAttendanceView } from './components/views/AdminAttendanceView';
import { AdminFingerprintView } from './components/views/AdminFingerprintView';
import { AdminInvoicesView } from './components/views/AdminInvoicesView';
import { AdminCoachesView } from './components/views/AdminCoachesView';
import { Coach } from './types/coach';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

import { ParentDashboardView } from './components/views/ParentDashboardView';
import { ParentAttendanceView } from './components/views/ParentAttendanceView';
import { ParentPaymentView } from './components/views/ParentPaymentView';
import { ParentPaymentsHistoryView } from './components/views/ParentPaymentsHistoryView';

import { RecordCashModal } from './components/modals/RecordCashModal';
import { FingerprintModal } from './components/modals/FingerprintModal';
import { StudentFormModal } from './components/modals/StudentFormModal';
import { StudentDetailModal } from './components/modals/StudentDetailModal';
import { EditReportModal } from './components/modals/EditReportModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { CameraModal } from './components/modals/CameraModal';
import { GenerateInvoiceModal } from './components/modals/GenerateInvoiceModal';
import { CreateScheduleModal } from './components/modals/CreateScheduleModal';
import { StudentBarcodeModal } from './components/modals/StudentBarcodeModal';
import { PaymentSubmitData } from './components/modals/InvoicePaymentModal';
import { generateIdempotentPaymentId, generateManualMutationId } from './utils/financeHelpers';
import { 
  testFirestoreConnection,
  seedInitialFirestoreDataIfEmpty,
  saveStudentToFirestore,
  saveReportToFirestore,
  saveInvoiceToFirestore,
  deleteInvoiceFromFirestore,
  saveAttendanceToFirestore,
  deleteAttendanceFromFirestore,
  saveScheduleToFirestore,
  deleteScheduleFromFirestore,
  subscribeToStudents,
  subscribeToStudentDoc,
  subscribeToReports,
  subscribeToStudentReport,
  subscribeToInvoices,
  subscribeToStudentInvoices,
  subscribeToAttendances,
  subscribeToStudentAttendances,
  subscribeToSchedules,
  saveCashMutationToFirestore,
  deleteCashMutationFromFirestore,
  subscribeToCashMutations,
  processInvoicePaymentTransaction,
  cancelInvoicePaymentTransaction,
  CancelPaymentInput,
  CancelPaymentResult,
  wipeDemoDataFromFirestore,
  fetchStudentsDirectly,
  getStudentsCount,
  FirestoreDiagnosticInfo,
  cleanForFirestore,
  saveNewStudentWithAtomicCounter,
  peekNextStudentId,
  db
} from './firebase';

// Explicit Production Write Allowlist:
// Only official BFA production hostnames ("bfa.my.id" and "www.bfa.my.id") are granted write permission to Cloud Firestore.
// All preview environments (*.run.app), localhost, 127.0.0.1, or other hostnames are strictly READ-ONLY (WRITE_ENABLED = false).
const getIsProductionWriteEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();

  // Explicit deny checks
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.run.app')) {
    return false;
  }

  // Explicit allowlist: only official BFA production domain
  if (hostname === 'bfa.my.id' || hostname === 'www.bfa.my.id') {
    return true;
  }

  // All other hostnames default to false (read-only)
  return false;
};

const WRITE_ENABLED = getIsProductionWriteEnabled();

export default function App() {
  // Authentication session state (null = show Login Page)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('bfa_auth_user');
      if (saved) {
        const user: AuthUser = JSON.parse(saved);
        // Reset old demo admin logins (like Coach Hendra or Sari) so user logs in with Admin / EdySun
        if (user.role === 'admin' && (user.name.includes('Hendra') || user.name.includes('Sari'))) {
          localStorage.removeItem('bfa_auth_user');
          return null;
        }
        return user;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState<Role>(currentUser?.role || 'admin');
  const [currentRoute, setCurrentRoute] = useState<RouteId>(() => {
    try {
      const savedRoute = localStorage.getItem('bfa_current_route');
      if (savedRoute) return savedRoute as RouteId;
    } catch {}
    return currentUser?.role === 'parent' ? 'parent-dashboard' : 'dashboard';
  });

  // Helper to inspect localStorage cached students
  const getInitialStudentsCache = (): {
    list: Student[];
    isLegacyPartial: boolean; // only 10 initial students
    cachedAt: string | null;
  } => {
    try {
      const saved = localStorage.getItem('bfa_students');
      const cachedAt = localStorage.getItem('bfa_students_cached_at');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const { list } = sanitizeStudentsList(parsed);
          // Detect if this device cache contains only the 10 legacy initial students (BFA-001 to BFA-010)
          const isLegacyPartial = list.length === 10 && list.every((s, idx) => s.id === `BFA-00${idx + 1}` || s.id === 'BFA-010');
          return { list, isLegacyPartial, cachedAt };
        }
      }
    } catch {}
    return { list: [], isLegacyPartial: false, cachedAt: null };
  };

  // Application Data States (Temporary local cache synchronized with Cloud Firestore)
  const [students, setStudents] = useState<Student[]>(() => {
    return getInitialStudentsCache().list;
  });

  // Find active student strictly matching current verified parent session
  const activeParentStudent = useMemo(() => {
    if (!currentUser || currentUser.role !== 'parent') return null;

    // 1. Strict exact match by studentId (case-insensitive & whitespace-trimmed)
    if (currentUser.studentId) {
      const cleanId = currentUser.studentId.trim().toUpperCase();
      const foundById = students.find((s) => s.id && s.id.trim().toUpperCase() === cleanId);
      if (foundById) {
        return foundById;
      }
    }

    // 2. Strict exact match by verified parent phone number
    if (currentUser.emailOrPhone && isValidIndonesianMobile(currentUser.emailOrPhone)) {
      const matchingByPhone = students.filter((s) => isExactPhoneMatch(s.phone, currentUser.emailOrPhone));
      if (matchingByPhone.length === 1) {
        return matchingByPhone[0];
      }
      if (matchingByPhone.length > 1) {
        if (currentUser.studentId) {
          const cleanId = currentUser.studentId.trim().toUpperCase();
          const byId = matchingByPhone.find((s) => s.id && s.id.trim().toUpperCase() === cleanId);
          if (byId) return byId;
        }
        if (currentUser.studentName) {
          const cleanName = currentUser.studentName.trim().toLowerCase();
          const byName = matchingByPhone.find((s) => s.name.trim().toLowerCase() === cleanName);
          if (byName) return byName;
        }
        return matchingByPhone[0];
      }
    }

    // NEVER fallback to students[0] or another arbitrary student!
    return null;
  }, [currentUser, students]);

  // List of all sibling students sharing the same verified parent phone
  const parentSiblings = useMemo(() => {
    if (!currentUser || currentUser.role !== 'parent' || !activeParentStudent?.phone) return [];
    if (!isValidIndonesianMobile(activeParentStudent.phone)) return [];
    return students.filter((s) => isExactPhoneMatch(s.phone, activeParentStudent.phone));
  }, [currentUser, activeParentStudent, students]);

  const [cashMutations, setCashMutations] = useState<CashMutation[]>(() => {
    try {
      const saved = localStorage.getItem('bfa_cash_mutations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [schedules, setSchedules] = useState<TrainingSchedule[]>(() => {
    try {
      const resetKey = 'bfa_schedules_realtime_sync_v6';
      if (!localStorage.getItem(resetKey)) {
        localStorage.setItem(resetKey, 'true');
        localStorage.setItem('bfa_training_schedules', JSON.stringify(INITIAL_SCHEDULES));
        return INITIAL_SCHEDULES;
      }
      const saved = localStorage.getItem('bfa_training_schedules');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });

  useEffect(() => {
    try { localStorage.setItem('bfa_training_schedules', JSON.stringify(schedules)); } catch (e) { console.error(e); }
  }, [schedules]);

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const resetKey = 'bfa_real_bookkeeping_wipe_all_v10';
      if (!localStorage.getItem(resetKey)) {
        localStorage.setItem(resetKey, 'true');
        localStorage.setItem('bfa_invoices', JSON.stringify([]));
        return [];
      }
      const saved = localStorage.getItem('bfa_invoices');
      const parsed: Invoice[] = saved ? JSON.parse(saved) : [];
      return parsed.filter((inv) => !inv.id.startsWith('INV-202609') && !inv.period?.includes('September'));
    } catch {
      return [];
    }
  });

  const [attendances, setAttendances] = useState<Attendance[]>(() => {
    try {
      const resetKey = 'bfa_october_clean_reset_v5';
      if (!localStorage.getItem(resetKey)) {
        return [];
      }
      const saved = localStorage.getItem('bfa_attendances');
      const parsed: Attendance[] = saved ? JSON.parse(saved) : [];
      return parsed.filter((att) => !att.date.startsWith('2026-09') && !att.id.startsWith('ATT-202609'));
    } catch {
      return [];
    }
  });

  // Per-student E-Rapport reports (Semua default awal 0, tersimpan di localStorage & Firestore)
  const [studentReports, setStudentReports] = useState<Record<string, StudentReport>>(() => {
    try {
      const resetKey = 'bfa_erapport_all_zero_v10';
      if (!localStorage.getItem(resetKey)) {
        localStorage.setItem(resetKey, 'true');
        localStorage.setItem('bfa_student_reports', JSON.stringify(INITIAL_STUDENT_REPORTS));
        return INITIAL_STUDENT_REPORTS;
      }
      const saved = localStorage.getItem('bfa_student_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned: Record<string, StudentReport> = {};
        for (const [id, rep] of Object.entries(parsed as Record<string, StudentReport>)) {
          if (rep.evaluationDate === '2026-09-25' || rep.coachNotes?.includes('first touch')) {
            cleaned[id] = createDefaultReport(id);
          } else {
            cleaned[id] = rep;
          }
        }
        return cleaned;
      }
      return INITIAL_STUDENT_REPORTS;
    } catch {
      return INITIAL_STUDENT_REPORTS;
    }
  });

  const [registeredStudentId, setRegisteredStudentId] = useState<string>('');

  // Coaches state (In Preview mode: simulated safely in memory / sessionStorage)
  const [coaches, setCoaches] = useState<Coach[]>(() => {
    try {
      const sim = sessionStorage.getItem('bfa_coaches_sim');
      return sim ? JSON.parse(sim) : [];
    } catch {
      return [];
    }
  });

  // Automatically persist every update to localStorage so refreshing page keeps all data
  // Safety guard: Never wipe 24 valid students in cache with an empty array or smaller partial cache!
  useEffect(() => {
    if (students.length > 0) {
      try {
        const existing = localStorage.getItem('bfa_students');
        if (existing) {
          const parsed = JSON.parse(existing);
          if (Array.isArray(parsed) && parsed.length > students.length && parsed.length >= 20) {
            console.warn('[Cache Safety] Preserving larger valid student cache in localStorage:', parsed.length);
            return;
          }
        }
        localStorage.setItem('bfa_students', JSON.stringify(students));
      } catch (e) {
        console.error(e);
      }
    }
  }, [students]);

  useEffect(() => {
    try { localStorage.setItem('bfa_cash_mutations', JSON.stringify(cashMutations)); } catch (e) { console.error(e); }
  }, [cashMutations]);

  useEffect(() => {
    try { localStorage.setItem('bfa_invoices', JSON.stringify(invoices)); } catch (e) { console.error(e); }
  }, [invoices]);

  useEffect(() => {
    try { localStorage.setItem('bfa_attendances', JSON.stringify(attendances)); } catch (e) { console.error(e); }
  }, [attendances]);

  useEffect(() => {
    try { localStorage.setItem('bfa_student_reports', JSON.stringify(studentReports)); } catch (e) { console.error(e); }
  }, [studentReports]);

  // Cloud synchronization status & diagnostics (safe, without secrets)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<{
    status: 'connecting' | 'connected' | 'error' | 'offline';
    source: 'server' | 'cache' | 'local_fallback';
    docCount: number;
    expectedCount: number;
    lastSynced: string | null;
    isQuotaExhausted: boolean;
    isPartialCache: boolean;
    errorMessage: string | null;
  }>(() => {
    const { list, isLegacyPartial, cachedAt } = getInitialStudentsCache();
    return {
      status: 'connecting',
      source: list.length > 0 ? 'cache' : 'server',
      docCount: list.length,
      expectedCount: 24,
      lastSynced: cachedAt,
      isQuotaExhausted: false,
      isPartialCache: isLegacyPartial,
      errorMessage: null,
    };
  });

  // Real-time synchronization for Students with online Firebase Firestore
  // Audit fix: No duplicate fetchStudentsDirectly on mount; listener uses local cache first
  useEffect(() => {
    // Passively query verified student count from server using lightweight aggregation (1 read per 1,000 docs)
    getStudentsCount().then((count) => {
      if (typeof count === 'number' && count > 0) {
        setCloudSyncStatus((prev) => ({
          ...prev,
          expectedCount: count,
          isPartialCache: students.length < count && prev.isPartialCache,
        }));
      }
    });

    // Listen to real-time changes from Firestore with diagnostic metadata and quota handling
    const unsubStudents = subscribeToStudents(
      (cloudStudents, meta) => {
        if (cloudStudents && cloudStudents.length > 0) {
          const { list: sanitized } = sanitizeStudentsList(cloudStudents);
          setStudents(sanitized);
          const isPartial = sanitized.length < 24;
          setCloudSyncStatus((prev) => ({
            status: 'connected',
            source: meta.fromCache ? 'cache' : 'server',
            docCount: sanitized.length,
            expectedCount: prev.expectedCount || Math.max(sanitized.length, 24),
            lastSynced: meta.timestamp,
            isQuotaExhausted: false,
            isPartialCache: isPartial,
            errorMessage: null,
          }));
          try {
            localStorage.setItem('bfa_students', JSON.stringify(sanitized));
            localStorage.setItem('bfa_students_cached_at', meta.timestamp);
            localStorage.setItem('bfa_students_cloud_synced', 'true');
          } catch {}
        } else if (cloudStudents && cloudStudents.length === 0) {
          setCloudSyncStatus((prev) => ({
            ...prev,
            status: 'connected',
            source: meta.fromCache ? 'cache' : 'server',
            lastSynced: meta.timestamp,
            errorMessage: null,
          }));
        }
      },
      (err, isQuota) => {
        setCloudSyncStatus((prev) => {
          let userFriendlyMsg: string;
          if (isQuota) {
            if (prev.isPartialCache) {
              userFriendlyMsg = 'Batas kuota harian Cloud Firestore (free tier read) terlampaui (resource-exhausted). Perangkat ini memuat 10 data siswa lama dari cache peramban lokal. Database Cloud di Firebase tetap aman berisi 24 siswa.';
            } else if (prev.docCount >= 24) {
              userFriendlyMsg = 'Batas kuota harian Cloud Firestore terlampaui (resource-exhausted). Menampilkan 24 siswa dari cache lokal terverifikasi. Data di Firebase tetap aman.';
            } else {
              userFriendlyMsg = 'Batas kuota harian Cloud Firestore terlampaui (resource-exhausted). Data server tidak dapat dimuat.';
            }
          } else {
            userFriendlyMsg = err?.message || 'Gagal tersambung ke database Firestore';
          }

          return {
            ...prev,
            status: 'error',
            source: prev.docCount > 0 ? 'cache' : 'local_fallback',
            isQuotaExhausted: isQuota,
            errorMessage: userFriendlyMsg,
          };
        });
      }
    );

    return () => {
      unsubStudents();
    };
  }, []);

  // Lifecycle-scoped listener for Invoices: Active only when viewing financial/dashboard/invoice routes
  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (currentUser?.role === 'admin') {
      const adminInvoiceRoutes: RouteId[] = ['dashboard', 'keuangan', 'invoices'];
      if (adminInvoiceRoutes.includes(currentRoute)) {
        unsub = subscribeToInvoices((cloudInvoices) => {
          if (cloudInvoices) {
            setInvoices(cloudInvoices);
          }
        }, undefined, 50);
      }
    } else if (role === 'parent' && activeParentStudent?.id) {
      const parentInvoiceRoutes: RouteId[] = ['parent-dashboard', 'parent-payment', 'parent-payments', 'parent-attendance'];
      if (parentInvoiceRoutes.includes(currentRoute)) {
        unsub = subscribeToStudentInvoices(activeParentStudent.id, (childInvoices) => {
          if (childInvoices) {
            setInvoices(childInvoices);
          }
        });
      }
    }

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser, role, currentRoute, activeParentStudent?.id]);

  // Lifecycle-scoped listener for Cash Mutations: Active only when viewing dashboard route (AdminKeuanganView manages its own scoped listener & pagination)
  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (currentUser?.role === 'admin') {
      const adminCashRoutes: RouteId[] = ['dashboard'];
      if (adminCashRoutes.includes(currentRoute)) {
        unsub = subscribeToCashMutations((cloudMutations) => {
          if (cloudMutations) {
            setCashMutations(cloudMutations);
          }
        }, undefined, 50);
      }
    }

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser, role, currentRoute]);

  // Lifecycle-scoped listener for Attendances: Active only when viewing attendance/dashboard/erapport routes
  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (currentUser?.role === 'admin') {
      const adminAttendanceRoutes: RouteId[] = ['dashboard', 'attendance', 'erapport', 'fingerprint'];
      if (adminAttendanceRoutes.includes(currentRoute)) {
        const attendanceLimit = currentRoute === 'dashboard' ? 40 : 200;
        unsub = subscribeToAttendances((cloudAttendances) => {
          if (cloudAttendances) {
            const realAttendances = cloudAttendances.filter(
              (att) => !att.date?.startsWith('2026-09') && !att.id?.startsWith('ATT-202609')
            );
            setAttendances(realAttendances);
          }
        }, undefined, attendanceLimit);
      }
    } else if (role === 'parent' && activeParentStudent?.id) {
      const parentAttendanceRoutes: RouteId[] = ['parent-dashboard', 'parent-attendance', 'parent-report'];
      if (parentAttendanceRoutes.includes(currentRoute)) {
        unsub = subscribeToStudentAttendances(activeParentStudent.id, (childAttendances) => {
          if (childAttendances) {
            setAttendances(childAttendances);
          }
        });
      }
    }

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser, role, currentRoute, activeParentStudent?.id]);

  // Lifecycle-scoped listener for Student Reports: Active only when viewing E-Rapport routes
  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (role === 'admin' && currentRoute === 'erapport') {
      unsub = subscribeToReports((cloudReports) => {
        if (cloudReports && Object.keys(cloudReports).length > 0) {
          const sanitized: Record<string, StudentReport> = {};
          for (const [id, rep] of Object.entries(cloudReports)) {
            if (rep.evaluationDate === '2026-09-25' || rep.coachNotes?.includes('first touch')) {
              sanitized[id] = createDefaultReport(id);
            } else {
              sanitized[id] = rep;
            }
          }
          setStudentReports((prev) => ({ ...prev, ...sanitized }));
        }
      });
    } else if (role === 'parent' && currentRoute === 'parent-report' && activeParentStudent?.id) {
      unsub = subscribeToStudentReport(activeParentStudent.id, (childReport) => {
        if (childReport) {
          setStudentReports((prev) => ({ ...prev, [activeParentStudent.id]: childReport }));
        }
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [role, currentRoute, activeParentStudent?.id]);

  // Auto-heal local state if any student record in memory has an empty ID (local only, never overwrite Firebase)
  useEffect(() => {
    if (students.length > 0) {
      const { list, changed } = sanitizeStudentsList(students);
      if (changed) {
        setStudents(list);
      }
    }
  }, [students]);

  // Toast Notification System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const lastSyncAttemptRef = useRef<number>(0);

  // Manual cloud re-synchronization with diagnostic reporting & cooldown safety
  const handleManualSyncCloud = async () => {
    const now = Date.now();
    const elapsed = now - lastSyncAttemptRef.current;
    if (elapsed < 30000) {
      const waitSec = Math.ceil((30000 - elapsed) / 1000);
      showToast(`Mohon tunggu ${waitSec} detik sebelum mencoba sinkronisasi ulang untuk menjaga kuota Firestore.`, 'warning');
      return;
    }

    lastSyncAttemptRef.current = now;
    setCloudSyncStatus((prev) => ({ ...prev, status: 'connecting', errorMessage: null }));
    showToast('Menghubungi cloud server untuk sinkronisasi data siswa...', 'info');

    const { students: freshStudents, meta, error, isQuotaExhausted } = await fetchStudentsDirectly();
    if (error || !freshStudents || freshStudents.length === 0) {
      let friendlyMsg = error || 'Tidak ada dokumen diterima dari server';
      if (isQuotaExhausted) {
        friendlyMsg = cloudSyncStatus.isPartialCache
          ? 'Batas kuota harian Cloud Firestore (free tier) masih terlampaui (resource-exhausted). Perangkat ini masih memuat 10 data awal. Database Cloud Firebase tetap aman berisi 24 siswa.'
          : 'Batas kuota harian Cloud Firestore (free tier) masih terlampaui (resource-exhausted). Menampilkan 24 siswa dari cache lokal terverifikasi.';
      }
      setCloudSyncStatus((prev) => ({
        ...prev,
        status: 'error',
        isQuotaExhausted: !!isQuotaExhausted,
        errorMessage: friendlyMsg,
      }));
      showToast(isQuotaExhausted ? 'Batas Kuota Cloud (resource-exhausted)' : friendlyMsg, 'error');
    } else {
      const { list: sanitized } = sanitizeStudentsList(freshStudents);
      setStudents(sanitized);
      const isPartial = sanitized.length < 24;
      setCloudSyncStatus({
        status: 'connected',
        source: meta.source,
        docCount: sanitized.length,
        expectedCount: 24,
        lastSynced: meta.timestamp,
        isQuotaExhausted: false,
        isPartialCache: isPartial,
        errorMessage: null,
      });
      try {
        localStorage.setItem('bfa_students', JSON.stringify(sanitized));
        localStorage.setItem('bfa_students_cached_at', meta.timestamp);
      } catch {}
      showToast(`✓ Sinkronisasi Cloud Berhasil! ${sanitized.length} data siswa aktif termuat.`, 'success');
    }
  };

  // Auth Handlers
  const handleLogin = (user: AuthUser) => {
    // Clear any temporary edit/detail/report states from previous accounts
    setStudentToEdit(null);
    setStudentForDetail(null);
    setEditingReportStudent(null);
    setInvoiceForReceipt(null);
    setCapturedCameraData(null);

    setCurrentUser(user);
    setRole(user.role);
    try {
      localStorage.setItem('bfa_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    const nextRoute = user.role === 'admin' ? 'dashboard' : 'parent-dashboard';
    setCurrentRoute(nextRoute);
    try {
      localStorage.setItem('bfa_current_route', nextRoute);
    } catch {}
  };

  // Logout is the only official way to switch account / role as requested
  const handleLogout = () => {
    setCurrentUser(null);
    setRole('admin');
    setRegisteredStudentId('');
    setStudentToEdit(null);
    setStudentForDetail(null);
    setEditingReportStudent(null);
    setInvoiceForReceipt(null);
    setCapturedCameraData(null);
    try {
      localStorage.removeItem('bfa_auth_user');
      localStorage.removeItem('bfa_current_route');
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    showToast('Anda telah keluar dari sesi BFA HUB. Silakan login kembali.', 'info');
  };

  const handleNavigate = (route: RouteId) => {
    setCurrentRoute(route);
    try {
      localStorage.setItem('bfa_current_route', route);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modal Control States
  const [isRecordCashOpen, setIsRecordCashOpen] = useState(false);
  const [isFingerprintOpen, setIsFingerprintOpen] = useState(false);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [studentForDetail, setStudentForDetail] = useState<Student | null>(null);
  
  // Edit Report Modal States
  const [isEditReportOpen, setIsEditReportOpen] = useState(false);
  const [editingReportStudent, setEditingReportStudent] = useState<Student | null>(null);
  const [editingReportIndicators, setEditingReportIndicators] = useState<SkillIndicator[]>([]);
  const [editingReportNotes, setEditingReportNotes] = useState<string>('');

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [invoiceForReceipt, setInvoiceForReceipt] = useState<Invoice | null>(null);
  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'photo' | 'kk' | 'akte' | 'kia' | 'ijazah' | null>(null);
  const [capturedCameraData, setCapturedCameraData] = useState<{
    dataUrl: string;
    target: 'photo' | 'kk' | 'akte' | 'kia' | 'ijazah';
    timestamp: number;
  } | null>(null);
  const [newlyRegisteredStudent, setNewlyRegisteredStudent] = useState<Student | null>(null);
  const [isNewStudentBarcodeOpen, setIsNewStudentBarcodeOpen] = useState(false);
  const [candidateNextId, setCandidateNextId] = useState<string>('BFA-039');

  // On-demand fetch of candidate preview ID only when opening form to add a new student
  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentFormOpen(true);
    peekNextStudentId().then((id) => {
      if (id) setCandidateNextId(id);
    });
  };

  // Lifecycle-scoped listener for Training Schedules: Active only when viewing schedule-related routes or modals
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const isAdminScheduleView =
      currentUser?.role === 'admin' &&
      ['dashboard', 'attendance'].includes(currentRoute);

    const isParentScheduleView =
      role === 'parent' &&
      ['parent-dashboard', 'parent-attendance'].includes(currentRoute);

    const isScheduleModalActive =
      currentUser?.role === 'admin' &&
      (isFingerprintOpen || isCreateScheduleOpen);

    if (
      isAdminScheduleView ||
      isParentScheduleView ||
      isScheduleModalActive
    ) {
      unsub = subscribeToSchedules((cloudSchedules) => {
        if (cloudSchedules && cloudSchedules.length > 0) {
          setSchedules(cloudSchedules);
        }
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [
    currentUser,
    role,
    currentRoute,
    isFingerprintOpen,
    isCreateScheduleOpen
  ]);

  // Lifecycle-scoped listener for Coaches: Active ONLY when admin is on 'coaches' route or schedule modal is open
  useEffect(() => {
    if (role !== 'admin' || (currentRoute !== 'coaches' && !isCreateScheduleOpen)) {
      return;
    }

    try {
      const coachesCol = collection(db, 'coaches');
      const unsubscribe = onSnapshot(
        coachesCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const loaded: Coach[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Coach;
              if (data && data.id && data.name) {
                loaded.push(data);
              }
            });
            loaded.sort((a, b) => a.id.localeCompare(b.id));
            setCoaches(loaded);
          }
        },
        (error) => {
          console.warn('[Firestore] coaches listener notice:', error);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.warn('[Firestore] coaches subscription error:', err);
    }
  }, [role, currentRoute, isCreateScheduleOpen]);

  // Coach Management Handlers (Safety Guard: WRITE_ENABLED = false by default in Preview)
  const handleSaveCoach = async (coachData: Coach) => {
    // 1. Preview Mode: Isolate to in-memory state and sessionStorage without touching Firestore
    if (!WRITE_ENABLED) {
      setCoaches((prev) => {
        const idx = prev.findIndex((c) => c.id === coachData.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = coachData;
          return next;
        }
        return [...prev, coachData];
      });

      try {
        const currentSim = JSON.parse(sessionStorage.getItem('bfa_coaches_sim') || '[]');
        const idx = currentSim.findIndex((c: Coach) => c.id === coachData.id);
        if (idx >= 0) currentSim[idx] = coachData;
        else currentSim.push(coachData);
        sessionStorage.setItem('bfa_coaches_sim', JSON.stringify(currentSim));
      } catch {}

      showToast(
        `Data ${coachData.name} tersimpan di memori sesi (Mode Preview: Cloud write dinonaktifkan)`,
        'info'
      );
      return;
    }

    // 2. Production Mode: Write to Firestore first with sanitized payload
    try {
      // Production Safety Guard: Never write base64/data URL strings to Firestore documents
      const cleanPayload: Partial<Coach> = { ...coachData };
      if (cleanPayload.photoUrl && cleanPayload.photoUrl.startsWith('data:')) {
        delete cleanPayload.photoUrl;
      }

      // Remove all undefined properties recursively so Firestore setDoc never throws 'Unsupported field value: undefined'
      const sanitizedPayload = cleanForFirestore(cleanPayload);

      const docRef = doc(db, 'coaches', coachData.id);
      await setDoc(docRef, sanitizedPayload, { merge: true });

      // Update local state only after successful Firestore write
      setCoaches((prev) => {
        const idx = prev.findIndex((c) => c.id === coachData.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = coachData;
          return next;
        }
        return [...prev, coachData];
      });

      showToast(`Data pelatih ${coachData.name} berhasil disimpan ke database.`, 'success');
    } catch (err: any) {
      console.error('[Firestore] Gagal menyimpan pelatih ke cloud:', err);
      showToast(`Gagal menyimpan pelatih ke cloud: ${err?.message || 'Error koneksi database'}`, 'error');
    }
  };

  const handleToggleCoachStatus = async (coachId: string, currentStatus: 'Aktif' | 'Non-Aktif') => {
    const newStatus = currentStatus === 'Aktif' ? 'Non-Aktif' : 'Aktif';
    const targetCoach = coaches.find((c) => c.id === coachId);
    if (!targetCoach) return;

    const updatedCoach: Coach = { ...targetCoach, status: newStatus };

    // 1. Preview Mode: Update in-memory state and sessionStorage only
    if (!WRITE_ENABLED) {
      setCoaches((prev) => prev.map((c) => (c.id === coachId ? updatedCoach : c)));

      try {
        const currentSim = JSON.parse(sessionStorage.getItem('bfa_coaches_sim') || '[]');
        const idx = currentSim.findIndex((c: Coach) => c.id === coachId);
        if (idx >= 0) {
          currentSim[idx] = updatedCoach;
          sessionStorage.setItem('bfa_coaches_sim', JSON.stringify(currentSim));
        }
      } catch {}

      showToast(
        `Status ${targetCoach.name} diubah menjadi "${newStatus}" (Mode Preview: Cloud write dinonaktifkan)`,
        'info'
      );
      return;
    }

    // 2. Production Mode: Write status update to Firestore first
    try {
      const docRef = doc(db, 'coaches', coachId);
      await setDoc(docRef, { status: newStatus }, { merge: true });

      // Update state only after successful write
      setCoaches((prev) => prev.map((c) => (c.id === coachId ? updatedCoach : c)));

      showToast(`Status pelatih ${targetCoach.name} diubah menjadi "${newStatus}".`, 'success');
    } catch (err: any) {
      console.error('[Firestore] Gagal memperbarui status pelatih di cloud:', err);
      showToast(`Gagal memperbarui status pelatih: ${err?.message || 'Error koneksi database'}`, 'error');
    }
  };

  // Cash Mutation Operations (Persistent Firestore Collection)
  const handleAddCashMutation = async (mutationData: Omit<CashMutation, 'id'>) => {
    const newId = generateManualMutationId();
    const newMutation: CashMutation = {
      id: newId,
      ...mutationData,
      source: 'MANUAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setCashMutations((prev) => [newMutation, ...prev]);

    try {
      await saveCashMutationToFirestore(newMutation);
      showToast(
        `Transaksi ${newMutation.category} (${newMutation.type}) sebesar Rp${newMutation.amount.toLocaleString('id-ID')} berhasil dicatat & tersimpan!`,
        'success'
      );
    } catch (err) {
      console.warn('Gagal menyimpan mutasi ke cloud:', err);
      showToast('Gagal menyimpan mutasi kas ke database cloud.', 'error');
    }
  };

  const handleDeleteMutation = async (id: string) => {
    const item = cashMutations.find((m) => m.id === id);
    setCashMutations((prev) => prev.filter((m) => m.id !== id));

    try {
      await deleteCashMutationFromFirestore(id);
      showToast(`Mutasi kas ${item?.note || id} berhasil dihapus.`, 'info');
    } catch (err) {
      console.warn('Gagal menghapus mutasi dari cloud:', err);
      showToast('Gagal menghapus mutasi kas dari database cloud.', 'error');
    }
  };

  // Update Student Photo Handler
  const handleUpdateStudentPhoto = (studentId: string, newPhotoUrl: string) => {
    setStudents((prev) => {
      const updated = prev.map((s) => (s.id === studentId ? { ...s, avatar: newPhotoUrl } : s));
      try {
        localStorage.setItem('bfa_students', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      const target = updated.find((s) => s.id === studentId);
      if (target) {
        saveStudentToFirestore(target).catch((e) => console.warn('Firestore student photo sync:', e));
      }
      return updated;
    });
    showToast('Foto profil ananda berhasil diperbarui!', 'success');
  };

  // Schedule Operations (Add / Edit / Delete)
  const [scheduleToEdit, setScheduleToEdit] = useState<TrainingSchedule | null>(null);

  const handleSaveSchedule = (scheduleData: Omit<TrainingSchedule, 'id'>, editId?: string) => {
    if (editId) {
      const updated: TrainingSchedule = { ...scheduleData, id: editId };
      setSchedules((prev) =>
        prev.map((s) => (s.id === editId ? updated : s))
      );
      saveScheduleToFirestore(updated).catch((e) => console.warn('Firestore schedule save error:', e));
      showToast(
        `✓ Jadwal sesi latihan ${scheduleData.classGroupId} (${scheduleData.dayName}) berhasil diperbarui & tersinkron online!`,
        'success'
      );
    } else {
      const newId = `SCH-${scheduleData.date.replace(/-/g, '')}-${String(schedules.length + 1).padStart(3, '0')}`;
      const newSchedule: TrainingSchedule = {
        id: newId,
        ...scheduleData,
      };
      setSchedules((prev) => [newSchedule, ...prev]);
      saveScheduleToFirestore(newSchedule).catch((e) => console.warn('Firestore schedule save error:', e));
      showToast(
        `✓ Jadwal sesi latihan ${newSchedule.classGroupId} (${newSchedule.dayName}) berhasil disimpan & disiarkan real-time ke Dashboard Orang Tua!`,
        'success'
      );
    }
    setScheduleToEdit(null);
  };

  const handleOpenEditSchedule = (sch: TrainingSchedule) => {
    setScheduleToEdit(sch);
    setIsCreateScheduleOpen(true);
  };

  const handleOpenAddSchedule = () => {
    setScheduleToEdit(null);
    setIsCreateScheduleOpen(true);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('bfa_training_schedules', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    deleteScheduleFromFirestore(id).catch((e) => console.warn('Firestore schedule delete error:', e));
    showToast('✓ Jadwal sesi latihan berhasil dihapus.', 'info');
  };

  // Fingerprint Attendance Logic
  const handleFingerprintSubmit = (
    studentId: string,
    date: string,
    time: string,
    status: 'HADIR' | 'TIDAK_HADIR'
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const existingIndex = attendances.findIndex((a) => a.studentId === studentId && a.date === date);
    let updatedAtt: Attendance;

    if (existingIndex >= 0) {
      // Update existing attendance record
      updatedAtt = {
        ...attendances[existingIndex],
        status,
        checkInTime: time,
        feeGenerated: status === 'HADIR',
      };
      setAttendances((prev) => {
        const next = [...prev];
        next[existingIndex] = updatedAtt;
        try {
          localStorage.setItem('bfa_attendances', JSON.stringify(next));
        } catch {}
        return next;
      });
      saveAttendanceToFirestore(updatedAtt).catch((e) => console.warn('Firestore attendance sync:', e));
    } else {
      // Create new attendance record
      updatedAtt = {
        id: `ATT-${date.replace(/-/g, '')}-${student.id.replace('BFA-', '') || Math.floor(100 + Math.random() * 900)}`,
        studentId: student.id,
        studentName: student.name,
        classGroupId: student.classGroupId,
        date,
        checkInTime: time,
        status,
        feeGenerated: status === 'HADIR',
      };
      setAttendances((prev) => {
        const next = [updatedAtt, ...prev];
        try {
          localStorage.setItem('bfa_attendances', JSON.stringify(next));
        } catch {}
        return next;
      });
      saveAttendanceToFirestore(updatedAtt).catch((e) => console.warn('Firestore attendance sync:', e));
    }

    if (status === 'HADIR') {
      const duplicateInvoice = invoices.find(
        (inv) => inv.studentId === studentId && inv.attendanceDate === date && inv.type === 'Latihan'
      );

      if (!duplicateInvoice) {
        const dateParts = date.split('-');
        const formattedCreated = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        const newInvoice: Invoice = {
          id: `INV-${date.replace(/-/g, '')}-${student.id.replace('BFA-', '') || Math.floor(100 + Math.random() * 900)}`,
          studentId: student.id,
          studentName: student.name,
          classGroupId: student.classGroupId,
          type: 'Latihan',
          attendanceDate: date,
          period: `Sesi Latihan (${date})`,
          amount: 15000,
          paidAmount: 0,
          remainingAmount: 15000,
          status: 'BELUM BAYAR',
          dueDate: date,
          createdAt: formattedCreated,
        };
        setInvoices((prev) => {
          const next = [newInvoice, ...prev];
          try {
            localStorage.setItem('bfa_invoices', JSON.stringify(next));
          } catch {}
          return next;
        });
        saveInvoiceToFirestore(newInvoice).catch((e) => console.warn('Firestore invoice sync:', e));

        showToast(
          `Absensi ${student.name} berhasil tercatat (HADIR) & Tagihan Sesi Latihan Rp15.000 otomatis diterbitkan!`,
          'success'
        );
      } else {
        showToast(
          `Absensi ${student.name} berhasil diverifikasi (HADIR) pada sesi ${date} jam ${time}.`,
          'success'
        );
      }
    } else {
      showToast(`Absensi ${student.name} tercatat (TIDAK HADIR). Bebas biaya iuran latihan.`, 'info');
    }
  };

  const handleQuickMarkAttendance = (studentId: string, date: string, status: 'HADIR' | 'TIDAK_HADIR') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    handleFingerprintSubmit(studentId, date, timeStr, status);
  };

  // Delete attendance record feature requested by user
  const handleDeleteAttendance = (attendanceId: string) => {
    const target = attendances.find((a) => a.id === attendanceId);
    setAttendances((prev) => {
      const next = prev.filter((a) => a.id !== attendanceId);
      try {
        localStorage.setItem('bfa_attendances', JSON.stringify(next));
      } catch {}
      return next;
    });

    deleteAttendanceFromFirestore(attendanceId).catch((e) =>
      console.warn('Firestore attendance delete error:', e)
    );

    if (target) {
      // If an unpaid training fee invoice was automatically generated for this session, remove it too
      setInvoices((prev) => {
        const next = prev.filter(
          (inv) =>
            !(
              inv.studentId === target.studentId &&
              inv.attendanceDate === target.date &&
              inv.type === 'Latihan' &&
              inv.status === 'BELUM BAYAR'
            )
        );
        try {
          localStorage.setItem('bfa_invoices', JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`Catatan absensi ${target.studentName} (${target.date}) berhasil dihapus.`, 'info');
    } else {
      showToast('Catatan absensi berhasil dihapus.', 'info');
    }
  };

  // Open SPP Configuration Modal
  const handleGenerateMonthlyInvoices = () => {
    setIsGenerateInvoiceModalOpen(true);
  };

  // Generate Monthly Invoices with custom settings from Modal
  const handleConfirmGenerateInvoices = (config: {
    period: string;
    dueDate: string;
    issueDate: string;
    amount: number;
    classGroupId: string;
  }) => {
    let count = 0;
    const newInvoices: Invoice[] = [];
    const dateFormatted = config.issueDate.split('-').reverse().join('/');

    students.forEach((st) => {
      const matchGroup = config.classGroupId === 'ALL' || st.classGroupId === config.classGroupId;
      if (st.status === 'Aktif' && matchGroup) {
        const exists = invoices.some(
          (inv) => inv.studentId === st.id && inv.type === 'Bulanan' && inv.period === config.period
        );
        if (!exists) {
          const invId = `INV-${config.issueDate.replace(/-/g, '')}-${st.id.replace('BFA-', '') || Math.floor(100 + Math.random() * 900)}`;
          newInvoices.push({
            id: invId,
            studentId: st.id,
            studentName: st.name,
            classGroupId: st.classGroupId,
            type: 'Bulanan',
            period: config.period,
            amount: config.amount,
            paidAmount: 0,
            remainingAmount: config.amount,
            status: 'BELUM BAYAR',
            dueDate: config.dueDate,
            createdAt: dateFormatted,
          });
          count++;
        }
      }
    });

    if (count > 0) {
      setInvoices((prev) => [...newInvoices, ...prev]);
      try {
        localStorage.setItem('bfa_invoices', JSON.stringify([...newInvoices, ...invoices]));
      } catch {}
      newInvoices.forEach((inv) => {
        saveInvoiceToFirestore(inv).catch((e) => console.warn('Firestore invoice sync:', e));
      });
      showToast(`Berhasil menerbitkan ${count} tagihan SPP (${config.period}) jatuh tempo ${config.dueDate}!`, 'success');
    } else {
      showToast(`Seluruh siswa aktif pada kelompok ${config.classGroupId === 'ALL' ? 'Semua' : config.classGroupId} sudah memiliki tagihan untuk ${config.period}.`, 'info');
    }
  };

  // Atomic Invoice Payment Processor (runTransaction: Invoice + Payment + CashMutation)
  const handleProcessPayment = async (data: PaymentSubmitData) => {
    try {
      const result = await processInvoicePaymentTransaction({
        paymentId: data.paymentId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        staffName: currentUser?.name || 'Admin BFA',
        note: data.note,
      });

      // Optimistic updates
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === result.invoice.id ? result.invoice : inv))
      );
      setCashMutations((prev) => {
        const exists = prev.some((m) => m.id === result.mutation.id);
        return exists ? prev : [result.mutation, ...prev];
      });

      showToast(
        `✓ Pembayaran ${result.invoice.studentName} sebesar Rp${data.amount.toLocaleString('id-ID')} berhasil dicatat & masuk ke Buku Kas!`,
        'success'
      );
    } catch (err: any) {
      console.error('Gagal memproses pembayaran atomik:', err);
      showToast(`Gagal memproses pembayaran: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  };

  // Atomic Invoice Payment Correction / Cancellation
  const handleCancelInvoicePayment = async (
    data: CancelPaymentInput
  ): Promise<{
    success: boolean;
    invoiceId: string;
    paymentId: string;
    mutationId?: string;
    invoice?: Invoice;
    message: string;
  }> => {
    try {
      // 1. Panggil transaksi atomik backend Firestore (tidak ada optimistic update sebelum transaksi sukses)
      const result = await cancelInvoicePaymentTransaction({
        invoiceId: data.invoiceId,
        paymentId: data.paymentId,
        staffName: data.staffName || currentUser?.name || 'Admin BFA',
        reason: data.reason,
      });

      // 2. Update state invoices hanya setelah backend sukses
      setInvoices((prev) => {
        const next = prev.map((inv) => (inv.id === result.invoice.id ? result.invoice : inv));
        try {
          localStorage.setItem('bfa_invoices', JSON.stringify(next));
        } catch {}
        return next;
      });

      // 3. Hapus cash mutation yang dikoreksi berdasarkan cancelledMutationId atau relasi tagihan/pembayaran
      setCashMutations((prev) => {
        const next = prev.filter(
          (m) =>
            m.id !== result.cancelledMutationId &&
            m.invoiceId !== data.invoiceId &&
            m.paymentId !== data.paymentId &&
            m.id !== data.paymentId
        );
        try {
          localStorage.setItem('bfa_cash_mutations', JSON.stringify(next));
        } catch {}
        return next;
      });

      const successMsg = `✓ Pembayaran ${result.invoice.studentName} sebesar Rp${result.cancelledAmount.toLocaleString('id-ID')} berhasil dibatalkan. Tagihan & Buku Kas telah disesuaikan!`;
      showToast(successMsg, 'success');

      return {
        success: true,
        invoiceId: data.invoiceId,
        paymentId: data.paymentId,
        mutationId: result.cancelledMutationId,
        invoice: result.invoice,
        message: successMsg,
      };
    } catch (err: any) {
      console.error('Gagal membatalkan pembayaran invoice:', err);
      const errMsg = err?.message || 'Terjadi kesalahan saat membatalkan pembayaran.';
      showToast(`Gagal membatalkan pembayaran: ${errMsg}`, 'error');
      throw err;
    }
  };

  // Mark invoice paid manually (Quick action with pre-generated idempotent paymentId)
  const handleMarkInvoicePaid = async (id: string) => {
    const targetInv = invoices.find((inv) => inv.id === id);
    if (!targetInv) return;

    const remaining = targetInv.remainingAmount !== undefined 
      ? targetInv.remainingAmount 
      : targetInv.amount;
    const paymentAmount = remaining > 0 ? remaining : targetInv.amount;
    const paymentId = generateIdempotentPaymentId(id);

    await handleProcessPayment({
      paymentId,
      invoiceId: id,
      amount: paymentAmount,
      paymentMethod: 'Manual Verifikasi Admin',
      paymentDate: new Date().toISOString().split('T')[0],
      note: `Pelunasan ${targetInv.type} (${targetInv.period}) - ${targetInv.studentName}`,
    });
  };

  // Delete single invoice
  const handleDeleteInvoice = (id: string) => {
    const targetInv = invoices.find((inv) => inv.id === id);
    setInvoices((prev) => {
      const next = prev.filter((inv) => inv.id !== id);
      try {
        localStorage.setItem('bfa_invoices', JSON.stringify(next));
      } catch {}
      return next;
    });

    deleteInvoiceFromFirestore(id).catch((e) =>
      console.warn('Firestore invoice delete error:', e)
    );

    showToast(
      `✓ Tagihan ${targetInv ? `${targetInv.studentName} (${targetInv.type} ${targetInv.period})` : id} berhasil dihapus.`,
      'info'
    );
  };

  // Student Form Submit (Add or Edit) - Database-First with Atomic Counter
  const handleSaveStudent = async (data: Omit<Student, 'id' | 'joinedDate'> & { id?: string }) => {
    const isExisting = Boolean(data.id && students.some((s) => s.id === data.id));
    if (isExisting && data.id) {
      // Edit mode: Update existing student
      const existing = students.find((s) => s.id === data.id);
      const updatedStudent: Student = {
        ...(existing || {}),
        ...data,
        id: data.id,
        joinedDate: existing?.joinedDate || '2024-01-10',
      } as Student;

      try {
        await saveStudentToFirestore(updatedStudent);

        setStudents((prev) =>
          prev.map((s) => (s.id === data.id ? updatedStudent : s))
        );

        // If parent user is currently logged in, sync active parent session
        if (currentUser?.role === 'parent' && (currentUser.studentId === data.id || currentUser.studentName === existing?.name)) {
          const updatedAuthUser: AuthUser = {
            ...currentUser,
            studentName: updatedStudent.name,
            name: updatedStudent.parentName || currentUser.name,
            emailOrPhone: updatedStudent.phone || currentUser.emailOrPhone,
          };
          setCurrentUser(updatedAuthUser);
          try {
            localStorage.setItem('bfa_auth_user', JSON.stringify(updatedAuthUser));
          } catch {}
        }

        showToast(`Data siswa ${data.name} (${data.id}) berhasil diperbarui & tersimpan online!`, 'success');
      } catch (err: any) {
        console.error('[Firestore] Gagal memperbarui data siswa:', err);
        showToast(`Gagal menyimpan perubahan siswa: ${err?.message || 'Error koneksi database'}`, 'error');
      }
    } else {
      // Add new student: DATABASE-FIRST via Firestore Atomic Counter Transaction
      try {
        showToast('Memproses alokasi nomor ID & menyimpan ke cloud...', 'info');
        const newStudent = await saveNewStudentWithAtomicCounter(data, '2026-09-26');

        // Only update local state AFTER Firestore transaction succeeds
        setStudents((prev) => [newStudent, ...prev]);
        try {
          localStorage.setItem('bfa_students', JSON.stringify([newStudent, ...students]));
        } catch {}

        // Initialize default report for newly added student
        const defaultRep = createDefaultReport(newStudent.id, newStudent.name, newStudent.position);
        setStudentReports((prev) => ({
          ...prev,
          [newStudent.id]: defaultRep,
        }));
        saveReportToFirestore(newStudent.id, defaultRep).catch((e) => console.warn('Firestore report sync:', e));

        // Update candidate preview ID for next registration
        peekNextStudentId().then((id) => setCandidateNextId(id));

        // Automatically trigger official Athlete Barcode Pass modal
        setNewlyRegisteredStudent(newStudent);
        setIsNewStudentBarcodeOpen(true);
        setIsStudentFormOpen(false);
        setStudentToEdit(null);

        showToast(
          `✓ Siswa baru ${newStudent.name} (${newStudent.id} - ${newStudent.classGroupId}) berhasil didaftarkan & tersimpan permanen di cloud!`,
          'success'
        );
      } catch (err: any) {
        console.error('[Firestore] Gagal membuat siswa baru:', err);
        showToast(`Gagal mendaftarkan siswa baru: ${err?.message || 'Error alokasi nomor ID'}`, 'error');
      }
    }
  };

  // Register New Member from Login Page (Database-First via Atomic Counter)
  const handleRegisterNewMemberFromLogin = async (data: Omit<Student, 'id' | 'joinedDate'> & { id?: string }) => {
    try {
      showToast('Memproses alokasi nomor ID & mendaftarkan ke cloud...', 'info');
      const newStudent = await saveNewStudentWithAtomicCounter(
        data,
        new Date().toISOString().split('T')[0]
      );

      // Only update local state AFTER Firestore transaction succeeds
      setStudents((prev) => [newStudent, ...prev]);
      try {
        localStorage.setItem('bfa_students', JSON.stringify([newStudent, ...students]));
      } catch {}

      // Initialize e-rapport for new athlete
      const defaultRep = createDefaultReport(newStudent.id, newStudent.name, newStudent.position);
      setStudentReports((prev) => ({
        ...prev,
        [newStudent.id]: defaultRep,
      }));
      saveReportToFirestore(newStudent.id, defaultRep).catch((e) => console.warn('Firestore report sync:', e));

      peekNextStudentId().then((id) => setCandidateNextId(id));

      setIsStudentFormOpen(false);

      // Tetap di menu login untuk melakukan login menggunakan ID yang sudah terdaftar
      setNewlyRegisteredStudent(newStudent);
      setIsNewStudentBarcodeOpen(true);
      setRegisteredStudentId(newStudent.id);

      showToast(
        `✓ Registrasi Siswa Baru Berhasil! ID Siswa Anda adalah ${newStudent.id}. Silakan masuk menggunakan ID Siswa ini di form login.`,
        'success'
      );
    } catch (err: any) {
      console.error('[Firestore] Gagal registrasi siswa baru dari login:', err);
      showToast(`Gagal mendaftarkan siswa baru: ${err?.message || 'Error alokasi nomor ID'}`, 'error');
    }
  };

  // E-Rapport Open Edit Modal for a specific student
  const handleOpenEditReportForStudent = (
    student: Student,
    currentIndicators: SkillIndicator[],
    currentNotes: string
  ) => {
    setEditingReportStudent(student);
    setEditingReportIndicators(currentIndicators);
    setEditingReportNotes(currentNotes);
    setIsEditReportOpen(true);
  };

  // Save Report for a specific student (dengan pembaruan tanggal, kehadiran, & sesi riil)
  const handleSaveReportForStudent = (
    studentId: string,
    indicators: SkillIndicator[],
    notes: string,
    evaluationDate?: string,
    attendancePercent?: number,
    totalSessions?: number
  ) => {
    const prevRep = studentReports[studentId];
    const updatedRep: StudentReport = {
      studentId,
      skillIndicators: indicators,
      coachNotes: notes,
      evaluationDate: evaluationDate || new Date().toISOString().split('T')[0],
      attendancePercent: typeof attendancePercent === 'number' ? attendancePercent : (prevRep?.attendancePercent ?? 0),
      totalSessions: typeof totalSessions === 'number' ? totalSessions : (prevRep?.totalSessions ?? 0),
    };

    setStudentReports((prev) => {
      const nextMap = { ...prev, [studentId]: updatedRep };
      try { localStorage.setItem('bfa_student_reports', JSON.stringify(nextMap)); } catch {}
      return nextMap;
    });

    saveReportToFirestore(studentId, updatedRep).catch((e) => console.warn('Firestore report sync:', e));

    const st = students.find((s) => s.id === studentId);
    showToast(`✓ Nilai E-Rapport untuk ${st?.name || studentId} berhasil disimpan!`, 'success');
  };

  // Save Full Report with evaluationDate, attendance, and sessions
  const handleSaveFullReportForStudent = (
    studentId: string,
    indicators: SkillIndicator[],
    notes: string,
    evaluationDate?: string,
    attendancePercent?: number,
    totalSessions?: number
  ) => {
    handleSaveReportForStudent(studentId, indicators, notes, evaluationDate, attendancePercent, totalSessions);
  };

  // Add new student AND immediately create their E-Rapport - Database-First via Atomic Counter
  const handleAddNewStudentWithReport = (
    studentData: Omit<Student, 'id' | 'joinedDate'> & { id?: string },
    reportData: {
      indicators: SkillIndicator[];
      notes: string;
      evaluationDate: string;
      attendancePercent: number;
      totalSessions: number;
    }
  ): string => {
    const previewAssignedId = candidateNextId;

    saveNewStudentWithAtomicCounter(studentData, '2026-09-26')
      .then((newStudent) => {
        const newRep: StudentReport = {
          studentId: newStudent.id,
          skillIndicators: reportData.indicators,
          coachNotes: reportData.notes,
          evaluationDate: reportData.evaluationDate,
          attendancePercent: reportData.attendancePercent,
          totalSessions: reportData.totalSessions,
        };

        setStudents((prev) => [newStudent, ...prev]);
        try {
          localStorage.setItem('bfa_students', JSON.stringify([newStudent, ...students]));
        } catch {}

        setStudentReports((prev) => ({
          ...prev,
          [newStudent.id]: newRep,
        }));

        saveReportToFirestore(newStudent.id, newRep).catch((e) => console.warn('Firestore report sync:', e));
        peekNextStudentId().then((id) => setCandidateNextId(id));

        showToast(
          `✓ Siswa baru ${newStudent.name} (${newStudent.id}) & E-Rapport berhasil disimpan online!`,
          'success'
        );
      })
      .catch((err) => {
        console.error('[Firestore] Gagal menambahkan siswa baru dengan rapor:', err);
        showToast(`Gagal mendaftarkan siswa baru: ${err?.message || 'Error alokasi nomor ID'}`, 'error');
      });

    return previewAssignedId;
  };

  // Send WhatsApp Report for a specific student
  const handleSendWhatsAppForStudent = (student: Student, report: StudentReport) => {
    const totalScore = report.skillIndicators.reduce((acc, curr) => acc + curr.score, 0);
    const ovrRating = Math.round(totalScore / (report.skillIndicators.length || 1));

    let phoneNum = student.phone.replace(/[^0-9]/g, '');
    if (phoneNum.startsWith('0')) {
      phoneNum = '62' + phoneNum.substring(1);
    }

    const message = 
`*BINTANG FUTSAL ACADEMY*
*KARAWANG • 13 PERFORMANCE RADAR*
━━━━━━━━━━━━━━━━━━━━
Yth. ${student.parentName},

Berikut laporan performa & evaluasi resmi atlet BFA:
• *Nama Siswa*: ${student.name}
• *ID Siswa*: ${student.id}
• *Kelompok*: ${student.classGroupId} (#${student.jerseyNumber} - ${student.position})
• *Tempat, Tgl Lahir*: ${student.birthPlace || 'Karawang'}, ${formatDateIndo(student.birthDate)}
• *OVR Rating*: *${ovrRating}*
• *Kehadiran*: ${report.attendancePercent || 100}% (${report.totalSessions || 17} Sesi)

*⚽ TEKNIK (SKILLS)*:
- Passing: ${report.skillIndicators.find((i) => i.key === 'pass')?.score ?? 83}
- Ball Control: ${report.skillIndicators.find((i) => i.key === 'ctrl')?.score ?? 81}
- Dribbling: ${report.skillIndicators.find((i) => i.key === 'drib')?.score ?? 84}
- Shooting: ${report.skillIndicators.find((i) => i.key === 'shoot')?.score ?? 80}

*🏃 FISIK & MOTORIK*:
- Stamina: ${report.skillIndicators.find((i) => i.key === 'stamina')?.score ?? 80}
- Kelincahan: ${report.skillIndicators.find((i) => i.key === 'kelincahan')?.score ?? 88}
- Koordinasi: ${report.skillIndicators.find((i) => i.key === 'koordinasi')?.score ?? 88}
- Keseimbangan: ${report.skillIndicators.find((i) => i.key === 'keseimbangan')?.score ?? 84}

*🧠 MENTAL & SIKAP*:
- Percaya Diri: ${report.skillIndicators.find((i) => i.key === 'p_diri')?.score ?? 85}
- Fokus: ${report.skillIndicators.find((i) => i.key === 'fokus')?.score ?? 82}
- Disiplin: ${report.skillIndicators.find((i) => i.key === 'disiplin')?.score ?? 85}
- Kerja Sama: ${report.skillIndicators.find((i) => i.key === 'k_sama')?.score ?? 82}
- Sportivitas: ${report.skillIndicators.find((i) => i.key === 'sportif')?.score ?? 85}

*CATATAN COACHING STAFF*:
"${report.coachNotes}"

Official Performance Report • BFA Karawang
#WeGrowTogether`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodedMessage}`;
    window.open(waUrl, '_blank');
    showToast(`Membuka WhatsApp ke wali ${student.name} (${student.phone})...`, 'success');
  };

  // Parent Payment Success
  const handleParentPaymentSuccess = async (method: string, trxId: string) => {
    const targetStudent = activeParentStudent;
    if (!targetStudent) return;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);
    const paymentMethodName = method === 'QRIS' ? 'QRIS Kasir' : 'Transfer Bank BFA';

    // Find unpaid/partially paid invoices for this child
    const unpaidChildInvoices = invoices.filter(
      (inv) => inv.studentId === targetStudent.id && inv.status !== 'LUNAS'
    );

    let paidTotal = 0;
    for (const inv of unpaidChildInvoices) {
      const remaining = inv.remainingAmount !== undefined 
        ? inv.remainingAmount 
        : inv.amount;
      if (remaining <= 0) continue;

      const paymentId = generateIdempotentPaymentId(inv.id);
      try {
        const result = await processInvoicePaymentTransaction({
          paymentId,
          invoiceId: inv.id,
          amount: remaining,
          paymentMethod: paymentMethodName,
          paymentDate: todayStr,
          staffName: 'Sistem Gateway BFA',
          transactionId: trxId,
          note: `Pembayaran Online: ${targetStudent.name} via ${method}`,
        });

        paidTotal += remaining;
        setInvoices((prev) =>
          prev.map((i) => (i.id === result.invoice.id ? result.invoice : i))
        );
        setCashMutations((prev) => {
          const exists = prev.some((m) => m.id === result.mutation.id);
          return exists ? prev : [result.mutation, ...prev];
        });
      } catch (err) {
        console.warn('Gagal memproses pembayaran anak:', err);
      }
    }

    if (paidTotal > 0) {
      showToast(
        `✓ Pembayaran ananda ${targetStudent.name} sebesar Rp${paidTotal.toLocaleString('id-ID')} berhasil diverifikasi & tagihan LUNAS!`,
        'success'
      );
    } else {
      showToast(
        `Pembayaran ananda ${targetStudent.name} via ${method} terverifikasi.`,
        'success'
      );
    }
  };

  // Camera Capture Handler
  const handleCameraCapture = (dataUrl: string, target: 'photo' | 'kk' | 'akte' | 'kia' | 'ijazah') => {
    setCapturedCameraData({
      dataUrl,
      target,
      timestamp: Date.now(),
    });

    if (target === 'photo') {
      showToast('✓ Foto profil dari live kamera berhasil dipasang ke formulir!', 'success');
    } else {
      showToast(`✓ Dokumen ${target.toUpperCase()} dari live kamera siap disimpan!`, 'success');
    }
  };

  const handleOpenDetail = (st: Student) => {
    setStudentForDetail(st);
    setIsStudentDetailOpen(true);
  };

  const handleEditFromDetail = (st: Student) => {
    setIsStudentDetailOpen(false);
    setStudentToEdit(st);
    setIsStudentFormOpen(true);
  };

  // Archive Student Handler (Safe soft-delete: updates status to Non-Aktif, preserving student doc & all history)
  const handleArchiveStudent = async (student: Student) => {
    const updatedStudent: Student = {
      ...student,
      status: 'Non-Aktif',
    };

    try {
      await saveStudentToFirestore(updatedStudent);

      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? updatedStudent : s))
      );

      try {
        const saved = localStorage.getItem('bfa_students');
        if (saved) {
          const list: Student[] = JSON.parse(saved);
          const next = list.map((s) => (s.id === student.id ? updatedStudent : s));
          localStorage.setItem('bfa_students', JSON.stringify(next));
        }
      } catch {}

      setIsStudentDetailOpen(false);
      showToast(`✓ Siswa ${student.name} (${student.id}) berhasil diarsipkan (Non-Aktif). Seluruh data & histori tetap tersimpan aman.`, 'success');
    } catch (err: any) {
      console.error('[Firestore] Gagal mengarsipkan siswa:', err);
      showToast(`Gagal mengarsipkan siswa: ${err?.message || 'Error koneksi database'}`, 'error');
    }
  };

  // Reactivate Student Handler
  const handleReactivateStudent = async (student: Student) => {
    const updatedStudent: Student = {
      ...student,
      status: 'Aktif',
    };

    try {
      await saveStudentToFirestore(updatedStudent);

      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? updatedStudent : s))
      );

      try {
        const saved = localStorage.getItem('bfa_students');
        if (saved) {
          const list: Student[] = JSON.parse(saved);
          const next = list.map((s) => (s.id === student.id ? updatedStudent : s));
          localStorage.setItem('bfa_students', JSON.stringify(next));
        }
      } catch {}

      setIsStudentDetailOpen(false);
      showToast(`✓ Siswa ${student.name} (${student.id}) berhasil diaktifkan kembali!`, 'success');
    } catch (err: any) {
      console.error('[Firestore] Gagal mengaktifkan kembali siswa:', err);
      showToast(`Gagal mengaktifkan kembali siswa: ${err?.message || 'Error koneksi database'}`, 'error');
    }
  };

  const handleDeleteStudent = (student: Student) => {
    // Audit Tahap 1: Hard delete diblokir. Alur diarahkan ke arsip aman (status: 'Non-Aktif')
    handleArchiveStudent(student);
  };

  const handleResetStudentPassword = (studentId: string, newPass: string) => {
    try {
      const raw = localStorage.getItem('bfa_student_passwords');
      const map = raw ? JSON.parse(raw) : {};
      map[studentId] = newPass;
      localStorage.setItem('bfa_student_passwords', JSON.stringify(map));
    } catch {}

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updated = { ...s, customPassword: newPass };
          saveStudentToFirestore(updated).catch(() => {});
          return updated;
        }
        return s;
      })
    );
  };

  const handleResetAdminPassword = (newPass: string) => {
    try {
      localStorage.setItem('bfa_custom_admin_password', newPass);
    } catch {}
  };

  // Switch active child for multi-student family accounts
  const handleSwitchStudent = (newStudentId: string) => {
    const cleanNewId = newStudentId.trim().toUpperCase();
    const targetStudent = students.find((s) => s.id && s.id.trim().toUpperCase() === cleanNewId);
    if (!targetStudent) {
      showToast('Data ananda tidak ditemukan.', 'error');
      return;
    }

    // Security check: Must belong to the same parent phone number
    if (activeParentStudent?.phone && isValidIndonesianMobile(activeParentStudent.phone)) {
      if (!isExactPhoneMatch(targetStudent.phone, activeParentStudent.phone)) {
        showToast('Akses ditolak: Siswa ini bukan bagian dari akun keluarga Anda.', 'error');
        return;
      }
    }

    const updatedUser: AuthUser = {
      ...currentUser!,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      name: targetStudent.parentName || currentUser!.name,
      emailOrPhone: targetStudent.phone,
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('bfa_auth_user', JSON.stringify(updatedUser));
    } catch {}
    showToast(`✓ Berhasil beralih ke portal ananda ${targetStudent.name} (${targetStudent.id}).`, 'success');
  };

  // If user is not logged in, render the Dedicated Login Page!
  if (!currentUser) {
    return (
      <>
        <LoginPage
          students={students}
          onLogin={handleLogin}
          onShowToast={showToast}
          onOpenRegister={handleOpenAddStudent}
          prefilledIdentifier={registeredStudentId}
          onResetStudentPassword={handleResetStudentPassword}
          onResetAdminPassword={handleResetAdminPassword}
          cloudSyncStatus={cloudSyncStatus}
        />

        <StudentFormModal
          isOpen={isStudentFormOpen}
          editStudent={null}
          nextStudentId={candidateNextId || getNextStudentId(students)}
          onClose={() => setIsStudentFormOpen(false)}
          onSubmit={handleRegisterNewMemberFromLogin}
          onOpenLiveCamera={(target) => {
            setCameraTarget(target);
            setIsCameraOpen(true);
          }}
          capturedItem={capturedCameraData}
        />

        <CameraModal
          isOpen={isCameraOpen}
          target={cameraTarget}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
        />

        <StudentBarcodeModal
          isOpen={isNewStudentBarcodeOpen}
          student={newlyRegisteredStudent}
          isNewRegistration={true}
          onClose={() => {
            setIsNewStudentBarcodeOpen(false);
          }}
        />

        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header - Role is locked without free switcher button */}
      <Header
        role={role}
        currentUser={currentUser}
        onLogoClick={() => handleNavigate(role === 'admin' ? 'dashboard' : 'parent-dashboard')}
        onLogout={handleLogout}
        parentSiblings={parentSiblings}
        onSwitchStudent={handleSwitchStudent}
        activeStudentId={activeParentStudent?.id}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar & Mobile Bottom Nav */}
        <Sidebar
          role={role}
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          onOpenRecordCash={() => setIsRecordCashOpen(true)}
          onOpenFingerprint={() => setIsFingerprintOpen(true)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 pb-20 md:pb-6 min-w-0">
          {role === 'admin' && (
            <>
              {currentRoute === 'dashboard' && (
                <AdminDashboardView
                  students={students}
                  cashMutations={cashMutations}
                  invoices={invoices}
                  attendances={attendances}
                  schedules={schedules}
                  onNavigate={handleNavigate}
                  onOpenRecordCash={() => setIsRecordCashOpen(true)}
                  onOpenFingerprint={() => setIsFingerprintOpen(true)}
                  onGenerateInvoices={handleGenerateMonthlyInvoices}
                  onOpenCreateSchedule={handleOpenAddSchedule}
                  onEditSchedule={handleOpenEditSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                  onViewParentDashboard={() => {
                    setRole('parent');
                    setCurrentRoute('parent-dashboard');
                  }}
                  cloudSyncStatus={cloudSyncStatus}
                  onRetrySync={handleManualSyncCloud}
                />
              )}

              {currentRoute === 'students' && (
                <AdminStudentsView
                  students={students}
                  onOpenAddStudent={handleOpenAddStudent}
                  onOpenEditStudent={(st) => {
                    setStudentToEdit(st);
                    setIsStudentFormOpen(true);
                  }}
                  onOpenDetailStudent={handleOpenDetail}
                  onArchiveStudent={handleArchiveStudent}
                  onReactivateStudent={handleReactivateStudent}
                  onDeleteStudent={handleDeleteStudent}
                  cloudSyncStatus={cloudSyncStatus}
                  onRetrySync={handleManualSyncCloud}
                />
              )}

              {currentRoute === 'coaches' && (
                <AdminCoachesView
                  coaches={coaches}
                  onSaveCoach={handleSaveCoach}
                  onToggleCoachStatus={handleToggleCoachStatus}
                  isReadOnlyPreview={!WRITE_ENABLED}
                />
              )}

              {currentRoute === 'keuangan' && (
                <AdminKeuanganView
                  cashMutations={cashMutations}
                  invoices={invoices}
                  onOpenRecordCash={() => setIsRecordCashOpen(true)}
                  onDeleteMutation={handleDeleteMutation}
                  onMarkInvoicePaid={handleMarkInvoicePaid}
                  onProcessPayment={handleProcessPayment}
                  onCancelInvoicePayment={handleCancelInvoicePayment}
                  onShowReceipt={(inv) => {
                    setInvoiceForReceipt(inv);
                    setIsReceiptOpen(true);
                  }}
                  onGenerateInvoices={handleGenerateMonthlyInvoices}
                />
              )}

              {currentRoute === 'erapport' && (
                <AdminERapportView
                  students={students}
                  studentReports={studentReports}
                  attendances={attendances}
                  onSaveReportForStudent={handleSaveReportForStudent}
                  onSaveFullReportForStudent={handleSaveFullReportForStudent}
                  onAddNewStudentWithReport={handleAddNewStudentWithReport}
                  onSendWhatsApp={handleSendWhatsAppForStudent}
                  onOpenEditReportForStudent={handleOpenEditReportForStudent}
                  onShowToast={showToast}
                  isParentView={false}
                />
              )}

              {currentRoute === 'attendance' && (
                <AdminAttendanceView
                  attendances={attendances}
                  students={students}
                  schedules={schedules}
                  onOpenFingerprint={() => setIsFingerprintOpen(true)}
                  onOpenCreateSchedule={handleOpenAddSchedule}
                  onEditSchedule={handleOpenEditSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                  onQuickMarkAttendance={handleQuickMarkAttendance}
                  onDeleteAttendance={handleDeleteAttendance}
                />
              )}

              {currentRoute === 'fingerprint' && (
                <AdminFingerprintView
                  onOpenFingerprint={() => setIsFingerprintOpen(true)}
                  onShowToast={showToast}
                />
              )}

              {currentRoute === 'invoices' && (
                <AdminInvoicesView
                  invoices={invoices}
                  onGenerateInvoices={handleGenerateMonthlyInvoices}
                  onMarkInvoicePaid={handleMarkInvoicePaid}
                  onProcessPayment={handleProcessPayment}
                  onCancelInvoicePayment={handleCancelInvoicePayment}
                  onShowReceipt={(inv) => {
                    setInvoiceForReceipt(inv);
                    setIsReceiptOpen(true);
                  }}
                  onDeleteInvoice={handleDeleteInvoice}
                />
              )}
            </>
          )}

          {role === 'parent' && (
            <>
              {!activeParentStudent ? (
                <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-rose-200 shadow-md text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold shadow-xs">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Data Siswa Tidak Ditemukan
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sistem tidak menemukan data atlet resmi yang terhubung dengan akun Anda ({currentUser?.emailOrPhone || currentUser?.studentId || 'Wali'}). Demi perlindungan privasi, sistem tidak menampilkan data siswa lain.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 px-4 bg-[#0F274E] hover:bg-blue-950 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar & Login Kembali</span>
                  </button>
                </div>
              ) : (
                <>
                  {currentRoute === 'parent-dashboard' && (
                    <ParentDashboardView
                      student={activeParentStudent}
                      allStudents={students}
                      invoices={invoices}
                      attendances={attendances}
                      schedules={schedules}
                      onNavigate={handleNavigate}
                      onUpdateStudentPhoto={handleUpdateStudentPhoto}
                      onOpenEditStudent={(st) => {
                        setStudentToEdit(st);
                        setIsStudentFormOpen(true);
                      }}
                      onOpenDetailStudent={handleOpenDetail}
                      onSwitchStudent={handleSwitchStudent}
                    />
                  )}

                  {currentRoute === 'parent-attendance' && (
                    <ParentAttendanceView
                      student={activeParentStudent}
                      invoices={invoices}
                      attendances={attendances}
                      schedules={schedules}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {currentRoute === 'parent-payment' && (
                    <ParentPaymentView
                      student={activeParentStudent}
                      invoices={invoices}
                      onNavigate={handleNavigate}
                      onPaymentSuccess={handleParentPaymentSuccess}
                      onShowToast={showToast}
                    />
                  )}

                  {currentRoute === 'parent-payments' && (
                    <ParentPaymentsHistoryView
                      student={activeParentStudent}
                      invoices={invoices}
                      onNavigate={handleNavigate}
                      onShowReceipt={(inv) => {
                        setInvoiceForReceipt(inv);
                        setIsReceiptOpen(true);
                      }}
                    />
                  )}

                  {currentRoute === 'parent-report' && (
                    <AdminERapportView
                      students={students}
                      currentStudentId={activeParentStudent.id}
                      studentReports={studentReports}
                      attendances={attendances}
                      onSaveReportForStudent={handleSaveReportForStudent}
                      onSendWhatsApp={handleSendWhatsAppForStudent}
                      onOpenEditReportForStudent={handleOpenEditReportForStudent}
                      onShowToast={showToast}
                      isParentView={true}
                    />
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <RecordCashModal
        isOpen={isRecordCashOpen}
        onClose={() => setIsRecordCashOpen(false)}
        onSubmit={handleAddCashMutation}
      />

      <FingerprintModal
        isOpen={isFingerprintOpen}
        students={students}
        schedules={schedules}
        onClose={() => setIsFingerprintOpen(false)}
        onSubmit={handleFingerprintSubmit}
      />

      <StudentFormModal
        isOpen={isStudentFormOpen}
        editStudent={studentToEdit}
        nextStudentId={candidateNextId || getNextStudentId(students)}
        onClose={() => {
          setIsStudentFormOpen(false);
          setStudentToEdit(null);
        }}
        onSubmit={handleSaveStudent}
        onOpenLiveCamera={(target) => {
          setCameraTarget(target);
          setIsCameraOpen(true);
        }}
        capturedItem={capturedCameraData}
        isParentRole={role === 'parent'}
      />

      <StudentDetailModal
        isOpen={isStudentDetailOpen}
        student={studentForDetail}
        skillIndicators={
          studentForDetail
            ? studentReports[studentForDetail.id]?.skillIndicators || INITIAL_SKILL_INDICATORS
            : INITIAL_SKILL_INDICATORS
        }
        invoices={invoices}
        attendances={attendances}
        onClose={() => setIsStudentDetailOpen(false)}
        onEdit={handleEditFromDetail}
        onArchive={role === 'admin' ? handleArchiveStudent : undefined}
        onReactivate={role === 'admin' ? handleReactivateStudent : undefined}
        onDelete={role === 'admin' ? handleDeleteStudent : undefined}
      />

      <EditReportModal
        isOpen={isEditReportOpen}
        studentName={editingReportStudent?.name}
        studentId={editingReportStudent?.id}
        initialIndicators={editingReportIndicators}
        initialNotes={editingReportNotes}
        initialEvaluationDate={
          editingReportStudent ? studentReports[editingReportStudent.id]?.evaluationDate : undefined
        }
        initialAttendancePercent={
          editingReportStudent ? studentReports[editingReportStudent.id]?.attendancePercent : 0
        }
        initialTotalSessions={
          editingReportStudent ? studentReports[editingReportStudent.id]?.totalSessions : 0
        }
        onClose={() => setIsEditReportOpen(false)}
        onSubmit={(inds, nts, evalDate, attPercent, totSessions) => {
          if (editingReportStudent) {
            handleSaveReportForStudent(
              editingReportStudent.id,
              inds,
              nts,
              evalDate,
              attPercent,
              totSessions
            );
          }
        }}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        invoice={invoiceForReceipt}
        onClose={() => setIsReceiptOpen(false)}
      />

      <CameraModal
        isOpen={isCameraOpen}
        target={cameraTarget}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <GenerateInvoiceModal
        isOpen={isGenerateInvoiceModalOpen}
        students={students}
        onClose={() => setIsGenerateInvoiceModalOpen(false)}
        onConfirm={handleConfirmGenerateInvoices}
      />

      <CreateScheduleModal
        isOpen={isCreateScheduleOpen}
        scheduleToEdit={scheduleToEdit}
        onClose={() => {
          setIsCreateScheduleOpen(false);
          setScheduleToEdit(null);
        }}
        onSubmit={handleSaveSchedule}
        coaches={coaches}
      />

      {/* Newly Registered Student Barcode Pass Modal */}
      <StudentBarcodeModal
        isOpen={isNewStudentBarcodeOpen}
        student={newlyRegisteredStudent}
        isNewRegistration={true}
        onClose={() => {
          setIsNewStudentBarcodeOpen(false);
          setNewlyRegisteredStudent(null);
        }}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
