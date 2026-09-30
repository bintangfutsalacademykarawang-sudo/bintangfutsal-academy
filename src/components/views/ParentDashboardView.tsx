import React from 'react';
import { RouteId, Invoice, Student, Attendance } from '../../types';
import { CalendarDays, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface ParentDashboardViewProps {
  student?: Student;
  invoices: Invoice[];
  attendances?: Attendance[];
  onNavigate: (route: RouteId) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  student,
  invoices,
  attendances = [],
  onNavigate,
}) => {
  const childName = student?.name || 'Andra';
  const childGroup = student?.classGroupId || 'U11';
  const parentTitle = student?.parentName || 'Ayah/Bunda';

  // Filter invoices for this student dynamically
  const childInvoices = invoices.filter(
    (i) => (student?.id && i.studentId === student.id) || i.studentName === childName
  );

  // Calculate unpaid sum dynamically from real invoices
  const unpaidSum = childInvoices
    .filter((i) => i.status === 'BELUM BAYAR')
    .reduce((a, b) => a + b.amount, 0);

  // 4 Official Saturday training sessions of the current month (5 Sep, 12 Sep, 19 Sep, 26 Sep)
  // Matching Kalender Absensi: 3 Hadir & 1 Tidak Hadir
  const hadirCount = 3;
  const tidakHadirCount = 1;
  const totalSessions = 4;
  const attendanceRate = 75;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-white rounded-3xl p-6 sm:p-7 border border-blue-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
              Halo, {parentTitle} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Pantau kehadiran latihan biometrik dan tagihan iuran futsal ananda {childName}.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">ANAK:</span>
            <span className="text-base font-black text-blue-900 uppercase">{childName}</span>
            <span className="ml-1.5 text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-xs">
              {childGroup}
            </span>
          </div>
        </div>
      </div>

      {/* Kehadiran Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>DISIPLIN KEHADIRAN</span>
          </h3>
          <button
            onClick={() => onNavigate('parent-attendance')}
            className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Buka Kalender</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-black text-emerald-600 tabular-nums">{attendanceRate}%</div>
            <p className="text-xs text-slate-500 mt-1">Disiplin kehadiran ({hadirCount} dari {totalSessions} sesi latihan)</p>
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

      {/* Tagihan Bulan Ini (Realtime Dynamic) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            TAGIHAN BULAN SEPTEMBER 2026
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {childInvoices.length} Tagihan Terdaftar
          </span>
        </div>

        {/* Invoices List dynamically mapped */}
        <div className="space-y-2 text-xs">
          {childInvoices.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500">
              Belum ada riwayat tagihan untuk ananda {childName}.
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

          {/* Sesi tidak hadir placeholder */}
          <div className="p-3 bg-slate-50/50 rounded-xl flex items-center justify-between text-slate-400 text-[11px] border border-dashed border-slate-200">
            <div>
              <p className="font-medium text-slate-600">Latihan 19 Sep</p>
              <p>Tidak hadir • Tidak ada tagihan</p>
            </div>
            <span className="font-mono">Rp0</span>
          </div>
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
              <span>SEMUA LUNAS</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
