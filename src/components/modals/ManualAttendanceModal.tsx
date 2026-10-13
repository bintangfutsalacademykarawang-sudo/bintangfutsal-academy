import React, { useState, useMemo, useEffect } from 'react';
import { Student, TrainingSchedule, Attendance } from '../../types';
import { ALL_KU_CATEGORIES } from '../../data/initialData';
import {
  X,
  UserCheck,
  Calendar,
  Clock,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Check,
  Sparkles,
  Filter,
  User,
  Loader2
} from 'lucide-react';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendances: Attendance[];
  schedules?: TrainingSchedule[];
  initialDate?: string;
  initialClassGroup?: string;
  onSubmit: (
    studentId: string,
    date: string,
    time: string,
    status: 'HADIR' | 'TIDAK_HADIR',
    notes?: string
  ) => Promise<any> | void;
}

const PRESET_NOTES = [
  { label: 'Lupa Kartu / Barcode', status: 'HADIR' as const, note: 'Lupa bawa ID Card (Verifikasi manual pelatih)' },
  { label: 'Scan Kamera Error', status: 'HADIR' as const, note: 'Kendala teknis scan kamera/barcode' },
  { label: 'Terlambat Hadir', status: 'HADIR' as const, note: 'Hadir menyusul di lapangan' },
  { label: 'Izin (Keluarga/Sekolah)', status: 'TIDAK_HADIR' as const, note: 'Izin berhalangan hadir (Ada keperluan keluarga/sekolah)' },
  { label: 'Sakit', status: 'TIDAK_HADIR' as const, note: 'Tidak hadir karena sakit' },
  { label: 'Tanpa Keterangan', status: 'TIDAK_HADIR' as const, note: 'Alpa / Tanpa konfirmasi' },
];

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  students,
  attendances,
  schedules = [],
  initialDate,
  initialClassGroup,
  onSubmit,
}) => {
  const getTodayDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const [date, setDate] = useState(() => initialDate || getTodayDate());
  const [time, setTime] = useState(getCurrentTime);
  const [classFilter, setClassFilter] = useState(() => initialClassGroup || 'Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [status, setStatus] = useState<'HADIR' | 'TIDAK_HADIR'>('HADIR');
  const [notes, setNotes] = useState('');
  const [allowOverwrite, setAllowOverwrite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const activeDate = initialDate || getTodayDate();
      setDate(activeDate);
      setTime(getCurrentTime());
      setClassFilter(initialClassGroup || 'Semua');
      setSearchQuery('');
      setNotes('');
      setAllowOverwrite(false);
      setIsSubmitting(false);
      setSubmitError(null);

      // Auto-select first student if available in filtered list
      const initialActive = students.filter((s) => s.status === 'Aktif');
      const matchesKU = initialClassGroup && initialClassGroup !== 'Semua'
        ? initialActive.filter((s) => s.classGroupId === initialClassGroup)
        : initialActive;
      setSelectedStudentId(matchesKU[0]?.id || initialActive[0]?.id || '');
    }
  }, [isOpen, initialDate, initialClassGroup, students]);

  // Active students filtered by KU and search query
  const filteredStudents = useMemo(() => {
    const active = students.filter((s) => s.status === 'Aktif');
    return active.filter((s) => {
      const matchKU = classFilter === 'Semua' || s.classGroupId === classFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.nickname && s.nickname.toLowerCase().includes(q));
      return matchKU && matchSearch;
    });
  }, [students, classFilter, searchQuery]);

  // Keep selected student valid if list changes
  useEffect(() => {
    if (filteredStudents.length > 0 && !filteredStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(filteredStudents[0].id);
    }
  }, [filteredStudents, selectedStudentId]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Duplicate attendance check: has this student been marked for this date?
  const existingAttendance = useMemo(() => {
    if (!selectedStudentId || !date) return null;
    return attendances.find((a) => a.studentId === selectedStudentId && a.date === date);
  }, [attendances, selectedStudentId, date]);

  // Associated schedule for selected date & KU
  const matchingSchedule = useMemo(() => {
    return schedules.find((sch) => {
      const dateMatches = sch.date === date;
      if (!dateMatches) return false;
      if (!selectedStudent) return true;
      return (
        sch.classGroupId === selectedStudent.classGroupId ||
        (sch.classGroups && sch.classGroups.includes(selectedStudent.classGroupId))
      );
    });
  }, [schedules, date, selectedStudent]);

  const handlePresetNote = (preset: typeof PRESET_NOTES[0]) => {
    setStatus(preset.status);
    setNotes(preset.note);
  };

  const handleUseCurrentTime = () => {
    setTime(getCurrentTime());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || isSubmitting) return;

    if (existingAttendance && !allowOverwrite) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(
        selectedStudentId,
        date,
        time || getCurrentTime(),
        status,
        notes.trim() || undefined
      );
      // Database-First: Modal hanya ditutup jika penulisan server berhasil tanpa error
      onClose();
    } catch (err: any) {
      console.error('Error saat menyimpan absensi manual ke server Firestore:', err);
      setSubmitError(
        err?.message || 'Gagal menyimpan absensi ke server Firestore. Periksa koneksi internet dan coba lagi.'
      );
      // Modal TETAP TERBUKA, tidak menyatakan absensi berhasil
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 text-slate-900 shadow-2xl relative border border-slate-200 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Pencatatan Presensi Manual
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                  Admin / Pelatih
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Catat kehadiran siswa saat lupa kartu ID BFA atau proses scan barcode tidak dapat dilakukan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 pr-1 text-xs flex-1">
          {/* Error Banner jika Firestore Gagal */}
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-rose-900 block">Gagal Menyimpan ke Database Server:</span>
                <span className="text-[11px] leading-relaxed block mt-0.5 text-rose-800">{submitError}</span>
              </div>
            </div>
          )}

          {/* Section 1: Tanggal & Waktu Sesi */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Sesi & Waktu Latihan
              </span>
              {matchingSchedule && (
                <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Jadwal: {matchingSchedule.courtName} ({matchingSchedule.startTime} - {matchingSchedule.endTime})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tanggal Sesi Latihan *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-semibold shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Jam Presensi *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentTime}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Clock className="w-3 h-3" /> Jam Sekarang
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="14:00:00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-mono font-semibold shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pemilihan Siswa */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Pilih Siswa BFA ({filteredStudents.length} Tersedia)
              </span>

              {/* Filter Kelompok Umur */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500">Filter KU:</span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-bold shadow-2xs"
                >
                  <option value="Semua">Semua KU</option>
                  {ALL_KU_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pencarian Siswa */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa atau ID (misal: BFA-001, Kenzo)..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-[10px] font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* List Siswa Terpilih / Grid */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs">
              {filteredStudents.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <User className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p className="font-semibold text-xs">Tidak ada siswa yang cocok dengan pencarian.</p>
                  <p className="text-[10px] text-slate-400">Coba ubah kata kunci atau ganti filter Kelompok Umur.</p>
                </div>
              ) : (
                filteredStudents.map((st) => {
                  const isSelected = st.id === selectedStudentId;
                  const alreadyAttended = attendances.find(
                    (a) => a.studentId === st.id && a.date === date
                  );

                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50/90 border border-blue-400 ring-1 ring-blue-300'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={st.avatar || 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=120'}
                          alt={st.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 truncate block text-xs">
                              {st.name}
                            </span>
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded text-[9px] font-black border border-blue-200 shrink-0">
                              {st.classGroupId}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 block">
                            {st.id} {st.position ? `• ${st.position}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {alreadyAttended && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 ${
                              alreadyAttended.status === 'HADIR'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {alreadyAttended.status === 'HADIR' ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <XCircle className="w-2.5 h-2.5" />
                            )}
                            Sudah Diabsen ({alreadyAttended.status})
                          </span>
                        )}

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: Pencegahan Duplikasi Absensi */}
          {existingAttendance && (
            <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl text-amber-900 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-xs text-amber-900">
                    Peringatan: Siswa Sudah Memiliki Catatan Presensi
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                    <strong>{selectedStudent?.name}</strong> ({selectedStudent?.id}) sudah tercatat pada tanggal{' '}
                    <strong>{existingAttendance.date}</strong> jam <strong>{existingAttendance.checkInTime} WIB</strong> dengan status{' '}
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded font-black text-[10px] ${
                        existingAttendance.status === 'HADIR'
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {existingAttendance.status}
                    </span>
                    {existingAttendance.notes ? ` — Catatan: "${existingAttendance.notes}"` : ''}.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-200">
                <input
                  type="checkbox"
                  checked={allowOverwrite}
                  onChange={(e) => setAllowOverwrite(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="font-bold text-[11px] text-amber-950">
                  Saya mengonfirmasi untuk memperbarui / menimpa data presensi yang sudah ada
                </span>
              </label>
            </div>
          )}

          {/* Section 4: Status Kehadiran */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Status Kehadiran *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('HADIR')}
                className={`p-3 rounded-2xl border-2 transition text-left flex items-start gap-2.5 ${
                  status === 'HADIR'
                    ? 'border-emerald-500 bg-emerald-50/90 shadow-xs ring-1 ring-emerald-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    status === 'HADIR' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-black text-xs text-slate-900 block">HADIR DI LAPANGAN</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                    ✓ Otomatis terbit tagihan sesi Rp15.000
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('TIDAK_HADIR')}
                className={`p-3 rounded-2xl border-2 transition text-left flex items-start gap-2.5 ${
                  status === 'TIDAK_HADIR'
                    ? 'border-rose-500 bg-rose-50/90 shadow-xs ring-1 ring-rose-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    status === 'TIDAK_HADIR' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-black text-xs text-slate-900 block">TIDAK HADIR / IZIN / SAKIT</span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    Bebas biaya iuran latihan (Rp0)
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 5: Preset Keterangan & Catatan Opsional */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700">
                Pilih Alasan Cepat (Preset Keterangan)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Klik untuk isi otomatis</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_NOTES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetNote(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                    notes === p.note
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 mt-2">
                Catatan / Keterangan Manual (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Lupa bawa kartu ID, orang tua titip info lewat pelatih lapangan..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium shadow-2xs resize-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedStudentId || (Boolean(existingAttendance) && !allowOverwrite) || isSubmitting}
            className={`w-full sm:w-auto px-5 py-2.5 font-black rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-1.5 ${
              !selectedStudentId || (Boolean(existingAttendance) && !allowOverwrite) || isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-500/25 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? 'Menyimpan ke Server...'
                : existingAttendance && allowOverwrite
                ? 'Perbarui Presensi Siswa'
                : existingAttendance
                ? 'Konfirmasi Diperlukan'
                : 'Simpan Presensi Manual'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
