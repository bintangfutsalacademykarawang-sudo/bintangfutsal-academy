/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { 
  testFirestoreConnection,
  seedInitialFirestoreDataIfEmpty,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  saveReportToFirestore,
  saveInvoiceToFirestore,
  saveAttendanceToFirestore,
  deleteAttendanceFromFirestore,
  saveScheduleToFirestore,
  deleteScheduleFromFirestore,
  subscribeToStudents,
  subscribeToReports,
  subscribeToInvoices,
  subscribeToAttendances,
  subscribeToSchedules,
  wipeDemoDataFromFirestore,
  wipeAllInvoicesFromFirestore
} from './firebase';

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

  // Application Data States (Persisted in localStorage across page refreshes)
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('bfa_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        const { list } = sanitizeStudentsList(parsed);
        return list;
      }
    } catch {
      // fallback
    }
    return INITIAL_STUDENTS;
  });

  const [cashMutations, setCashMutations] = useState<CashMutation[]>(() => {
    try {
      const resetFlag = localStorage.getItem('bfa_cash_reset_v4');
      if (!resetFlag) {
        localStorage.setItem('bfa_cash_reset_v4', 'true');
        localStorage.setItem('bfa_cash_mutations', JSON.stringify([]));
        return [];
      }
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

  // Automatically persist every update to localStorage so refreshing page keeps all data
  useEffect(() => {
    try { localStorage.setItem('bfa_students', JSON.stringify(students)); } catch (e) { console.error(e); }
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

  // Real-time synchronization with online Firebase Firestore database
  useEffect(() => {
    // 1. Verify Firestore Connection
    testFirestoreConnection().then((connected) => {
      if (connected) {
        console.log('Online Firestore Database Active');
      }
    });

    // 2. Wipe demo September data & clear all previous invoices from online Firestore for clean bookkeeping
    wipeDemoDataFromFirestore().catch((e) => console.warn('Firestore demo wipe error:', e));

    const wipeKey = 'bfa_cloud_invoices_wiped_v10';
    if (!localStorage.getItem(wipeKey)) {
      localStorage.setItem(wipeKey, 'true');
      wipeAllInvoicesFromFirestore().catch((e) => console.warn('Wipe all cloud invoices error:', e));
    }

    // 3. Seed initial clean data if Firestore collections are empty
    seedInitialFirestoreDataIfEmpty(INITIAL_STUDENTS, INITIAL_STUDENT_REPORTS, INITIAL_INVOICES, INITIAL_SCHEDULES);

    // 4. Listen to real-time changes from Firestore
    const unsubStudents = subscribeToStudents((cloudStudents) => {
      if (cloudStudents && cloudStudents.length > 0) {
        const { list: sanitized, changed } = sanitizeStudentsList(cloudStudents);
        setStudents(sanitized);
        if (changed) {
          sanitized.forEach((st) => {
            saveStudentToFirestore(st).catch((e) => console.warn('Firestore student sync:', e));
          });
        }
      }
    });

    const unsubReports = subscribeToReports((cloudReports) => {
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

    const unsubInvoices = subscribeToInvoices((cloudInvoices) => {
      if (cloudInvoices) {
        // Filter out any demo September invoices
        const realInvoices = cloudInvoices.filter(
          (inv) => !inv.id.startsWith('INV-202609') && !inv.period?.includes('September')
        );
        setInvoices(realInvoices);
      }
    });

    const unsubAttendances = subscribeToAttendances((cloudAttendances) => {
      if (cloudAttendances) {
        // Filter out any demo September attendances
        const realAttendances = cloudAttendances.filter(
          (att) => !att.date?.startsWith('2026-09') && !att.id?.startsWith('ATT-202609')
        );
        setAttendances(realAttendances);
      }
    });

    const unsubSchedules = subscribeToSchedules((cloudSchedules) => {
      if (cloudSchedules && cloudSchedules.length > 0) {
        setSchedules(cloudSchedules);
      }
    });

    return () => {
      unsubStudents();
      unsubReports();
      unsubInvoices();
      unsubAttendances();
      unsubSchedules();
    };
  }, []);

  // Auto-heal any student record that has an empty or missing ID
  useEffect(() => {
    const { list, changed } = sanitizeStudentsList(students);
    if (changed) {
      setStudents(list);
      list.forEach((st) => {
        saveStudentToFirestore(st).catch((e) => console.warn('Firestore student sync:', e));
      });
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

  // Auth Handlers
  const handleLogin = (user: AuthUser) => {
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
    try {
      localStorage.removeItem('bfa_auth_user');
      localStorage.removeItem('bfa_current_route');
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

  // Cash Mutation Operations
  const handleAddCashMutation = (mutationData: Omit<CashMutation, 'id'>) => {
    const newId = `MUT-${String(cashMutations.length + 1).padStart(3, '0')}`;
    const newMutation: CashMutation = {
      id: newId,
      ...mutationData,
    };
    setCashMutations((prev) => [newMutation, ...prev]);
    showToast(
      `Transaksi ${newMutation.category} (${newMutation.type}) sebesar Rp${newMutation.amount.toLocaleString('id-ID')} berhasil dicatat!`,
      'success'
    );
  };

  const handleDeleteMutation = (id: string) => {
    const item = cashMutations.find((m) => m.id === id);
    setCashMutations((prev) => prev.filter((m) => m.id !== id));
    showToast(`Mutasi kas ${item?.note || id} berhasil dihapus.`, 'info');
  };

  const handleResetCash = () => {
    setCashMutations([]);
    try {
      localStorage.setItem('bfa_cash_mutations', JSON.stringify([]));
    } catch {}
    showToast('Seluruh data buku kas berhasil direset ke Rp0.', 'info');
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

  // Mark invoice paid manually (Admin & Keuangan live sync)
  const handleMarkInvoicePaid = (id: string) => {
    const targetInv = invoices.find((inv) => inv.id === id);
    if (!targetInv) return;

    let updatedTarget: Invoice | null = null;
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          updatedTarget = {
            ...inv,
            status: 'LUNAS',
            paidAt: new Date().toISOString(),
            transactionId: `BFA-TRX-MANUAL-${Math.floor(100 + Math.random() * 900)}`,
            paymentMethod: 'Manual Verifikasi Admin',
          };
          return updatedTarget;
        }
        return inv;
      })
    );

    if (updatedTarget) {
      saveInvoiceToFirestore(updatedTarget).catch((e) => console.warn('Firestore invoice sync:', e));

      // Otomatis sinkronisasi masuk ke Buku Kas & Keuangan (Pemasukan)
      const newCashMutation: CashMutation = {
        id: `MUT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        type: 'Pemasukan',
        category: targetInv.type === 'Bulanan' ? 'SPP Bulanan' : 'Iuran Sesi Lapangan',
        amount: targetInv.amount,
        note: `Pembayaran ${targetInv.type} (${targetInv.period}) - ${targetInv.studentName} [${targetInv.id}]`,
        method: 'Tunai / Transfer',
        staff: currentUser?.name || 'Admin BFA',
      };

      setCashMutations((prev) => {
        const next = [newCashMutation, ...prev];
        try {
          localStorage.setItem('bfa_cash_mutations', JSON.stringify(next));
        } catch {}
        return next;
      });

      showToast(
        `Invoice ${id} (${targetInv.studentName}) LUNAS & Rp${targetInv.amount.toLocaleString('id-ID')} otomatis tercatat masuk ke Kas!`,
        'success'
      );
    }
  };

  // Wipe all invoices for clean real bookkeeping
  const handleClearAllInvoices = async () => {
    setInvoices([]);
    try {
      localStorage.setItem('bfa_invoices', JSON.stringify([]));
    } catch {}
    await wipeAllInvoicesFromFirestore();
    showToast('Seluruh data tagihan iuran berhasil dihapus bersih (Rp0). Siap untuk pembukuan riil!', 'success');
  };

  // Student Form Submit (Add or Edit)
  const handleSaveStudent = (data: Omit<Student, 'id' | 'joinedDate'> & { id?: string }) => {
    const isExisting = Boolean(data.id && students.some((s) => s.id === data.id));
    if (isExisting && data.id) {
      // Edit
      const updatedStudent: Student = {
        ...(students.find((s) => s.id === data.id) || {}),
        ...data,
        id: data.id,
      } as Student;
      setStudents((prev) =>
        prev.map((s) => (s.id === data.id ? updatedStudent : s))
      );
      saveStudentToFirestore(updatedStudent).catch((e) => console.warn('Firestore student sync:', e));
      showToast(`Data siswa ${data.name} (${data.id}) berhasil diperbarui & tersimpan online!`, 'success');
    } else {
      // Add - Generate next sequential ID based on all existing students' IDs
      const nextId = (data.id && data.id.trim() !== '') ? data.id : getNextStudentId(students);
      const { id: _ignore, ...studentPayload } = data;
      const newStudent: Student = {
        ...studentPayload,
        id: nextId,
        joinedDate: '2026-09-26',
      } as Student;
      setStudents((prev) => [newStudent, ...prev]);

      // Initialize default report for newly added student
      const defaultRep = createDefaultReport(nextId, newStudent.name, newStudent.position);
      setStudentReports((prev) => ({
        ...prev,
        [nextId]: defaultRep,
      }));

      saveStudentToFirestore(newStudent).catch((e) => console.warn('Firestore student sync:', e));
      saveReportToFirestore(nextId, defaultRep).catch((e) => console.warn('Firestore report sync:', e));

      // Automatically trigger the official Athlete Barcode Pass modal for new registration
      setNewlyRegisteredStudent(newStudent);
      setIsNewStudentBarcodeOpen(true);

      showToast(
        `Siswa baru ${newStudent.name} (${nextId} - ${newStudent.classGroupId}) berhasil didaftarkan & kartu barcode resmi otomatis diterbitkan!`,
        'success'
      );
    }
  };

  // Register New Member from Login Page (Auto ID, Auto Save, Direct redirect to Admin Data Siswa)
  const handleRegisterNewMemberFromLogin = (data: Omit<Student, 'id' | 'joinedDate'> & { id?: string }) => {
    const nextId = (data.id && data.id.trim() !== '') ? data.id : getNextStudentId(students);
    const { id: _ignore, ...studentPayload } = data;
    const newStudent: Student = {
      ...studentPayload,
      id: nextId,
      joinedDate: new Date().toISOString().split('T')[0],
    } as Student;

    setStudents((prev) => [newStudent, ...prev]);
    try {
      localStorage.setItem('bfa_students', JSON.stringify([newStudent, ...students]));
    } catch {}

    // Initialize e-rapport for new athlete
    const defaultRep = createDefaultReport(nextId, newStudent.name, newStudent.position);
    setStudentReports((prev) => ({
      ...prev,
      [nextId]: defaultRep,
    }));

    saveStudentToFirestore(newStudent).catch((e) => console.warn('Firestore student sync:', e));
    saveReportToFirestore(nextId, defaultRep).catch((e) => console.warn('Firestore report sync:', e));

    setIsStudentFormOpen(false);

    // Tetap di menu login untuk melakukan login menggunakan ID yang sudah terdaftar
    setNewlyRegisteredStudent(newStudent);
    setIsNewStudentBarcodeOpen(true);
    setRegisteredStudentId(nextId);

    showToast(
      `✓ Registrasi Siswa Baru Berhasil! ID Siswa Anda adalah ${nextId}. Silakan masuk menggunakan ID Siswa ini di form login.`,
      'success'
    );
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

  // Add new student AND immediately create their E-Rapport
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
    const nextId = (studentData.id && studentData.id.trim() !== '') ? studentData.id : getNextStudentId(students);
    const { id: _ignore, ...studentPayload } = studentData;
    const newStudent: Student = {
      ...studentPayload,
      id: nextId,
      joinedDate: '2026-09-26',
    } as Student;

    const newRep: StudentReport = {
      studentId: nextId,
      skillIndicators: reportData.indicators,
      coachNotes: reportData.notes,
      evaluationDate: reportData.evaluationDate,
      attendancePercent: reportData.attendancePercent,
      totalSessions: reportData.totalSessions,
    };

    setStudents((prev) => [newStudent, ...prev]);

    setStudentReports((prev) => ({
      ...prev,
      [nextId]: newRep,
    }));

    saveStudentToFirestore(newStudent).catch((e) => console.warn('Firestore student sync:', e));
    saveReportToFirestore(nextId, newRep).catch((e) => console.warn('Firestore report sync:', e));

    showToast(
      `✓ Siswa baru ${newStudent.name} (${nextId}) & E-Rapport berhasil disimpan online!`,
      'success'
    );
    return nextId;
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
  const handleParentPaymentSuccess = (method: string, trxId: string) => {
    const targetStudent = activeParentStudent;
    const nowIso = new Date().toISOString();
    let paidTotal = 0;
    const updatedInvoicesToSync: Invoice[] = [];

    setInvoices((prev) => {
      return prev.map((inv) => {
        const isTargetChild =
          (targetStudent?.id && inv.studentId === targetStudent.id) ||
          inv.studentName === targetStudent.name;

        if (isTargetChild && inv.status === 'BELUM BAYAR') {
          paidTotal += inv.amount;
          const paidInv: Invoice = {
            ...inv,
            status: 'LUNAS',
            paidAt: nowIso,
            transactionId: trxId,
            paymentMethod: method === 'QRIS' ? 'QRIS' : 'Transfer Bank',
          };
          updatedInvoicesToSync.push(paidInv);
          return paidInv;
        }
        return inv;
      });
    });

    if (paidTotal === 0) {
      paidTotal = 15000;
    }

    const newMut: CashMutation = {
      id: `MUT-${String(cashMutations.length + 1).padStart(3, '0')}`,
      date: nowIso.slice(0, 10),
      type: 'Pemasukan',
      category: 'Iuran Sesi Lapangan',
      note: `Pembayaran Online: ${targetStudent.name} via ${method}`,
      method: method === 'QRIS' ? 'QRIS Kasir' : 'Transfer Bank BFA',
      amount: paidTotal,
      staff: 'Sistem Gateway BFA',
    };
    setCashMutations((prev) => [newMut, ...prev]);

    // Real-time Firestore sync
    updatedInvoicesToSync.forEach((inv) => {
      saveInvoiceToFirestore(inv).catch((e) => console.warn('Firestore invoice sync:', e));
    });

    showToast(
      `✓ Pembayaran ananda ${targetStudent.name} sebesar Rp${paidTotal.toLocaleString('id-ID')} berhasil diverifikasi & tagihan otomatis LUNAS!`,
      'success'
    );
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

  const handleDeleteStudent = (student: Student) => {
    // 1. Remove from students list
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== student.id);
      try {
        localStorage.setItem('bfa_students', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Remove associated e-rapport report
    setStudentReports((prev) => {
      const copy = { ...prev };
      delete copy[student.id];
      try {
        localStorage.setItem('bfa_student_reports', JSON.stringify(copy));
      } catch {}
      return copy;
    });

    // 3. Remove custom password if stored
    try {
      const raw = localStorage.getItem('bfa_student_passwords');
      if (raw) {
        const map = JSON.parse(raw);
        delete map[student.id];
        localStorage.setItem('bfa_student_passwords', JSON.stringify(map));
      }
    } catch {}

    // 4. Remove from online Firestore database
    deleteStudentFromFirestore(student.id).catch((e) =>
      console.warn('Firestore student delete error:', e)
    );

    // 5. Close detail modal if open
    setIsStudentDetailOpen(false);

    showToast(`✓ Data siswa ${student.name} (${student.id}) berhasil dihapus.`, 'success');
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

  // Find active student for current parent session
  const activeParentStudent = currentUser?.studentId
    ? (students.find((s) => s.id === currentUser.studentId) || students[0])
    : students[0];

  // If user is not logged in, render the Dedicated Login Page!
  if (!currentUser) {
    return (
      <>
        <LoginPage
          students={students}
          onLogin={handleLogin}
          onShowToast={showToast}
          onOpenRegister={() => {
            setStudentToEdit(null);
            setIsStudentFormOpen(true);
          }}
          prefilledIdentifier={registeredStudentId}
          onResetStudentPassword={handleResetStudentPassword}
          onResetAdminPassword={handleResetAdminPassword}
        />

        <StudentFormModal
          isOpen={isStudentFormOpen}
          editStudent={null}
          nextStudentId={getNextStudentId(students)}
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
                />
              )}

              {currentRoute === 'students' && (
                <AdminStudentsView
                  students={students}
                  onOpenAddStudent={() => {
                    setStudentToEdit(null);
                    setIsStudentFormOpen(true);
                  }}
                  onOpenEditStudent={(st) => {
                    setStudentToEdit(st);
                    setIsStudentFormOpen(true);
                  }}
                  onOpenDetailStudent={handleOpenDetail}
                  onDeleteStudent={handleDeleteStudent}
                />
              )}

              {currentRoute === 'keuangan' && (
                <AdminKeuanganView
                  cashMutations={cashMutations}
                  invoices={invoices}
                  onOpenRecordCash={() => setIsRecordCashOpen(true)}
                  onDeleteMutation={handleDeleteMutation}
                  onResetCash={handleResetCash}
                  onMarkInvoicePaid={handleMarkInvoicePaid}
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
                  onShowReceipt={(inv) => {
                    setInvoiceForReceipt(inv);
                    setIsReceiptOpen(true);
                  }}
                  onClearAllInvoices={handleClearAllInvoices}
                />
              )}
            </>
          )}

          {role === 'parent' && (
            <>
              {currentRoute === 'parent-dashboard' && (
                <ParentDashboardView
                  student={activeParentStudent}
                  invoices={invoices}
                  attendances={attendances}
                  schedules={schedules}
                  onNavigate={handleNavigate}
                  onUpdateStudentPhoto={handleUpdateStudentPhoto}
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
        nextStudentId={getNextStudentId(students)}
        onClose={() => setIsStudentFormOpen(false)}
        onSubmit={handleSaveStudent}
        onOpenLiveCamera={(target) => {
          setCameraTarget(target);
          setIsCameraOpen(true);
        }}
        capturedItem={capturedCameraData}
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
        onDelete={handleDeleteStudent}
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
