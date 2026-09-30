import React, { useState } from 'react';
import { CashMutation } from '../../types';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Vault, 
  PlusCircle, 
  Search, 
  Trash2, 
  CreditCard 
} from 'lucide-react';

interface AdminKeuanganViewProps {
  cashMutations: CashMutation[];
  onOpenRecordCash: () => void;
  onDeleteMutation: (id: string) => void;
}

export const AdminKeuanganView: React.FC<AdminKeuanganViewProps> = ({
  cashMutations,
  onOpenRecordCash,
  onDeleteMutation,
}) => {
  const [filterType, setFilterType] = useState<'Semua' | 'Pemasukan' | 'Pengeluaran'>('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [search, setSearch] = useState('');

  const totalPemasukan = cashMutations
    .filter((m) => m.type === 'Pemasukan')
    .reduce((acc, curr) => acc + curr.amount, 0) + 3660000;
  
  const totalPengeluaran = cashMutations
    .filter((m) => m.type === 'Pengeluaran')
    .reduce((acc, curr) => acc + curr.amount, 0) - 250000;

  const totalKas = totalPemasukan - totalPengeluaran;

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
        <button
          onClick={onOpenRecordCash}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-orange-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Catat Mutasi Kas Baru</span>
        </button>
      </div>

      {/* Top Summary 3 Cards */}
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
            <p>• SPP Bulanan: <strong className="text-emerald-800">Rp6.250.000</strong></p>
            <p>• Iuran Sesi Lapangan: <strong className="text-emerald-800">Rp2.000.000</strong></p>
            <p>• Registrasi Anggota Baru: <strong className="text-emerald-800">Rp500.000</strong></p>
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
            <p>• Sewa Lapangan: <strong className="text-rose-800">Rp1.500.000</strong></p>
            <p>• Honor Tim Pelatih: <strong className="text-rose-800">Rp1.100.000</strong></p>
            <p>• Alat, Bola & Medis: <strong className="text-rose-800">Rp650.000</strong></p>
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

      {/* Rincian Pos Operasional */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] block">Sewa Lapangan FlaminGO</span>
          <p className="font-black text-slate-900 mt-1 tabular-nums">Rp1.500.000</p>
          <span className="text-[10px] text-slate-400">Alokasi Mingguan Terjadwal</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] block">Honor Pelatih & Official</span>
          <p className="font-black text-slate-900 mt-1 tabular-nums">Rp1.100.000</p>
          <span className="text-[10px] text-slate-400">Head Coach & Ass. Coach</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] block">Inventaris Bola & Alat</span>
          <p className="font-black text-slate-900 mt-1 tabular-nums">Rp650.000</p>
          <span className="text-[10px] text-slate-400">Bola Molten, Rompi, Cone</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] block">P3K, Medis & Konsumsi</span>
          <p className="font-black text-slate-900 mt-1 tabular-nums">Rp250.000</p>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  filterType === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-100 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none font-medium"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="SPP Bulanan">SPP Bulanan</option>
            <option value="Iuran Sesi Lapangan">Iuran Sesi Lapangan</option>
            <option value="Pendaftaran Anggota Baru">Pendaftaran Baru</option>
            <option value="Sewa Lapangan">Sewa Lapangan</option>
            <option value="Honor Pelatih">Honor Pelatih</option>
            <option value="Alat & Bola Futsal">Alat & Bola</option>
            <option value="Operasional Lainnya">Operasional Lainnya</option>
          </select>
        </div>
      </div>

      {/* Table Mutasi Kas */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Tipe & Kategori</th>
                <th className="px-4 py-3.5">Keterangan / Rincian</th>
                <th className="px-4 py-3.5">Metode Bayar</th>
                <th className="px-4 py-3.5">Petugas</th>
                <th className="px-4 py-3.5 text-right">Nominal (Rp)</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMutations.map((m) => {
                const isIncome = m.type === 'Pemasukan';
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{m.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{m.category}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{m.note}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
                      {m.method}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{m.staff}</td>
                    <td
                      className={`px-4 py-3 text-right font-black font-mono whitespace-nowrap tabular-nums ${
                        isIncome ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isIncome ? '+' : '-'}Rp{m.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onDeleteMutation(m.id)}
                        title="Hapus Mutasi"
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
