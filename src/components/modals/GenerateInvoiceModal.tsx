import React, { useState } from 'react';
import { Student } from '../../types';
import { X, Calendar, DollarSign, Users, CheckCircle2, AlertCircle } from 'lucide-react';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onConfirm: (config: {
    period: string;
    dueDate: string;
    issueDate: string;
    amount: number;
    classGroupId: string;
  }) => void;
}

export const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  isOpen,
  onClose,
  students,
  onConfirm,
}) => {
  const [period, setPeriod] = useState('Oktober 2026');
  const [dueDate, setDueDate] = useState('2026-10-10');
  const [issueDate, setIssueDate] = useState('2026-10-01');
  const [amount, setAmount] = useState(50000);
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  if (!isOpen) return null;

  // Filter targeted active students
  const activeStudents = students.filter((s) => s.status === 'Aktif');
  const targetedStudents = activeStudents.filter(
    (s) => selectedGroup === 'ALL' || s.classGroupId === selectedGroup
  );
  const totalPotential = targetedStudents.length * amount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!period.trim()) return;
    onConfirm({
      period: period.trim(),
      dueDate,
      issueDate,
      amount,
      classGroupId: selectedGroup,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-900 font-black text-sm uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span>Penerbitan Tagihan SPP Bulanan</span>
          </div>
          <p className="text-xs text-slate-500">
            Atur tanggal jatuh tempo, periode bulan, dan sasaran siswa untuk menerbitkan tagihan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Periode SPP Bulanan *
            </label>
            <input
              type="text"
              required
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Contoh: Oktober 2026"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal Terbit *
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jatuh Tempo Bayar *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-rose-700 font-bold focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nominal SPP per Siswa (Rp) *
            </label>
            <input
              type="number"
              required
              min={10000}
              step={5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Target Kelompok Usia Siswa *
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Semua Kelompok Usia (Seluruh Siswa Aktif)</option>
              <option value="U8">Kelompok Usia U8</option>
              <option value="U10">Kelompok Usia U10</option>
              <option value="U11">Kelompok Usia U11</option>
              <option value="U12">Kelompok Usia U12</option>
              <option value="U15">Kelompok Usia U15</option>
              <option value="U17">Kelompok Usia U17</option>
            </select>
          </div>

          {/* Target Preview Box */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
            <div className="flex justify-between font-bold text-blue-950">
              <span>Sasaran Penerbitan:</span>
              <span className="font-black text-blue-800">{targetedStudents.length} Siswa Aktif</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Total Estimasi Tagihan:</span>
              <span className="font-mono font-black text-emerald-700">
                Rp{totalPotential.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/20 active:scale-95 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Terbitkan Tagihan Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
