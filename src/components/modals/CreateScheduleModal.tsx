import React, { useState, useEffect } from 'react';
import { TrainingSchedule, Coach } from '../../types';
import { X, Calendar, Clock, MapPin, Users, Check, Plus, Layers } from 'lucide-react';

interface CreateScheduleModalProps {
  isOpen: boolean;
  scheduleToEdit?: TrainingSchedule | null;
  onClose: () => void;
  onSubmit: (schedule: Omit<TrainingSchedule, 'id'>, editId?: string) => void;
  coaches?: Coach[];
}

const AVAILABLE_COACHES = [
  'Coach Hendra',
  'Coach Ilham',
  'Coach Hanif',
  'Coach Dani',
  'Coach Sari',
];

// Kelompok Umur lengkap dari U-3 sampai U-40
const ALL_AVAILABLE_KUS = Array.from({ length: 38 }, (_, i) => `U-${i + 3}`); // U-3 to U-40
const POPULAR_KUS = ['U-6', 'U-8', 'U-10', 'U-11', 'U-12', 'U-15', 'U-17'];

export const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({
  isOpen,
  scheduleToEdit,
  onClose,
  onSubmit,
  coaches = [],
}) => {
  const [date, setDate] = useState('2026-10-02');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [selectedKUs, setSelectedKUs] = useState<string[]>(['U-10']);
  const [courtName, setCourtName] = useState('Bintang Futsal (Lap B)');
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>(['Coach Ilham', 'Coach Hanif']);
  const [customCoach, setCustomCoach] = useState('');

  // Sync state whenever scheduleToEdit or isOpen changes
  useEffect(() => {
    if (scheduleToEdit) {
      setDate(scheduleToEdit.date);
      setStartTime(scheduleToEdit.startTime);
      setEndTime(scheduleToEdit.endTime);
      
      const existingKUs = scheduleToEdit.classGroups && scheduleToEdit.classGroups.length > 0
        ? scheduleToEdit.classGroups.map(k => k.startsWith('U') && !k.includes('-') ? k.replace('U', 'U-') : k)
        : (scheduleToEdit.classGroupId || 'U10').split(',').map(k => {
            const trimmed = k.trim();
            return trimmed.startsWith('U') && !trimmed.includes('-') ? trimmed.replace('U', 'U-') : trimmed;
          });
      setSelectedKUs(existingKUs.length > 0 ? existingKUs : ['U-10']);
      setCourtName(scheduleToEdit.courtName);
      setSelectedCoaches(scheduleToEdit.coaches);
    } else {
      setDate('2026-10-02');
      setStartTime('14:00');
      setEndTime('16:00');
      setSelectedKUs(['U-10']);
      setCourtName('Bintang Futsal (Lap B)');
      setSelectedCoaches(['Coach Ilham', 'Coach Hanif']);
    }
    setCustomCoach('');
  }, [scheduleToEdit, isOpen]);

  if (!isOpen) return null;

  // Format date to Indonesian day & date banner
  const getDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const dayNameFormatted = getDayName(date);

  const toggleCoach = (coach: string) => {
    if (selectedCoaches.includes(coach)) {
      setSelectedCoaches(selectedCoaches.filter((c) => c !== coach));
    } else {
      setSelectedCoaches([...selectedCoaches, coach]);
    }
  };

  const toggleKU = (ku: string) => {
    if (selectedKUs.includes(ku)) {
      setSelectedKUs(selectedKUs.filter((k) => k !== ku));
    } else {
      setSelectedKUs([...selectedKUs, ku]);
    }
  };

  const selectAllKUs = () => {
    setSelectedKUs([...ALL_AVAILABLE_KUS]);
  };

  const selectPopularKUs = () => {
    setSelectedKUs([...POPULAR_KUS]);
  };

  const clearAllKUs = () => {
    setSelectedKUs([]);
  };

  const handleAddCustomCoach = () => {
    const trimmed = customCoach.trim();
    if (trimmed && !selectedCoaches.includes(trimmed)) {
      setSelectedCoaches([...selectedCoaches, trimmed]);
      setCustomCoach('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKUs.length === 0) {
      alert('Silakan pilih minimal 1 kelompok umur latihan (U-3 s/d U-40).');
      return;
    }
    if (selectedCoaches.length === 0) {
      alert('Silakan pilih minimal 1 orang pelatih bertugas.');
      return;
    }

    // Format normalized KUs
    const normalizedKUs = selectedKUs.map(k => k.replace('-', ''));
    const classGroupId = normalizedKUs.join(', ');

    onSubmit(
      {
        date,
        dayName: dayNameFormatted,
        startTime: startTime.replace('.', ':'),
        endTime: endTime.replace('.', ':'),
        classGroupId,
        classGroups: normalizedKUs,
        courtName,
        coaches: selectedCoaches,
        status: scheduleToEdit ? scheduleToEdit.status : 'Akan Datang',
      },
      scheduleToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 text-slate-900 shadow-2xl relative border border-slate-200 my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <span>{scheduleToEdit ? 'Edit Jadwal Sesi Latihan' : 'Tambah Jadwal Latihan'}</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Hari & Tanggal Latihan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Hari & Tanggal Latihan
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            {/* Banner Preview Tanggal */}
            <div className="mt-2 py-2 px-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-900 font-bold text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>{dayNameFormatted}</span>
            </div>
          </div>

          {/* Jam Mulai & Jam Selesai */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jam Mulai
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="14.00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono font-semibold"
                />
                <Clock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jam Selesai
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="16.00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono font-semibold"
                />
                <Clock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Nama Lapangan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lapangan
            </label>
            <input
              type="text"
              required
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              placeholder="Bintang Futsal (Lap B)"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          {/* Kelompok Umur (Bisa Pilih > 1 Kelompok Umur, U-3 s/d U-40) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Kelompok Umur (Bisa Pilih &gt; 1 KU, U-3 s/d U-40) *</span>
              </label>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                {selectedKUs.length} KU Terpilih
              </span>
            </div>

            {/* Display Selected KUs Chips */}
            <div className="w-full bg-white border border-slate-300 rounded-xl p-2.5 min-h-[42px] flex flex-wrap items-center gap-1.5">
              {selectedKUs.length === 0 ? (
                <span className="text-slate-400 text-xs">Silakan klik tombol KU di bawah untuk memilih...</span>
              ) : (
                selectedKUs.map((ku) => (
                  <span
                    key={ku}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-black shadow-2xs animate-in fade-in"
                  >
                    <span>{ku}</span>
                    <button
                      type="button"
                      onClick={() => toggleKU(ku)}
                      className="hover:text-rose-200 text-blue-200 ml-0.5 font-bold"
                      title={`Hapus ${ku}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Helper Action Buttons */}
            <div className="flex items-center justify-between gap-1.5 text-[10px] pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectPopularKUs}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
                >
                  Preset U6 - U17
                </button>
                <button
                  type="button"
                  onClick={selectAllKUs}
                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg transition"
                >
                  Pilih Semua (U3 - U40)
                </button>
              </div>
              <button
                type="button"
                onClick={clearAllKUs}
                className="px-2 py-1 text-rose-600 hover:bg-rose-50 font-bold rounded-lg transition"
              >
                Reset Pilihan
              </button>
            </div>

            {/* Visual KU Selection Matrix (U-3 to U-40) */}
            <div className="pt-1.5 border-t border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-bold block mb-1.5">
                Pilih atau tap kelompok umur untuk menambah/menghapus:
              </span>
              <div className="max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200 flex flex-wrap gap-1">
                {ALL_AVAILABLE_KUS.map((ku) => {
                  const isSelected = selectedKUs.includes(ku);
                  return (
                    <button
                      key={ku}
                      type="button"
                      onClick={() => toggleKU(ku)}
                      className={`px-2 py-1 rounded-md text-[10px] font-black transition active:scale-95 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {ku}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pelatih Bertugas (Pilihan Pelatih Bisa Lebih Dari 1 Orang) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                <span>Pelatih Bertugas (Bisa Pilih &gt; 1 Orang) *</span>
              </label>
              <span className="text-[10px] text-blue-700 font-semibold">
                {selectedCoaches.length} Pelatih Dipilih
              </span>
            </div>

            {/* Selected Coaches Display */}
            <div className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 min-h-[42px] flex flex-wrap items-center gap-1.5">
              {selectedCoaches.length === 0 ? (
                <span className="text-slate-400 text-xs">Pilih pelatih bertugas di bawah...</span>
              ) : (
                selectedCoaches.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => toggleCoach(c)}
                      className="hover:text-rose-600 text-slate-400 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Coach Quick Toggle Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {((coaches && coaches.filter((c) => c.status === 'Aktif').length > 0)
                ? coaches.filter((c) => c.status === 'Aktif').map((c) => c.name)
                : AVAILABLE_COACHES
              ).map((coach) => {
                const isSelected = selectedCoaches.includes(coach);
                return (
                  <button
                    key={coach}
                    type="button"
                    onClick={() => toggleCoach(coach)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{coach}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Coach Input */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={customCoach}
                onChange={(e) => setCustomCoach(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCoach();
                  }
                }}
                placeholder="+ Tambah nama pelatih lain..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddCustomCoach}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-500/25 active:scale-95 transition"
            >
              {scheduleToEdit ? 'Simpan Perubahan' : 'Simpan Jadwal'}
            </button>
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-400 font-medium">
            #WegrowTogether • Pembinaan Futsal Berjenjang
          </div>
        </form>
      </div>
    </div>
  );
};

