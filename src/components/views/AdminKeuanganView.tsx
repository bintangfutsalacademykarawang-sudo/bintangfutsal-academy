import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CashMutation, Invoice } from '../../types';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { 
  Vault, 
  PlusCircle, 
  Search, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  Plus, 
  RefreshCw, 
  Clock,
  Calendar,
  AlertTriangle,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { exportFinancePDF } from '../../utils/exportFinancePDF';
import { exportFinanceExcel, exportInvoicesExcel, exportInvoicesPDF } from '../../utils/exportHelpers';
import { 
  getDynamicInvoiceStatus, 
  calculateFinanceTotals, 
  getInvoicePaymentSummary 
} from '../../utils/financeHelpers';
import { InvoicePaymentModal, PaymentSubmitData } from '../modals/InvoicePaymentModal';
import { 
  fetchCashMutationsPage, 
  subscribeToOperationalCashMutations 
} from '../../firebase';

interface AdminKeuanganViewProps {
  cashMutations: CashMutation[];
  invoices?: Invoice[];
  onOpenRecordCash: () => void;
  onDeleteMutation: (id: string) => void;
  onMarkInvoicePaid?: (id: string) => void;
  onProcessPayment?: (data: PaymentSubmitData) => Promise<void> | void;
  onShowReceipt?: (invoice: Invoice) => void;
  onGenerateInvoices?: () => void;
}

export const AdminKeuanganView: React.FC<AdminKeuanganViewProps> = ({
  cashMutations: propCashMutations,
  invoices = [],
  onOpenRecordCash,
  onDeleteMutation,
  onMarkInvoicePaid,
  onProcessPayment,
  onShowReceipt,
  onGenerateInvoices,
}) => {
  const [activeTab, setActiveTab] = useState<'buku-kas' | 'tagihan-iuran'>('buku-kas');

  // Filter state for Buku Kas
  const [filterType, setFilterType] = useState<'Semua' | 'Pemasukan' | 'Pengeluaran'>('Semua');
  const [filterPeriod, setFilterPeriod] = useState<'Semua' | 'Bulan Ini' | 'Hari Ini' | 'Custom'>('Semua');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Paginated Cash Mutations State
  const [mutations, setMutations] = useState<CashMutation[]>(() => propCashMutations || []);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isFullHistoryLoading, setIsFullHistoryLoading] = useState<boolean>(false);
  const [fullHistoryProgress, setFullHistoryProgress] = useState<number>(0);

  // Filter state for Tagihan Iuran
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'Semua' | 'LUNAS' | 'SEBAGIAN' | 'BELUM BAYAR' | 'MENUNGGAK'>('Semua');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Payment modal state
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  // Synchronization with incoming props for newly inserted records
  useEffect(() => {
    if (propCashMutations && propCashMutations.length > 0) {
      setMutations((prev) => {
        if (prev.length === 0) return propCashMutations;
        const map = new Map<string, CashMutation>();
        // Add existing first
        prev.forEach((m) => map.set(m.id, m));
        // Add props (will not duplicate existing IDs)
        propCashMutations.forEach((m) => {
          if (!map.has(m.id)) {
            map.set(m.id, m);
          }
        });
        return Array.from(map.values()).sort(
          (a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '')
        );
      });
    }
  }, [propCashMutations]);

  // Query & Cursor Lifecycle per Filter
  // When filterPeriod or custom dates change: reset cursor, reset hasMore, and initiate new query
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let isCancelled = false;

    // Reset pagination state whenever filter changes
    setCursor(null);
    setHasMore(false);
    setIsLoadingPage(true);

    if (filterPeriod === 'Hari Ini' || filterPeriod === 'Bulan Ini') {
      // OPERATIONAL REALTIME MODE: Scoped listener for current day or month
      unsub = subscribeToOperationalCashMutations(
        filterPeriod,
        (realtimeList) => {
          if (!isCancelled) {
            setMutations(realtimeList);
            setIsLoadingPage(false);
            setHasMore(false); // operational scope is bounded
            setCursor(null);
          }
        },
        (err) => {
          console.warn(`Realtime cash subscription (${filterPeriod}) notice:`, err?.message);
          if (!isCancelled) {
            setIsLoadingPage(false);
          }
        },
        50
      );
    } else {
      // HISTORICAL PAGINATED MODE: One-time fetch (getDocs) with startAfter cursor
      // For 'Custom', only fetch if both dates are provided or when first entering
      if (filterPeriod === 'Custom' && (!customStartDate || !customEndDate)) {
        setIsLoadingPage(false);
        return;
      }

      fetchCashMutationsPage({
        period: filterPeriod,
        startDate: customStartDate,
        endDate: customEndDate,
        pageSize: 50,
        cursor: null,
      })
        .then((res) => {
          if (!isCancelled) {
            setMutations(res.items);
            setCursor(res.lastDoc);
            setHasMore(res.hasMore);
            setIsLoadingPage(false);
          }
        })
        .catch((err) => {
          console.error('Fetch cash mutations page error:', err);
          if (!isCancelled) {
            setIsLoadingPage(false);
          }
        });
    }

    return () => {
      isCancelled = true;
      if (unsub) unsub();
    };
  }, [filterPeriod, customStartDate, customEndDate]);

  // User-demand pagination: Next 50 records
  const handleLoadNextPage = async () => {
    if (!hasMore || !cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetchCashMutationsPage({
        period: filterPeriod,
        startDate: customStartDate,
        endDate: customEndDate,
        pageSize: 50,
        cursor: cursor,
      });

      // Deduplicate by mutation ID using Map
      setMutations((prev) => {
        const map = new Map<string, CashMutation>();
        prev.forEach((m) => map.set(m.id, m));
        res.items.forEach((m) => map.set(m.id, m));
        return Array.from(map.values()).sort(
          (a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '')
        );
      });

      setCursor(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to load next cash page:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // User-driven sequential pagination to load full history without artificial document limit
  const handleLoadFullHistory = async () => {
    if (isFullHistoryLoading || !hasMore || !cursor) return;
    setIsFullHistoryLoading(true);

    let cur: QueryDocumentSnapshot | null = cursor;
    let more: boolean = hasMore;
    const map = new Map<string, CashMutation>();
    mutations.forEach((m) => map.set(m.id, m));

    let lastProcessedCursorId: string | null = null;

    try {
      while (more && cur) {
        // Anti-infinite-loop guard: pastikan cursor selalu bergerak maju dan tidak stuck pada ID yang sama
        if (lastProcessedCursorId && cur.id === lastProcessedCursorId) {
          console.warn('[Anti-Infinite-Loop] Cursor Firestore tidak berpindah, menghentikan pengambilan riwayat.');
          break;
        }
        lastProcessedCursorId = cur.id;

        const res = await fetchCashMutationsPage({
          period: filterPeriod,
          startDate: customStartDate,
          endDate: customEndDate,
          pageSize: 50,
          cursor: cur,
        });

        // Anti-infinite-loop guard: jika response tidak mengembalikan dokumen
        if (!res.items || res.items.length === 0) {
          more = false;
          break;
        }

        const prevSize = map.size;
        res.items.forEach((m) => map.set(m.id, m));

        // Jika tidak ada data baru yang berhasil ditambahkan dan tidak ada lagi halaman berikutnya
        if (map.size === prevSize && !res.hasMore) {
          more = false;
          break;
        }

        cur = res.lastDoc;
        more = res.hasMore;
        setFullHistoryProgress(map.size);
      }

      const finalSorted = Array.from(map.values()).sort(
        (a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '')
      );
      setMutations(finalSorted);
      setCursor(cur);
      setHasMore(more);
    } catch (err) {
      console.error('Failed to load full cash history:', err);
    } finally {
      setIsFullHistoryLoading(false);
    }
  };

  // Authoritative Balance: Sourced directly from cashMutations
  // SALDO KAS = TOTAL SELURUH PEMASUKAN - TOTAL SELURUH PENGELUARAN
  const { totalPemasukan, totalPengeluaran, totalKas } = useMemo(
    () => calculateFinanceTotals(mutations),
    [mutations]
  );

  // Subcategory calculations
  const sppPemasukan = useMemo(
    () => mutations
      .filter((m) => m.type === 'Pemasukan' && m.category.toLowerCase().includes('spp'))
      .reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
    [mutations]
  );

  const sesiPemasukan = useMemo(
    () => mutations
      .filter((m) => m.type === 'Pemasukan' && m.category.toLowerCase().includes('sesi'))
      .reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
    [mutations]
  );

  const sewaPengeluaran = useMemo(
    () => mutations
      .filter((m) => m.type === 'Pengeluaran' && m.category.toLowerCase().includes('sewa'))
      .reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
    [mutations]
  );

  const honorPengeluaran = useMemo(
    () => mutations
      .filter((m) => m.type === 'Pengeluaran' && (m.category.toLowerCase().includes('honor') || m.category.toLowerCase().includes('gaji')))
      .reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
    [mutations]
  );

  // Invoices Summary with dynamic calculation
  const invoiceSummary = useMemo(
    () => getInvoicePaymentSummary(invoices),
    [invoices]
  );

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportFinancePDF(mutations, totalPemasukan, totalPengeluaran, totalKas);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter mutations by type, category, period, and search query
  const filteredMutations = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentYearMonth = todayStr.substring(0, 7);

    return mutations.filter((m) => {
      const matchType = filterType === 'Semua' || m.type === filterType;
      const matchCategory = filterCategory === 'Semua' || m.category === filterCategory;

      let matchPeriod = true;
      if (filterPeriod === 'Hari Ini') {
        matchPeriod = m.date === todayStr;
      } else if (filterPeriod === 'Bulan Ini') {
        matchPeriod = (m.date || '').startsWith(currentYearMonth);
      } else if (filterPeriod === 'Custom' && customStartDate && customEndDate) {
        matchPeriod = Boolean(m.date && m.date >= customStartDate && m.date <= customEndDate);
      }

      const matchSearch =
        (m.note || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.method || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.staff || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.id || '').toLowerCase().includes(search.toLowerCase());

      return matchType && matchCategory && matchPeriod && matchSearch;
    });
  }, [mutations, filterType, filterCategory, filterPeriod, customStartDate, customEndDate, search]);

  // Filter invoices by dynamic status and search query
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const dynStatus = getDynamicInvoiceStatus(inv);
      const matchStatus = invoiceStatusFilter === 'Semua' || dynStatus === invoiceStatusFilter;
      const matchSearch =
        (inv.studentName || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        (inv.studentId || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        (inv.type || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        (inv.period || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        (inv.id || '').toLowerCase().includes(invoiceSearch.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [invoices, invoiceStatusFilter, invoiceSearch]);

  const handlePaymentSubmit = async (data: PaymentSubmitData) => {
    if (onProcessPayment) {
      await onProcessPayment(data);
    } else if (onMarkInvoicePaid) {
      onMarkInvoicePaid(data.invoiceId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
            BFA PERSISTENT FINANCE & CASHFLOW
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
            Buku Kas & Manajemen Keuangan
          </h1>
          <p className="text-xs text-slate-500">
            Riwayat pembukuan persisten seumur data. Tidak ada auto-reset harian, bulanan, maupun tahunan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'buku-kas' ? (
            <>
              <button
                onClick={() => exportFinanceExcel(mutations, totalPemasukan, totalPengeluaran, totalKas)}
                className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
                title="Download Rekapitulasi Kas format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Unduh Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{isExporting ? 'Membuat PDF...' : 'Unduh Laporan Kas PDF'}</span>
              </button>
              <button
                onClick={onOpenRecordCash}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-orange-500/20 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Catat Mutasi Kas</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => exportInvoicesExcel(invoices)}
                className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
                title="Download Tagihan format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Unduh Excel Tagihan</span>
              </button>
              <button
                onClick={() => exportInvoicesPDF(invoices)}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
                title="Download Tagihan format PDF"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Unduh PDF Tagihan</span>
              </button>
              {onGenerateInvoices && (
                <button
                  onClick={onGenerateInvoices}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-orange-500/20 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Tagihan SPP</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPI Cards: Authoritative Formula Balance & Invoice Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Kas Riil (Sourced from cashMutations) */}
        <div className="bg-gradient-to-br from-white to-blue-50/70 rounded-2xl p-4 border border-blue-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider">
                {filterPeriod === 'Semua' ? (
                  hasMore ? (
                    <span className="text-amber-800 flex items-center gap-1 font-black">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />
                      SALDO TERHITUNG — DATA BELUM SELURUHNYA DIMUAT
                    </span>
                  ) : (
                    'SALDO KAS BERSIH — SEMUA WAKTU'
                  )
                ) : filterPeriod === 'Bulan Ini' ? (
                  'SALDO KAS — BULAN INI'
                ) : filterPeriod === 'Hari Ini' ? (
                  'SALDO KAS — HARI INI'
                ) : (
                  'SALDO KAS — RENTANG TANGGAL'
                )}
              </span>
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0 ml-1">
                <Vault className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-950 mt-1.5 tabular-nums">
              Rp{totalKas.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] font-medium mt-1">
              {filterPeriod === 'Semua' ? (
                hasMore ? (
                  <span className="text-amber-700 font-semibold block leading-tight">
                    ⚠️ Menampilkan akumulasi dari {mutations.length} transaksi termuat. Muat seluruh riwayat di bawah untuk saldo final.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold block leading-tight">
                    ✓ Seluruh riwayat transaksi ({mutations.length}) termuat. 100% akurat seumur data.
                  </span>
                )
              ) : (
                <span className="text-slate-500 font-medium">Saldo = Total Masuk - Total Keluar</span>
              )}
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-100 text-[10px] text-slate-500 flex justify-between">
            <span>Masuk: Rp{totalPemasukan.toLocaleString('id-ID')}</span>
            <span>Keluar: Rp{totalPengeluaran.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Card 2: Tagihan Iuran Terkumpul (Lunas) */}
        <div className="bg-gradient-to-br from-white to-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider">
                IURAN TERKUMPUL
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-1.5 tabular-nums">
              Rp{invoiceSummary.totalPaid.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              {invoiceSummary.countLunas} tagihan lunas • {invoiceSummary.countSebagian} cicilan
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-100 text-[10px] text-slate-500 flex justify-between">
            <span>Tersinkron ke Kas</span>
            <span>100% Persisten</span>
          </div>
        </div>

        {/* Card 3: Piutang Iuran Aktif (Sisa Belum Bayar) */}
        <div className="bg-gradient-to-br from-white to-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">
                SISA PIUTANG AKTIF
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-950 mt-1.5 tabular-nums">
              Rp{invoiceSummary.totalUnpaid.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
              {invoiceSummary.countBelumBayar} belum bayar • {invoiceSummary.countMenunggak} menunggak
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-100 text-[10px] text-slate-500 flex justify-between">
            <span>Siap ditagih ke wali</span>
            <span>Total: Rp{invoiceSummary.totalBilled.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Card 4: Status Menunggak */}
        <div className="bg-gradient-to-br from-white to-rose-50/70 rounded-2xl p-4 border border-rose-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-rose-900 uppercase tracking-wider">
                TAGIHAN MENUNGGAK
              </span>
              <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-950 mt-1.5 tabular-nums">
              {invoiceSummary.countMenunggak} Tagihan
            </div>
            <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
              Jatuh tempo terlampaui & belum lunas
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-rose-100 text-[10px] text-slate-500 flex justify-between">
            <span>Status Dinamis Realtime</span>
            <span className="font-semibold text-rose-700">Perlu Tindak Lanjut</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-8 text-sm font-bold">
        <button
          onClick={() => setActiveTab('buku-kas')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'buku-kas'
              ? 'border-blue-900 text-blue-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Vault className="w-4 h-4" />
          <span>Buku Kas & Transaksi Keuangan ({mutations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tagihan-iuran')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'tagihan-iuran'
              ? 'border-blue-900 text-blue-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tagihan & Iuran Siswa ({invoices.length})</span>
        </button>
      </div>

      {/* ---------------- TAB 1: BUKU KAS & MUTASI TRANSAKSI ---------------- */}
      {activeTab === 'buku-kas' && (
        <div className="space-y-4">
          {/* Subcategory Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] block">SPP Masuk Kas</span>
              <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{sppPemasukan.toLocaleString('id-ID')}</p>
              <span className="text-[10px] text-emerald-600 font-bold">✓ Pemasukan Kas</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] block">Iuran Sesi Lapangan</span>
              <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{sesiPemasukan.toLocaleString('id-ID')}</p>
              <span className="text-[10px] text-emerald-600 font-bold">✓ Pemasukan Kas</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] block">Sewa Lapangan</span>
              <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{sewaPengeluaran.toLocaleString('id-ID')}</p>
              <span className="text-[10px] text-rose-600 font-bold">Pengeluaran</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] block">Honor Pelatih & Staf</span>
              <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{honorPengeluaran.toLocaleString('id-ID')}</p>
              <span className="text-[10px] text-rose-600 font-bold">Pengeluaran</span>
            </div>
          </div>

          {/* Filter Bar with Period, Type, Category, and Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Type filter */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                {(['Semua', 'Pemasukan', 'Pengeluaran'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filterType === t ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Period filter: Semua Waktu, Bulan Ini, Hari Ini, Rentang Tanggal */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                {(['Semua', 'Bulan Ini', 'Hari Ini', 'Custom'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filterPeriod === p ? 'bg-white text-blue-900 shadow-xs font-black' : 'hover:text-slate-900'
                    }`}
                  >
                    {p === 'Semua' ? 'Semua Waktu' : p === 'Custom' ? 'Pilih Rentang' : p}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Inputs */}
              {filterPeriod === 'Custom' && (
                <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl p-1">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                    title="Tanggal Mulai"
                  />
                  <span className="text-slate-400 font-bold px-0.5">s/d</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                    title="Tanggal Selesai"
                  />
                </div>
              )}

              {/* Category selector */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="SPP Bulanan">SPP Bulanan</option>
                <option value="Iuran Sesi Lapangan">Iuran Sesi Lapangan</option>
                <option value="Sewa Lapangan">Sewa Lapangan</option>
                <option value="Honor Pelatih">Honor Pelatih</option>
                <option value="Peralatan & Bola">Peralatan & Bola</option>
                <option value="Medis & P3K">Medis & P3K</option>
                <option value="Pendaftaran Anggota Baru">Pendaftaran</option>
                <option value="Operasional Lainnya">Operasional Lainnya</option>
              </select>
            </div>

            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Cari transaksi / PIC / catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Mutations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Jenis</th>
                    <th className="px-4 py-3.5">Kategori</th>
                    <th className="px-4 py-3.5">Keterangan Transaksi</th>
                    <th className="px-4 py-3.5">Metode</th>
                    <th className="px-4 py-3.5">Sumber</th>
                    <th className="px-4 py-3.5 text-right">Nominal</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isLoadingPage ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                          <span>Memuat data transaksi...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        Belum ada mutasi kas tercatat pada kriteria filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((m) => {
                      const isIncome = m.type === 'Pemasukan';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                            <span>{m.date}</span>
                            {m.time && <span className="block text-[10px] text-slate-400">{m.time}</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isIncome
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{m.category}</td>
                          <td className="px-4 py-3 text-slate-700 max-w-xs">
                            <span>{m.note}</span>
                            {m.invoiceId && (
                              <span className="block text-[10px] text-blue-600 font-mono">Ref: {m.invoiceId}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] border border-slate-200">
                              {m.method}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {m.source === 'INVOICE_PAYMENT' ? 'Auto Tagihan' : (m.source || 'Manual')}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 font-mono font-black text-right whitespace-nowrap tabular-nums text-sm ${
                              isIncome ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isIncome ? '+' : '-'}Rp{(Number(m.amount) || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus transaksi ${m.note || m.id}?`)) {
                                  onDeleteMutation(m.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus transaksi ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Load All History Controls for Historical Mode */}
            {(filterPeriod === 'Semua' || filterPeriod === 'Custom') && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-600 flex items-center gap-1.5">
                  <span>
                    Menampilkan <strong className="text-slate-900">{filteredMutations.length}</strong> transaksi.
                  </span>
                  {hasMore ? (
                    <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      Ada data historis sebelumnya di database
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      ✓ Seluruh riwayat transaksi telah dimuat
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {hasMore && (
                    <>
                      <button
                        onClick={handleLoadNextPage}
                        disabled={isLoadingMore || isFullHistoryLoading}
                        className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />}
                        <span>{isLoadingMore ? 'Memuat 50 data...' : 'Muat Transaksi Sebelumnya'}</span>
                      </button>

                      <button
                        onClick={handleLoadFullHistory}
                        disabled={isFullHistoryLoading || isLoadingMore}
                        className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isFullHistoryLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
                        <span>
                          {isFullHistoryLoading
                            ? `Memuat riwayat (${fullHistoryProgress} data)...`
                            : 'Muat Seluruh Riwayat Kas untuk Rekap Lengkap'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: SINKRONISASI TAGIHAN IURAN SISWA ---------------- */}
      {activeTab === 'tagihan-iuran' && (
        <div className="space-y-4">
          {/* Synchronized Info Notice */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-blue-950">
                Sistem Tagihan & Pelunasan Atomik Terintegrasi ke Kas
              </p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Setiap pembayaran diverifikasi secara atomik ke database. Riwayat tagihan siswa disimpan persisten tanpa pernah di-reset saat pergantian bulan atau tahun.
              </p>
            </div>
          </div>

          {/* Filter Bar with Dynamic Statuses */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['Semua', 'LUNAS', 'SEBAGIAN', 'BELUM BAYAR', 'MENUNGGAK'] as const).map((st) => {
                let count = invoices.length;
                if (st === 'LUNAS') count = invoiceSummary.countLunas;
                else if (st === 'SEBAGIAN') count = invoiceSummary.countSebagian;
                else if (st === 'BELUM BAYAR') count = invoiceSummary.countBelumBayar;
                else if (st === 'MENUNGGAK') count = invoiceSummary.countMenunggak;

                return (
                  <button
                    key={st}
                    onClick={() => setInvoiceStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      invoiceStatusFilter === st
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
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Synchronized Invoices Table */}
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
                        Belum ada tagihan iuran yang sesuai kriteria filter.
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
                                onShowReceipt && (
                                  <button
                                    type="button"
                                    onClick={() => onShowReceipt(inv)}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 inline-flex items-center gap-1 active:scale-95"
                                  >
                                    <Receipt className="w-3.5 h-3.5 text-blue-700" />
                                    <span>Kuitansi</span>
                                  </button>
                                )
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
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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
