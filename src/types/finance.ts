export interface InvoicePayment {
  id: string; // ID unik payment: 'PAY_...'
  paymentId?: string; // Alias untuk kompatibilitas
  invoiceId: string;
  studentId?: string;
  amount: number; // Nominal pembayaran pada sesi ini
  date: string; // Format YYYY-MM-DD
  time?: string; // Format HH:mm:ss
  method?: 'Tunai' | 'Transfer Bank' | 'QRIS' | 'Manual Verifikasi Admin' | string;
  paymentMethod?: string;
  transactionId?: string; // Nomor bukti transaksi / resi unik
  staff?: string; // Nama admin/sistem yang memverifikasi
  receiptUrl?: string; // Tautan bukti pembayaran jika ada
  note?: string; // Catatan cicilan / keterangan
  mutationId?: string; // MUT_{paymentId}
  createdAt: string; // ISO 8601 Timestamp
}

export interface CashMutation {
  id: string; // Format: 'MUT-YYYYMMDD-HHmmss-XXX' atau 'MUT_' + paymentId
  date: string; // Format YYYY-MM-DD
  time?: string; // Format HH:mm:ss
  type: 'Pemasukan' | 'Pengeluaran';
  category: string;
  note: string;
  method: string;
  amount: number;
  staff: string;
  
  // Integritas data & anti duplikasi
  source?: 'INVOICE_PAYMENT' | 'MANUAL' | 'SYSTEM' | string;
  paymentId?: string; // Terhubung ke invoicePayments
  invoiceId?: string; // Terhubung ke invoice terkait
  idempotencyKey?: string; // Kunci unik penjamin tidak ada pencatatan ganda
  createdAt?: string; // ISO 8601 Timestamp
  updatedAt?: string; // ISO 8601 Timestamp
}

export interface PaymentRecord {
  paymentId: string;
  date: string;
  time: string;
  amount: number;
  method: string;
  transactionId: string;
  staff: string;
  note?: string;
}
