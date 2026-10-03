import React, { useState } from 'react';
import { RouteId, Invoice, Student, Attendance, TrainingSchedule } from '../../types';
import { 
  CalendarDays, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  Camera,
  User,
  Edit3,
  QrCode
} from 'lucide-react';
import { ChangePhotoModal } from '../modals/ChangePhotoModal';
import { StudentBarcodeModal } from '../modals/StudentBarcodeModal';

interface ParentDashboardViewProps {
  student?: Student;
  invoices: Invoice[];
  attendances?: Attendance[];
  schedules?: TrainingSchedule[];
  onNavigate: (route: RouteId) => void;
  onUpdateStudentPhoto?: (studentId: string, photoUrl: string) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  student,
  invoices,
  attendances = [],
  schedules = [],
  onNavigate,
  onUpdateStudentPhoto,
}) => {
  const childName = student?.name || 'Siswa BFA';
  const childGroup = student?.classGroupId || 'U11';
  const parentTitle = student?.parentName || 'Ayah/Bunda';
  const childAvatar = student?.avatar || '';

  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Filter invoices for this student
  const childInvoices = invoices.filter(
    (i) => (student?.id && i.studentId === student.id) || i.studentName === childName
  );

  const unpaidInvoices = childInvoices.filter((i) => i.status === 'BELUM BAYAR');
  const unpaidSum = unpaidInvoices.reduce((a, b) => a + b.amount, 0);

  // Dynamic attendance metrics
  const studentAtts = attendances.filter(
    (a) => (student?.id && a.studentId === student.id) || a.studentName === childName
  );
  const hadirCount = studentAtts.filter((a) => a.status === 'HADIR').length;
  const tidakHadirCount = studentAtts.filter((a) => a.status !== 'HADIR').length;
  const totalSessions = studentAtts.length;
  const attendanceRate = totalSessions > 0 ? Math.round((hadirCount / totalSessions) * 100) : 100;

  // Relevant upcoming training schedules for this student's KU (supporting multi-KU like U10, U11)
  const relevantSchedules = schedules.filter((sch) => {
    if (!sch.classGroupId) return false;
    if (sch.classGroupId === 'Semua' || sch.classGroupId === childGroup) return true;
    if (sch.classGroups && sch.classGroups.includes(childGroup)) return true;
    const parts = sch.classGroupId.split(',').map((p) => p.trim());
    return parts.includes(childGroup);
  });
  const displaySchedules = relevantSchedules.length > 0 ? relevantSchedules : schedules.slice(0, 3);

  const handleSavePhoto = (newUrl: string) => {
    if (student?.id && onUpdateStudentPhoto) {
      onUpdateStudentPhoto(student.id, newUrl);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Kotak Orang Tua / Greeting & Student Profile Banner with Photo Feature */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white rounded-3xl p-5 sm:p-7 border border-blue-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Student Photo with Camera / Edit Button Badge */}
            <div className="relative group shrink-0">
              <div 
                onClick={() => setIsChangePhotoOpen(true)}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-blue-600 shadow-md ring-4 ring-white bg-slate-100 flex items-center justify-center cursor-pointer transition hover:opacity-90"
                title="Klik untuk mengubah foto ananda"
              >
                {childAvatar ? (
                  <img
                    src={childAvatar}
                    alt={childName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>

              {/* Edit Camera Badge Button */}
              <button
                type="button"
                onClick={() => setIsChangePhotoOpen(true)}
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md border-2 border-white transition active:scale-95 flex items-center justify-center"
                title="Ubah / Tambah Foto Siswa"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                  WALI ATLET BFA
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Aktif
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-black text-blue-950 tracking-tight">
                Halo, {parentTitle} 👋
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-bold text-slate-900">Ananda: {childName}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-500">ID: {student?.id || 'BFA-001'}</span>
                {student?.position && (
                  <>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">{student.position}</span>
                  </>
                )}
                {student?.jerseyNumber && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-blue-700 font-mono">#{student.jerseyNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Action: KU Badge & Buttons */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-100">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">KELOMPOK USIA:</span>
              <span className="text-xs font-black text-white bg-blue-600 px-2.5 py-1 rounded-full shadow-xs inline-block">
                {childGroup}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                title="Buka Kartu Barcode & QR Presensi Ananda"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Kartu Barcode</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangePhotoOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                title="Ubah / Tambah Foto Siswa"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>Ubah Foto</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* JADWAL LATIHAN TERJADWAL DARI ADMIN */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>JADWAL LATIHAN TERJADWAL ({childGroup})</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Real-Time Pelatih</span>
          </span>
        </div>

        {displaySchedules.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
            Jadwal sesi latihan baru akan segera dibagikan oleh pelatih/admin.
          </div>
        ) : (
          <div className="space-y-2.5">
            {displaySchedules.map((sch) => {
              const statusColor = 
                sch.status === 'Sedang Berjalan' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                  : sch.status === 'Akan Datang'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-200';

              return (
                <div
                  key={sch.id}
                  className="p-3.5 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:border-blue-300 transition text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{sch.dayName}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-black text-[10px]">
                        Kelas {sch.classGroupId}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${statusColor}`}>
                        {sch.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-600 text-[11px]">
                      <span className="flex items-center gap-1 font-mono font-bold text-blue-900">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sch.startTime} - {sch.endTime} WIB</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-600" />
                        <span>{sch.courtName}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Pelatih Bertugas:</span>
                    <div className="flex flex-wrap sm:justify-end gap-1 mt-0.5">
                      {sch.coaches.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white text-slate-800 rounded text-[10px] font-bold border border-slate-200 shadow-2xs"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Iuran sesi latihan Rp15.000 otomatis terbit setelah ananda hadir dan tap presensi di lapangan.</span>
        </div>
      </div>

      {/* Disiplin Kehadiran Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>DISIPLIN KEHADIRAN ANANDA</span>
          </h3>
          <button
            onClick={() => onNavigate('parent-attendance')}
            className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Buka Riwayat Presensi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-black text-emerald-600 tabular-nums">
              {totalSessions > 0 ? `${attendanceRate}%` : '100%'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {totalSessions > 0
                ? `Disiplin kehadiran (${hadirCount} dari ${totalSessions} sesi tercatat)`
                : 'Belum ada catatan absensi latihan untuk sesi baru.'}
            </p>
          </div>
          <div className="text-right space-y-1 text-xs">
            <p className="text-slate-800">
              Hadir: <span className="font-bold text-emerald-700 tabular-nums">{hadirCount} Sesi</span>
            </p>
            <p className="text-slate-500">
              Tidak hadir: <span className="font-bold text-rose-600 tabular-nums">{tidakHadirCount} Sesi</span>
            </p>
          </div>
        </div>
      </div>

      {/* Status Tagihan & Iuran (Realtime Dynamic, Zero Tunggakan Awal) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            STATUS TAGIHAN & IURAN AKADEMI (OKTOBER 2026)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {childInvoices.length} Tagihan Terdaftar
          </span>
        </div>

        {/* Invoices List */}
        <div className="space-y-2 text-xs">
          {childInvoices.length === 0 ? (
            <div className="p-5 bg-gradient-to-r from-emerald-50/60 to-white rounded-2xl border border-emerald-200 text-center space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="font-black text-slate-900 text-xs">
                Tidak Ada Tunggakan / Semua Iuran Bersih
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                Saat ini belum ada tagihan iuran yang harus dibayar. Tagihan SPP bulanan atau iuran latihan akan tampil di sini saat dibagikan oleh admin atau setelah ananda hadir latihan.
              </p>
            </div>
          ) : (
            childInvoices.map((inv) => {
              const isPaid = inv.status === 'LUNAS';
              return (
                <div
                  key={inv.id}
                  className={`p-3 rounded-xl flex items-center justify-between border transition ${
                    isPaid
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-200'
                  }`}
                >
                  <div>
                    <p className="font-extrabold text-slate-900">
                      {inv.type === 'Bulanan'
                        ? `Iuran Bulanan (SPP ${inv.period})`
                        : `${inv.period} (Kehadiran Tap)`}
                    </p>
                    <p className={`text-[11px] tabular-nums font-mono font-bold mt-0.5 ${isPaid ? 'text-slate-500' : 'text-rose-600'}`}>
                      Rp{inv.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  {isPaid ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>LUNAS</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      <span>BELUM BAYAR</span>
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Total and Payment Trigger */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">
              Total belum dibayar:
            </span>
            <span
              className={`text-xl font-black font-mono tabular-nums ${
                unpaidSum > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              Rp{unpaidSum.toLocaleString('id-ID')}
            </span>
          </div>

          {unpaidSum > 0 ? (
            <button
              onClick={() => onNavigate('parent-payment')}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs shadow-lg shadow-orange-500/25 transition active:scale-95 uppercase tracking-wider flex items-center space-x-1.5"
            >
              <span>BAYAR SEKARANG</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>SEMUA LUNAS / TIDAK ADA TAGIHAN</span>
            </span>
          )}
        </div>
      </div>

      {/* Change Photo Modal */}
      <ChangePhotoModal
        isOpen={isChangePhotoOpen}
        studentName={childName}
        currentAvatar={childAvatar}
        onClose={() => setIsChangePhotoOpen(false)}
        onSave={handleSavePhoto}
      />

      {/* Student Barcode ID Pass Modal */}
      <StudentBarcodeModal
        isOpen={isBarcodeModalOpen}
        student={student}
        onClose={() => setIsBarcodeModalOpen(false)}
      />
    </div>
  );
};
