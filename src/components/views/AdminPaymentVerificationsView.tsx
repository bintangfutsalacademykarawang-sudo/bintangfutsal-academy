import React, { useState, useMemo } from 'react';
import { PaymentVerificationRequest, Invoice } from '../../types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Copy, 
  Check, 
  Smartphone, 
  AlertCircle, 
  Receipt, 
  CreditCard, 
  Calendar, 
  Filter, 
  Loader2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface AdminPaymentVerificationsViewProps {
  verificationRequests: PaymentVerificationRequest[];
  invoices: Invoice[];
  onApprove: (requestId: string, staffName?: string, note?: string) => Promise<void>;
  onReject: (requestId: string, reason: string, staffName?: string) => Promise<void>;
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  adminName?: string;
}

export const AdminPaymentVerificationsView: React.FC<AdminPaymentVerificationsViewProps> = ({
  verificationRequests,
  invoices,
  onApprove,
  onReject,
  onShowToast,
  adminName = 'Admin BFA',
}) => {
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'MENUNGGU_VERIFIKASI' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN_ADMIN'>('MENUNGGU_VERIFIKASI');
  const [search, setSearch] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Modal State
  const [requestToApprove, setRequestToApprove] = useState<PaymentVerificationRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const [requestToReject, setRequestToReject] = useState<PaymentVerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Statistics
  const pendingRequests = useMemo(
    () => verificationRequests.filter((r) => r.status === 'MENUNGGU_VERIFIKASI'),
    [verificationRequests]
  );
  const approvedRequests = useMemo(
    () => verificationRequests.filter((r) => r.status === 'DISETUJUI'),
    [verificationRequests]
  );
  const rejectedRequests = useMemo(
    () => verificationRequests.filter((r) => r.status === 'DITOLAK'),
    [verificationRequests]
  );
  const cancelledRequests = useMemo(
    () => verificationRequests.filter((r) => r.status === 'DIBATALKAN_ADMIN'),
    [verificationRequests]
  );

  const pendingAmount = useMemo(
    () => pendingRequests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    [pendingRequests]
  );

  // Filtered List
  const filteredRequests = useMemo(() => {
    return verificationRequests.filter((r) => {
      const matchStatus = filterStatus === 'Semua' || r.status === filterStatus;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || 
        (r.studentName || '').toLowerCase().includes(q) ||
        (r.studentId || '').toLowerCase().includes(q) ||
        (r.referenceNumber || '').toLowerCase().includes(q) ||
        (r.paymentMethod || '').toLowerCase().includes(q) ||
        (r.invoiceIds || []).some((id) => id.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [verificationRequests, filterStatus, search]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
    onShowToast?.(`✓ Nomor referensi ${text} berhasil disalin!`, 'info');
  };

  const handleConfirmApproval = async () => {
    if (!requestToApprove || isApproving) return;
    setIsApproving(true);
    try {
      await onApprove(requestToApprove.id, adminName, approvalNote.trim());
      onShowToast?.(`✓ Pembayaran ${requestToApprove.referenceNumber} ananda ${requestToApprove.studentName} berhasil diverifikasi! Dana dicatat ke Buku Kas.`, 'success');
      setRequestToApprove(null);
      setApprovalNote('');
    } catch (err: any) {
      console.error('Approval failed:', err);
      onShowToast?.(err?.message || 'Gagal menyetujui pembayaran.', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!requestToReject || isRejecting) return;
    const reason = rejectionReason.trim() || 'Dana transfer belum masuk / bukti pembayaran tidak sesuai.';
    setIsRejecting(true);
    try {
      await onReject(requestToReject.id, reason, adminName);
      onShowToast?.(`Konfirmasi ${requestToReject.referenceNumber} ditolak. Tagihan tetap belum bayar.`, 'warning');
      setRequestToReject(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Rejection failed:', err);
      onShowToast?.(err?.message || 'Gagal menolak konfirmasi.', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenWhatsApp = (req: PaymentVerificationRequest) => {
    const rawPhone = (req.parentPhone || '').replace(/\D/g, '');
    let cleanPhone = rawPhone;
    if (cleanPhone.startsWith('08')) {
      cleanPhone = '628' + cleanPhone.slice(2);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '628' + cleanPhone.slice(1);
    }

    const msg = encodeURIComponent(
      `Halo Bapak/Ibu wali dari ananda *${req.studentName}* (${req.studentId}),\n` +
      `Mengenai konfirmasi pembayaran *${req.referenceNumber}* via *${req.paymentMethod}* sebesar *Rp${(Number(req.amount) || 0).toLocaleString('id-ID')}*.\n\n` +
      `Admin BFA ingin melakukan konfirmasi...`
    );

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Kasir & Verifikasi Keuangan BFA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Verifikasi Pembayaran Orang Tua
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Antrean konfirmasi transfer bank dan QRIS dari portal orang tua. Verifikasi kasir langsung memperbarui status tagihan menjadi <strong>LUNAS</strong> dan mencatat pemasukan ke Buku Kas secara atomik.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs shrink-0 space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">
            Antrean Belum Diproses:
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900 font-mono">
              {pendingRequests.length}
            </span>
            <span className="text-xs font-bold text-amber-700">Permintaan</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-800 block">
            Total Rp{pendingAmount.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Menunggu</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {pendingRequests.length}
          </div>
          <p className="text-[11px] text-slate-500">Perlu dicocokkan dengan mutasi rekening</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Disetujui</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {approvedRequests.length}
          </div>
          <p className="text-[11px] text-slate-500">Tagihan lunas & tercatat di Buku Kas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Ditolak</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {rejectedRequests.length}
          </div>
          <p className="text-[11px] text-slate-500">Konfirmasi tidak valid / dana tak masuk</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Konfirmasi</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">
            {verificationRequests.length}
          </div>
          <p className="text-[11px] text-slate-500">Riwayat konfirmasi orang tua tersimpan</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            {[
              { id: 'MENUNGGU_VERIFIKASI' as const, label: 'Menunggu Verifikasi', count: pendingRequests.length, badgeColor: 'bg-amber-500' },
              { id: 'DISETUJUI' as const, label: 'Disetujui', count: approvedRequests.length, badgeColor: 'bg-emerald-600' },
              { id: 'DITOLAK' as const, label: 'Ditolak', count: rejectedRequests.length, badgeColor: 'bg-rose-600' },
              { id: 'DIBATALKAN_ADMIN' as const, label: 'Dibatalkan Kasir', count: cancelledRequests.length, badgeColor: 'bg-slate-600' },
              { id: 'Semua' as const, label: 'Semua Riwayat', count: verificationRequests.length, badgeColor: 'bg-slate-500' },
            ].map((tab) => {
              const isActive = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] text-white font-mono ${tab.badgeColor}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari siswa, ref, atau ID..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* List of Requests */}
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-slate-900">Tidak Ada Data Konfirmasi</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filterStatus === 'MENUNGGU_VERIFIKASI'
                ? 'Semua konfirmasi pembayaran dari orang tua telah diproses. Tidak ada antrean pending.'
                : 'Tidak ditemukan permintaan verifikasi pembayaran dengan filter saat ini.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isPending = req.status === 'MENUNGGU_VERIFIKASI';
              const isApproved = req.status === 'DISETUJUI';
              const isRejected = req.status === 'DITOLAK';
              const isCancelled = req.status === 'DIBATALKAN_ADMIN';

              return (
                <div
                  key={req.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition space-y-3 ${
                    isPending
                      ? 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-300/60 shadow-xs'
                      : isApproved
                      ? 'bg-white border-slate-200'
                      : isCancelled
                      ? 'bg-slate-50/70 border-slate-300'
                      : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  {/* Top Bar: Reference & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                        <span>{req.referenceNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(req.referenceNumber)}
                          className="hover:text-blue-600 transition"
                          title="Salin No. Referensi"
                        >
                          {copiedRef === req.referenceNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        (req.paymentMethod || '').toLowerCase().includes('tunai')
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black'
                          : req.paymentMethod === 'QRIS'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {(req.paymentMethod || '').toLowerCase().includes('tunai') ? '💵 ' : ''}{req.paymentMethod}
                      </span>

                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Diajukan: {req.submittedAt ? req.submittedAt.slice(0, 16).replace('T', ' ') : '-'}</span>
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span>MENUNGGU VERIFIKASI KASIR</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>DISETUJUI</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5 shadow-2xs">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>DITOLAK</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1.5 shadow-2xs">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
                          <span>DIBATALKAN KASIR</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Column 1: Siswa & Wali */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Siswa & Wali:</span>
                      <p className="font-black text-sm text-blue-950">
                        {req.studentName}
                        <span className="ml-1.5 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                          {req.classGroupId || '-'}
                        </span>
                      </p>
                      <p className="font-mono text-slate-500 text-[11px]">ID Siswa: {req.studentId}</p>
                      {req.parentName && (
                        <p className="text-slate-600 text-[11px]">Wali: {req.parentName}</p>
                      )}
                      {req.parentPhone && (
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(req)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>WA: {req.parentPhone}</span>
                        </button>
                      )}
                    </div>

                    {/* Column 2: Tagihan Terkait */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Rincian Tagihan Terkait ({req.invoiceIds?.length || 0}):
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {req.invoiceDetails && req.invoiceDetails.length > 0 ? (
                          req.invoiceDetails.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] flex justify-between items-center"
                            >
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {item.type} ({item.period})
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {item.id}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-slate-700">
                                Rp{item.amount.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {(req.invoiceIds || []).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Nominal Transfer & Verification Detail */}
                    <div className="space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Nominal Transfer Orang Tua:
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono text-orange-600">
                          Rp{(Number(req.amount) || 0).toLocaleString('id-ID')}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Metode: <strong className="text-slate-800">{req.paymentMethod}</strong>
                        </p>
                      </div>

                      {/* Verification Audit Trail */}
                      {(isApproved || isRejected || isCancelled) && (
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-0.5">
                          {isCancelled ? (
                            <>
                              <p className="text-slate-700 font-bold">
                                Dibatalkan oleh: <strong>{req.cancelledBy || 'Admin BFA'}</strong>
                              </p>
                              <p className="text-slate-400 font-mono text-[10px]">
                                {req.cancelledAt ? req.cancelledAt.slice(0, 19).replace('T', ' ') : '-'}
                              </p>
                              {req.cancellationReason && (
                                <p className="text-slate-600 font-medium pt-1 border-t border-slate-200 mt-1">
                                  Alasan batal: "{req.cancellationReason}"
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-slate-600">
                                Diproses oleh: <strong>{req.verifiedBy || 'Admin BFA'}</strong>
                              </p>
                              <p className="text-slate-400 font-mono text-[10px]">
                                {req.verifiedAt ? req.verifiedAt.slice(0, 19).replace('T', ' ') : '-'}
                              </p>
                              {isRejected && req.rejectionReason && (
                                <p className="text-rose-700 font-medium pt-1 border-t border-slate-200 mt-1">
                                  Alasan tolak: "{req.rejectionReason}"
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  {isPending && (
                    <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-amber-800 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          {(req.paymentMethod || '').toLowerCase().includes('tunai')
                            ? 'Pastikan uang tunai fisik sudah diterima oleh pelatih/petugas BFA di lapangan sebelum menyetujui.'
                            : 'Pastikan mutasi dana sudah masuk ke rekening kasir BFA sebelum menyetujui.'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(req)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chat Wali</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRequestToReject(req);
                            setRejectionReason('');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tolak</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRequestToApprove(req);
                            setApprovalNote('');
                          }}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui Pembayaran</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL APPROVAL CONFIRMATION */}
      {requestToApprove && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Konfirmasi Persetujuan Pembayaran
              </h3>
              <p className="text-xs text-slate-500">
                Persetujuan ini akan secara otomatis memperbarui tagihan menjadi <strong>LUNAS</strong> dan mencatat pemasukan ke Buku Kas.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Referensi:</span>
                <span className="font-mono font-bold text-slate-900">{requestToApprove.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Siswa:</span>
                <span className="font-bold text-slate-900">{requestToApprove.studentName} ({requestToApprove.studentId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal Transfer:</span>
                <span className="font-black font-mono text-emerald-700 text-sm">
                  Rp{(Number(requestToApprove.amount) || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Pembayaran:</span>
                <span className="font-bold text-slate-800">{requestToApprove.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Tagihan:</span>
                <span className="font-bold text-slate-800">{requestToApprove.invoiceIds?.length || 0} Tagihan</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Catatan Kasir / Keterangan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder={
                  (requestToApprove.paymentMethod || '').toLowerCase().includes('tunai')
                    ? 'Contoh: Diterima oleh Coach Hendra di lapangan saat sesi latihan...'
                    : 'Contoh: Dana mutasi BCA terkonfirmasi via kasir...'
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isApproving}
                onClick={() => setRequestToApprove(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isApproving}
                onClick={handleConfirmApproval}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya, Setujui & Catat Kas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REJECTION */}
      {requestToReject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Tolak Konfirmasi Pembayaran
              </h3>
              <p className="text-xs text-slate-500">
                Konfirmasi akan ditandai ditolak. Tagihan siswa tetap <strong>BELUM BAYAR</strong> dan tidak ada mutasi kas yang dicatat.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Referensi:</span>
                <span className="font-mono font-bold text-slate-900">{requestToReject.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Siswa:</span>
                <span className="font-bold text-slate-900">{requestToReject.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-mono font-bold text-slate-900">
                  Rp{(Number(requestToReject.amount) || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Alasan Penolakan:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Mutasi rekening BCA belum ditemukan nominal ini, atau bukti transfer buram..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isRejecting}
                onClick={() => setRequestToReject(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={handleConfirmRejection}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menolak...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Tolak Konfirmasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
