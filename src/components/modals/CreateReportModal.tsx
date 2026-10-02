import React, { useState, useEffect } from 'react';
import { Student, SkillIndicator, StudentReport } from '../../types';
import { 
  ALL_KU_CATEGORIES, 
  calculateAgeAndGroup, 
  INITIAL_SKILL_INDICATORS,
  createDefaultReport,
  getNextStudentId 
} from '../../data/initialData';
import { 
  X, 
  Sparkles, 
  UserPlus, 
  UserCheck, 
  Sliders, 
  CheckCircle2, 
  Calendar, 
  Award,
  Zap
} from 'lucide-react';

interface CreateReportModalProps {
  isOpen: boolean;
  students: Student[];
  studentReports: Record<string, StudentReport>;
  onClose: () => void;
  onSubmitExistingStudent: (
    studentId: string,
    indicators: SkillIndicator[],
    notes: string,
    evaluationDate: string,
    attendancePercent: number,
    totalSessions: number
  ) => void;
  onSubmitNewStudent: (
    studentData: Omit<Student, 'id' | 'joinedDate'>,
    reportData: {
      indicators: SkillIndicator[];
      notes: string;
      evaluationDate: string;
      attendancePercent: number;
      totalSessions: number;
    }
  ) => void;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  students,
  studentReports,
  onClose,
  onSubmitExistingStudent,
  onSubmitNewStudent,
}) => {
  const [tabMode, setTabMode] = useState<'existing' | 'new'>('existing');

  // Existing student selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // New student form state
  const [name, setName] = useState('');
  const [birthPlace, setBirthPlace] = useState('Karawang');
  const [birthDate, setBirthDate] = useState('2016-05-15');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [classGroupId, setClassGroupId] = useState('U10');
  const [position, setPosition] = useState<Student['position']>('Flank');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);

  // Report metadata state
  const [evaluationDate, setEvaluationDate] = useState('2026-10-01');
  const [attendancePercent, setAttendancePercent] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);

  // 13 Indicators state (Skala 0 - 100)
  const [indicators, setIndicators] = useState<SkillIndicator[]>(() =>
    INITIAL_SKILL_INDICATORS.map((i) => ({ ...i }))
  );
  const [coachNotes, setCoachNotes] = useState(
    'Belum ada evaluasi nilai untuk periode ini. Silakan sesuaikan penilaian riil atlet.'
  );

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      if (students.length > 0) {
        const firstId = students[0].id;
        setSelectedStudentId(firstId);
        loadStudentReportData(firstId);
      }
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  // Load existing report or create defaults when choosing an existing student
  const loadStudentReportData = (stId: string) => {
    const existing = studentReports[stId];
    if (existing) {
      setIndicators(existing.skillIndicators.map((i) => ({ ...i })));
      setCoachNotes(existing.coachNotes);
      setEvaluationDate(existing.evaluationDate || '2026-10-01');
      setAttendancePercent(typeof existing.attendancePercent === 'number' ? existing.attendancePercent : 0);
      setTotalSessions(typeof existing.totalSessions === 'number' ? existing.totalSessions : 0);
    } else {
      const st = students.find((s) => s.id === stId);
      const def = createDefaultReport(stId, st?.name, st?.position);
      setIndicators(def.skillIndicators.map((i) => ({ ...i })));
      setCoachNotes(def.coachNotes);
      setEvaluationDate(def.evaluationDate);
      setAttendancePercent(def.attendancePercent ?? 0);
      setTotalSessions(def.totalSessions ?? 0);
    }
  };

  const handleSelectExistingStudent = (stId: string) => {
    setSelectedStudentId(stId);
    loadStudentReportData(stId);
  };

  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    const { group } = calculateAgeAndGroup(val);
    setClassGroupId(group);
  };

  const handleScoreChange = (key: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setIndicators((prev) =>
      prev.map((ind) => (ind.key === key ? { ...ind, score: clamped } : ind))
    );
  };

  const applyPresetAll = (score: number) => {
    setIndicators((prev) => prev.map((ind) => ({ ...ind, score })));
  };

  const applyPositionPreset = (pos: Student['position']) => {
    const isGK = pos === 'Goalkeeper';
    const isAnchor = pos === 'Anchor';
    const isPivot = pos === 'Pivot';

    setIndicators((prev) =>
      prev.map((ind) => {
        if (isGK) {
          if (ind.key === 'kelincahan') return { ...ind, score: 92 };
          if (ind.key === 'koordinasi') return { ...ind, score: 90 };
          if (ind.key === 'fokus') return { ...ind, score: 93 };
          if (ind.key === 'keseimbangan') return { ...ind, score: 88 };
          if (ind.key === 'shoot') return { ...ind, score: 72 };
          return { ...ind, score: 84 };
        } else if (isAnchor) {
          if (ind.key === 'pass') return { ...ind, score: 88 };
          if (ind.key === 'disiplin') return { ...ind, score: 90 };
          if (ind.key === 'fokus') return { ...ind, score: 89 };
          if (ind.key === 'k_sama') return { ...ind, score: 88 };
          return { ...ind, score: 85 };
        } else if (isPivot) {
          if (ind.key === 'shoot') return { ...ind, score: 90 };
          if (ind.key === 'ctrl') return { ...ind, score: 86 };
          if (ind.key === 'p_diri') return { ...ind, score: 88 };
          return { ...ind, score: 84 };
        } else {
          // Flank
          if (ind.key === 'drib') return { ...ind, score: 89 };
          if (ind.key === 'kelincahan') return { ...ind, score: 90 };
          if (ind.key === 'pass') return { ...ind, score: 86 };
          return { ...ind, score: 84 };
        }
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tabMode === 'existing') {
      if (!selectedStudentId) return;
      onSubmitExistingStudent(
        selectedStudentId,
        indicators,
        coachNotes,
        evaluationDate,
        attendancePercent,
        totalSessions
      );
    } else {
      if (!name.trim() || !parentName.trim() || !phone.trim()) {
        alert('Mohon lengkapi Nama Siswa, Nama Wali, dan Nomor WhatsApp!');
        return;
      }

      onSubmitNewStudent(
        {
          name: name.trim(),
          birthPlace: birthPlace.trim() || 'Karawang',
          birthDate,
          gender,
          parentName: parentName.trim(),
          phone: phone.trim(),
          classGroupId,
          status: 'Aktif',
          position,
          jerseyNumber: Number(jerseyNumber) || 10,
          avatar: `https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=240&auto=format&fit=crop&q=80`,
          documents: { kk: '-', akte: '-', kia: '-', ijazah: '-' },
        },
        {
          indicators,
          notes: coachNotes,
          evaluationDate,
          attendancePercent,
          totalSessions,
        }
      );
    }

    onClose();
  };

  const teknikItems = indicators.filter((i) => i.category === 'Teknik');
  const fisikItems = indicators.filter((i) => i.category === 'Fisik');
  const mentalItems = indicators.filter((i) => i.category === 'Mental');

  const selectedExistingStudent = students.find((s) => s.id === selectedStudentId);
  const nextStudentId = getNextStudentId(students);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative my-6 border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Input & Buat Data E-Rapport Atlet
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih atlet yang sudah terdaftar atau daftarkan siswa baru untuk mengisi penilaian 13 Performance Radar.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Mode: Existing Student vs New Student */}
        <div className="pt-3 pb-2 flex gap-2">
          <button
            type="button"
            onClick={() => setTabMode('existing')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 border ${
              tabMode === 'existing'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Pilih Siswa Terdaftar</span>
          </button>

          <button
            type="button"
            onClick={() => setTabMode('new')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 border ${
              tabMode === 'new'
                ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Daftarkan Siswa Baru</span>
          </button>
        </div>

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs py-2">
          
          {/* TAB 1: EXISTING STUDENT SELECTOR */}
          {tabMode === 'existing' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
              <label className="block font-black text-blue-900 text-xs uppercase tracking-wider">
                Pilih Atlet untuk Diinputkan / Diperbarui Rapornya:
              </label>

              <select
                value={selectedStudentId}
                onChange={(e) => handleSelectExistingStudent(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.id}) • Kelompok {st.classGroupId} • {st.position} (#{st.jerseyNumber}) - Wali: {st.parentName}
                  </option>
                ))}
              </select>

              {selectedExistingStudent && (
                <div className="flex items-center space-x-3 p-2.5 bg-white rounded-xl border border-blue-200">
                  <img
                    src={selectedExistingStudent.avatar}
                    alt={selectedExistingStudent.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-slate-900 text-xs block">
                      {selectedExistingStudent.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ID: {selectedExistingStudent.id} • KU: {selectedExistingStudent.classGroupId} • Posisi: {selectedExistingStudent.position} • No. HP: {selectedExistingStudent.phone}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    Aktif
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NEW STUDENT REGISTRATION FIELDS */}
          {tabMode === 'new' && (
            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-3">
              <div className="p-3 bg-white rounded-xl border border-orange-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Kode ID Atlet Baru (Otomatis Melanjutkan Nomor)
                  </span>
                  <span className="text-base font-black font-mono text-orange-600 tracking-wide">
                    {nextStudentId}
                  </span>
                </div>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200">
                  ✓ Auto Nomor Urut
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Khairul Anam"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali *</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Contoh: Bpk. Kurniawan"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp Wali *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Karawang"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir (Auto-KU)</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelompok (KU)</label>
                  <select
                    value={classGroupId}
                    onChange={(e) => setClassGroupId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
                  >
                    {ALL_KU_CATEGORIES.map((ku) => (
                      <option key={ku} value={ku}>
                        {ku} ({parseInt(ku.replace('U', ''), 10)} Tahun)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Posisi Futsal</label>
                  <select
                    value={position}
                    onChange={(e) => {
                      const pos = e.target.value as Student['position'];
                      setPosition(pos);
                      applyPositionPreset(pos);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
                  >
                    <option value="Flank">Flank</option>
                    <option value="Pivot">Pivot</option>
                    <option value="Anchor">Anchor</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Jersey</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* EVALUATION METADATA (Date, Attendance %, Total Sessions) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="font-extrabold text-slate-800 text-xs block mb-2">
              Parameter Evaluasi Periode:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">
                  Tanggal Evaluasi
                </label>
                <input
                  type="date"
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">
                  Kehadiran Latihan (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={attendancePercent}
                  onChange={(e) => setAttendancePercent(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-cyan-700 font-black focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">
                  Total Sesi Latihan
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-emerald-700 font-black focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* PRESET QUICK BUTTONS */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <span className="font-extrabold text-slate-800 text-xs">
              Input 13 Indikator Performance Radar (Skala 0 - 100):
            </span>
            <div className="flex items-center space-x-1.5 text-[10px]">
              <span className="text-slate-400 font-semibold">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => applyPresetAll(80)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
              >
                Semua 80
              </button>
              <button
                type="button"
                onClick={() => applyPresetAll(85)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
              >
                Semua 85
              </button>
              <button
                type="button"
                onClick={() => applyPositionPreset(position)}
                className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-extrabold flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-orange-600" />
                <span>Preset Sesuai Posisi</span>
              </button>
            </div>
          </div>

          {/* 1. TEKNIK (SKILLS) - FULL UNABBREVIATED LABELS */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-slate-800 text-[11px] block">
              ⚽ TEKNIK (SKILLS)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {teknikItems.map((item) => (
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-black text-amber-600 text-sm focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 2. FISIK & MOTORIK - FULL UNABBREVIATED LABELS */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-slate-800 text-[11px] block">
              🏃 FISIK & MOTORIK
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fisikItems.map((item) => (
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-black text-cyan-600 text-sm focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. MENTAL & SIKAP - FULL UNABBREVIATED LABELS */}
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

          {/* CATATAN COACHING STAFF */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Coaching Staff:
            </label>
            <textarea
              rows={2}
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Tuliskan catatan perkembangan dan evaluasi untuk atlet..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-600 text-xs leading-relaxed"
            />
          </div>

          {/* Action Submit */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {tabMode === 'existing'
                  ? 'Simpan & Tampilkan Rapor'
                  : 'Daftarkan Siswa & Buat Rapor'}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
