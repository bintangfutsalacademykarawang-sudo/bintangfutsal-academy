export type Role = 'admin' | 'parent';

export type RouteId = 
  | 'dashboard'
  | 'students'
  | 'keuangan'
  | 'erapport'
  | 'attendance'
  | 'fingerprint'
  | 'invoices'
  | 'parent-dashboard'
  | 'parent-attendance'
  | 'parent-payment'
  | 'parent-payments'
  | 'parent-report';

export interface StudentDocuments {
  kk?: string;
  akte?: string;
  kia?: string;
  ijazah?: string;
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'L' | 'P';
  parentName: string;
  phone: string;
  classGroupId: string; // e.g. 'U6', 'U8', 'U10', 'U11', 'U12', 'U15', 'U17'
  status: 'Aktif' | 'Non-Aktif';
  joinedDate: string;
  position: 'Flank' | 'Anchor' | 'Pivot' | 'Goalkeeper';
  jerseyNumber: number;
  documents: StudentDocuments;
}

export interface CashMutation {
  id: string;
  date: string;
  type: 'Pemasukan' | 'Pengeluaran';
  category: string;
  note: string;
  method: string;
  amount: number;
  staff: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  classGroupId: string;
  type: 'Bulanan' | 'Latihan';
  period: string;
  attendanceDate?: string;
  amount: number;
  status: 'LUNAS' | 'BELUM BAYAR';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
  paymentMethod?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  classGroupId: string;
  date: string;
  checkInTime: string;
  status: 'HADIR' | 'TIDAK_HADIR';
  feeGenerated: boolean;
}

export interface SkillIndicator {
  key: string;
  name: string;
  shortName: string;
  score: number; // 0 - 100 scale matching 13 Performance Radar
  category: 'Teknik' | 'Fisik' | 'Mental';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

export interface StudentReport {
  studentId: string;
  skillIndicators: SkillIndicator[];
  coachNotes: string;
  evaluationDate: string;
  attendancePercent?: number;
  totalSessions?: number;
}

export interface TrainingSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. 'Jumat, 2 Oktober 2026'
  startTime: string; // e.g. '14:00'
  endTime: string; // e.g. '16:00'
  classGroupId: string; // e.g. 'U10'
  courtName: string; // e.g. 'Bintang Futsal (Lap B)'
  coaches: string[]; // multi-coach selection
  status: 'Akan Datang' | 'Sedang Berjalan' | 'Selesai';
}

export interface AuthUser {
  role: Role;
  name: string;
  emailOrPhone: string;
  studentId?: string;
  studentName?: string;
}
