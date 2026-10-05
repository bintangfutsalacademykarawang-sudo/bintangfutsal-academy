import React, { useState } from 'react';
import { Coach } from '../../types/coach';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Award, 
  ShieldCheck, 
  ShieldAlert, 
  Edit3, 
  Power, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  FileBadge
} from 'lucide-react';
import { CoachFormModal } from '../modals/CoachFormModal';

interface AdminCoachesViewProps {
  coaches: Coach[];
  onSaveCoach: (coach: Coach) => void;
  onToggleCoachStatus: (coachId: string, currentStatus: 'Aktif' | 'Non-Aktif') => void;
  isReadOnlyPreview?: boolean;
}

export const AdminCoachesView: React.FC<AdminCoachesViewProps> = ({
  coaches,
  onSaveCoach,
  onToggleCoachStatus,
  isReadOnlyPreview = false,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [coachToEdit, setCoachToEdit] = useState<Coach | null>(null);

  // Filtered coaches
  const filteredCoaches = coaches.filter((c) => {
    const matchesStatus = filterStatus === 'Semua' || c.status === filterStatus;
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.specialization || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.license || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.licenseNumber || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeCount = coaches.filter((c) => c.status === 'Aktif').length;
  const nonActiveCount = coaches.filter((c) => c.status === 'Non-Aktif').length;

  const handleOpenAdd = () => {
    setCoachToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (coach: Coach) => {
    setCoachToEdit(coach);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (coachData: Coach) => {
    onSaveCoach(coachData);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Manajemen Data Pelatih
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-extrabold text-xs rounded-full border border-blue-200">
              {coaches.length} Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data staf pelatih Bintang Futsal Academy Karawang. Pelatih berstatus Aktif otomatis muncul saat membuat jadwal latihan.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-700/20 transition flex items-center space-x-2 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelatih Baru</span>
        </button>
      </div>

      {/* Safety Guard Preview Banner */}
      {isReadOnlyPreview && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900 text-xs shadow-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-extrabold block">Mode Simulasi Aman (Preview AI Studio)</span>
            <span className="text-[11px] text-amber-800">
              Penulisan ke Firestore produksi dinonaktifkan secara bawaan (WRITE_ENABLED = false). Data pelatih yang Anda tambah atau ubah statusnya berjalan di memori lokal tanpa risiko mencemari database produksi BFA HUB.
            </span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Pelatih
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {coaches.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Keseluruhan staf resmi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Pelatih Aktif
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {activeCount}
          </div>
          <p className="text-[10px] text-emerald-600/70 mt-0.5">Tersedia untuk sesi latihan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Pelatih Non-Aktif
            </span>
            <Power className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-600 mt-1">
            {nonActiveCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Diarsipkan / Riwayat terjaga</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, ID pelatih, nomor WhatsApp..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            {(['Semua', 'Aktif', 'Non-Aktif'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coach Cards Grid */}
      {filteredCoaches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800">
            {coaches.length === 0 ? 'Belum Ada Data Pelatih' : 'Tidak Ditemukan Pelatih'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {coaches.length === 0
              ? 'Data pelatih masih kosong. Klik tombol di bawah untuk menambahkan staf pelatih pertama akademi.'
              : 'Tidak ada pelatih yang cocok dengan kriteria pencarian atau filter yang dipilih.'}
          </p>
          {coaches.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-sm transition"
            >
              Tambah Pelatih Baru
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoaches.map((coach) => {
            const isAktif = coach.status === 'Aktif';
            const cleanPhone = coach.phone.replace(/\D/g, '');
            const waNumber = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;

            return (
              <div
                key={coach.id}
                className={`bg-white rounded-2xl border transition shadow-xs hover:shadow-md p-5 flex flex-col justify-between ${
                  isAktif ? 'border-slate-200' : 'border-slate-300 bg-slate-50/70 opacity-90'
                }`}
              >
                <div>
                  {/* Top Bar: ID and Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                      {coach.id}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                        isAktif
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                      <span>{coach.status}</span>
                    </span>
                  </div>

                  {/* Coach Avatar & Name */}
                  <div className="flex items-center space-x-3.5 mb-4">
                    {coach.photoUrl ? (
                      <img
                        src={coach.photoUrl}
                        alt={coach.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white font-black text-base flex items-center justify-center shadow-xs">
                        {coach.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-slate-900 truncate">
                        {coach.name}
                      </h3>
                      <p className="text-xs text-blue-700 font-bold flex items-center space-x-1">
                        <Award className="w-3 h-3 shrink-0" />
                        <span className="truncate">{coach.specialization || 'Pelatih'}</span>
                      </p>
                    </div>
                  </div>

                  {/* License Badge if available */}
                  {coach.license && (
                    <div className={`mb-3 p-2 rounded-xl border ${
                      coach.license === 'Belum Berlisensi / Grassroots'
                        ? 'bg-slate-100/80 border-slate-200 text-slate-700'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50/50 border-amber-200 text-amber-900 shadow-2xs'
                    }`}>
                      <div className="flex items-center space-x-1.5">
                        <FileBadge className={`w-3.5 h-3.5 shrink-0 ${
                          coach.license === 'Belum Berlisensi / Grassroots' ? 'text-slate-500' : 'text-amber-700'
                        }`} />
                        <span className="text-xs font-extrabold truncate">
                          {coach.license}
                        </span>
                      </div>
                      {(coach.licenseNumber || coach.licenseYear) && (
                        <div className="mt-0.5 text-[10px] font-mono opacity-85 flex items-center space-x-1 pl-5">
                          {coach.licenseNumber && <span>No. {coach.licenseNumber}</span>}
                          {coach.licenseNumber && coach.licenseYear && <span>•</span>}
                          {coach.licenseYear && <span>Thn {coach.licenseYear}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* WhatsApp Contact */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>WhatsApp</span>
                      </span>
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                        title="Buka WhatsApp Chat"
                      >
                        <span>{coach.phone}</span>
                        <MessageSquare className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Kelompok Usia Binaan */}
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Kelompok Usia (KU) Binaan:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {coach.classGroups && coach.classGroups.length > 0 ? (
                        coach.classGroups.map((ku) => (
                          <span
                            key={ku}
                            className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-extrabold text-[10px]"
                          >
                            {ku}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ditentukan</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEdit(coach)}
                    className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Profil</span>
                  </button>

                  {/* Soft Delete / Toggle Status Button */}
                  <button
                    onClick={() => onToggleCoachStatus(coach.id, coach.status)}
                    className={`py-1.5 px-3 font-bold text-xs rounded-xl border transition flex items-center space-x-1 ${
                      isAktif
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                    title={isAktif ? 'Nonaktifkan Pelatih (Arsipkan)' : 'Aktifkan Kembali Pelatih'}
                  >
                    <Power className={`w-3.5 h-3.5 ${isAktif ? 'text-amber-600' : 'text-emerald-600'}`} />
                    <span>{isAktif ? 'Non-Aktifkan' : 'Aktifkan'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      <CoachFormModal
        isOpen={isFormOpen}
        coachToEdit={coachToEdit}
        existingCoachesCount={coaches.length}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        isReadOnlyPreview={isReadOnlyPreview}
      />
    </div>
  );
};
