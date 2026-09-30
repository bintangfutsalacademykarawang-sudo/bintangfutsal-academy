import React, { useState, useEffect } from 'react';
import { SkillIndicator } from '../../types';
import { X, Award } from 'lucide-react';

interface EditReportModalProps {
  isOpen: boolean;
  studentName?: string;
  initialIndicators: SkillIndicator[];
  initialNotes: string;
  onClose: () => void;
  onSubmit: (indicators: SkillIndicator[], notes: string) => void;
}

export const EditReportModal: React.FC<EditReportModalProps> = ({
  isOpen,
  studentName,
  initialIndicators,
  initialNotes,
  onClose,
  onSubmit,
}) => {
  const [indicators, setIndicators] = useState<SkillIndicator[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIndicators([...initialIndicators]);
      setNotes(initialNotes);
    }
  }, [isOpen, initialIndicators, initialNotes]);

  if (!isOpen) return null;

  const handleScoreChange = (key: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setIndicators((prev) =>
      prev.map((item) => (item.key === key ? { ...item, score: clamped } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(indicators, notes);
    onClose();
  };

  const teknikItems = indicators.filter((item) => item.category === 'Teknik');
  const fisikItems = indicators.filter((item) => item.category === 'Fisik');
  const mentalItems = indicators.filter((item) => item.category === 'Mental');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 text-slate-800 shadow-2xl relative my-8 border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Edit Nilai E-Rapport: <span className="text-blue-700">{studentName || 'Siswa'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Skala penilaian 0 - 100 untuk 13 Indikator (Teknik, Fisik & Motorik, Mental & Sikap).
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* SECTION 1: TEKNIK */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-slate-800 text-[11px] block">
              ⚽ TEKNIK (SKILLS)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {teknikItems.map((item) => (
                <div key={item.key} className="p-2 bg-white rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">
                    {item.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={(e) => handleScoreChange(item.key, Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-black text-amber-600 text-sm focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: FISIK & MOTORIK */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-slate-800 text-[11px] block">
              🏃 FISIK & MOTORIK
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fisikItems.map((item) => (
                <div key={item.key} className="p-2 bg-white rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">
                    {item.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={(e) => handleScoreChange(item.key, Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-black text-cyan-600 text-sm focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: MENTAL & SIKAP */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-slate-800 text-[11px] block">
              🧠 MENTAL & SIKAP
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {mentalItems.map((item) => (
                <div key={item.key} className="p-2 bg-white rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-700 text-[11px] mb-1 truncate" title={item.name}>
                    {item.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={(e) => handleScoreChange(item.key, Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-black text-emerald-600 text-sm focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Coaching Staff:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tingkatkan lagi konsistensi first touch..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-600 text-xs leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-100 active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition active:scale-95"
            >
              Simpan Rapor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
