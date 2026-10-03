import React from 'react';
import { RouteId, Student, Invoice, Attendance, TrainingSchedule } from '../../types';
import { CheckCircle2, AlertCircle, CalendarDays, ArrowRight, Clock, MapPin, Sparkles } from 'lucide-react';

interface ParentAttendanceViewProps {
  student?: Student;
  invoices?: Invoice[];
  attendances?: Attendance[];
  schedules?: TrainingSchedule[];
  onNavigate?: (route: RouteId) => void;
}

export const ParentAttendanceView: React.FC<ParentAttendanceViewProps> = ({
  student,
  invoices = [],
  attendances = [],
  schedules = [],
  onNavigate,
}) => {
  const childName = student?.name || 'Siswa BFA';
  const childGroup = student?.classGroupId || '-';

  // Filter child invoices and attendances strictly for verified student
  const childInvoices = student?.id 
    ? invoices.filter((i) => i.studentId === student.id)
    : [];

  const studentAtts = student?.id 
    ? attendances.filter((a) => a.studentId === student.id)
    : [];

  // Relevant October schedules for this student's group (supports multi-KU like U10, U11)
  const octoberSchedules = schedules.filter((sch) => {
    if (!sch.classGroupId) return false;
    if (sch.classGroupId === 'Semua' || sch.classGroupId === childGroup) return true;
    if (sch.classGroups && sch.classGroups.includes(childGroup)) return true;
    const parts = sch.classGroupId.split(',').map((p) => p.trim());
    return parts.includes(childGroup);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kalender Presensi Ananda
          </h1>
          <p className="text-xs text-slate-500">
            Jadwal latihan dan rekap jam scan sidik jari di arena Bintang Futsal Karawang (Periode: Mulai Oktober 2026).
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Siswa:</span>
          <span className="text-sm font-black text-blue-900">{childName}</span>
          <span className="ml-1 text-[10px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-full">
            {childGroup}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>Oktober 2026</span>
          </h3>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Hadir</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Tidak Hadir</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>Akan Datang</span>
            </span>
          </div>
        </div>

        {/* Sessions list */}
        <div className="space-y-2.5 text-xs">
          {octoberSchedules.length === 0 && studentAtts.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-500 space-y-2 border border-slate-200">
              <p className="font-bold text-slate-800">Periode Absensi & Iuran Dimulai Oktober 2026</p>
              <p className="text-slate-400 text-[11px]">
                Rekap kehadiran Agustus dan September telah direset bersih. Sesi latihan bulan Oktober akan tampil saat dijadwalkan oleh pelatih.
              </p>
            </div>
          ) : (
            octoberSchedules.map((sch) => {
              const att = studentAtts.find((a) => a.date === sch.date);
              const inv = childInvoices.find(
                (i) => i.type === 'Latihan' && i.attendanceDate === sch.date
              );

              const isHadir = att?.status === 'HADIR';
              const isRecorded = !!att;
              const isPaid = inv?.status === 'LUNAS';

              return (
                <div
                  key={sch.id}
                  className="p-3.5 bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between border border-slate-200 gap-2"
                >
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          !isRecorded
                            ? 'bg-amber-400'
                            : isHadir
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span>{sch.dayName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({sch.classGroupId})</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>Jam: {sch.startTime} - {sch.endTime} WIB</span>
                      <span>•</span>
                      <span>Lap: {sch.courtName}</span>
                      {isRecorded && (
                        <>
                          <span>•</span>
                          <span>Tap: {att.checkInTime}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {!isRecorded ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        AKAN DATANG
                      </span>
                    ) : isHadir ? (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-orange-100 text-orange-800 border border-orange-300'
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>HADIR (LUNAS)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-orange-600" />
                            <span>HADIR (RP15.000)</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        TIDAK HADIR (BEBAS RP0)
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-100">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Iuran latihan otomatis terbit hanya jika status ananda HADIR saat sesi latihan Oktober berlangsung.</span>
        </div>
      </div>
    </div>
  );
};
