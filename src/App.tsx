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
  StudentReport
} from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_CASH_MUTATIONS, 
  INITIAL_INVOICES, 
  INITIAL_ATTENDANCES, 
  INITIAL_SKILL_INDICATORS, 
  INITIAL_STUDENT_REPORTS,
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
import { 
  testFirestoreConnection,
  seedInitialFirestoreDataIfEmpty,
  saveStudentToFirestore,
  saveReportToFirestore,
  saveInvoiceToFirestore,
  subscribeToStudents,
  subscribeToReports,
  subscribeToInvoices
} from './firebase';

export default function App() {
  // Authentication session state (null = show Login Page)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('bfa_auth_user');
      return saved ? JSON.parse(saved) : null;
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
      const saved = localStorage.getItem('bfa_cash_mutations');
      return saved ? JSON.parse(saved) : INITIAL_CASH_MUTATIONS;
    } catch {
      return INITIAL_CASH_MUTATIONS;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('bfa_invoices');
      if (saved) {
        const parsed: Invoice[] = JSON.parse(saved);
        // Ensure any standard initial invoice that is missing is added
        const missing = INITIAL_INVOICES.filter(
          (init) => !parsed.some((p) => p.id === init.id)
        );
        let merged = missing.length > 0 ? [...parsed, ...missing] : parsed;

        // Ensure Bima and Andra have their 12 Sep & 26 Sep invoices synchronized with INITIAL_INVOICES
        merged = merged.map((inv) => {
          const match = INITIAL_INVOICES.find((i) => i.id === inv.id);
          if (match && match.status === 'LUNAS' && inv.status !== 'LUNAS') {
            return {
              ...inv,
              status: 'LUNAS',
              paidAt: match.paidAt,
              transactionId: match.transactionId,
              paymentMethod: match.paymentMethod,
            };
          }
          return inv;
        });

        return merged;
      }
      return INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [attendances, setAttendances] = useState<Attendance[]>(() => {
    try {
      const saved = localStorage.getItem('bfa_attendances');
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCES;
    } catch {
      return INITIAL_ATTENDANCES;
    }
  });

  // Per-student E-Rapport reports (Persisted in localStorage across page refreshes)
  const [studentReports, setStudentReports] = useState<Record<string, StudentReport>>(() => {
    try {
      const saved = localStorage.getItem('bfa_student_reports');
      return saved ? JSON.parse(saved) : INITIAL_STUDENT_REPORTS;
    } catch {
      return INITIAL_STUDENT_REPORTS;
    }
  });

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

    // 2. Seed initial data if Firestore collections are empty
    seedInitialFirestoreDataIfEmpty(INITIAL_STUDENTS, INITIAL_STUDENT_REPORTS, INITIAL_INVOICES);

    // 3. Listen to real-time changes from Firestore
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
        setStudentReports((prev) => ({ ...prev, ...cloudReports }));
      }
    });

    const unsubInvoices = subscribeToInvoices((cloudInvoices) => {
      if (cloudInvoices && cloudInvoices.length > 0) {
        setInvoices(cloudInvoices);
      }
    });

    return () => {
      unsubStudents();
      unsubReports();
      unsubInvoices();
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'photo' | 'kk' | 'akte' | 'kia' | 'ijazah' | null>(null);

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

  // Fingerprint Attendance Logic
  const handleFingerprintSubmit = (
    studentId: string,
    date: string,
    time: string,
    status: 'HADIR' | 'TIDAK_HADIR'
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const existingAtt = attendances.find((a) => a.studentId === studentId && a.date === date);
    if (existingAtt) {
      showToast(`Absensi ${student.name} sudah tercatat pada ${date}.`, 'warning');
      return;
    }

    const newAtt: Attendance = {
      id: `ATT-${date.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      studentId: student.id,
      studentName: student.name,
      classGroupId: student.classGroupId,
      date,
      checkInTime: time,
      status,
      feeGenerated: status === 'HADIR',
    };

    setAttendances((prev) => [newAtt, ...prev]);

    if (status === 'HADIR') {
      const duplicateInvoice = invoices.find(
        (inv) => inv.studentId === studentId && inv.attendanceDate === date && inv.type === 'Latihan'
      );

      if (!duplicateInvoice) {
        const newInvoice: Invoice = {
          id: `INV-${date.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
          studentId: student.id,
          studentName: student.name,
          classGroupId: student.classGroupId,
          type: 'Latihan',
          attendanceDate: date,
          period: `Latihan ${date.split('-')[2]} Sep`,
          amount: 15000,
          status: 'BELUM BAYAR',
          dueDate: date,
          createdAt: `${date.split('-')[2]}/${date.split('-')[1]}/2026`,
        };
        setInvoices((prev) => [newInvoice, ...prev]);

        // Record cash entry
        const newMut: CashMutation = {
          id: `MUT-${String(cashMutations.length + 1).padStart(3, '0')}`,
          date,
          type: 'Pemasukan',
          category: 'Iuran Sesi Lapangan',
          note: `Iuran sesi latihan: ${student.name}`,
          method: 'Tunai Lapangan',
          amount: 15000,
          staff: 'Auto Gate 01',
        };
        setCashMutations((prev) => [newMut, ...prev]);

        showToast(
          `Absensi ${student.name} berhasil & tagihan latihan Rp15.000 otomatis diterbitkan.`,
          'success'
        );
      }
    } else {
      showToast(`Absensi ${student.name} tercatat (TIDAK HADIR). Bebas biaya iuran latihan.`, 'info');
    }
  };

  // Generate Monthly Invoices (SPP Bulanan)
  const handleGenerateMonthlyInvoices = () => {
    let count = 0;
    const period = 'September 2026';
    const newInvoices: Invoice[] = [];

    students.forEach((st) => {
      if (st.status === 'Aktif') {
        const exists = invoices.some(
          (inv) => inv.studentId === st.id && inv.type === 'Bulanan' && inv.period === period
        );
        if (!exists) {
          newInvoices.push({
            id: `INV-20260901-${Math.floor(100 + Math.random() * 900)}`,
            studentId: st.id,
            studentName: st.name,
            classGroupId: st.classGroupId,
            type: 'Bulanan',
            period,
            amount: 50000,
            status: 'BELUM BAYAR',
            dueDate: '2026-09-10',
            createdAt: '01/09/2026',
          });
          count++;
        }
      }
    });

    if (count > 0) {
      setInvoices((prev) => [...newInvoices, ...prev]);
      newInvoices.forEach((inv) => {
        saveInvoiceToFirestore(inv).catch((e) => console.warn('Firestore invoice sync:', e));
      });
      showToast(`Berhasil menerbitkan ${count} invoice SPP Bulanan Rp50.000 (tersimpan online).`, 'success');
    } else {
      showToast('Semua siswa aktif sudah memiliki invoice SPP bulan ini.', 'info');
    }
  };

  // Mark invoice paid manually (Admin)
  const handleMarkInvoicePaid = (id: string) => {
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
    }
    showToast(`Invoice ${id} berhasil ditandai LUNAS (disinkron online).`, 'success');
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

      showToast(
        `Siswa baru ${newStudent.name} (${nextId} - ${newStudent.classGroupId}) berhasil didaftarkan & tersimpan online!`,
        'success'
      );
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

  // Save Report for a specific student
  const handleSaveReportForStudent = (
    studentId: string,
    indicators: SkillIndicator[],
    notes: string
  ) => {
    const updatedRep: StudentReport = {
      studentId,
      skillIndicators: indicators,
      coachNotes: notes,
      evaluationDate: '2026-09-25',
      attendancePercent: studentReports[studentId]?.attendancePercent || 100,
      totalSessions: studentReports[studentId]?.totalSessions || 17,
    };

    setStudentReports((prev) => ({
      ...prev,
      [studentId]: updatedRep,
    }));

    saveReportToFirestore(studentId, updatedRep).catch((e) => console.warn('Firestore report sync:', e));

    const st = students.find((s) => s.id === studentId);
    showToast(`✓ Nilai E-Rapport untuk ${st?.name || studentId} berhasil disimpan online!`, 'success');
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
    const updatedRep: StudentReport = {
      studentId,
      skillIndicators: indicators,
      coachNotes: notes,
      evaluationDate: evaluationDate || '2026-09-25',
      attendancePercent: attendancePercent ?? (studentReports[studentId]?.attendancePercent || 100),
      totalSessions: totalSessions ?? (studentReports[studentId]?.totalSessions || 17),
    };

    setStudentReports((prev) => ({
      ...prev,
      [studentId]: updatedRep,
    }));

    saveReportToFirestore(studentId, updatedRep).catch((e) => console.warn('Firestore report sync:', e));

    const st = students.find((s) => s.id === studentId);
    showToast(`✓ Nilai E-Rapport untuk ${st?.name || studentId} berhasil disimpan online!`, 'success');
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
    if (target === 'photo') {
      showToast('Foto profil dari live kamera berhasil disimpan!', 'success');
    } else {
      showToast(`Dokumen ${target.toUpperCase()} dari live kamera siap disimpan!`, 'success');
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
                  onNavigate={handleNavigate}
                  onOpenRecordCash={() => setIsRecordCashOpen(true)}
                  onOpenFingerprint={() => setIsFingerprintOpen(true)}
                  onGenerateInvoices={handleGenerateMonthlyInvoices}
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
                />
              )}

              {currentRoute === 'keuangan' && (
                <AdminKeuanganView
                  cashMutations={cashMutations}
                  onOpenRecordCash={() => setIsRecordCashOpen(true)}
                  onDeleteMutation={handleDeleteMutation}
                />
              )}

              {currentRoute === 'erapport' && (
                <AdminERapportView
                  students={students}
                  studentReports={studentReports}
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
                  onOpenFingerprint={() => setIsFingerprintOpen(true)}
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
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'parent-attendance' && (
                <ParentAttendanceView
                  student={activeParentStudent}
                  invoices={invoices}
                  attendances={attendances}
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
      />

      <EditReportModal
        isOpen={isEditReportOpen}
        studentName={editingReportStudent?.name}
        initialIndicators={editingReportIndicators}
        initialNotes={editingReportNotes}
        onClose={() => setIsEditReportOpen(false)}
        onSubmit={(inds, nts) => {
          if (editingReportStudent) {
            handleSaveReportForStudent(editingReportStudent.id, inds, nts);
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

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
