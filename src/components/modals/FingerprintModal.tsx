import React, { useState } from 'react';
import { Student } from '../../types';
import { X, Fingerprint } from 'lucide-react';

interface FingerprintModalProps {
  isOpen: boolean;
  students: Student[];
  onClose: () => void;
  onSubmit: (studentId: string, date: string, time: string, status: 'HADIR' | 'TIDAK_HADIR') => void;
}

export const FingerprintModal: React.FC<FingerprintModalProps> = ({
  isOpen,
  students,
  onClose,
  onSubmit,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 'BFA-001');
  const [date, setDate] = useState('2026-09-26');
  const [time, setTime] = useState('14:02:15');
  const [status, setStatus] = useState<'HADIR' | 'TIDAK_HADIR'>('HADIR');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedStudentId, date, time, status);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
            <Fingerprint className="w-7 h-7 animate-pulse" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Simulasi Presensi Fingerprint
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan kehadiran biometrik & pembuatan invoice Rp15.000 otomatis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Pilih Siswa Akademi:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-bold"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.classGroupId} - #{st.jerseyNumber || '-'} - {st.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Latihan:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Jam Tap Sidik Jari:</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Status Kehadiran:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'HADIR' | 'TIDAK_HADIR')}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
            >
              <option value="HADIR">HADIR (Buat Tagihan Latihan Rp15.000)</option>
              <option value="TIDAK_HADIR">TIDAK HADIR (Tanpa Tagihan / Bebas Iuran)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition active:scale-95"
            >
              TAP FINGERPRINT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
