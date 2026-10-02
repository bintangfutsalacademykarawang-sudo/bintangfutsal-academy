import React, { useState } from 'react';
import { Attendance, TrainingSchedule, Student } from '../../types';
import { ALL_KU_CATEGORIES } from '../../data/initialData';
import { 
  Fingerprint, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ArrowRight,
  Edit3,
  MessageCircle 
} from 'lucide-react';
import { exportAttendanceExcel, exportAttendancePDF } from '../../utils/exportHelpers';

interface AdminAttendanceViewProps {
  attendances: Attendance[];
  students: Student[];
  schedules: TrainingSchedule[];
  onOpenFingerprint: () => void;
  onOpenCreateSchedule: () => void;
  onEditSchedule?: (schedule: TrainingSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onQuickMarkAttendance: (studentId: string, date: string, status: 'HADIR' | 'TIDAK_HADIR') => void;
}

export const AdminAttendanceView: React.FC<AdminAttendanceViewProps> = ({
  attendances,
  students,
  schedules,
  onOpenFingerprint,
  onOpenCreateSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onQuickMarkAttendance,
}) => {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'presensi'>('jadwal');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('2026-10-02');
  const [classFilter, setClassFilter] = useState('Semua');

  const filteredAttendances = attendances.filter(
    (a) => (classFilter === 'Semua' || a.classGroupId === classFilter) && (!dateFilter || a.date === dateFilter)
  );

  const hadirCount = filteredAttendances.filter((a) => a.status === 'HADIR').length;
  const tidakHadirCount = filteredAttendances.filter((a) => a.status !== 'HADIR').length;

  const handleSelectScheduleForAttendance = (sch: TrainingSchedule) => {
    setDateFilter(sch.date);
    setClassFilter(sch.classGroupId);
    setActiveTab('presensi');
  };

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
            BFA FIELD OPERATIONS & BIOMETRICS
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Jadwal Latihan & Absensi Lapangan
          </h1>
          <p className="text-xs text-slate-500">
            Atur jadwal sesi latihan, tugaskan tim pelatih, dan sinkronkan kehadiran biometrik siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenCreateSchedule}
            className="px-3.5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal Latihan</span>
          </button>

          <button
            onClick={onOpenFingerprint}
            className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-orange-500/20 transition flex items-center space-x-1.5 active:scale-95"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Simulasi Tap Presensi</span>
          </button>

          <button
            onClick={() => exportAttendanceExcel(filteredAttendances.length > 0 ? filteredAttendances : attendances)}
            className="px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
            title="Download Absensi format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Unduh Excel</span>
          </button>

          <button
            onClick={() => exportAttendancePDF(filteredAttendances.length > 0 ? filteredAttendances : attendances)}
            className="px-3 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
            title="Download Absensi format PDF"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'jadwal'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Jadwal Sesi Latihan ({schedules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('presensi')}
          className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'presensi'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5" />
          <span>Rekap Presensi & Kehadiran ({filteredAttendances.length})</span>
        </button>
      </div>

      {/* TAB 1: JADWAL SESI LATIHAN */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Daftar Sesi Jadwal Latihan Terdaftar
                </h3>
                <p className="text-xs text-slate-500">
                  Jadwal dibuat oleh Pelatih & Manajemen BFA. Klik sesi untuk membuka absensi.
                </p>
              </div>
              <button
                onClick={onOpenCreateSchedule}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto border border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tambah Jadwal Sesi Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">HARI & TANGGAL</th>
                    <th className="py-3 px-4">JAM</th>
                    <th className="py-3 px-4">KELOMPOK UMUR</th>
                    <th className="py-3 px-4">LAPANGAN</th>
                    <th className="py-3 px-4">PELATIH BERTUGAS</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada jadwal sesi latihan. Klik tombol &quot;Tambah Jadwal Latihan&quot; di atas.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">{sch.dayName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{sch.date}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                          {sch.startTime} - {sch.endTime}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-black">
                            {sch.classGroupId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                            <span>{sch.courtName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {sch.coaches.map((c, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-bold border border-slate-200 whitespace-nowrap"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sch.status === 'Sedang Berjalan'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {sch.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSelectScheduleForAttendance(sch)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shadow-xs"
                            >
                              <span>Buka Absensi</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBroadcastWhatsApp(sch)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Kirim siaran jadwal ke WhatsApp orang tua"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            {onEditSchedule && (
                              <button
                                onClick={() => onEditSchedule(sch)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Edit jadwal latihan ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {confirmDeleteId === sch.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 p-1 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteSchedule(sch.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded transition active:scale-95"
                                >
                                  Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] transition"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(sch.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Hapus jadwal latihan ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAP PRESENSI & KEHADIRAN */}
      {activeTab === 'presensi' && (
        <div className="space-y-4">
          {/* Filter Bar & Counters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center shadow-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Tanggal Sesi:
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Kelompok Umur (KU):
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-bold"
              >
                <option value="Semua">Semua Kelompok</option>
                {ALL_KU_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 block flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> HADIR
                </span>
                <span className="text-lg font-black text-emerald-600 tabular-nums">{hadirCount}</span>
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-bold text-rose-700 block flex items-center justify-center gap-1">
                  <XCircle className="w-3 h-3" /> TIDAK HADIR
                </span>
                <span className="text-lg font-black text-rose-600 tabular-nums">{tidakHadirCount}</span>
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 block flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> TOTAL
                </span>
                <span className="text-lg font-black text-slate-900 tabular-nums">{filteredAttendances.length}</span>
              </div>
            </div>
          </div>

          {/* Attendances Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Nama Siswa</th>
                    <th className="px-4 py-3.5">KU</th>
                    <th className="px-4 py-3.5">Jam Presensi</th>
                    <th className="px-4 py-3.5">Status Kehadiran</th>
                    <th className="px-4 py-3.5">Tagihan Sesi Latihan</th>
                    <th className="px-4 py-3.5 text-center">Aksi Cepat Presensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Belum ada catatan presensi untuk sesi tanggal {dateFilter}. Silakan klik &quot;Simulasi Tap Presensi&quot; untuk mencatat kehadiran.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendances.map((att) => {
                      const isHadir = att.status === 'HADIR';
                      return (
                        <tr key={att.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-bold text-slate-900">{att.studentName}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{att.classGroupId}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">{att.checkInTime}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isHadir
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {att.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-extrabold text-slate-900 tabular-nums">
                            {isHadir ? (
                              <span className="text-orange-600">Rp15.000 (Terbit Otomatis)</span>
                            ) : (
                              <span className="text-slate-400">Bebas Biaya (Rp0)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onQuickMarkAttendance(att.studentId, att.date, 'HADIR')}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                                  isHadir
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-600'
                                }`}
                              >
                                Hadir
                              </button>
                              <button
                                onClick={() => onQuickMarkAttendance(att.studentId, att.date, 'TIDAK_HADIR')}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                                  !isHadir
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-100 hover:bg-rose-100 text-slate-600'
                                }`}
                              >
                                Tidak Hadir
                              </button>
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
    </div>
  );
};
