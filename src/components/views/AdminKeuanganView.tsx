import React, { useState } from 'react';
import { CashMutation, Invoice } from '../../types';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Vault, 
  PlusCircle, 
  Search, 
  Trash2, 
  CreditCard,
  Download, 
  FileSpreadsheet, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Plus,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { exportFinancePDF } from '../../utils/exportFinancePDF';
import { exportFinanceExcel, exportInvoicesExcel, exportInvoicesPDF } from '../../utils/exportHelpers';

interface AdminKeuanganViewProps {
  cashMutations: CashMutation[];
  invoices?: Invoice[];
  onOpenRecordCash: () => void;
  onDeleteMutation: (id: string) => void;
  onResetCash: () => void;
  onMarkInvoicePaid?: (id: string) => void;
  onShowReceipt?: (invoice: Invoice) => void;
  onGenerateInvoices?: () => void;
}

export const AdminKeuanganView: React.FC<AdminKeuanganViewProps> = ({
  cashMutations,
  invoices = [],
  onOpenRecordCash,
  onDeleteMutation,
  onResetCash,
  onMarkInvoicePaid,
  onShowReceipt,
  onGenerateInvoices,
}) => {
  const [activeTab, setActiveTab] = useState<'buku-kas' | 'tagihan-iuran'>('buku-kas');

  // Filter state for Buku Kas
  const [filterType, setFilterType] = useState<'Semua' | 'Pemasukan' | 'Pengeluaran'>('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Filter state for Sinkronisasi Tagihan Iuran
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'Semua' | 'LUNAS' | 'BELUM BAYAR'>('Semua');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Financial metrics 100% Realtime from Recorded Mutations
  const totalPemasukan = cashMutations
    .filter((m) => m.type === 'Pemasukan')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalPengeluaran = cashMutations
    .filter((m) => m.type === 'Pengeluaran')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalKas = totalPemasukan - totalPengeluaran;

  // Realtime Subcategories
  const sppPemasukan = cashMutations
    .filter((m) => m.type === 'Pemasukan' && m.category.toLowerCase().includes('spp'))
    .reduce((acc, c) => acc + c.amount, 0);

  const sesiPemasukan = cashMutations
    .filter((m) => m.type === 'Pemasukan' && m.category.toLowerCase().includes('sesi'))
    .reduce((acc, c) => acc + c.amount, 0);

  const regPemasukan = cashMutations
    .filter((m) => m.type === 'Pemasukan' && !m.category.toLowerCase().includes('spp') && !m.category.toLowerCase().includes('sesi'))
    .reduce((acc, c) => acc + c.amount, 0);

  const sewaPengeluaran = cashMutations
    .filter((m) => m.type === 'Pengeluaran' && m.category.toLowerCase().includes('sewa'))
    .reduce((acc, c) => acc + c.amount, 0);

  const honorPengeluaran = cashMutations
    .filter((m) => m.type === 'Pengeluaran' && m.category.toLowerCase().includes('honor'))
    .reduce((acc, c) => acc + c.amount, 0);

  const alatPengeluaran = cashMutations
    .filter((m) => m.type === 'Pengeluaran' && (m.category.toLowerCase().includes('alat') || m.category.toLowerCase().includes('bola')))
    .reduce((acc, c) => acc + c.amount, 0);

  const p3kPengeluaran = cashMutations
    .filter((m) => m.type === 'Pengeluaran' && !m.category.toLowerCase().includes('sewa') && !m.category.toLowerCase().includes('honor') && !m.category.toLowerCase().includes('alat') && !m.category.toLowerCase().includes('bola'))
    .reduce((acc, c) => acc + c.amount, 0);

  // Synchronized Invoice Metrics (Lunas & Belum Lunas)
  const paidInvoices = invoices.filter((i) => i.status === 'LUNAS');
  const unpaidInvoices = invoices.filter((i) => i.status !== 'LUNAS');
  const paidInvoicesAmount = paidInvoices.reduce((acc, curr) => acc + curr.amount, 0);
  const unpaidInvoicesAmount = unpaidInvoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalInvoicesAmount = paidInvoicesAmount + unpaidInvoicesAmount;

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportFinancePDF(cashMutations, totalPemasukan, totalPengeluaran, totalKas);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredMutations = cashMutations.filter((m) => {
    const matchType = filterType === 'Semua' || m.type === filterType;
    const matchCategory = filterCategory === 'Semua' || m.category === filterCategory;
    const matchSearch =
      m.note.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.method.toLowerCase().includes(search.toLowerCase()) ||
      m.staff.toLowerCase().includes(search.toLowerCase());
    return matchType && matchCategory && matchSearch;
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchStatus = invoiceStatusFilter === 'Semua' || inv.status === invoiceStatusFilter;
    const matchSearch =
      inv.studentName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.studentId.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.type.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.period.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.id.toLowerCase().includes(invoiceSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
            BFA FINANCE & CASHFLOW INTEGRATION
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
            Manajemen Kas & Keuangan Akademi
          </h1>
          <p className="text-xs text-slate-500">
            Sinkronisasi real-time buku kas, iuran latihan lapangan, dan tagihan SPP bulanan siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'buku-kas' ? (
            <>
              <button
                onClick={() => exportFinanceExcel(cashMutations, totalPemasukan, totalPengeluaran, totalKas)}
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
              <button
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin mereset seluruh mutasi kas ke Rp0?')) {
                    onResetCash();
                  }
                }}
                className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition active:scale-95 border border-rose-200"
                title="Reset catatan mutasi kas ke Rp0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Kas</span>
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

      {/* KPI Cards: Synchronized Cash & Invoices Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Kas Riil */}
        <div className="bg-gradient-to-br from-white to-blue-50/70 rounded-2xl p-4 border border-blue-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider">
                SALDO KAS BERSIH
              </span>
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
                <Vault className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-950 mt-1.5 tabular-nums">
              Rp{totalKas.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Saldo riil di tangan / bank</p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-100 text-[10px] text-slate-500 flex justify-between">
            <span>Masuk: Rp{totalPemasukan.toLocaleString('id-ID')}</span>
            <span>Keluar: Rp{totalPengeluaran.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Card 2: Iuran Siswa Lunas */}
        <div className="bg-gradient-to-br from-white to-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
                IURAN SISWA LUNAS
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1.5 tabular-nums">
              Rp{paidInvoicesAmount.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Tercatat lunas dari <strong>{paidInvoices.length}</strong> transaksi siswa
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-100 text-[10px] text-emerald-800 font-bold flex justify-between">
            <span>Status Kas:</span>
            <span>✓ Masuk Pemasukan Kas</span>
          </div>
        </div>

        {/* Card 3: Piutang Iuran Belum Lunas */}
        <div className="bg-gradient-to-br from-white to-rose-50/70 rounded-2xl p-4 border border-rose-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider">
                PIUTANG IURAN BELUM LUNAS
              </span>
              <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1.5 tabular-nums">
              Rp{unpaidInvoicesAmount.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Menunggu pembayaran dari <strong>{unpaidInvoices.length}</strong> tagihan
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-rose-100 text-[10px] text-rose-700 font-bold flex justify-between">
            <span>Status Kas:</span>
            <span>Belum Diterima</span>
          </div>
        </div>

        {/* Card 4: Total Potensi Penerimaan */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                TOTAL NILAI TAGIHAN
              </span>
              <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5 tabular-nums">
              Rp{totalInvoicesAmount.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Total {invoices.length} tagihan iuran diterbitkan
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-600 flex justify-between">
            <span>Persentase Tertagih:</span>
            <span className="font-bold text-slate-900">
              {totalInvoicesAmount > 0 ? Math.round((paidInvoicesAmount / totalInvoicesAmount) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('buku-kas')}
          className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'buku-kas'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Vault className="w-3.5 h-3.5" />
          <span>Buku Kas & Mutasi ({cashMutations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tagihan-iuran')}
          className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'tagihan-iuran'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Sinkronisasi Tagihan Iuran Siswa ({invoices.length})</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </button>
      </div>

      {/* ---------------- TAB 1: BUKU KAS & MUTASI KAS ---------------- */}
      {activeTab === 'buku-kas' && (
        <div className="space-y-4">
          {/* Subcategory breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] block">SPP Bulanan Terkumpul</span>
              <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{sppPemasukan.toLocaleString('id-ID')}</p>
              <span className="text-[10px] text-emerald-600 font-bold">✓ Pemasukan Kas</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] block">Iuran Latihan Terkumpul</span>
              <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{sesiPemasukan.toLocaleString('id-ID')}</p>
              <span className="text-[10px] text-emerald-600 font-bold">✓ Pemasukan Kas</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] block">Sewa Lapangan</span>
              <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{sewaPengeluaran.toLocaleString('id-ID')}</p>
              <span className="text-[10px] text-rose-600 font-bold">Pengeluaran</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] block">Honor Pelatih & Operasional</span>
              <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{(honorPengeluaran + alatPengeluaran + p3kPengeluaran).toLocaleString('id-ID')}</p>
              <span className="text-[10px] text-rose-600 font-bold">Pengeluaran</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                <option value="Pendaftaran & Registrasi">Pendaftaran</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari transaksi / keterangan..."
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
                    <th className="px-4 py-3.5 text-right">Nominal</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Belum ada data mutasi kas tercatat. Klik tombol &quot;Catat Mutasi Kas&quot; untuk menambah transaksi.
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((m) => {
                      const isIncome = m.type === 'Pemasukan';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{m.date}</td>
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
                          <td className="px-4 py-3 text-slate-700 max-w-xs">{m.note}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] border border-slate-200">
                              {m.method}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 font-mono font-black text-right whitespace-nowrap tabular-nums text-sm ${
                              isIncome ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isIncome ? '+' : '-'}Rp{m.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => onDeleteMutation(m.id)}
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
                Sinkronisasi Tagihan Iuran Siswa Terintegrasi Penuh ke Kas
              </p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Setiap kali tagihan berstatus <strong>LUNAS</strong>, nominal pembayaran otomatis tercatat sebagai <strong>Pemasukan Kas</strong>. Tagihan <strong>BELUM BAYAR</strong> tercatat sebagai piutang aktif yang siap ditagih kepada orang tua siswa.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setInvoiceStatusFilter('Semua')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  invoiceStatusFilter === 'Semua' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Semua ({invoices.length})
              </button>
              <button
                onClick={() => setInvoiceStatusFilter('LUNAS')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  invoiceStatusFilter === 'LUNAS' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Lunas ({paidInvoices.length})
              </button>
              <button
                onClick={() => setInvoiceStatusFilter('BELUM BAYAR')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  invoiceStatusFilter === 'BELUM BAYAR' ? 'bg-white text-rose-800 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Belum Bayar ({unpaidInvoices.length})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari siswa / ID invoice / jenis..."
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
                    <th className="px-4 py-3.5">Tanggal Terbit</th>
                    <th className="px-4 py-3.5">Nominal</th>
                    <th className="px-4 py-3.5">Status Tagihan</th>
                    <th className="px-4 py-3.5">Status di Kas</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Belum ada tagihan iuran yang sesuai kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isPaid = inv.status === 'LUNAS';
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">{inv.studentName}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {inv.studentId} • {inv.id}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-800 font-semibold">
                            {inv.type} ({inv.period})
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                            {inv.createdAt}
                          </td>
                          <td className="px-4 py-3 font-black text-slate-900 font-mono whitespace-nowrap tabular-nums text-sm">
                            Rp{inv.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isPaid ? (
                              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Tercatat Masuk Kas</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Piutang Belum Masuk</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {isPaid ? (
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
                              onMarkInvoicePaid && (
                                <button
                                  type="button"
                                  onClick={() => onMarkInvoicePaid(inv.id)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold active:scale-95 shadow-xs inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Tandai Lunas & Masuk Kas</span>
                                </button>
                              )
                            )}
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
    </div>
  );
};
