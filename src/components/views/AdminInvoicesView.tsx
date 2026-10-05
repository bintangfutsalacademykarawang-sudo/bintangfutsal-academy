import React, { useState, useMemo, useEffect } from 'react';
import { Invoice } from '../../types';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { 
  CreditCard, 
  Plus, 
  Receipt, 
  CheckCircle, 
  Download, 
  FileSpreadsheet, 
  Trash2, 
  AlertTriangle,
  Search,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { exportInvoicesExcel, exportInvoicesPDF } from '../../utils/exportHelpers';
import { getDynamicInvoiceStatus, getInvoicePaymentSummary } from '../../utils/financeHelpers';
import { InvoicePaymentModal, PaymentSubmitData } from '../modals/InvoicePaymentModal';
import { fetchInvoicesPage } from '../../firebase';

interface AdminInvoicesViewProps {
  invoices: Invoice[];
  onGenerateInvoices: () => void;
  onMarkInvoicePaid: (id: string) => void;
  onProcessPayment?: (data: PaymentSubmitData) => Promise<void> | void;
  onShowReceipt: (invoice: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
}

export const AdminInvoicesView: React.FC<AdminInvoicesViewProps> = ({
  invoices: propInvoices,
  onGenerateInvoices,
  onMarkInvoicePaid,
  onProcessPayment,
  onShowReceipt,
  onDeleteInvoice,
}) => {
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>(() => propInvoices || []);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'LUNAS' | 'SEBAGIAN' | 'BELUM BAYAR' | 'MENUNGGAK'>('Semua');
  const [search, setSearch] = useState<string>('');

  // Synchronize with incoming props (newly created or updated invoices)
  useEffect(() => {
    if (propInvoices && propInvoices.length > 0) {
      setLocalInvoices((prev) => {
        if (prev.length === 0) return propInvoices;
        const map = new Map<string, Invoice>();
        prev.forEach((inv) => map.set(inv.id, inv));
        propInvoices.forEach((inv) => {
          map.set(inv.id, inv);
        });
        return Array.from(map.values()).sort(
          (a, b) => (b.dueDate || '').localeCompare(a.dueDate || '')
        );
      });
    }
  }, [propInvoices]);

  // Initial fetch if no invoices provided via props
  useEffect(() => {
    let isCancelled = false;
    if (localInvoices.length === 0) {
      fetchInvoicesPage({ cursor: null, pageSize: 50 })
        .then((res) => {
          if (!isCancelled) {
            setLocalInvoices(res.items);
            setCursor(res.lastDoc);
            setHasMore(res.hasMore);
          }
        })
        .catch((err) => {
          console.warn('Initial fetch invoices page notice:', err);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, []);

  // User-demand pagination for next 50 invoices
  const handleLoadMoreInvoices = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetchInvoicesPage({
        cursor: cursor,
        pageSize: 50,
      });

      // Deduplicate with Map
      setLocalInvoices((prev) => {
        const map = new Map<string, Invoice>();
        prev.forEach((inv) => map.set(inv.id, inv));
        res.items.forEach((inv) => map.set(inv.id, inv));
        return Array.from(map.values()).sort(
          (a, b) => (b.dueDate || '').localeCompare(a.dueDate || '')
        );
      });

      setCursor(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to load more invoices:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const summary = useMemo(() => getInvoicePaymentSummary(localInvoices), [localInvoices]);

  const filteredInvoices = useMemo(() => {
    return localInvoices.filter((inv) => {
      const dynStatus = getDynamicInvoiceStatus(inv);
      const matchStatus = statusFilter === 'Semua' || dynStatus === statusFilter;
      const matchSearch =
        (inv.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.studentId || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.type || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.period || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.id || '').toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [localInvoices, statusFilter, search]);

  const handlePaymentSubmit = async (data: PaymentSubmitData) => {
    if (onProcessPayment) {
      await onProcessPayment(data);
    } else {
      onMarkInvoicePaid(data.invoiceId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
            BFA STUDENT BILLING & RECEIVABLES
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
            Sistem Tagihan & Iuran Siswa
          </h1>
          <p className="text-xs text-slate-500">
            Riwayat tagihan SPP bulanan, uang pendaftaran, dan iuran kehadiran siswa tersimpan persisten.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {localInvoices.length > 0 && (
            <>
              <button
                onClick={() => exportInvoicesExcel(localInvoices)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
                title="Download Tagihan format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Unduh Excel</span>
              </button>

              <button
                onClick={() => exportInvoicesPDF(localInvoices)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
                title="Download Tagihan format PDF"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Unduh PDF</span>
              </button>
            </>
          )}

          <button
            onClick={onGenerateInvoices}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-blue-900/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Generate Tagihan SPP Bulanan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Dynamic Calculations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Tagihan Terbit</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
              Rp{summary.totalBilled.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{localInvoices.length} tagihan termuat</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sudah Terbayar</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono tabular-nums">
              Rp{summary.totalPaid.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              {summary.countLunas} lunas • {summary.countSebagian} cicilan
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sisa Piutang</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono tabular-nums">
              Rp{summary.totalUnpaid.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
              {summary.countBelumBayar} belum bayar
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Menunggak</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-rose-900 font-mono tabular-nums">
              {summary.countMenunggak} Tagihan
            </div>
            <p className="text-[10px] text-rose-700 font-semibold mt-0.5">
              Melewati jatuh tempo
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['Semua', 'LUNAS', 'SEBAGIAN', 'BELUM BAYAR', 'MENUNGGAK'] as const).map((st) => {
            let count = localInvoices.length;
            if (st === 'LUNAS') count = summary.countLunas;
            else if (st === 'SEBAGIAN') count = summary.countSebagian;
            else if (st === 'BELUM BAYAR') count = summary.countBelumBayar;
            else if (st === 'MENUNGGAK') count = summary.countMenunggak;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === st
                    ? st === 'MENUNGGAK'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black'
                      : st === 'LUNAS'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-black'
                      : 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari siswa / nomor invoice / jenis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Siswa</th>
                <th className="px-4 py-3.5">Jenis Tagihan</th>
                <th className="px-4 py-3.5">Jatuh Tempo</th>
                <th className="px-4 py-3.5 text-right">Total Tagihan</th>
                <th className="px-4 py-3.5 text-right">Sudah Dibayar</th>
                <th className="px-4 py-3.5 text-right">Sisa Tagihan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data tagihan yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const dynamicStatus = getDynamicInvoiceStatus(inv);
                  const isFullyPaid = dynamicStatus === 'LUNAS';
                  const totalAmt = Number(inv.amount) || 0;
                  const paidAmt = inv.paidAmount !== undefined 
                    ? Number(inv.paidAmount) || 0 
                    : (isFullyPaid ? totalAmt : 0);
                  const remAmt = inv.remainingAmount !== undefined 
                    ? Math.max(0, Number(inv.remainingAmount) || 0) 
                    : Math.max(0, totalAmt - paidAmt);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{inv.studentName}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {inv.studentId} • {inv.classGroupId}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-800 font-semibold">
                        <span>{inv.type}</span>
                        <span className="block text-[10px] text-slate-500 font-normal">{inv.period}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                        {inv.dueDate || '-'}
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900 font-mono whitespace-nowrap tabular-nums text-sm text-right">
                        Rp{totalAmt.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700 font-mono whitespace-nowrap tabular-nums text-right">
                        Rp{paidAmt.toLocaleString('id-ID')}
                      </td>
                      <td className={`px-4 py-3 font-black font-mono whitespace-nowrap tabular-nums text-right ${
                        remAmt > 0 ? 'text-rose-700' : 'text-slate-400'
                      }`}>
                        Rp{remAmt.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            dynamicStatus === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : dynamicStatus === 'SEBAGIAN'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : dynamicStatus === 'MENUNGGAK'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {dynamicStatus === 'MENUNGGAK' && (
                            <AlertTriangle className="w-3 h-3 text-rose-600 mr-1" />
                          )}
                          {dynamicStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isFullyPaid ? (
                            <button
                              type="button"
                              onClick={() => onShowReceipt(inv)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 inline-flex items-center gap-1 active:scale-95"
                            >
                              <Receipt className="w-3.5 h-3.5 text-blue-700" />
                              <span>Kuitansi</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPayingInvoice(inv)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold active:scale-95 shadow-xs inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{paidAmt > 0 ? 'Bayar Cicilan' : 'Bayar / Lunas'}</span>
                            </button>
                          )}

                          {onDeleteInvoice && !isFullyPaid && (
                            <button
                              type="button"
                              onClick={() => setInvoiceToDelete(inv)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Tagihan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 flex items-center gap-1.5">
            <span>
              Menampilkan <strong className="text-slate-900">{filteredInvoices.length}</strong> dari{' '}
              <strong className="text-slate-900">{localInvoices.length}</strong> tagihan termuat.
            </span>
            {hasMore ? (
              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                Ada tagihan sebelumnya di database
              </span>
            ) : (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                ✓ Seluruh tagihan telah dimuat
              </span>
            )}
          </div>

          <div>
            {hasMore && (
              <button
                onClick={handleLoadMoreInvoices}
                disabled={isLoadingMore}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />}
                <span>{isLoadingMore ? 'Memuat 50 tagihan...' : 'Muat Tagihan Sebelumnya'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Invoice Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl relative border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Hapus Tagihan Siswa?
              </h3>
              <p className="text-xs text-slate-500">
                Data tagihan akan dihapus permanen dari sistem akademi.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Siswa:</span>
                <span className="font-extrabold text-slate-900">{invoiceToDelete.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Jenis:</span>
                <span className="font-bold text-blue-900">{invoiceToDelete.type} ({invoiceToDelete.period})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nominal:</span>
                <span className="font-mono font-black text-slate-900">Rp{(Number(invoiceToDelete.amount) || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className={`font-bold ${invoiceToDelete.status === 'LUNAS' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {invoiceToDelete.status}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-[10px]">
                <span className="text-slate-400 font-mono">ID Tagihan:</span>
                <span className="font-mono text-slate-600">{invoiceToDelete.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteInvoice) {
                    onDeleteInvoice(invoiceToDelete.id);
                  }
                  setInvoiceToDelete(null);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-rose-600/25 active:scale-95 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Payment Modal */}
      <InvoicePaymentModal
        isOpen={Boolean(payingInvoice)}
        invoice={payingInvoice}
        onClose={() => setPayingInvoice(null)}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};
