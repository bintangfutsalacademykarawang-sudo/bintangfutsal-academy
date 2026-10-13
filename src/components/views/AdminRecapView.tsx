import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Student, Invoice } from '../../types';
import { 
  fetchInvoicesForYear 
} from '../../firebase';
import { 
  MONTH_NAMES_ID,
  buildStudentMonthlySppRecap,
  buildTrainingFeeRecap,
  buildStudentOverdueRecap,
  calculateRecapKpi,
  exportComprehensiveRecapExcel,
  StudentMonthlyRecapRow,
  TrainingSessionRecapItem,
  MonthlyTrainingSummary,
  StudentTrainingSummary,
  StudentOverdueRecap
} from '../../utils/recapHelpers';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Users, 
  CreditCard, 
  Layers, 
  Filter,
  ArrowRight,
  Info
} from 'lucide-react';
import { CURRENT_SYSTEM_YEAR } from '../../data/initialData';

interface AdminRecapViewProps {
  students: Student[];
  currentInvoices?: Invoice[];
}

export const AdminRecapView: React.FC<AdminRecapViewProps> = ({
  students = [],
  currentInvoices = [],
}) => {
  // 1. Filter States
  const [selectedYear, setSelectedYear] = useState<number>(() => CURRENT_SYSTEM_YEAR || new Date().getFullYear());
  const [selectedKu, setSelectedKu] = useState<string>('Semua');
  const [selectedStudentStatus, setSelectedStudentStatus] = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');
  const [activeSubTab, setActiveSubTab] = useState<'spp' | 'latihan' | 'tunggakan'>('spp');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 2. Data On-Demand Fetch State
  const [yearInvoices, setYearInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastLoadedTime, setLastLoadedTime] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);

  // 3. Sub-filter untuk Rekap Latihan (Tampilan Per Bulan vs Per Siswa vs Sesi Individual)
  const [trainingViewMode, setTrainingViewMode] = useState<'per-siswa' | 'per-bulan' | 'detail-sesi'>('per-siswa');

  // Daftar Kelompok Usia Unik
  const availableKus = useMemo(() => {
    const setKu = new Set<string>();
    students.forEach((s) => {
      if (s.classGroupId) setKu.add(s.classGroupId);
    });
    return Array.from(setKu).sort();
  }, [students]);

  // Fungsi Pemuatan Data On-Demand dari Firestore
  const handleLoadRecapData = useCallback(async (yearToLoad: number) => {
    if (isLoading) return; // Mencegah klik ganda

    setIsLoading(true);
    setFetchError(null);

    try {
      // Ambil seluruh invoice tahun bersangkutan langsung dari Firestore dengan pagination ter-batch
      const remoteInvoices = await fetchInvoicesForYear(yearToLoad);

      // Gabungkan dengan invoice lokal terbaru di memori untuk mencegah hilangnya invoice yang baru saja dibuat
      const invMap = new Map<string, Invoice>();
      remoteInvoices.forEach((inv) => invMap.set(inv.id, inv));

      // Jika ada invoice di currentInvoices yang relevan dengan tahun ini, gabungkan secara aman
      currentInvoices.forEach((inv) => {
        const d = inv.attendanceDate || inv.dueDate || '';
        const pYear = (inv.period || '').match(/\b(20\d\d)\b/);
        const matchesYear = d.startsWith(String(yearToLoad)) || (pYear && parseInt(pYear[1], 10) === yearToLoad);
        if (matchesYear && !invMap.has(inv.id)) {
          invMap.set(inv.id, inv);
        }
      });

      const mergedList = Array.from(invMap.values());
      setYearInvoices(mergedList);
      setHasLoadedOnce(true);

      const now = new Date();
      setLastLoadedTime(
        now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (err: any) {
      console.error('Gagal memuat rekap tahunan dari Firestore:', err);
      setFetchError(
        err?.message || 'Gagal memuat rekap dari server. Silakan periksa koneksi dan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentInvoices]);

  // Muat data awal secara otomatis saat komponen pertama kali dipasang
  useEffect(() => {
    if (!hasLoadedOnce) {
      handleLoadRecapData(selectedYear);
    }
  }, [hasLoadedOnce, selectedYear, handleLoadRecapData]);

  // Handler pergantian tahun
  const handleChangeYear = (newYear: number) => {
    setSelectedYear(newYear);
    handleLoadRecapData(newYear);
  };

  // 4. Filter Siswa Berdasarkan KU, Status Siswa, dan Pencarian
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedKu !== 'Semua' && s.classGroupId !== selectedKu) return false;
      if (selectedStudentStatus !== 'Semua' && s.status !== selectedStudentStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        const matchNick = (s.nickname || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchNick) return false;
      }
      return true;
    });
  }, [students, selectedKu, selectedStudentStatus, searchQuery]);

  // 5. Agregasi Data Menggunakan Helper
  const sppRecapRows: StudentMonthlyRecapRow[] = useMemo(() => {
    if (!hasLoadedOnce || fetchError) return [];
    return buildStudentMonthlySppRecap(filteredStudents, yearInvoices, selectedYear);
  }, [filteredStudents, yearInvoices, selectedYear, hasLoadedOnce, fetchError]);

  const trainingRecap = useMemo(() => {
    if (!hasLoadedOnce || fetchError) {
      return {
        sessionItems: [] as TrainingSessionRecapItem[],
        monthlySummaries: [] as MonthlyTrainingSummary[],
        studentSummaries: [] as StudentTrainingSummary[],
      };
    }
    return buildTrainingFeeRecap(filteredStudents, yearInvoices, selectedYear);
  }, [filteredStudents, yearInvoices, selectedYear, hasLoadedOnce, fetchError]);

  const overdueRecapRows: StudentOverdueRecap[] = useMemo(() => {
    if (!hasLoadedOnce || fetchError) return [];
    return buildStudentOverdueRecap(filteredStudents, yearInvoices, selectedYear);
  }, [filteredStudents, yearInvoices, selectedYear, hasLoadedOnce, fetchError]);

  // KPI Eksekutif Ringkasan
  const kpi = useMemo(() => {
    if (!hasLoadedOnce || fetchError) {
      return {
        invoiceCount: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalRemaining: 0,
        totalOverdue: 0,
        studentsWithOverdueCount: 0,
      };
    }
    const typeFilter = activeSubTab === 'spp' ? 'Bulanan' : activeSubTab === 'latihan' ? 'Latihan' : 'Semua';
    return calculateRecapKpi(
      yearInvoices,
      students,
      selectedYear,
      typeFilter,
      selectedKu,
      selectedStudentStatus
    );
  }, [hasLoadedOnce, fetchError, yearInvoices, students, selectedYear, activeSubTab, selectedKu, selectedStudentStatus]);

  // Handler Ekspor Excel Multi-Sheet
  const handleExportExcel = () => {
    if (!hasLoadedOnce || yearInvoices.length === 0) return;
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-');
    exportComprehensiveRecapExcel({
      targetYear: selectedYear,
      kuFilter: selectedKu,
      studentStatusFilter: selectedStudentStatus,
      sppRows: sppRecapRows,
      trainingSessions: trainingRecap.sessionItems,
      studentOverdueRows: overdueRecapRows,
      exportedAt: nowStr,
    });
  };

  return (
    <div className="space-y-6">
      {/* ---------------- 1. PANEL FILTER DAN KONTROL ---------------- */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-900" />
              <span>Rekapitulasi Keuangan & Tunggakan Siswa</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data ditarik secara on-demand langsung dari server untuk cakupan tahun penuh, bebas dari batasan limit query harian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLoadRecapData(selectedYear)}
              disabled={isLoading}
              className="px-3.5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-xs transition active:scale-95"
              title="Muat ulang seluruh data rekap untuk tahun yang dipilih"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Mengambil Data Server...' : 'Muat Rekap'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isLoading || yearInvoices.length === 0}
              className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-xs transition active:scale-95"
              title="Download rekap multi-sheet Excel (SPP, Latihan, Tunggakan)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Ekspor Excel Rekap</span>
            </button>
          </div>
        </div>

        {/* Filter Baris Kedua */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Pilihan Tahun */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tahun Kalender:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => handleChangeYear(parseInt(e.target.value, 10))}
              disabled={isLoading}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  Tahun {y} {y === CURRENT_SYSTEM_YEAR ? '(Tahun Berjalan)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Kelompok Usia */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Kelompok Usia (KU):
            </label>
            <select
              value={selectedKu}
              onChange={(e) => setSelectedKu(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Semua">Semua Kelompok Usia</option>
              {availableKus.map((ku) => (
                <option key={ku} value={ku}>
                  Kelompok {ku}
                </option>
              ))}
            </select>
          </div>

          {/* Status Siswa */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Status Atlet:
            </label>
            <select
              value={selectedStudentStatus}
              onChange={(e) => setSelectedStudentStatus(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Semua">Semua Atlet ({students.length})</option>
              <option value="Aktif">Hanya Atlet Aktif</option>
              <option value="Non-Aktif">Hanya Non-Aktif / Alumni</option>
            </select>
          </div>

          {/* Cari Siswa */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Cari Nama atau ID Siswa:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama siswa atau ID BFA..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Indikator Status & Waktu */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Menampilkan {filteredStudents.length} siswa tersaring &bull; {yearInvoices.length} total invoice dimuat untuk tahun {selectedYear}
            </span>
          </div>
          {lastLoadedTime && (
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Terakhir sinkronisasi server: {lastLoadedTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- 2. ERROR STATE GUARD ---------------- */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Peringatan: Gagal memuat data rekap dari server Firestore</p>
            <p className="text-red-700">{fetchError}</p>
            <button
              onClick={() => handleLoadRecapData(selectedYear)}
              className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition"
            >
              Coba Muat Ulang
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 3. SUMMARY KPI CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Ditagihkan */}
        <div className="bg-gradient-to-br from-white to-blue-50/60 rounded-2xl p-4 border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">
            Total Tagihan Diterbitkan ({selectedYear})
          </span>
          <div className="text-xl font-black text-slate-900 mt-1">
            Rp{kpi.totalBilled.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Dari {kpi.invoiceCount} tagihan {activeSubTab === 'spp' ? 'SPP Bulanan' : activeSubTab === 'latihan' ? 'Iuran Latihan' : 'keseluruhan'}
          </span>
        </div>

        {/* Card 2: Total Terbayar */}
        <div className="bg-gradient-to-br from-white to-emerald-50/60 rounded-2xl p-4 border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
            Total Pembayaran Diterima
          </span>
          <div className="text-xl font-black text-emerald-700 mt-1">
            Rp{kpi.totalPaid.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-emerald-700/80 mt-1 block">
            {kpi.totalBilled > 0
              ? `${Math.round((kpi.totalPaid / kpi.totalBilled) * 100)}% dari target penerimaan`
              : 'Belum ada penerbitan tagihan'}
          </span>
        </div>

        {/* Card 3: Total Sisa Tagihan Aktif */}
        <div className="bg-gradient-to-br from-white to-amber-50/60 rounded-2xl p-4 border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
            Total Sisa Tagihan Aktif
          </span>
          <div className="text-xl font-black text-amber-700 mt-1">
            Rp{kpi.totalRemaining.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Belum lunas (berjalan & menunggak)
          </span>
        </div>

        {/* Card 4: Siswa Menunggak */}
        <div className="bg-gradient-to-br from-white to-rose-50/60 rounded-2xl p-4 border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider block">
            Siswa Memiliki Tunggakan
          </span>
          <div className="text-xl font-black text-rose-700 mt-1">
            {kpi.studentsWithOverdueCount} Siswa
          </div>
          <span className="text-[11px] text-rose-700/80 mt-1 block">
            Tunggakan jatuh tempo: Rp{kpi.totalOverdue.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* ---------------- 4. SUB-TAB NAVIGASI REKAP ---------------- */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('spp')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeSubTab === 'spp'
              ? 'border-blue-900 text-blue-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rekap SPP Bulanan (Jan – Des)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('latihan')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeSubTab === 'latihan'
              ? 'border-blue-900 text-blue-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rekap Iuran Sesi Latihan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tunggakan')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeSubTab === 'tunggakan'
              ? 'border-blue-900 text-blue-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Daftar Tunggakan Siswa ({overdueRecapRows.filter((r) => r.status === 'Menunggak').length})</span>
        </button>
      </div>

      {/* ---------------- 5. KONTEN SUB-TAB 1: REKAP SPP BULANAN ---------------- */}
      {activeSubTab === 'spp' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Matriks Pembayaran SPP Bulanan Tahun {selectedYear}
              </h3>
              <p className="text-[11px] text-slate-500">
                Kolom Januari hingga Desember menampilkan status pembayaran riil dan sisa tagihan per siswa.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>Lunas</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                <span>Cicil/Sebagian</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                <span>Menunggak</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200"></span>
                <span>Belum Diterbitkan / Pra-Gabung</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100/80 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">ID Siswa</th>
                  <th className="py-3 px-3 min-w-[140px]">Nama Siswa</th>
                  <th className="py-3 px-2 text-center">KU</th>
                  {MONTH_NAMES_ID.map((m) => (
                    <th key={m} className="py-3 px-2 text-center min-w-[70px]">
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right">Total Ditagih</th>
                  <th className="py-3 px-3 text-right">Terbayar</th>
                  <th className="py-3 px-3 text-right">Sisa Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sppRecapRows.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="py-12 text-center text-slate-400">
                      Tidak ada data siswa yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  sppRecapRows.map((row, idx) => (
                    <tr key={row.student.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-[11px]">
                        {row.student.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{row.student.name}</div>
                        {row.student.nickname && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({row.student.nickname})
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold rounded text-[10px]">
                          {row.student.classGroupId}
                        </span>
                      </td>

                      {/* 12 Bulan */}
                      {row.cells.map((cell) => {
                        let badgeClass = 'bg-slate-50 text-slate-400';
                        let label = '-';

                        if (cell.status === 'BELUM_BERGABUNG') {
                          badgeClass = 'bg-slate-50 text-slate-300 font-normal italic';
                          label = '-';
                        } else if (cell.status === 'BELUM_DITERBITKAN') {
                          badgeClass = 'bg-slate-100 text-slate-400 font-normal';
                          label = '-';
                        } else if (cell.status === 'LUNAS') {
                          badgeClass = 'bg-emerald-100 text-emerald-800 font-extrabold';
                          label = 'LUNAS';
                        } else if (cell.status === 'SEBAGIAN') {
                          badgeClass = 'bg-amber-100 text-amber-900 font-bold';
                          label = `Cicil (${Math.round((cell.paidAmount / cell.amount) * 100)}%)`;
                        } else if (cell.status === 'MENUNGGAK') {
                          badgeClass = 'bg-rose-100 text-rose-800 font-extrabold';
                          label = 'TUNGGAK';
                        } else if (cell.status === 'BELUM_BAYAR') {
                          badgeClass = 'bg-blue-100 text-blue-900 font-medium';
                          label = 'TAGIHAN';
                        }

                        return (
                          <td key={cell.monthIndex} className="py-2.5 px-1.5 text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] inline-flex items-center space-x-1 ${badgeClass}`}
                                title={`${cell.monthName}: ${cell.status} ${
                                  cell.remainingAmount > 0
                                    ? `- Sisa Rp${cell.remainingAmount.toLocaleString('id-ID')}`
                                    : ''
                                }`}
                              >
                                <span>{label}</span>
                                {cell.hasDuplicate && (
                                  <span
                                    className="text-[9px] bg-rose-600 text-white rounded-full px-1 font-mono font-bold"
                                    title={`Peringatan: Terdapat ${cell.duplicateCount} invoice pada bulan ini!`}
                                  >
                                    !
                                  </span>
                                )}
                              </span>
                              {cell.remainingAmount > 0 && cell.status !== 'BELUM_BERGABUNG' && (
                                <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                                  Rp{(cell.remainingAmount / 1000).toFixed(0)}k
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Baris Siswa */}
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                        Rp{row.totalBilled.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                        Rp{row.totalPaid.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-700">
                        Rp{row.totalRemaining.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Catatan Kaki & Aturan Agregasi */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center space-x-2 font-bold text-slate-700">
              <Info className="w-3.5 h-3.5 text-blue-900" />
              <span>Aturan Agregasi & Integritas Tagihan:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
              <li>Bulan sebelum tanggal resmi bergabung siswa (<code>joinedDate</code>) ditampilkan sebagai strip (-) dan <strong>tidak dihitung sebagai piutang/tunggakan</strong>.</li>
              <li>Tagihan yang belum diterbitkan berstatus <strong>Belum Diterbitkan</strong> dan tidak menambah saldo piutang.</li>
              <li>Jika ditemukan lebih dari 1 tagihan SPP untuk periode yang sama pada satu siswa, sel ditandai tanda seru (!) dan nilai sisa dihitung dari tagihan aktif terbaru agar tidak terjadi penggelembungan utang ganda.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ---------------- 6. KONTEN SUB-TAB 2: REKAP IURAN LATIHAN ---------------- */}
      {activeSubTab === 'latihan' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Rekap Tagihan Iuran Sesi Latihan Lapangan
              </h3>
              <p className="text-[11px] text-slate-500">
                Berasal dari invoice jenis Latihan (Rp15.000/sesi) yang diterbitkan secara sah dari presensi HADIR.
              </p>
            </div>

            {/* Toggle Tampilan Latihan */}
            <div className="inline-flex bg-slate-100 rounded-xl p-1 text-xs font-bold">
              <button
                onClick={() => setTrainingViewMode('per-siswa')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  trainingViewMode === 'per-siswa'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rekap Per Siswa ({trainingRecap.studentSummaries.length})
              </button>
              <button
                onClick={() => setTrainingViewMode('per-bulan')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  trainingViewMode === 'per-bulan'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ringkasan Bulanan (12 Bulan)
              </button>
              <button
                onClick={() => setTrainingViewMode('detail-sesi')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  trainingViewMode === 'detail-sesi'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daftar Detail Sesi ({trainingRecap.sessionItems.length})
              </button>
            </div>
          </div>

          {/* Tampilan 1: Per Siswa */}
          {trainingViewMode === 'per-siswa' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/80 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3">ID Siswa</th>
                      <th className="py-3 px-3">Nama Siswa</th>
                      <th className="py-3 px-3 text-center">KU</th>
                      <th className="py-3 px-3 text-center">Status Siswa</th>
                      <th className="py-3 px-3 text-center">Sesi Ber-Invoice</th>
                      <th className="py-3 px-3 text-right">Total Tagihan (Rp)</th>
                      <th className="py-3 px-3 text-right">Sudah Dibayar (Rp)</th>
                      <th className="py-3 px-3 text-right">Sisa Tagihan (Rp)</th>
                      <th className="py-3 px-3 text-center">Sesi Menunggak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trainingRecap.studentSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          Belum ada data invoice latihan untuk filter ini.
                        </td>
                      </tr>
                    ) : (
                      trainingRecap.studentSummaries.map((st, idx) => (
                        <tr key={st.studentId} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-[11px]">{st.studentId}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{st.studentName}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold rounded text-[10px]">
                              {st.classGroupId}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                st.studentStatus === 'Aktif'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {st.studentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {st.sessionCount} Sesi
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                            Rp{st.totalBilled.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                            Rp{st.totalPaid.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-700">
                            Rp{st.totalRemaining.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {st.overdueCount > 0 ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">
                                {st.overdueCount} Sesi
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tampilan 2: Ringkasan Bulanan */}
          {trainingViewMode === 'per-bulan' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/80 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Bulan</th>
                      <th className="py-3 px-4 text-center">Jumlah Tagihan Sesi Diterbitkan</th>
                      <th className="py-3 px-4 text-right">Total Tagihan (Rp)</th>
                      <th className="py-3 px-4 text-right">Pembayaran Masuk (Rp)</th>
                      <th className="py-3 px-4 text-right">Sisa Piutang (Rp)</th>
                      <th className="py-3 px-4 text-center">Persentase Terkumpul</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trainingRecap.monthlySummaries.map((m) => {
                      const pct = m.totalBilled > 0 ? Math.round((m.totalPaid / m.totalBilled) * 100) : 0;
                      return (
                        <tr key={m.monthIndex} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{m.monthName} {selectedYear}</td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-800">
                            {m.sessionCount} Tagihan Sesi
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700">
                            Rp{m.totalBilled.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            Rp{m.totalPaid.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-rose-700">
                            Rp{m.totalRemaining.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                m.sessionCount === 0
                                  ? 'bg-slate-100 text-slate-400'
                                  : pct === 100
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : pct > 50
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {m.sessionCount === 0 ? '-' : `${pct}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tampilan 3: Detail Sesi Individual */}
          {trainingViewMode === 'detail-sesi' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/80 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3">Tanggal Sesi</th>
                      <th className="py-3 px-3">No. Invoice</th>
                      <th className="py-3 px-3">Siswa</th>
                      <th className="py-3 px-2 text-center">KU</th>
                      <th className="py-3 px-3 text-right">Tagihan</th>
                      <th className="py-3 px-3 text-right">Terbayar</th>
                      <th className="py-3 px-3 text-right">Sisa</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trainingRecap.sessionItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          Tidak ada rincian sesi latihan yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      trainingRecap.sessionItems.map((sesi, idx) => (
                        <tr key={sesi.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{sesi.date}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{sesi.id}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{sesi.studentName}</td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold rounded text-[10px]">
                              {sesi.classGroupId}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                            Rp{sesi.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                            Rp{sesi.paidAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-700">
                            Rp{sesi.remainingAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                sesi.status === 'LUNAS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sesi.status === 'MENUNGGAK'
                                  ? 'bg-rose-100 text-rose-800'
                                  : sesi.status === 'SEBAGIAN'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-blue-100 text-blue-900'
                              }`}
                            >
                              {sesi.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- 7. KONTEN SUB-TAB 3: REKAP TUNGGAKAN SISWA ---------------- */}
      {activeSubTab === 'tunggakan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Daftar Tunggakan Jatuh Tempo & Sisa Tagihan Siswa
              </h3>
              <p className="text-[11px] text-slate-500">
                Membedakan tunggakan yang sudah melewati tanggal jatuh tempo (kolektibilitas macet) dengan sisa tagihan berjalan.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700">
              Total Siswa Menunggak:{' '}
              <span className="text-rose-700 font-black">
                {overdueRecapRows.filter((r) => r.status === 'Menunggak').length} Atlet
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100/80 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">ID Siswa</th>
                  <th className="py-3 px-3">Nama Siswa</th>
                  <th className="py-3 px-2 text-center">KU</th>
                  <th className="py-3 px-3">Orang Tua / No. WA</th>
                  <th className="py-3 px-3 text-right">Tunggakan SPP (Rp)</th>
                  <th className="py-3 px-3 text-right">Tunggakan Latihan (Rp)</th>
                  <th className="py-3 px-3 text-right bg-rose-50/50">TOTAL JATUH TEMPO (Rp)</th>
                  <th className="py-3 px-3 text-right">Total Sisa Berjalan (Rp)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueRecapRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Tidak ada siswa yang memiliki tagihan pada filter ini.
                    </td>
                  </tr>
                ) : (
                  overdueRecapRows
                    .sort((a, b) => b.totalOverdueAmount - a.totalOverdueAmount)
                    .map((row, idx) => (
                      <tr
                        key={row.student.id}
                        className={`hover:bg-slate-50 transition ${
                          row.totalOverdueAmount > 0 ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-[11px]">
                          {row.student.id}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{row.student.name}</div>
                          <div className="text-[10px] text-slate-400">Status: {row.student.status}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold rounded text-[10px]">
                            {row.student.classGroupId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div className="font-semibold text-slate-800">{row.student.parentName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{row.student.phone || '-'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          {row.sppOverdueAmount > 0 ? (
                            <div>
                              <span className="font-bold text-rose-700">
                                Rp{row.sppOverdueAmount.toLocaleString('id-ID')}
                              </span>
                              <div className="text-[10px] text-slate-400">({row.sppOverdueCount} bln)</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          {row.trainingOverdueAmount > 0 ? (
                            <div>
                              <span className="font-bold text-rose-700">
                                Rp{row.trainingOverdueAmount.toLocaleString('id-ID')}
                              </span>
                              <div className="text-[10px] text-slate-400">({row.trainingOverdueCount} sesi)</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-800 bg-rose-50/40">
                          Rp{row.totalOverdueAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                          Rp{row.totalActiveRemaining.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {row.totalOverdueAmount > 0 ? (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-extrabold rounded-full text-[10px]">
                              Menunggak
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                              Lancar
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
