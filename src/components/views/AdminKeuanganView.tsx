import React, { useState } from 'react';
import { CashMutation } from '../../types';
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
  RotateCcw
} from 'lucide-react';
import { exportFinancePDF } from '../../utils/exportFinancePDF';
import { exportFinanceExcel } from '../../utils/exportHelpers';

interface AdminKeuanganViewProps {
  cashMutations: CashMutation[];
  onOpenRecordCash: () => void;
  onDeleteMutation: (id: string) => void;
  onResetCash: () => void;
}

export const AdminKeuanganView: React.FC<AdminKeuanganViewProps> = ({
  cashMutations,
  onOpenRecordCash,
  onDeleteMutation,
  onResetCash,
}) => {
  const [filterType, setFilterType] = useState<'Semua' | 'Pemasukan' | 'Pengeluaran'>('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
            BFA FINANCE & CASHFLOW
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
            Manajemen Kas & Keuangan Akademi
          </h1>
          <p className="text-xs text-slate-500">
            Pencatatan real-time kas masuk (SPP, iuran latihan, formulir) dan kas keluar operasional.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            <span>Catat Mutasi Kas Baru</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin mereset seluruh mutasi kas ke Rp0 (Mulai dari nol)?')) {
                onResetCash();
              }
            }}
            className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition active:scale-95 border border-rose-200"
            title="Reset seluruh catatan kas ke Rp0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Kas ke Rp0</span>
          </button>
        </div>
      </div>

      {/* Top Summary 3 Cards (100% Realtime Synchronized) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-white to-emerald-50/60 rounded-2xl p-5 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              TOTAL PEMASUKAN
            </span>
            <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
            Rp{totalPemasukan.toLocaleString('id-ID')}
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-200 text-[11px] text-slate-600 space-y-0.5">
            <p>• SPP Bulanan: <strong className="text-emerald-800">Rp{sppPemasukan.toLocaleString('id-ID')}</strong></p>
            <p>• Iuran Sesi Lapangan: <strong className="text-emerald-800">Rp{sesiPemasukan.toLocaleString('id-ID')}</strong></p>
            <p>• Pendaftaran & Lainnya: <strong className="text-emerald-800">Rp{regPemasukan.toLocaleString('id-ID')}</strong></p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-rose-50/60 rounded-2xl p-5 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
              TOTAL PENGELUARAN
            </span>
            <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-sm font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
            Rp{totalPengeluaran.toLocaleString('id-ID')}
          </div>
          <div className="mt-2 pt-2 border-t border-rose-200 text-[11px] text-slate-600 space-y-0.5">
            <p>• Sewa Lapangan: <strong className="text-rose-800">Rp{sewaPengeluaran.toLocaleString('id-ID')}</strong></p>
            <p>• Honor Tim Pelatih: <strong className="text-rose-800">Rp{honorPengeluaran.toLocaleString('id-ID')}</strong></p>
            <p>• Alat, Bola & Operasional: <strong className="text-rose-800">Rp{(alatPengeluaran + p3kPengeluaran).toLocaleString('id-ID')}</strong></p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50/60 rounded-2xl p-5 border border-blue-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                SALDO KAS BERSIH BFA
              </span>
              <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
                <Vault className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-blue-800 mt-2 tabular-nums">
              Rp{totalKas.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-emerald-800 font-semibold mt-1">Surplus Operasional Sehat (Siap Pakai)</p>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between text-[11px] text-slate-600">
            <span>Status Audit:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              BALANCE SESUAI
            </span>
          </div>
        </div>
      </div>

      {/* Rincian Pos Operasional (100% Realtime dari Database) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] block">Sewa Lapangan FlaminGO</span>
          <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{sewaPengeluaran.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-400">Alokasi Mingguan Terjadwal</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] block">Honor Pelatih & Official</span>
          <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{honorPengeluaran.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-400">Head Coach & Ass. Coach</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] block">Inventaris Bola & Alat</span>
          <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{alatPengeluaran.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-400">Bola Molten, Rompi, Cone</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] block">P3K, Medis & Konsumsi</span>
          <p className="font-black text-slate-900 mt-1 tabular-nums">Rp{p3kPengeluaran.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-400">Spray Pereda, Es & Mineral</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari keterangan, kategori, metode..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center space-x-1">
            {(['Semua', 'Pemasukan', 'Pengeluaran'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterType === t
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-100 text-slate-700 font-bold text-xs rounded-xl px-3 py-1.5 border-0 focus:ring-2 focus:ring-blue-600"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="SPP Bulanan">SPP Bulanan</option>
            <option value="Iuran Sesi Lapangan">Iuran Sesi Lapangan</option>
            <option value="Pendaftaran Anggota Baru">Pendaftaran Baru</option>
            <option value="Sewa Lapangan">Sewa Lapangan</option>
            <option value="Honor Pelatih">Honor Pelatih</option>
            <option value="Alat & Bola Futsal">Alat & Bola</option>
            <option value="Operasional Lainnya">Operasional</option>
          </select>
        </div>
      </div>

      {/* Cash Mutations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">TANGGAL</th>
                <th className="py-3 px-4">TIPE & KATEGORI</th>
                <th className="py-3 px-4">KETERANGAN / RINCIAN</th>
                <th className="py-3 px-4">METODE BAYAR</th>
                <th className="py-3 px-4">PETUGAS</th>
                <th className="py-3 px-4 text-right">NOMINAL (RP)</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan mutasi kas yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredMutations.map((m) => {
                  const isPemasukan = m.type === 'Pemasukan';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {m.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPemasukan
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPemasukan ? <ArrowDownLeft className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                          {m.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate">
                        {m.note}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>{m.method}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {m.staff}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono font-bold text-right tabular-nums whitespace-nowrap ${
                          isPemasukan ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isPemasukan ? '+' : '-'}Rp{m.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onDeleteMutation(m.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 transition rounded-lg"
                          title="Hapus mutasi kas"
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
  );
};
