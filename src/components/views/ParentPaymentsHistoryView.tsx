import React from 'react';
import { RouteId, Invoice, Student, PaymentVerificationRequest } from '../../types';
import { Download, CheckCircle2, Receipt, ShieldCheck, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { getDynamicInvoiceStatus } from '../../utils/financeHelpers';

interface ParentPaymentsHistoryViewProps {
  student?: Student;
  invoices: Invoice[];
  onNavigate: (route: RouteId) => void;
  onShowReceipt: (invoice: Invoice) => void;
  verificationRequests?: PaymentVerificationRequest[];
}

export const ParentPaymentsHistoryView: React.FC<ParentPaymentsHistoryViewProps> = ({
  student,
  invoices,
  onNavigate,
  onShowReceipt,
  verificationRequests = [],
}) => {
  const childName = student?.name || 'Siswa BFA';
  const childGroup = student?.classGroupId || '-';

  const childInvoices = student?.id 
    ? invoices.filter((i) => i.studentId === student.id)
    : [];

  const paidInvoices = childInvoices.filter((i) => getDynamicInvoiceStatus(i) === 'LUNAS');
  const unpaidInvoices = childInvoices.filter((i) => getDynamicInvoiceStatus(i) !== 'LUNAS');

  const studentVerifications = student?.id
    ? verificationRequests.filter((r) => r.studentId === student.id)
    : [];

  const pendingVerification = studentVerifications.find((r) => r.status === 'MENUNGGU_VERIFIKASI');
  const pendingInvoiceIds = new Set(
    studentVerifications
      .filter((r) => r.status === 'MENUNGGU_VERIFIKASI')
      .flatMap((r) => r.invoiceIds || [])
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Pembayaran & Kuitansi
          </h1>
          <p className="text-xs text-slate-500">
            Daftar bukti transaksi resmi pembayaran iuran akademi ananda tersimpan persisten.
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

      {/* Pending Payment Verification Banner */}
      {pendingVerification && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-black text-amber-950 text-sm flex items-center gap-2">
                <span>Konfirmasi Pembayaran Sedang Diverifikasi Kasir</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Ref: <strong>{pendingVerification.referenceNumber}</strong> • Nominal Rp{(Number(pendingVerification.amount) || 0).toLocaleString('id-ID')} via {pendingVerification.paymentMethod}. Status tagihan akan otomatis Lunas setelah kasir memverifikasi dana masuk.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('parent-payment')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs transition active:scale-95 shrink-0"
          >
            Lihat Rincian
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Kuitansi Transaksi Resmi</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {paidInvoices.length} Lunas • {unpaidInvoices.length} Belum Lunas
          </span>
        </div>

        {childInvoices.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-black text-xs text-slate-900">Belum Ada Tagihan Tercatat</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Bukti pembayaran dan kuitansi resmi akan tercatat secara otomatis di sini setelah Anda melakukan pembayaran iuran atau kehadiran latihan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {childInvoices.map((inv) => {
              const dynamicStatus = getDynamicInvoiceStatus(inv);
              const isPaid = dynamicStatus === 'LUNAS';
              const totalAmt = Number(inv.amount) || 0;
              const paidAmt = inv.paidAmount !== undefined 
                ? Number(inv.paidAmount) || 0 
                : (isPaid ? totalAmt : 0);
              const remainingAmt = inv.remainingAmount !== undefined 
                ? Math.max(0, Number(inv.remainingAmount) || 0) 
                : Math.max(0, totalAmt - paidAmt);

              return (
                <div
                  key={inv.id}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {inv.type === 'Bulanan' ? `Iuran SPP (${inv.period})` : `${inv.period || 'Iuran Latihan'}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dynamicStatus === 'LUNAS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : dynamicStatus === 'SEBAGIAN'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : dynamicStatus === 'MENUNGGAK'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {dynamicStatus === 'MENUNGGAK' && (
                          <AlertTriangle className="w-3 h-3 text-rose-600 inline mr-1" />
                        )}
                        {dynamicStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>ID: {inv.id}</span>
                      {inv.dueDate && <span>• Jatuh Tempo: {inv.dueDate}</span>}
                      {inv.paidAt && <span>• Dibayar: {inv.paidAt.slice(0, 10)}</span>}
                      {inv.paymentMethod && <span>• Metode: {inv.paymentMethod}</span>}
                    </div>

                    {dynamicStatus === 'SEBAGIAN' && (
                      <div className="text-[11px] text-amber-800 font-medium">
                        Telah dibayar: Rp{paidAmt.toLocaleString('id-ID')} • Sisa: Rp{remainingAmt.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div className="text-right">
                      <span className="font-black font-mono text-sm text-slate-900 block">
                        Rp{totalAmt.toLocaleString('id-ID')}
                      </span>
                      {remainingAmt > 0 && remainingAmt !== totalAmt && (
                        <span className="text-[10px] text-rose-600 font-mono block">
                          Sisa: Rp{remainingAmt.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>

                    {isPaid ? (
                      <button
                        onClick={() => onShowReceipt(inv)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Kuitansi</span>
                      </button>
                    ) : pendingInvoiceIds.has(inv.id) ? (
                      <span className="px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Verifikasi</span>
                      </span>
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

      {/* Online Payment Verification History */}
      {studentVerifications.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Riwayat Pengajuan Konfirmasi Pembayaran Online</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {studentVerifications.length} Pengajuan
            </span>
          </div>

          <div className="space-y-3">
            {studentVerifications.map((req) => (
              <div
                key={req.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  req.status === 'MENUNGGU_VERIFIKASI'
                    ? 'bg-amber-50/60 border-amber-200'
                    : req.status === 'DISETUJUI'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : req.status === 'DIBATALKAN_ADMIN'
                    ? 'bg-slate-50/80 border-slate-300'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {req.referenceNumber}
                    </span>
                    <span className="text-slate-500 font-medium">• {req.paymentMethod}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'MENUNGGU_VERIFIKASI'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : req.status === 'DISETUJUI'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : req.status === 'DIBATALKAN_ADMIN'
                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {req.status === 'MENUNGGU_VERIFIKASI'
                        ? 'Menunggu Verifikasi Kasir'
                        : req.status === 'DISETUJUI'
                        ? 'Disetujui ✓'
                        : req.status === 'DIBATALKAN_ADMIN'
                        ? 'Dibatalkan Kasir'
                        : 'Ditolak'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Diajukan pada: {req.submittedAt ? req.submittedAt.slice(0, 16).replace('T', ' ') : '-'}
                    {req.verifiedAt && ` • Diproses: ${req.verifiedAt.slice(0, 16).replace('T', ' ')}`}
                  </p>

                  {req.status === 'DITOLAK' && req.rejectionReason && (
                    <p className="text-[11px] text-rose-700 font-medium">
                      Alasan: {req.rejectionReason}
                    </p>
                  )}

                  {req.status === 'DIBATALKAN_ADMIN' && (
                    <p className="text-[11px] text-slate-600 font-medium">
                      {req.cancellationReason ? `Alasan Pembatalan: "${req.cancellationReason}"` : 'Pembayaran telah dibatalkan oleh Kasir / Admin BFA'}
                      {req.cancelledAt && ` • ${req.cancelledAt.slice(0, 16).replace('T', ' ')}`}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-sm text-slate-900 block">
                    Rp{(Number(req.amount) || 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {req.invoiceIds?.length || 0} Tagihan Terkait
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
