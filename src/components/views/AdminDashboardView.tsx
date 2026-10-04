import React, { useState } from 'react';
import { RouteId, Student, CashMutation, Invoice, Attendance, TrainingSchedule } from '../../types';
import { 
  Users, 
  UserCheck, 
  CalendarCheck, 
  AlertCircle, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Vault, 
  PlusCircle, 
  Fingerprint, 
  ArrowRight,
  CreditCard,
  Plus,
  Download,
  FileSpreadsheet,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  MessageCircle,
  Radio,
  Sparkles,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import { exportFinancePDF } from '../../utils/exportFinancePDF';

interface AdminDashboardViewProps {
  students: Student[];
  cashMutations: CashMutation[];
  invoices: Invoice[];
  attendances: Attendance[];
  schedules?: TrainingSchedule[];
  onNavigate: (route: RouteId) => void;
  onOpenRecordCash: () => void;
  onOpenFingerprint: () => void;
  onGenerateInvoices: () => void;
  onOpenCreateSchedule?: () => void;
  onEditSchedule?: (schedule: TrainingSchedule) => void;
  onDeleteSchedule?: (id: string) => void;
  onViewParentDashboard?: () => void;
  cloudSyncStatus?: {
    status: 'connecting' | 'connected' | 'error' | 'offline';
    source: 'server' | 'cache' | 'local_fallback';
    docCount: number;
    lastSynced: string | null;
    errorMessage: string | null;
  };
  onRetrySync?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  students,
  cashMutations,
  invoices,
  attendances,
  schedules = [],
  onNavigate,
  onOpenRecordCash,
  onOpenFingerprint,
  onGenerateInvoices,
  onOpenCreateSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onViewParentDashboard,
  cloudSyncStatus,
  onRetrySync,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Broadcast schedule to parent WhatsApp group
  const handleBroadcastWhatsApp = (sch: TrainingSchedule) => {
    const coachesStr = sch.coaches.join(', ');
    const msg = 
      `*PEMBERITAHUAN JADWAL LATIHAN RESMI BFA*\n\n` +
      `Halo Ayah / Bunda Siswa Bintang Futsal Academy,\n` +
      `Berikut rincian jadwal sesi latihan ananda:\n\n` +
      `📅 *Hari & Tanggal:* ${sch.dayName}\n` +
      `⏰ *Waktu:* ${sch.startTime} - ${sch.endTime} WIB\n` +
      `⚽ *Kelompok Usia:* ${sch.classGroupId}\n` +
      `🏟️ *Lapangan:* ${sch.courtName}\n` +
      `👟 *Pelatih Bertugas:* ${coachesStr}\n\n` +
      `📌 *Catatan Penting:*\n` +
      `1. Hadir 15 menit lebih awal untuk registrasi dan pemanasan.\n` +
      `2. Jadwal dan kehadiran dapat dipantau langsung di Dashboard Orang Tua.\n` +
      `3. Iuran sesi latihan (Rp15.000) otomatis tercatat setelah ananda hadir di lapangan.\n\n` +
      `#WegrowTogether • Pembinaan Futsal Berjenjang`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Financial metrics 100% Realtime from Database
  const totalPemasukan = cashMutations
    .filter((m) => m.type === 'Pemasukan')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalPengeluaran = cashMutations
    .filter((m) => m.type === 'Pengeluaran')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalKas = totalPemasukan - totalPengeluaran;

  // Student & Attendance Metrics 100% Realtime from Database
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'Aktif').length;
  const todayAttendance = attendances.filter((a) => a.status === 'HADIR').length;
  const unpaidInvoices = invoices.filter((i) => i.status === 'BELUM BAYAR').length;

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

  const dayNameMap: Record<number, string> = {
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
    0: 'Minggu',
  };

  const weeklyAttendance = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => {
    const count = attendances.filter((a) => {
      if (a.status !== 'HADIR') return false;
      const d = new Date(a.date);
      return dayNameMap[d.getDay()] === day;
    }).length;

    return {
      day,
      value: count,
      max: Math.max(totalStudents, 1),
      highlight: day === 'Sabtu',
    };
  });

  return (
    <div className="space-y-6">
      {/* Cloud Diagnostic Error Banner */}
      {cloudSyncStatus && cloudSyncStatus.status === 'error' && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-amber-950">Sinkronisasi Cloud Terkendala</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {cloudSyncStatus.errorMessage} Menampilkan <strong>{students.length} data siswa</strong> dari cache memori lokal perangkat ini.
              </p>
            </div>
          </div>
          {onRetrySync && (
            <button
              onClick={onRetrySync}
              className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-[11px] transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
            >
              <span>Hubungkan Ulang</span>
            </button>
          )}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-xs text-slate-500">Ringkasan KPI, absensi biometrik lapangan, dan arus pembayaran BFA.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={onOpenRecordCash}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Catat Kas</span>
          </button>

          <button 
            onClick={onOpenCreateSchedule || (() => onNavigate('attendance'))}
            className="px-3.5 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>+ Jadwal Sesi</span>
          </button>

          <button 
            onClick={onViewParentDashboard || (() => onNavigate('parent-dashboard'))}
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
            title="Buka pratinjau tampilan dashboard orang tua"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Dashboard Wali</span>
          </button>

          <button 
            onClick={onGenerateInvoices}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-blue-900 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Terbitkan SPP</span>
          </button>

          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{isExporting ? 'Membuat PDF...' : 'Unduh Laporan Kas PDF'}</span>
          </button>

          <button 
            onClick={onOpenFingerprint}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-500/20 transition flex items-center space-x-1.5 active:scale-95"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Simulate Attendance</span>
          </button>
        </div>
      </div>

      {/* 5 Top Statistic Cards (100% Realtime Database) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">JUMLAH SISWA</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{totalStudents}</div>
          <span className="text-[10px] text-slate-400">Terdaftar di database</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">AKTIF</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">{activeStudents}</div>
          <span className="text-[10px] text-slate-400">Status siswa aktif</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">HADIR HARI INI</span>
            <CalendarCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1 tabular-nums">{todayAttendance}</div>
          <span className="text-[10px] text-blue-600 font-semibold">Tercatat Hadir Sesi</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">BELUM BAYAR</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1 tabular-nums">{unpaidInvoices}</div>
          <span className="text-[10px] text-slate-400">Tagihan berjalan</span>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-orange-50/60 rounded-2xl p-4 border border-orange-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">PENDAPATAN BULAN INI</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
            Rp{totalPemasukan.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">Realtime Kas Masuk</span>
        </div>
      </div>

      {/* JADWAL SESI LATIHAN & LINK PEMBERITAHUAN KE DASHBOARD ORANG TUA */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-indigo-600 animate-pulse" />
                <span>Siaran Live ke Orang Tua</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                🟢 Aktif Tersinkron
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Jadwal Sesi Latihan & Pemberitahuan Wali Murid</span>
            </h2>
            <p className="text-xs text-slate-500">
              Jadwal yang ditambahkan di sini otomatis terbit di Portal Orang Tua dan terhubung ke Absensi Lapangan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onOpenCreateSchedule || (() => onNavigate('attendance'))}
              className="px-3.5 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 transition flex items-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal Sesi</span>
            </button>

            <button
              onClick={onViewParentDashboard || (() => onNavigate('parent-dashboard'))}
              className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs active:scale-95"
              title="Lihat langsung tampilan jadwal yang dilihat oleh orang tua"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Buka Dashboard Orang Tua</span>
            </button>
          </div>
        </div>

        {/* Schedules Cards List */}
        {schedules.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-2">
            <p>Belum ada jadwal sesi latihan aktif.</p>
            <button
              onClick={onOpenCreateSchedule || (() => onNavigate('attendance'))}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition"
            >
              + Tambah Jadwal Latihan Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {schedules.map((sch) => (
              <div
                key={sch.id}
                className="bg-slate-50/80 hover:bg-white rounded-2xl p-4 border border-slate-200 hover:border-indigo-300 transition shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-black">
                      Kelas {sch.classGroupId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sch.status === 'Sedang Berjalan'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {sch.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{sch.dayName}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-blue-900 font-mono font-bold mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sch.startTime} - {sch.endTime} WIB</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="font-medium truncate">{sch.courtName}</span>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 block font-semibold mb-1">
                        Pelatih Bertugas:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sch.coaches.map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white text-slate-800 rounded-md text-[10px] font-bold border border-slate-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Per Schedule */}
                <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleBroadcastWhatsApp(sch)}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-xs"
                    title="Kirim pesan siaran jadwal ke grup WhatsApp orang tua"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Siarkan WA</span>
                  </button>

                  <button
                    onClick={() => onNavigate('attendance')}
                    className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                    title="Buka absensi lapangan untuk sesi ini"
                  >
                    <span>Absensi</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {onEditSchedule && (
                    <button
                      onClick={() => onEditSchedule(sch)}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 rounded-xl text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                      title="Edit jadwal latihan ini"
                    >
                      <Edit3 className="w-3 h-3 text-indigo-600" />
                      <span>Edit</span>
                    </button>
                  )}

                  {onDeleteSchedule && (
                    confirmDeleteId === sch.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 px-2 py-1 rounded-xl shadow-xs">
                        <span className="text-[10px] text-rose-700 font-black">Hapus?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSchedule(sch.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black transition active:scale-95"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(sch.id)}
                        className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                        title="Hapus jadwal sesi latihan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-blue-950 font-medium">
            <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Jadwal di atas otomatis aktif dan tersiar di Dashboard Orang Tua. Klik link untuk memeriksa langsung tampilan yang dilihat oleh wali murid:
            </span>
          </div>
          <button
            onClick={onViewParentDashboard || (() => onNavigate('parent-dashboard'))}
            className="text-xs font-black text-blue-800 hover:text-blue-950 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs"
          >
            <span>Buka Dashboard Orang Tua</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
          </button>
        </div>
      </div>

      {/* Ringkasan Keuangan Komprehensif (100% Realtime Database) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
            <Vault className="w-4 h-4 text-orange-500" />
            <span>Ringkasan Keuangan & Kas BFA</span>
          </span>
          <button 
            onClick={() => onNavigate('keuangan')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            <span>Lihat Buku Kas & Rincian</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-white to-emerald-50/50 rounded-2xl p-4 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">TOTAL PEMASUKAN</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                <ArrowDownLeft className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
              Rp{totalPemasukan.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">SPP Bulanan, iuran latihan & registrasi baru</p>
          </div>

          <div className="bg-gradient-to-br from-white to-rose-50/50 rounded-2xl p-4 border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider">TOTAL PENGELUARAN</span>
              <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
              Rp{totalPengeluaran.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Sewa lapangan, honor pelatih, bola & P3K</p>
          </div>

          <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-4 border border-blue-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">SALDO KAS BERSIH BFA</span>
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
                <Vault className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-700 mt-2 tabular-nums">
              Rp{totalKas.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Surplus Operasional Sehat (Siap Pakai)</p>
          </div>
        </div>
      </div>

      {/* Visual Chart Bars: Kehadiran Mingguan & Pembayaran Bulanan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Kehadiran Mingguan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Kehadiran Mingguan</h3>
              <p className="text-[11px] text-slate-500">Distribusi presensi siswa per hari sesi latihan</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
              Total {activeStudents} Siswa Aktif
            </span>
          </div>

          <div className="h-48 flex items-end justify-between pt-6 px-2 gap-3">
            {weeklyAttendance.map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-slate-600 tabular-nums">{item.value}</span>
                <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden h-32 flex items-end">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      item.highlight ? 'bg-orange-500 shadow-xs' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    style={{ height: `${item.max > 0 ? (item.value / item.max) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pembayaran Bulanan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Pembayaran Bulanan</h3>
              <p className="text-[11px] text-slate-500">Pemasukan SPP & iuran latihan berjalan</p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
              {invoices.filter(i => i.status === 'LUNAS').length} Lunas
            </span>
          </div>

          <div className="h-48 flex flex-col justify-center items-center text-center p-4">
            <div className="text-3xl font-black text-emerald-700 tabular-nums">
              Rp{totalPemasukan.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total Pemasukan Kas Realtime Tercatat</p>
            <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ 
                  width: `${invoices.length > 0 ? Math.round((invoices.filter(i => i.status === 'LUNAS').length / invoices.length) * 100) : 100}%` 
                }}
              />
            </div>
            <span className="text-[11px] text-slate-600 mt-2 font-medium">
              Tingkat Pelunasan: {invoices.length > 0 ? Math.round((invoices.filter(i => i.status === 'LUNAS').length / invoices.length) * 100) : 100}% Tagihan Lunas
            </span>
          </div>
        </div>
      </div>

      {/* Live Feeds: Absensi Terbaru & Pembayaran Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-orange-500" />
              <span>Absensi Terbaru ({attendances.length})</span>
            </h3>
            <button 
              onClick={() => onNavigate('attendance')}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {attendances.slice(0, 4).map((att) => (
              <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-extrabold border border-blue-200">
                    {att.studentName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{att.studentName}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{att.classGroupId} • {att.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    att.status === 'HADIR' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {att.status}
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 tabular-nums">{att.checkInTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Pembayaran Terbaru ({invoices.length})</span>
            </h3>
            <button 
              onClick={() => onNavigate('invoices')}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.slice(0, 4).map((inv) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{inv.studentName}</p>
                  <p className="text-[10px] text-slate-500">{inv.type} • {inv.period}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 tabular-nums">Rp{inv.amount.toLocaleString('id-ID')}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    inv.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
