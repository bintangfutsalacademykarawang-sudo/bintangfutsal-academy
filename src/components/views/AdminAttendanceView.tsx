import React, { useState } from 'react';
import { Attendance } from '../../types';
import { ALL_KU_CATEGORIES } from '../../data/initialData';
import { Fingerprint, CheckCircle2, XCircle, Users } from 'lucide-react';

interface AdminAttendanceViewProps {
  attendances: Attendance[];
  onOpenFingerprint: () => void;
}

export const AdminAttendanceView: React.FC<AdminAttendanceViewProps> = ({
  attendances,
  onOpenFingerprint,
}) => {
  const [dateFilter, setDateFilter] = useState('2026-09-26');
  const [classFilter, setClassFilter] = useState('U11');

  const filtered = attendances.filter(
    (a) => (classFilter === 'Semua' || a.classGroupId === classFilter) && (!dateFilter || a.date === dateFilter)
  );

  const hadirCount = filtered.filter((a) => a.status === 'HADIR').length;
  const tidakHadirCount = filtered.filter((a) => a.status !== 'HADIR').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Absensi Lapangan
          </h1>
          <p className="text-xs text-slate-500">
            Rekap kehadiran fingerprint dan auto-invoicing sesi latihan mingguan (Rp15.000/sesi).
          </p>
        </div>
        <button
          onClick={onOpenFingerprint}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-orange-500/20 transition flex items-center space-x-1.5 active:scale-95 self-start sm:self-auto"
        >
          <Fingerprint className="w-4 h-4" />
          <span>Simulasi Tap Presensi</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center shadow-xs">
        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Tanggal Latihan:
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
            Kelas / Usia:
          </label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-bold"
          >
            <option value="Semua">Semua Kelompok</option>
            {ALL_KU_CATEGORIES.map((c) => {
              const age = parseInt(c.replace('U', ''), 10);
              return (
                <option key={c} value={c}>
                  Kelas {c} ({age} Thn)
                </option>
              );
            })}
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
            <span className="text-lg font-black text-slate-900 tabular-nums">{filtered.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Nama Siswa</th>
                <th className="px-4 py-3.5">Jam Fingerprint</th>
                <th className="px-4 py-3.5">Status Kehadiran</th>
                <th className="px-4 py-3.5">Tagihan Sesi Latihan</th>
                <th className="px-4 py-3.5 text-right">Logika Sistem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data presensi untuk filter tanggal & kelas ini.
                  </td>
                </tr>
              ) : (
                filtered.map((att) => {
                  const isHadir = att.status === 'HADIR';
                  return (
                    <tr key={att.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{att.studentName}</td>
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
                          <span className="text-orange-600">Rp15.000</span>
                        ) : (
                          <span className="text-slate-400">- (Rp0)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[11px] text-slate-500">
                        {isHadir ? 'Invoice otomatis diterbitkan' : 'Tidak hadir = Bebas Iuran'}
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
