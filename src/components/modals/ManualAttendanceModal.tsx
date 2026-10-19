import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, TrainingSchedule, Attendance, Invoice } from '../../types';
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
  Check,
  Sparkles,
  Filter,
  User,
  Loader2,
  Users,
  CheckSquare,
  RotateCcw,
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';

export interface BatchAttendanceItem {
  studentId: string;
  date: string;
  time: string;
  status: 'HADIR' | 'TIDAK_HADIR';
  notes?: string;
}

export interface BatchAttendanceResult {
  successCount: number;
  failCount: number;
  errors: string[];
  attendanceSuccessCount?: number;
  attendanceFailCount?: number;
  attendanceErrors?: Array<{ studentId: string; studentName: string; error: string }>;
  invoiceSuccessCount?: number;
  invoiceFailCount?: number;
  invoiceErrors?: Array<{
    studentId: string;
    studentName: string;
    invoiceId: string;
    error: string;
    invoiceData?: Invoice;
  }>;
}

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
  onBatchSubmit?: (
    items: BatchAttendanceItem[]
  ) => Promise<BatchAttendanceResult | any> | void;
  onRetryInvoices?: (
    invoices: Invoice[]
  ) => Promise<{ successCount: number; failCount: number; errors: string[] }> | void;
}

const PRESET_NOTES = [
  { label: 'Lupa Kartu / ID', status: 'HADIR' as const, note: 'Lupa bawa ID Card (Verifikasi fisik pelatih di lapangan)' },
  { label: 'Scan Kamera Error', status: 'HADIR' as const, note: 'Kendala teknis scan kamera/barcode gate' },
  { label: 'Terlambat Hadir', status: 'HADIR' as const, note: 'Hadir menyusul di lapangan' },
  { label: 'Izin (Keluarga / Sekolah)', status: 'TIDAK_HADIR' as const, note: 'Izin berhalangan hadir (Ada keperluan keluarga/sekolah)' },
  { label: 'Sakit', status: 'TIDAK_HADIR' as const, note: 'Tidak hadir karena kondisi kesehatan / sakit' },
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
  onBatchSubmit,
  onRetryInvoices,
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
  const [listTab, setListTab] = useState<'all' | 'selected' | 'unmarked' | 'marked'>('all');
  
  // Multi-Select state: array of selected student IDs
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  const [status, setStatus] = useState<'HADIR' | 'TIDAK_HADIR'>('HADIR');
  const [notes, setNotes] = useState('');
  const [allowOverwrite, setAllowOverwrite] = useState(false);
  
  // Submission & Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<{ current: number; total: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRetryingInvoices, setIsRetryingInvoices] = useState(false);
  const [retryInvoiceSuccessMessage, setRetryInvoiceSuccessMessage] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<(BatchAttendanceResult & { date: string }) | null>(null);

  // Track previous open state to avoid resetting form when attendances change while open
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    // Only reset state when modal transitions from closed to opened
    if (isOpen && !prevIsOpenRef.current) {
      const activeDate = initialDate || getTodayDate();
      setDate(activeDate);
      setTime(getCurrentTime());
      setClassFilter(initialClassGroup || 'Semua');
      setSearchQuery('');
      setNotes('');
      setAllowOverwrite(false);
      setIsSubmitting(false);
      setSubmitProgress(null);
      setSubmitError(null);
      setSubmitResult(null);
      setRetryInvoiceSuccessMessage(null);
      setSelectedStudentIds([]);
      setListTab('all');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialDate, initialClassGroup]);

  // Daftar seluruh siswa aktif
  const allActiveStudents = useMemo(() => {
    return students.filter((s) => s.status === 'Aktif');
  }, [students]);

  // Siswa aktif pada filter KU yang dipilih
  const studentsInKu = useMemo(() => {
    return classFilter === 'Semua'
      ? allActiveStudents
      : allActiveStudents.filter((s) => s.classGroupId === classFilter);
  }, [allActiveStudents, classFilter]);

  // Map catatan presensi yang sudah ada pada tanggal yang dipilih
  const existingAttendancesMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendances.forEach((a) => {
      if (a.date === date) {
        map.set(a.studentId, a);
      }
    });
    return map;
  }, [attendances, date]);

  // Siswa aktif yang difilter berdasarkan KU dan pencarian nama/ID/panggilan
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return studentsInKu.filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.nickname && s.nickname.toLowerCase().includes(q))
      );
    });
  }, [studentsInKu, searchQuery]);

  // Siswa yang ditampilkan setelah menerapkan sub-tab (Semua, Terpilih, Belum Presensi, Sudah Presensi)
  const displayedStudents = useMemo(() => {
    if (listTab === 'selected') {
      return filteredStudents.filter((s) => selectedStudentIds.includes(s.id));
    }
    if (listTab === 'unmarked') {
      return filteredStudents.filter((s) => !existingAttendancesMap.has(s.id));
    }
    if (listTab === 'marked') {
      return filteredStudents.filter((s) => existingAttendancesMap.has(s.id));
    }
    return filteredStudents;
  }, [filteredStudents, listTab, selectedStudentIds, existingAttendancesMap]);

  // Statistik siswa untuk tampilan filter saat ini
  const unmarkedInFiltered = useMemo(() => {
    return filteredStudents.filter((s) => !existingAttendancesMap.has(s.id));
  }, [filteredStudents, existingAttendancesMap]);

  const markedInFiltered = useMemo(() => {
    return filteredStudents.filter((s) => existingAttendancesMap.has(s.id));
  }, [filteredStudents, existingAttendancesMap]);

  const selectedInFilteredCount = useMemo(() => {
    return filteredStudents.filter((s) => selectedStudentIds.includes(s.id)).length;
  }, [filteredStudents, selectedStudentIds]);

  // Daftar siswa terpilih yang SUDAH memiliki presensi pada tanggal yang dipilih
  const selectedAlreadyMarkedStudents = useMemo(() => {
    return allActiveStudents.filter(
      (s) => selectedStudentIds.includes(s.id) && existingAttendancesMap.has(s.id)
    );
  }, [allActiveStudents, selectedStudentIds, existingAttendancesMap]);

  // Jadwal latihan yang cocok untuk tanggal & filter KU
  const matchingSchedule = useMemo(() => {
    return schedules.find((sch) => {
      const dateMatches = sch.date === date;
      if (!dateMatches) return false;
      if (classFilter === 'Semua') return true;
      return (
        sch.classGroupId === classFilter ||
        (sch.classGroups && sch.classGroups.includes(classFilter))
      );
    });
  }, [schedules, date, classFilter]);

  // Toggle pilihan satu siswa
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
    if (submitError) setSubmitError(null);
  };

  // Pilih semua hasil filter yang sedang ditampilkan
  const handleSelectAllFiltered = () => {
    const idsToSelect = filteredStudents.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...idsToSelect])));
    if (submitError) setSubmitError(null);
  };

  // Pilih hanya siswa yang belum memiliki catatan presensi pada hasil filter
  const handleSelectAllUnmarkedFiltered = () => {
    const idsToSelect = unmarkedInFiltered.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...idsToSelect])));
    if (submitError) setSubmitError(null);
  };

  // Pilih seluruh siswa di KU yang dipilih
  const handleSelectAllInKu = () => {
    const idsToSelect = studentsInKu.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...idsToSelect])));
    if (submitError) setSubmitError(null);
  };

  // Pilih seluruh siswa aktif (tanpa terkecuali)
  const handleSelectAllActive = () => {
    const allIds = allActiveStudents.map((s) => s.id);
    setSelectedStudentIds(allIds);
    if (submitError) setSubmitError(null);
  };

  // Kosongkan seluruh pilihan siswa
  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
    if (submitError) setSubmitError(null);
  };

  // Hapus dari pilihan: khusus siswa yang sudah memiliki catatan presensi
  const handleRemoveAlreadyMarkedFromSelection = () => {
    setSelectedStudentIds((prev) =>
      prev.filter((id) => !existingAttendancesMap.has(id))
    );
  };

  const handlePresetNote = (preset: typeof PRESET_NOTES[0]) => {
    setStatus(preset.status);
    setNotes(preset.note);
  };

  const handleUseCurrentTime = () => {
    setTime(getCurrentTime());
  };

  // Recovery Handler: Coba terbitkan ulang hanya invoice yang sebelumnya gagal
  const handleRetryFailedInvoices = async () => {
    if (
      !submitResult ||
      !submitResult.invoiceErrors ||
      submitResult.invoiceErrors.length === 0 ||
      !onRetryInvoices
    ) {
      return;
    }

    const invoicesToRetry = submitResult.invoiceErrors
      .map((e) => e.invoiceData)
      .filter(Boolean) as Invoice[];

    if (invoicesToRetry.length === 0) return;

    setIsRetryingInvoices(true);
    setRetryInvoiceSuccessMessage(null);
    try {
      const res = await onRetryInvoices(invoicesToRetry);
      if (res && res.failCount === 0) {
        setRetryInvoiceSuccessMessage(
          `✓ Seluruh ${res.successCount} tagihan latihan berhasil diterbitkan ke database!`
        );
        setSubmitResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            invoiceSuccessCount: (prev.invoiceSuccessCount || 0) + res.successCount,
            invoiceFailCount: 0,
            invoiceErrors: [],
          };
        });
      } else if (res) {
        const failedInvoiceIds = (res.errors || []).map((e: string) => e.split(':')[0].trim());
        setSubmitResult((prev) => {
          if (!prev) return null;
          const remainingErrors = (prev.invoiceErrors || []).filter(
            (ie) =>
              failedInvoiceIds.includes(ie.studentName) ||
              failedInvoiceIds.includes(ie.studentId) ||
              failedInvoiceIds.includes(ie.invoiceId)
          );
          return {
            ...prev,
            invoiceSuccessCount: (prev.invoiceSuccessCount || 0) + res.successCount,
            invoiceFailCount: res.failCount,
            invoiceErrors: remainingErrors,
          };
        });
      }
    } catch (err: any) {
      console.error('Error saat menerbitkan ulang tagihan:', err);
    } finally {
      setIsRetryingInvoices(false);
    }
  };

  // Submit Massal Seluruh Siswa Terpilih (Batch Save)
  const handleSubmitBatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedStudentIds.length === 0 || isSubmitting) return;

    // Jika ada siswa yang sudah diabsen dan konfirmasi overwrite belum dicentang
    if (selectedAlreadyMarkedStudents.length > 0 && !allowOverwrite) {
      setSubmitError(
        `Terdapat ${selectedAlreadyMarkedStudents.length} siswa yang sudah memiliki catatan presensi pada tanggal ${date}. Harap centang konfirmasi penimpaan data presensi di bawah atau keluarkan mereka untuk melanjutkan.`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);
    setRetryInvoiceSuccessMessage(null);
    setSubmitProgress({ current: 0, total: selectedStudentIds.length });

    const currentTime = time || getCurrentTime();
    const cleanNotes = notes.trim() || undefined;

    const itemsToSubmit: BatchAttendanceItem[] = selectedStudentIds.map((id) => ({
      studentId: id,
      date,
      time: currentTime,
      status,
      notes: cleanNotes,
    }));

    try {
      let result: BatchAttendanceResult;

      if (onBatchSubmit) {
        const res = await onBatchSubmit(itemsToSubmit);
        result = res || {
          successCount: itemsToSubmit.length,
          failCount: 0,
          errors: [],
          attendanceSuccessCount: itemsToSubmit.length,
          attendanceFailCount: 0,
        };
      } else {
        // Fallback sequential jika hanya ada single onSubmit
        let sCount = 0;
        let fCount = 0;
        const errs: string[] = [];

        for (let i = 0; i < itemsToSubmit.length; i++) {
          const item = itemsToSubmit[i];
          setSubmitProgress({ current: i + 1, total: itemsToSubmit.length });
          try {
            await onSubmit(item.studentId, item.date, item.time, item.status, item.notes);
            sCount++;
          } catch (err: any) {
            fCount++;
            errs.push(`${item.studentId}: ${err?.message || 'Gagal menyimpan'}`);
          }
        }
        result = {
          successCount: sCount,
          failCount: fCount,
          errors: errs,
          attendanceSuccessCount: sCount,
          attendanceFailCount: fCount,
        };
      }

      setSubmitResult({
        ...result,
        date,
      });

      const attFail =
        result.attendanceFailCount !== undefined ? result.attendanceFailCount : result.failCount;

      if (attFail === 0) {
        // Presensi seluruhnya sukses tersimpan: kosongkan pilihan siswa agar tidak mengulang presensi
        setSelectedStudentIds([]);
        setAllowOverwrite(false);
      } else {
        // Jika ada presensi yang gagal: hanya pertahankan siswa yang presensinya gagal agar dapat dicoba ulang
        const failedIds =
          result.attendanceErrors && result.attendanceErrors.length > 0
            ? result.attendanceErrors.map((e) => e.studentId)
            : result.errors.map((e) => e.split(':')[0].trim());
        setSelectedStudentIds(failedIds);
      }
    } catch (err: any) {
      console.error('Error saat menyimpan presensi massal ke server Firestore:', err);
      setSubmitError(
        err?.message || 'Gagal menyimpan presensi ke server Firestore. Periksa koneksi internet dan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 text-slate-900 shadow-2xl relative border border-slate-200 my-4 max-h-[94vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Pencatatan Presensi Massal Siswa
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                  Admin / Pelatih
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pilih beberapa siswa sekaligus untuk mencatat kehadiran dalam satu sesi latihan di lapangan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1 text-xs flex-1">
          {/* Banner 1: Sukses Penuh Presensi & Tagihan */}
          {submitResult &&
            (submitResult.attendanceFailCount ?? submitResult.failCount) === 0 &&
            (submitResult.invoiceFailCount ?? 0) === 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-black text-sm text-emerald-900">
                      Presensi & Tagihan Berhasil Disimpan!
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                      Sebanyak <strong>{submitResult.attendanceSuccessCount ?? submitResult.successCount} siswa</strong> berhasil dicatat pada sesi tanggal{' '}
                      <strong>{submitResult.date}</strong> dan seluruh tagihan latihan telah terbit ke database. Anda dapat melanjutkan pencatatan siswa lainnya.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitResult(null)}
                    className="text-emerald-600 hover:text-emerald-900 p-1 cursor-pointer"
                    title="Tutup pesan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          {/* Banner 2: Sukses Pemulihan Tagihan yang Sebelumnya Gagal */}
          {retryInvoiceSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{retryInvoiceSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setRetryInvoiceSuccessMessage(null)}
                className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Banner 3: PERINGATAN PARSIAL - Presensi Tersimpan, Namun Tagihan Gagal Disimpan */}
          {submitResult && (submitResult.invoiceFailCount ?? 0) > 0 && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl text-amber-950 space-y-3 animate-in fade-in shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs text-amber-950 uppercase tracking-tight">
                      ⚠️ Presensi Tersimpan, Namun {submitResult.invoiceFailCount} Tagihan Latihan Gagal Disimpan
                    </h4>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-black rounded text-[9px]">
                      Perlu Tindakan
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed mt-1">
                    Kehadiran untuk <strong>{submitResult.attendanceSuccessCount ?? submitResult.successCount} siswa</strong> sudah tercatat aman di presensi. Namun, tagihan sesi Rp15.000 untuk <strong>{submitResult.invoiceFailCount} siswa</strong> berikut belum berhasil disimpan ke database:
                  </p>

                  {/* List Siswa yang Tagihannya Gagal */}
                  <div className="bg-white/90 rounded-xl p-2.5 border border-amber-300 max-h-36 overflow-y-auto space-y-1.5 mt-2">
                    {submitResult.invoiceErrors?.map((ie, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] border-b border-amber-100 last:border-0 pb-1 last:pb-0">
                        <span className="font-bold text-slate-900">
                          {ie.studentName} <span className="font-mono text-slate-500 text-[10px]">({ie.studentId})</span>
                        </span>
                        <span className="text-amber-800 text-[10px] font-mono">
                          {ie.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action: Coba Terbitkan Ulang Tagihan */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-amber-200">
                <span className="text-[10px] text-amber-800">
                  Data presensi tidak akan terulang. Klik tombol untuk menerbitkan tagihan yang tertunda:
                </span>
                <button
                  type="button"
                  onClick={handleRetryFailedInvoices}
                  disabled={isRetryingInvoices || !onRetryInvoices}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
                >
                  {isRetryingInvoices ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isRetryingInvoices
                      ? 'Menerbitkan Ulang Tagihan...'
                      : `Coba Terbitkan Ulang (${submitResult.invoiceFailCount} Tagihan)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Banner 4: Peringatan Presensi Gagal */}
          {submitResult && (submitResult.attendanceFailCount ?? submitResult.failCount) > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-black text-xs text-rose-900">
                    Gagal Menyimpan Presensi untuk {submitResult.attendanceFailCount ?? submitResult.failCount} Siswa
                  </h4>
                  <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                    Siswa yang gagal disimpan tetap berada dalam daftar pilihan terpilih di bawah agar Anda dapat mencoba kembali. Rincian kendala:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 font-mono text-[10px] text-rose-900">
                    {submitResult.attendanceErrors && submitResult.attendanceErrors.length > 0
                      ? submitResult.attendanceErrors.map((e, idx) => (
                          <li key={idx}>
                            {e.studentName}: {e.error}
                          </li>
                        ))
                      : submitResult.errors.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitResult(null)}
                  className="text-rose-600 hover:text-rose-900 p-1 cursor-pointer"
                  title="Tutup pesan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Error Banner jika Server Gagal */}
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-rose-900 block">Pemberitahuan Sistem:</span>
                <span className="text-[11px] leading-relaxed block mt-0.5 text-rose-800">{submitError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="text-rose-400 hover:text-rose-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
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
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-semibold shadow-2xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Jam Presensi *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentTime}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
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

          {/* Section 2: Pemilihan Banyak Siswa (Multi-Select) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div>
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Daftar Siswa BFA</span>
                </span>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  <strong className="text-blue-700 font-black">{selectedStudentIds.length} siswa dipilih</strong> dari{' '}
                  <strong className="text-slate-900 font-black">{studentsInKu.length} tersedia</strong>
                  {classFilter !== 'Semua' ? ` (${classFilter})` : ' (Semua KU)'}
                  {searchQuery && ` • Menampilkan ${filteredStudents.length} hasil pencarian`}
                </p>
              </div>

              {/* Filter Kelompok Umur (KU) */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <Filter className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500">Filter KU:</span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-bold shadow-2xs cursor-pointer"
                >
                  <option value="Semua">Semua KU ({allActiveStudents.length})</option>
                  {ALL_KU_CATEGORIES.map((c) => {
                    const countInKu = allActiveStudents.filter((s) => s.classGroupId === c).length;
                    return (
                      <option key={c} value={c}>
                        {c} ({countInKu})
                      </option>
                    );
                  })}
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
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-14 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-[10px] font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Toolbar Tombol Ceklis Semua & Hapus Pilihan */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Tombol Pilih Semua Hasil Tampil */}
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl border border-blue-200 transition active:scale-95 flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer"
                  title={`Pilih semua ${filteredStudents.length} siswa yang sedang ditampilkan`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {searchQuery || classFilter !== 'Semua'
                      ? `Pilih Semua Hasil Tampil (${filteredStudents.length})`
                      : `Pilih Semua Siswa (${filteredStudents.length})`}
                  </span>
                </button>

                {/* Tombol Pilih Semua Siswa KU jika sedang ada pencarian */}
                {searchQuery && classFilter !== 'Semua' && (
                  <button
                    type="button"
                    onClick={handleSelectAllInKu}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-xl border border-indigo-200 transition active:scale-95 flex items-center gap-1 text-xs shadow-2xs cursor-pointer"
                    title={`Pilih seluruh ${studentsInKu.length} siswa pada kelompok usia ${classFilter}`}
                  >
                    <span>Pilih Seluruh Siswa {classFilter} ({studentsInKu.length})</span>
                  </button>
                )}

                {/* Tombol Pilih Semua Siswa Aktif jika KU difilter */}
                {classFilter !== 'Semua' && !searchQuery && (
                  <button
                    type="button"
                    onClick={handleSelectAllActive}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 transition active:scale-95 flex items-center gap-1 text-xs shadow-2xs cursor-pointer"
                    title={`Pilih seluruh ${allActiveStudents.length} siswa aktif BFA`}
                  >
                    <span>Pilih Seluruh Siswa Aktif BFA ({allActiveStudents.length})</span>
                  </button>
                )}

                {/* Tombol Cerdas: Pilih Yang Belum Presensi */}
                {unmarkedInFiltered.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllUnmarkedFiltered}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition active:scale-95 flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer"
                    title="Pilih hanya siswa yang belum memiliki catatan presensi pada tanggal ini"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilih Belum Presensi ({unmarkedInFiltered.length})</span>
                  </button>
                )}
              </div>

              {/* Tombol Hapus Pilihan */}
              <button
                type="button"
                onClick={handleDeselectAll}
                disabled={selectedStudentIds.length === 0}
                className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 disabled:text-slate-300 disabled:hover:bg-white font-bold rounded-xl border border-slate-200 hover:border-rose-200 transition active:scale-95 flex items-center gap-1.5 text-xs disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hapus Pilihan ({selectedStudentIds.length})</span>
              </button>
            </div>

            {/* Sub-Tabs: Semua, Terpilih, Belum Presensi, Sudah Presensi */}
            <div className="flex items-center gap-1 pt-1 border-t border-slate-200/60 overflow-x-auto">
              <button
                type="button"
                onClick={() => setListTab('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition whitespace-nowrap cursor-pointer ${
                  listTab === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Semua Siswa ({filteredStudents.length})
              </button>

              <button
                type="button"
                onClick={() => setListTab('selected')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition whitespace-nowrap cursor-pointer ${
                  listTab === 'selected'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Terpilih ({selectedInFilteredCount})
              </button>

              <button
                type="button"
                onClick={() => setListTab('unmarked')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition whitespace-nowrap cursor-pointer ${
                  listTab === 'unmarked'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Belum Presensi ({unmarkedInFiltered.length})
              </button>

              <button
                type="button"
                onClick={() => setListTab('marked')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition whitespace-nowrap cursor-pointer ${
                  listTab === 'marked'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Sudah Presensi ({markedInFiltered.length})
              </button>
            </div>

            {/* List Siswa (Multi-Select List) */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
              {displayedStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <User className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p className="font-semibold text-xs">
                    {listTab === 'selected'
                      ? 'Belum ada siswa yang dipilih pada tampilan ini.'
                      : listTab === 'unmarked'
                      ? 'Seluruh siswa pada tampilan ini sudah memiliki catatan presensi.'
                      : listTab === 'marked'
                      ? 'Belum ada siswa yang memiliki catatan presensi pada tanggal ini.'
                      : 'Tidak ada siswa yang cocok dengan kriteria filter.'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {listTab === 'selected'
                      ? 'Klik siswa pada tab Semua untuk memilih siswa.'
                      : 'Ubah kata kunci pencarian atau ganti pilihan Kelompok Usia.'}
                  </p>
                </div>
              ) : (
                displayedStudents.map((st) => {
                  const isSelected = selectedStudentIds.includes(st.id);
                  const alreadyAttended = existingAttendancesMap.get(st.id);

                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleStudent(st.id)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition select-none ${
                        isSelected
                          ? 'bg-blue-50/90 border border-blue-400 ring-1 ring-blue-300 shadow-2xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox Indikator */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStudent(st.id);
                          }}
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                              : 'border-slate-300 bg-white hover:border-blue-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        {/* Foto Avatar */}
                        <img
                          src={st.avatar || 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=120'}
                          alt={st.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0"
                          referrerPolicy="no-referrer"
                        />

                        {/* Detail Siswa */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 truncate block text-xs">
                              {st.name}
                            </span>
                            {st.nickname && (
                              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                                ({st.nickname})
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded text-[9px] font-black border border-blue-200 shrink-0">
                              {st.classGroupId}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-500 block">
                            {st.id} {st.position ? `• ${st.position}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Status Kehadiran yang Sudah Tercatat */}
                      <div className="flex items-center gap-2 shrink-0">
                        {alreadyAttended ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 ${
                              alreadyAttended.status === 'HADIR'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                            title={`Sudah dicatat: ${alreadyAttended.status} jam ${alreadyAttended.checkInTime || '-'} WIB`}
                          >
                            {alreadyAttended.status === 'HADIR' ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                            ) : (
                              <XCircle className="w-2.5 h-2.5 text-rose-700" />
                            )}
                            <span>{alreadyAttended.status}</span>
                            {alreadyAttended.checkInTime && (
                              <span className="font-mono hidden sm:inline text-slate-600">
                                ({alreadyAttended.checkInTime})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                            Belum presensi
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: Pencegahan Duplikasi Presensi jika ada yang sudah tercatat */}
          {selectedAlreadyMarkedStudents.length > 0 && (
            <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl text-amber-900 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-black text-xs text-amber-900">
                    Peringatan: {selectedAlreadyMarkedStudents.length} Siswa Terpilih Sudah Memiliki Data Presensi
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                    Siswa berikut sudah tercatat pada sesi tanggal <strong>{date}</strong>:
                  </p>

                  {/* List Nama Siswa yang Sudah Tercatat */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-24 overflow-y-auto">
                    {selectedAlreadyMarkedStudents.map((st) => {
                      const prevAtt = existingAttendancesMap.get(st.id);
                      return (
                        <span
                          key={st.id}
                          className="px-2 py-0.5 bg-white border border-amber-300 rounded-md text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-2xs"
                        >
                          <span>{st.name}</span>
                          <span
                            className={`px-1 rounded text-[9px] font-black ${
                              prevAtt?.status === 'HADIR'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {prevAtt?.status || 'ADA'}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action: Keluarkan yang sudah absen ATAU Konfirmasi Timpa */}
              <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleRemoveAlreadyMarkedFromSelection}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold border border-amber-300 transition active:scale-95 inline-flex items-center gap-1 self-start cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-amber-700" />
                  <span>Keluarkan {selectedAlreadyMarkedStudents.length} Siswa Ini dari Pilihan</span>
                </button>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOverwrite}
                    onChange={(e) => setAllowOverwrite(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span className="font-bold text-[11px] text-amber-950">
                    Konfirmasi: Timpa / perbarui data presensi mereka
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Section 4: Status Kehadiran (Diterapkan untuk seluruh siswa terpilih) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Status Kehadiran Batch *</span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                Berlaku untuk seluruh <strong className="text-blue-700 font-black">{selectedStudentIds.length}</strong> siswa terpilih
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('HADIR')}
                className={`p-3 rounded-2xl border-2 transition text-left flex items-start gap-2.5 cursor-pointer ${
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
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5 leading-snug">
                    ✓ Otomatis terbit tagihan sesi Rp15.000 bagi siswa yang belum diterbitkan
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('TIDAK_HADIR')}
                className={`p-3 rounded-2xl border-2 transition text-left flex items-start gap-2.5 cursor-pointer ${
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
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5 leading-snug">
                    Bebas biaya iuran sesi latihan (Rp0)
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
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
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
              <div className="flex items-center justify-between mb-1 mt-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Catatan / Keterangan Manual (Opsional)
                </label>
                {notes && (
                  <button
                    type="button"
                    onClick={() => setNotes('')}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                  >
                    Hapus Catatan
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sesi latihan intensif lapangan BFA, presensi massal pelatih..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium shadow-2xs resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Catatan ini akan tersimpan pada data presensi seluruh {selectedStudentIds.length} siswa terpilih dalam batch ini.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {selectedStudentIds.length > 0 ? (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>
                  Total terpilih: <strong className="text-slate-900 font-black">{selectedStudentIds.length} siswa</strong>
                </span>
              </span>
            ) : (
              <span className="text-slate-400 italic">Pilih minimal 1 siswa di atas untuk mencatat presensi</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={() => handleSubmitBatch()}
              disabled={
                selectedStudentIds.length === 0 ||
                (selectedAlreadyMarkedStudents.length > 0 && !allowOverwrite) ||
                isSubmitting
              }
              className={`w-full sm:w-auto px-5 py-2.5 font-black rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                selectedStudentIds.length === 0 ||
                (selectedAlreadyMarkedStudents.length > 0 && !allowOverwrite) ||
                isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
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
                  ? submitProgress
                    ? `Menyimpan (${submitProgress.current}/${submitProgress.total})...`
                    : 'Menyimpan Presensi...'
                  : selectedStudentIds.length === 0
                  ? 'Pilih Siswa Terlebih Dahulu'
                  : selectedAlreadyMarkedStudents.length > 0 && !allowOverwrite
                  ? `Konfirmasi Diperlukan (${selectedAlreadyMarkedStudents.length} Siswa Sudah Absen)`
                  : `Simpan Kehadiran (${selectedStudentIds.length} Siswa)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
