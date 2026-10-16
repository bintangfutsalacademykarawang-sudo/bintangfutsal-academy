export type Role = 'admin' | 'parent';

export type RouteId = 
  | 'dashboard'
  | 'registrations'
  | 'payment-verifications'
  | 'students'
  | 'coaches'
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

export type { Coach } from './types/coach';

export type RegistrationStatus = 'MENUNGGU_VERIFIKASI' | 'DISETUJUI' | 'DITOLAK';

export type PaymentVerificationStatus = 'MENUNGGU_VERIFIKASI' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN_ADMIN';

export interface PaymentVerificationInvoiceItem {
  id: string;
  type: string;
  period: string;
  amount: number;
  remainingAmount: number;
}

export interface PaymentVerificationRequest {
  id: string;
  referenceNumber: string; // e.g. CONF-BFA-123456-789
  studentId: string;
  studentName: string;
  classGroupId: string;
  parentPhone?: string;
  parentName?: string;
  amount: number;
  paymentMethod: 'QRIS' | 'Transfer Bank' | string;
  invoiceIds: string[];
  invoiceDetails?: PaymentVerificationInvoiceItem[];
  status: PaymentVerificationStatus;
  submittedAt: string;
  notes?: string;
  proofUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  cancelledPaymentId?: string;
  processedPaymentIds?: string[];
  processedMutationIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentDocuments {
  kk?: string;
  akte?: string;
  kia?: string;
  ijazah?: string;
}

export interface Student {
  id: string;
  name: string;
  nickname?: string; // Nama Panggilan (digunakan di Kartu Member & panggilan resmi latihan)
  avatar: string;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'L' | 'P';
  parentName: string;
  phone: string;
  classGroupId: string; // e.g. 'U6', 'U8', 'U10', 'U11', 'U12', 'U15', 'U17'
  status: 'Aktif' | 'Non-Aktif';
  joinedDate: string;
  position?: 'Flank' | 'Anchor' | 'Pivot' | 'Goalkeeper' | 'Belum Ditentukan' | string;
  jerseyNumber: number;
  documents: StudentDocuments;
  customPassword?: string;
  registrationStatus?: RegistrationStatus;
  registrationDate?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export type { InvoicePayment, PaymentRecord } from './types/finance';

export interface CashMutation {
  id: string;
  date: string;
  time?: string;
  type: 'Pemasukan' | 'Pengeluaran';
  category: string;
  note: string;
  method: string;
  amount: number;
  staff: string;
  source?: 'INVOICE_PAYMENT' | 'MANUAL' | 'SYSTEM' | string;
  paymentId?: string;
  invoiceId?: string;
  idempotencyKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  classGroupId: string;
  type: 'Bulanan' | 'Latihan' | 'Pendaftaran' | 'Seragam' | 'Turnamen' | 'Lainnya' | string;
  period: string;
  attendanceDate?: string;
  amount: number;
  paidAmount?: number; // Total terbayar kumulatif
  remainingAmount?: number; // Sisa tagihan aktif
  status: 'LUNAS' | 'SEBAGIAN' | 'BELUM BAYAR';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
  paymentMethod?: string;
  payments?: import('./types/finance').InvoicePayment[];
  updatedAt?: string;
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
  notes?: string;
  method?: 'BARCODE' | 'FINGERPRINT' | 'MANUAL';
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
  classGroupId: string; // e.g. 'U10' or 'U10, U11'
  classGroups?: string[]; // multi-KU selection (U3 s/d U40)
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
