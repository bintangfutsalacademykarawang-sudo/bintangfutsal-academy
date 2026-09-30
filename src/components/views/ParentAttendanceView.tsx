import React from 'react';
import { RouteId, Student, Invoice, Attendance } from '../../types';
import { CheckCircle2, AlertCircle, CalendarDays, ArrowRight } from 'lucide-react';

interface ParentAttendanceViewProps {
  student?: Student;
  invoices?: Invoice[];
  attendances?: Attendance[];
  onNavigate?: (route: RouteId) => void;
}

export const ParentAttendanceView: React.FC<ParentAttendanceViewProps> = ({
  student,
  invoices = [],
  attendances = [],
  onNavigate,
}) => {
  const childName = student?.name || 'Andra';
  const childGroup = student?.classGroupId || 'U11';

  // Real-time filter child invoices
  const childInvoices = invoices.filter(
    (i) => (student?.id && i.studentId === student.id) || i.studentName === childName
  );
  const unpaidInvoices = childInvoices.filter((i) => i.status === 'BELUM BAYAR');
  const isAllPaid = unpaidInvoices.length === 0;

  // Find invoices for specific session dates
  const inv5 = childInvoices.find(
    (i) => i.attendanceDate === '2026-09-05' || i.period?.includes('5 Sep')
  );
  const isPaid5 = isAllPaid || (inv5 ? inv5.status === 'LUNAS' : true);

  const inv12 = childInvoices.find(
    (i) => i.attendanceDate === '2026-09-12' || i.period?.includes('12 Sep')
  );
  const isPaid12 = isAllPaid || (inv12 ? inv12.status === 'LUNAS' : false);

  const inv26 = childInvoices.find(
    (i) => i.attendanceDate === '2026-09-26' || i.period?.includes('26 Sep')
  );
  const isPaid26 = isAllPaid || (inv26 ? inv26.status === 'LUNAS' : false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kalender Absensi Ananda
          </h1>
          <p className="text-xs text-slate-500">
            Jadwal latihan dan rekap jam scan sidik jari di arena Bintang Futsal Karawang.
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
            <span>September 2026</span>
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
          </div>
        </div>

        {/* Sessions list */}
        <div className="space-y-2.5 text-xs">
          
          {/* SESI 1: 5 September */}
          <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
            <div>
              <p className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Sabtu, 5 September 2026</span>
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Fingerprint: 14:04:10 • Tagihan: Rp15.000
              </p>
            </div>
            {isPaid5 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>LUNAS</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>BELUM BAYAR</span>
              </span>
            )}
          </div>

          {/* SESI 2: 12 September */}
          <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
            <div>
              <p className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Sabtu, 12 September 2026</span>
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Fingerprint: 14:02:15 • Tagihan: Rp15.000
              </p>
            </div>
            {isPaid12 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>LUNAS</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>BELUM BAYAR</span>
              </span>
            )}
          </div>

          {/* SESI 3: 19 September */}
          <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
            <div>
              <p className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>Sabtu, 19 September 2026</span>
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Status: TIDAK HADIR • Tagihan: Rp0
              </p>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold bg-slate-200 px-2 py-0.5 rounded">
              Bebas Iuran
            </span>
          </div>

          {/* SESI 4: 26 September (Detailed Live Card) */}
          <div className={`p-4 rounded-xl border space-y-2 shadow-xs transition ${isPaid26 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-blue-50/70 border-blue-200'}`}>
            <div className="flex items-center justify-between">
              <p className="font-black text-blue-950 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Sabtu, 26 September 2026</span>
              </p>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${isPaid26 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-blue-800 border-blue-300'}`}>
                {isPaid26 && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                <span>{isPaid26 ? 'HADIR • LUNAS' : 'HADIR'}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700 text-[11px] pt-1">
              <p>Jam Fingerprint: <strong className="text-slate-900 font-mono">14:02:15</strong></p>
              <p>Tagihan Sesi: <strong className="text-orange-600 font-mono">Rp15.000</strong></p>
              <p>
                Status Pembayaran:{' '}
                {isPaid26 ? (
                  <strong className="text-emerald-700 font-black">LUNAS ✓</strong>
                ) : (
                  <strong className="text-rose-600 font-black">BELUM BAYAR</strong>
                )}
              </p>
              <p>Terminal: <span className="text-slate-500 font-mono">BFA Gate 01 Klari</span></p>
            </div>
          </div>
        </div>

        {/* Status Summary Banner */}
        {isAllPaid ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">✓ Seluruh tagihan sesi latihan bulan ini telah LUNAS</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Tidak Ada Tunggakan
            </span>
          </div>
        ) : (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Terdapat tagihan sesi latihan yang belum dibayar</span>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('parent-payment')}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-xs"
              >
                <span>Bayar Sekarang</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
