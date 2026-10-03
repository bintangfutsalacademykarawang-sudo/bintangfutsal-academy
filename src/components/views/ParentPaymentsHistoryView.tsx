import React from 'react';
import { RouteId, Invoice, Student } from '../../types';
import { Download, AlertCircle, CheckCircle2, Receipt, ShieldCheck } from 'lucide-react';

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
  const childName = student?.name || 'Siswa BFA';
  const childGroup = student?.classGroupId || '-';

  const childInvoices = student?.id 
    ? invoices.filter((i) => i.studentId === student.id)
    : [];

  const paidInvoices = childInvoices.filter((i) => i.status === 'LUNAS');
  const unpaidInvoices = childInvoices.filter((i) => i.status === 'BELUM BAYAR');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Pembayaran & Kwitansi
          </h1>
          <p className="text-xs text-slate-500">
            Daftar bukti transaksi resmi pembayaran iuran akademi ananda (Periode: Mulai Oktober 2026).
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Siswa:</span>
          <span className="text-sm font-black text-blue-900">{childName}</span>
          <span className="ml-1 text-[10px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-full">
            {childGroup}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Kwitansi Transaksi Resmi (Oktober 2026)</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {paidInvoices.length} Lunas • {unpaidInvoices.length} Belum Bayar
          </span>
        </div>

        {childInvoices.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-black text-xs text-slate-900">Periode Iuran Dimulai Oktober 2026</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Seluruh riwayat tagihan periode Agustus & September telah direset bersih. Bukti pembayaran dan kwitansi resmi akan tercatat di sini setelah Anda melakukan pembayaran iuran Oktober.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {childInvoices.map((inv) => {
              const isPaid = inv.status === 'LUNAS';
              return (
                <div
                  key={inv.id}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {inv.type === 'Bulanan' ? `Iuran SPP (${inv.period})` : `${inv.period} (Kehadiran Tap)`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>ID: {inv.id}</span>
                      {inv.paidAt && <span>• Lunas: {inv.paidAt}</span>}
                      {inv.paymentMethod && <span>• Metode: {inv.paymentMethod}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <span className="font-black font-mono text-sm text-slate-900">
                      Rp{inv.amount.toLocaleString('id-ID')}
                    </span>

                    {isPaid ? (
                      <button
                        onClick={() => onShowReceipt(inv)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Kwitansi</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('parent-payment')}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                      >
                        <span>Bayar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
