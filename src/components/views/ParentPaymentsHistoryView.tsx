import React from 'react';
import { RouteId, Invoice, Student } from '../../types';
import { Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ParentPaymentsHistoryViewProps {
  student?: Student;
  invoices: Invoice[];
  onNavigate: (route: RouteId) => void;
  onShowReceipt: (invoice: Invoice) => void;
}

export const ParentPaymentsHistoryView: React.FC<ParentPaymentsHistoryViewProps> = ({
  student,
  invoices,
  onNavigate,
  onShowReceipt,
}) => {
  const childName = student?.name || 'Raka';
  const childGroup = student?.classGroupId || 'U12';
  const childInvoices = invoices.filter(
    (i) => (student?.id && i.studentId === student.id) || i.studentName === childName
  );
  const unpaidInvoices = childInvoices.filter((i) => i.status === 'BELUM BAYAR');
  const isAllPaid = unpaidInvoices.length === 0;

  // Build the 5 synchronized payment items matching "Bayar Tagihan" exactly
  // 1. SPP Bulanan September 2026
  const invMonthly = childInvoices.find((i) => i.type === 'Bulanan');
  const isMonthlyPaid = invMonthly ? invMonthly.status === 'LUNAS' : isAllPaid;
  const itemMonthly: Invoice = invMonthly || {
    id: `INV-20260901-${student?.id?.replace('BFA-', '') || '003'}`,
    studentId: student?.id || 'BFA-003',
    studentName: childName,
    classGroupId: childGroup,
    type: 'Bulanan',
    period: 'September 2026',
    amount: 50000,
    status: isMonthlyPaid ? 'LUNAS' : 'BELUM BAYAR',
    dueDate: '2026-09-10',
    createdAt: '01/09/2026',
    paidAt: '01/09/2026 09:30:00',
    transactionId: `BFA-TRX-20260901-${student?.id?.replace('BFA-', '') || '003'}`,
    paymentMethod: 'QRIS',
  };

  // 2. Sesi Latihan 5 Sep
  const inv5 = childInvoices.find(
    (i) => i.attendanceDate === '2026-09-05' || i.period?.includes('5 Sep')
  );
  const is5Paid = inv5 ? inv5.status === 'LUNAS' : isAllPaid;
  const item5: Invoice = inv5 || {
    id: `INV-20260905-${student?.id?.replace('BFA-', '') || '003'}`,
    studentId: student?.id || 'BFA-003',
    studentName: childName,
    classGroupId: childGroup,
    type: 'Latihan',
    attendanceDate: '2026-09-05',
    period: 'Latihan 5 Sep',
    amount: 15000,
    status: is5Paid ? 'LUNAS' : 'BELUM BAYAR',
    dueDate: '2026-09-08',
    createdAt: '05/09/2026',
    paidAt: '05/09/2026 16:30:00',
    transactionId: `BFA-TRX-20260905-${student?.id?.replace('BFA-', '') || '014'}`,
    paymentMethod: 'QRIS',
  };

  // 3. Sesi Latihan 12 Sep
  const inv12 = childInvoices.find(
    (i) => i.attendanceDate === '2026-09-12' || i.period?.includes('12 Sep')
  );
  const is12Paid = inv12 ? inv12.status === 'LUNAS' : isAllPaid;
  const item12: Invoice = inv12 || {
    id: `INV-20260912-${student?.id?.replace('BFA-', '') || '003'}`,
    studentId: student?.id || 'BFA-003',
    studentName: childName,
    classGroupId: childGroup,
    type: 'Latihan',
    attendanceDate: '2026-09-12',
    period: 'Latihan 12 Sep',
    amount: 15000,
    status: is12Paid ? 'LUNAS' : 'BELUM BAYAR',
    dueDate: '2026-09-15',
    createdAt: '12/09/2026',
    paidAt: '12/09/2026 17:15:00',
    transactionId: `BFA-TRX-20260912-${student?.id?.replace('BFA-', '') || '029'}`,
    paymentMethod: 'QRIS',
  };

  // 4. Sesi Latihan 19 Sep (Tidak Hadir • Bebas Iuran)
  const item19: Invoice = {
    id: `INV-20260919-${student?.id?.replace('BFA-', '') || '003'}`,
    studentId: student?.id || 'BFA-003',
    studentName: childName,
    classGroupId: childGroup,
    type: 'Latihan',
    attendanceDate: '2026-09-19',
    period: 'Latihan 19 Sep (Tidak Hadir)',
    amount: 0,
    status: 'LUNAS',
    dueDate: '2026-09-22',
    createdAt: '19/09/2026',
    paidAt: '19/09/2026 14:00:00',
    transactionId: `BFA-TRX-20260919-EXEMPT`,
    paymentMethod: 'Bebas Iuran Siswa',
  };

  // 5. Sesi Latihan 26 Sep
  const inv26 = childInvoices.find(
    (i) => i.attendanceDate === '2026-09-26' || i.period?.includes('26 Sep')
  );
  const is26Paid = inv26 ? inv26.status === 'LUNAS' : isAllPaid;
  const item26: Invoice = inv26 || {
    id: `INV-20260926-${student?.id?.replace('BFA-', '') || '003'}`,
    studentId: student?.id || 'BFA-003',
    studentName: childName,
    classGroupId: childGroup,
    type: 'Latihan',
    attendanceDate: '2026-09-26',
    period: 'Latihan 26 Sep',
    amount: 15000,
    status: is26Paid ? 'LUNAS' : 'BELUM BAYAR',
    dueDate: '2026-09-29',
    createdAt: '26/09/2026',
    paidAt: '26/09/2026 16:45:00',
    transactionId: `BFA-TRX-20260926-${student?.id?.replace('BFA-', '') || '091'}`,
    paymentMethod: 'QRIS',
  };

  const historyItems = [itemMonthly, item5, item12, item19, item26];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Riwayat Pembayaran Siswa
        </h1>
        <p className="text-xs text-slate-500">
          Daftar seluruh transaksi dan unduhan bukti kuitansi digital sah ananda {childName}.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
            September 2026
          </span>
          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            5 Pembayaran Terdata
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {historyItems.map((inv) => {
            const isExempt = inv.amount === 0;
            const isPaid = inv.status === 'LUNAS';
            const cleanTitle =
              inv.type === 'Bulanan'
                ? `Iuran Akademi (SPP ${inv.period})`
                : inv.period?.includes('Tidak Hadir')
                ? 'Latihan 19 Sep (Tidak Hadir)'
                : `${inv.period} (Kehadiran Tap)`;

            return (
              <div key={inv.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-mono text-slate-400 text-[10px]">{inv.createdAt} • #{inv.id}</p>
                  <p className="font-bold text-slate-900">
                    {cleanTitle}
                  </p>
                  <p className={`font-mono font-bold mt-0.5 tabular-nums ${isExempt ? 'text-slate-400' : 'text-slate-700'}`}>
                    Rp{inv.amount.toLocaleString('id-ID')} {isExempt ? '(Bebas Iuran)' : ''}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isExempt
                        ? 'bg-slate-100 text-slate-600 border border-slate-300'
                        : isPaid
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isExempt ? 'BEBAS IURAN' : inv.status}
                  </span>
                  <div>
                    {isPaid ? (
                      <button
                        onClick={() => onShowReceipt(inv)}
                        className="text-[11px] text-blue-700 hover:underline font-bold inline-flex items-center gap-1 active:scale-95"
                      >
                        <Download className="w-3 h-3 text-blue-700" />
                        <span>Kuitansi Digital</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('parent-payment')}
                        className="text-[11px] text-orange-600 hover:underline font-bold inline-flex items-center gap-1 active:scale-95"
                      >
                        <AlertCircle className="w-3 h-3 text-orange-600" />
                        <span>Bayar Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
