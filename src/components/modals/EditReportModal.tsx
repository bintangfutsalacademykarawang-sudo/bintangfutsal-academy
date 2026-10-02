import React, { useState, useEffect, useMemo } from 'react';
import { SkillIndicator } from '../../types';
import { X, Award, RotateCcw, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';

interface EditReportModalProps {
  isOpen: boolean;
  studentName?: string;
  studentId?: string;
  initialIndicators: SkillIndicator[];
  initialNotes: string;
  initialEvaluationDate?: string;
  initialAttendancePercent?: number;
  initialTotalSessions?: number;
  onClose: () => void;
  onSubmit: (
    indicators: SkillIndicator[],
    notes: string,
    evaluationDate?: string,
    attendancePercent?: number,
    totalSessions?: number
  ) => void;
}

export const EditReportModal: React.FC<EditReportModalProps> = ({
  isOpen,
  studentName,
  studentId,
  initialIndicators,
  initialNotes,
  initialEvaluationDate,
  initialAttendancePercent = 0,
  initialTotalSessions = 0,
  onClose,
  onSubmit,
}) => {
  const [indicators, setIndicators] = useState<SkillIndicator[]>([]);
  const [notes, setNotes] = useState('');
  const [evaluationDate, setEvaluationDate] = useState('2026-10-01');
  const [attendancePercent, setAttendancePercent] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setIndicators(initialIndicators.map((i) => ({ ...i })));
      setNotes(initialNotes || '');
      setEvaluationDate(
        initialEvaluationDate && initialEvaluationDate !== '2026-09-25'
          ? initialEvaluationDate
          : new Date().toISOString().split('T')[0]
      );
      setAttendancePercent(typeof initialAttendancePercent === 'number' ? initialAttendancePercent : 0);
      setTotalSessions(typeof initialTotalSessions === 'number' ? initialTotalSessions : 0);
    }
  }, [
    isOpen,
    initialIndicators,
    initialNotes,
    initialEvaluationDate,
    initialAttendancePercent,
    initialTotalSessions,
  ]);

  // Live OVR Rating calculation
  const liveOvr = useMemo(() => {
    if (indicators.length === 0) return 0;
    const total = indicators.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return total > 0 ? Math.round(total / indicators.length) : 0;
  }, [indicators]);

  if (!isOpen) return null;

  const handleScoreChange = (key: string, val: number) => {
    const clamped = isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
    setIndicators((prev) =>
      prev.map((item) => (item.key === key ? { ...item, score: clamped } : item))
    );
  };

  const handleResetAllZero = () => {
    setIndicators((prev) => prev.map((item) => ({ ...item, score: 0 })));
  };

  const handleSetPreset = (targetScore: number) => {
    setIndicators((prev) => prev.map((item) => ({ ...item, score: targetScore })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(indicators, notes, evaluationDate, attendancePercent, totalSessions);
    onClose();
  };

  const teknikItems = indicators.filter((item) => item.category === 'Teknik');
  const fisikItems = indicators.filter((item) => item.category === 'Fisik');
  const mentalItems = indicators.filter((item) => item.category === 'Mental');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative my-6 border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition z-10"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Edit Nilai Rapor Atlet: <span className="text-blue-700">{studentName || 'Siswa'}</span>
                </h3>
                {studentId && (
                  <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {studentId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Nilai awal default 0. Geser slider atau ketik angka untuk memberikan penilaian riil atlet.
              </p>
            </div>
          </div>

          {/* Live OVR Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-blue-950 text-white flex items-center gap-1.5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-300">Live OVR:</span>
              <span className="text-base font-black font-mono text-amber-400 tabular-nums">
                {liveOvr}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-xs">
          <span className="text-[11px] font-bold text-slate-600 pl-1">Preset Cepat:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleResetAllZero}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-rose-600 font-bold rounded-lg border border-slate-200 flex items-center gap-1 transition text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Semua (0)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset(75)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-lg border border-slate-200 transition text-[11px]"
            >
              Rata-rata 75
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset(85)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-emerald-700 font-bold rounded-lg border border-slate-200 transition text-[11px]"
            >
              Rata-rata 85
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[68vh] overflow-y-auto pr-1">
          {/* Metadata Section: Tanggal, Kehadiran, Total Sesi */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 text-[11px] mb-1">
                Tanggal Evaluasi:
              </label>
              <input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 text-[11px] mb-1">
                Kehadiran (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={attendancePercent}
                onChange={(e) => setAttendancePercent(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 text-[11px] mb-1">
                Total Sesi Latihan:
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={totalSessions}
                onChange={(e) => setTotalSessions(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* SECTION 1: TEKNIK (SKILLS) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-slate-900 text-xs block flex items-center gap-1.5">
              <span>⚽</span> <span>TEKNIK (SKILLS)</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {teknikItems.map((item) => (
                <div key={item.key} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      {item.name}
                    </label>
                    <span className="font-mono font-black text-amber-600 text-xs">
                      {item.score}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={(e) => handleScoreChange(item.key, Number(e.target.value))}
                    className="w-full accent-amber-500 mb-1 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={(e) => handleScoreChange(item.key, Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-center font-black text-amber-600 text-xs focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: FISIK & MOTORIK */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-slate-900 text-xs block flex items-center gap-1.5">
              <span>🏃</span> <span>FISIK & MOTORIK</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {fisikItems.map((item) => (
                <div key={item.key} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      {item.name}
                    </label>
                    <span className="font-mono font-black text-cyan-600 text-xs">
                      {item.score}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={(e) => handleScoreChange(item.key, Number(e.target.value))}
                    className="w-full accent-cyan-500 mb-1 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={(e) => handleScoreChange(item.key, Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-center font-black text-cyan-600 text-xs focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: MENTAL & SIKAP */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-slate-900 text-xs block flex items-center gap-1.5">
              <span>🧠</span> <span>MENTAL & SIKAP</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {mentalItems.map((item) => (
                <div key={item.key} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 text-[11px] truncate" title={item.name}>
                      {item.name}
                    </label>
                    <span className="font-mono font-black text-emerald-600 text-xs">
                      {item.score}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={(e) => handleScoreChange(item.key, Number(e.target.value))}
                    className="w-full accent-emerald-500 mb-1 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={(e) => handleScoreChange(item.key, Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-center font-black text-emerald-600 text-xs focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Catatan Coaching Staff */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Coaching Staff:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masukkan evaluasi perkembangan atlet..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-600 text-xs leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition active:scale-95 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black rounded-xl shadow-md shadow-orange-600/25 transition active:scale-95 text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Perubahan Nilai Rapor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
