import React, { useState, useMemo, useEffect } from 'react';
import { Student, Invoice } from '../../types';
import { ALL_KU_CATEGORIES } from '../../data/initialData';
import {
  X,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Filter,
  UserCheck
} from 'lucide-react';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  invoices?: Invoice[];
  onConfirm: (config: {
    period: string;
    dueDate: string;
    issueDate: string;
    amount: number;
    classGroupId: string;
    targetMode?: 'ALL' | 'GROUP' | 'CUSTOM';
    selectedStudentIds?: string[];
  }) => void;
}

export const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  isOpen,
  onClose,
  students,
  invoices = [],
  onConfirm,
}) => {
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  });

  const [dueDate, setDueDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-10`;
  });

  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(50000);

  // Target Mode: 'ALL' | 'GROUP' | 'CUSTOM'
  const [targetMode, setTargetMode] = useState<'ALL' | 'GROUP' | 'CUSTOM'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  // Custom Student Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setPeriod(now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setDueDate(`${y}-${m}-10`);
      setIssueDate(new Date().toISOString().split('T')[0]);
      setAmount(50000);
      setTargetMode('ALL');
      setSelectedGroup('ALL');
      setSelectedStudentIds([]);
      setSearchQuery('');
      setIsConfirming(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Active students only
  const activeStudents = useMemo(() => {
    return students.filter((s) => s.status === 'Aktif');
  }, [students]);

  // Available KU groups dynamically found in active students + standard categories
  const availableKUGroups = useMemo(() => {
    const groups = new Set<string>();
    activeStudents.forEach((s) => {
      if (s.classGroupId) groups.add(s.classGroupId);
    });
    // Add common fallback if empty
    ['U8', 'U10', 'U11', 'U12', 'U15', 'U17'].forEach((g) => groups.add(g));
    return Array.from(groups).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [activeStudents]);

  // Filtered students for custom search
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeStudents;
    return activeStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.nickname && s.nickname.toLowerCase().includes(q)) ||
        (s.classGroupId && s.classGroupId.toLowerCase().includes(q))
    );
  }, [activeStudents, searchQuery]);

  // Selected students full objects
  const selectedStudentsList = useMemo(() => {
    const idSet = new Set(selectedStudentIds);
    return activeStudents.filter((s) => idSet.has(s.id));
  }, [activeStudents, selectedStudentIds]);

  // Targeted students based on selected targetMode
  const targetedStudents = useMemo(() => {
    if (targetMode === 'CUSTOM') {
      const idSet = new Set(selectedStudentIds);
      return activeStudents.filter((s) => idSet.has(s.id));
    }
    if (targetMode === 'GROUP') {
      if (selectedGroup === 'ALL') return activeStudents;
      return activeStudents.filter((s) => s.classGroupId === selectedGroup);
    }
    return activeStudents; // 'ALL'
  }, [activeStudents, targetMode, selectedGroup, selectedStudentIds]);

  // Calculation of potential and already invoiced students for current period
  const totalPotential = targetedStudents.length * amount;

  const alreadyInvoicedStudents = useMemo(() => {
    if (!period.trim()) return [];
    const trimmed = period.trim().toLowerCase();
    return targetedStudents.filter((st) =>
      invoices.some(
        (inv) =>
          inv.studentId === st.id &&
          inv.type === 'Bulanan' &&
          (inv.period || '').trim().toLowerCase() === trimmed
      )
    );
  }, [targetedStudents, invoices, period]);

  const netNewInvoicesCount = Math.max(0, targetedStudents.length - alreadyInvoicedStudents.length);
  const netNewTotal = netNewInvoicesCount * amount;

  // Toggle single student in custom mode
  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all matching search query
  const handleSelectAllFiltered = () => {
    const newIds = new Set(selectedStudentIds);
    filteredStudents.forEach((s) => newIds.add(s.id));
    setSelectedStudentIds(Array.from(newIds));
  };

  // Clear all selections
  const handleClearAllSelected = () => {
    setSelectedStudentIds([]);
  };

  // Remove single selected student
  const handleRemoveStudent = (id: string) => {
    setSelectedStudentIds((prev) => prev.filter((item) => item !== id));
  };

  // Pre-submit validation
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!period.trim()) return;
    if (targetMode === 'CUSTOM' && selectedStudentIds.length === 0) return;
    if (targetedStudents.length === 0) return;

    // Open confirmation step
    setIsConfirming(true);
  };

  // Final confirmation execution
  const handleExecuteGenerate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm({
        period: period.trim(),
        dueDate,
        issueDate,
        amount,
        classGroupId: targetMode === 'GROUP' ? selectedGroup : targetMode,
        targetMode,
        selectedStudentIds: targetMode === 'CUSTOM' ? selectedStudentIds : undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error saat menerbitkan tagihan:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 text-slate-900 shadow-2xl relative border border-slate-200 my-6 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
          title="Tutup dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-blue-900 font-black text-sm uppercase tracking-wider mb-0.5">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span>Penerbitan Tagihan SPP Bulanan</span>
          </div>
          <p className="text-xs text-slate-500">
            Atur periode, tanggal jatuh tempo, nominal, dan tentukan target siswa penerima tagihan.
          </p>
        </div>

        {/* STEP 2: CONFIRMATION VIEW */}
        {isConfirming ? (
          <div className="py-4 space-y-4 text-xs overflow-y-auto flex-1 pr-1 animate-in fade-in">
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-700" />
                <span>Konfirmasi Rincian Penerbitan Tagihan SPP</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Mohon tinjau parameter penerbitan di bawah ini sebelum menyimpan ke sistem database.
              </p>

              <div className="bg-white rounded-xl p-3 border border-blue-100 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Periode SPP:</span>
                  <span className="font-black text-blue-900">{period}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Target Sasaran:</span>
                  <span className="font-black text-slate-800">
                    {targetMode === 'ALL' && 'Semua Siswa Aktif'}
                    {targetMode === 'GROUP' && `Kelompok Usia (${selectedGroup === 'ALL' ? 'Semua KU' : selectedGroup})`}
                    {targetMode === 'CUSTOM' && `Pilihan Khusus (${targetedStudents.length} Siswa)`}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Jumlah Siswa Sasaran:</span>
                  <span className="font-bold text-slate-900">{targetedStudents.length} Siswa</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Nominal SPP per Siswa:</span>
                  <span className="font-mono font-bold text-slate-900">
                    Rp{amount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Tanggal Terbit & Jatuh Tempo:</span>
                  <span className="font-mono text-slate-700">
                    {issueDate} s/d <strong className="text-rose-700">{dueDate}</strong>
                  </span>
                </div>

                <div className="flex justify-between py-1 pt-2 font-black text-sm text-blue-950">
                  <span>Total Estimasi Tagihan:</span>
                  <span className="font-mono text-emerald-700">
                    Rp{totalPotential.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Already invoiced warning */}
              {alreadyInvoicedStudents.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Pemberitahuan Pencegahan Duplikasi:</span>
                  </div>
                  <p className="leading-relaxed text-amber-800">
                    Terdapat <strong>{alreadyInvoicedStudents.length} siswa</strong> yang sudah memiliki tagihan SPP untuk periode <strong>{period}</strong>. Tagihan untuk siswa tersebut akan <strong>dilewati secara otomatis</strong> tanpa menduplikasi data.
                  </p>
                  <p className="font-bold text-emerald-800 pt-0.5">
                    Tagihan baru yang akan benar-benar terbit: {netNewInvoicesCount} Siswa (Rp{netNewTotal.toLocaleString('id-ID')}).
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                ← Kembali / Ubah Target
              </button>
              <button
                type="button"
                onClick={handleExecuteGenerate}
                disabled={isSubmitting}
                className={`px-5 py-2.5 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition ${
                  isSubmitting
                    ? 'bg-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-900 hover:bg-blue-950 shadow-blue-900/25 active:scale-95'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmitting ? 'Memproses ke Server...' : 'Ya, Terbitkan Tagihan Sekarang'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* STEP 1: CONFIGURATION FORM */
          <form onSubmit={handlePreSubmit} className="py-4 space-y-3.5 text-xs overflow-y-auto flex-1 pr-1">
            {/* Periode SPP */}
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            {/* Tanggal Terbit & Jatuh Tempo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Terbit *
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-rose-700 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Nominal SPP */}
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-900 focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            {/* Target Mode Selection */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <label className="block font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                Target Sasaran Penerbitan Siswa *
              </label>

              {/* Segmented Button Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTargetMode('ALL')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    targetMode === 'ALL'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Semua Siswa Aktif</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMode('GROUP')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    targetMode === 'GROUP'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Berdasarkan KU</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMode('CUSTOM')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    targetMode === 'CUSTOM'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Pilih per Nama</span>
                </button>
              </div>

              {/* Sub-mode 1: Berdasarkan Kelompok Usia */}
              {targetMode === 'GROUP' && (
                <div className="pt-1 space-y-1 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Pilih Kelompok Usia:
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                  >
                    <option value="ALL">Semua Kelompok Usia</option>
                    {availableKUGroups.map((ku) => (
                      <option key={ku} value={ku}>
                        Kelompok Usia {ku} ({activeStudents.filter((s) => s.classGroupId === ku).length} Siswa Aktif)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub-mode 2: Pilih Siswa Berdasarkan Nama */}
              {targetMode === 'CUSTOM' && (
                <div className="pt-1 space-y-2.5 animate-in fade-in">
                  {/* Search Bar & Action Buttons */}
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama siswa atau ID BFA (misal: BFA-001, Kenzo)..."
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-600 shadow-2xs"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold p-0.5"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 font-semibold">
                        Menampilkan {filteredStudents.length} dari {activeStudents.length} siswa aktif
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleSelectAllFiltered}
                          disabled={filteredStudents.length === 0}
                          className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg font-bold transition text-[10px] disabled:opacity-50"
                        >
                          Pilih Semua Hasil Pencarian
                        </button>
                        {selectedStudentIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllSelected}
                            className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold transition text-[10px]"
                          >
                            Hapus Semua Pilihan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selected Students Preview Chips */}
                  {selectedStudentIds.length > 0 && (
                    <div className="bg-white p-2.5 rounded-xl border border-blue-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-blue-900 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                          Siswa Terpilih ({selectedStudentIds.length} Siswa):
                        </span>
                        <span className="text-[10px] text-slate-400">Klik tanda silang untuk membatalkan</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {selectedStudentsList.map((st) => (
                          <span
                            key={st.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-300 text-blue-900 rounded-lg text-[11px] font-bold shadow-2xs"
                          >
                            <span>{st.name}</span>
                            <span className="text-[9px] font-mono text-blue-600 font-normal">({st.id})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(st.id)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-0.5 ml-0.5 transition"
                              title={`Batalkan pilihan ${st.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Searchable Students List with Checkboxes */}
                  <div className="max-h-44 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <div className="py-6 text-center text-slate-400">
                        <Users className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p className="font-semibold text-xs">Tidak ada siswa yang cocok dengan pencarian.</p>
                      </div>
                    ) : (
                      filteredStudents.map((st) => {
                        const isChecked = selectedStudentIds.includes(st.id);
                        const hasInvoiceAlready = invoices.some(
                          (inv) =>
                            inv.studentId === st.id &&
                            inv.type === 'Bulanan' &&
                            (inv.period || '').trim().toLowerCase() === period.trim().toLowerCase()
                        );

                        return (
                          <div
                            key={st.id}
                            onClick={() => handleToggleStudent(st.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                              isChecked
                                ? 'bg-blue-50/90 border border-blue-300'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStudent(st.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                              />
                              <img
                                src={st.avatar || 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=120'}
                                alt={st.name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-900 truncate text-xs">
                                    {st.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-800 rounded text-[9px] font-black border border-slate-200">
                                    {st.classGroupId}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 block">
                                  {st.id}
                                </span>
                              </div>
                            </div>

                            {hasInvoiceAlready && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded shrink-0">
                                Sudah Ada SPP
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Target Summary Preview Box */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-1.5 shadow-2xs">
              <div className="flex justify-between font-bold text-blue-950 text-xs">
                <span>Sasaran Penerbitan:</span>
                <span className="font-black text-blue-900">
                  {targetedStudents.length} Siswa Aktif
                  {targetMode === 'CUSTOM' ? ' (Dipilih)' : targetMode === 'GROUP' ? ` (${selectedGroup})` : ''}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Estimasi Tagihan:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  Rp{totalPotential.toLocaleString('id-ID')}
                </span>
              </div>

              {alreadyInvoicedStudents.length > 0 && (
                <div className="pt-1 border-t border-blue-200/60 flex justify-between text-[11px] text-amber-900 font-medium">
                  <span>Sudah memiliki tagihan ({period}):</span>
                  <span className="font-bold text-amber-800">{alreadyInvoicedStudents.length} siswa (akan dilewati)</span>
                </div>
              )}
            </div>

            {/* Validation warning if custom mode has no students selected */}
            {targetMode === 'CUSTOM' && selectedStudentIds.length === 0 && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Pilih minimal 1 siswa di atas untuk menerbitkan tagihan.
              </p>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={
                  (targetMode === 'CUSTOM' && selectedStudentIds.length === 0) ||
                  targetedStudents.length === 0 ||
                  !period.trim()
                }
                className={`px-5 py-2.5 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition ${
                  (targetMode === 'CUSTOM' && selectedStudentIds.length === 0) ||
                  targetedStudents.length === 0 ||
                  !period.trim()
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-blue-900 hover:bg-blue-950 text-white shadow-blue-900/25 active:scale-95'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Terbitkan Tagihan Sekarang</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
