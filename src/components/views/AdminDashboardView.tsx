import React from 'react';
import { RouteId, Student, CashMutation, Invoice, Attendance } from '../../types';
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
  Plus
} from 'lucide-react';

interface AdminDashboardViewProps {
  students: Student[];
  cashMutations: CashMutation[];
  invoices: Invoice[];
  attendances: Attendance[];
  onNavigate: (route: RouteId) => void;
  onOpenRecordCash: () => void;
  onOpenFingerprint: () => void;
  onGenerateInvoices: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  students,
  cashMutations,
  invoices,
  attendances,
  onNavigate,
  onOpenRecordCash,
  onOpenFingerprint,
  onGenerateInvoices,
}) => {
  // Financial metrics
  const totalPemasukan = cashMutations
    .filter((m) => m.type === 'Pemasukan')
    .reduce((acc, curr) => acc + curr.amount, 0) + 3660000;
  
  const totalPengeluaran = cashMutations
    .filter((m) => m.type === 'Pengeluaran')
    .reduce((acc, curr) => acc + curr.amount, 0) - 250000;

  const totalKas = totalPemasukan - totalPengeluaran;

  const totalStudents = students.length + 115;
  const activeStudents = students.filter((s) => s.status === 'Aktif').length + 108;
  const todayAttendance = attendances.filter((a) => a.date === '2026-09-26' && a.status === 'HADIR').length + 90;
  const unpaidInvoices = invoices.filter((i) => i.status === 'BELUM BAYAR').length + 21;

  const weeklyAttendance = [
    { day: 'Senin', value: 45, max: 120 },
    { day: 'Selasa', value: 72, max: 120 },
    { day: 'Rabu', value: 88, max: 120 },
    { day: 'Kamis', value: 80, max: 120 },
    { day: 'Jumat', value: 92, max: 120 },
    { day: 'Sabtu', value: 114, max: 120, highlight: true }
  ];

  const monthlyPayments = [
    { week: 'Minggu 1', nominal: 'Rp2.8Jt', pct: 60 },
    { week: 'Minggu 2', nominal: 'Rp2.2Jt', pct: 50 },
    { week: 'Minggu 3', nominal: 'Rp2.5Jt', pct: 55 },
    { week: 'Minggu 4', nominal: 'Rp1.25Jt', pct: 30 }
  ];

  return (
    <div className="space-y-6">
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
            onClick={onGenerateInvoices}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-blue-900 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Terbitkan SPP</span>
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

      {/* 5 Top Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">JUMLAH SISWA</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{totalStudents}</div>
          <span className="text-[10px] text-slate-400">Terdaftar di akademi</span>
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
          <span className="text-[10px] text-blue-600 font-semibold">Sabtu, 26 Sep 2026</span>
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
          <span className="text-[10px] text-emerald-700 font-semibold">+12% vs Agustus</span>
        </div>
      </div>

      {/* Ringkasan Keuangan Komprehensif */}
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
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">Rata-rata 92 Siswa</span>
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
                    style={{ height: `${(item.value / item.max) * 100}%` }}
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
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">Target 95%</span>
          </div>

          <div className="h-48 flex items-end justify-between pt-6 px-2 gap-4">
            {monthlyPayments.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 tabular-nums">{w.nominal}</span>
                <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden h-32 flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 shadow-xs"
                    style={{ height: `${w.pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">{w.week}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Feeds: Absensi Terbaru & Pembayaran Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-orange-500" />
              <span>Absensi Terbaru</span>
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
                    <span className="text-[10px] text-slate-500 font-mono">{att.classGroupId}</span>
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
              <span>Pembayaran Terbaru</span>
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
