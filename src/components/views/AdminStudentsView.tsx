import React, { useState } from 'react';
import { Student } from '../../types';
import { formatDateIndo, getKUCategoryInfo } from '../../data/initialData';
import { Search, Plus, Eye, Edit3, Filter, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { CategoryFilterModal } from '../modals/CategoryFilterModal';

interface AdminStudentsViewProps {
  students: Student[];
  onOpenAddStudent: () => void;
  onOpenEditStudent: (student: Student) => void;
  onOpenDetailStudent: (student: Student) => void;
}

export const AdminStudentsView: React.FC<AdminStudentsViewProps> = ({
  students,
  onOpenAddStudent,
  onOpenEditStudent,
  onOpenDetailStudent,
}) => {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('Semua');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Filter students based on search and selected KU
  const filtered = students.filter((st) => {
    const matchSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.id.toLowerCase().includes(search.toLowerCase()) ||
      st.parentName.toLowerCase().includes(search.toLowerCase()) ||
      (st.birthPlace && st.birthPlace.toLowerCase().includes(search.toLowerCase()));
    const matchClass = classFilter === 'Semua' || st.classGroupId === classFilter;
    return matchSearch && matchClass;
  });

  const activeCategoryInfo = classFilter !== 'Semua' ? getKUCategoryInfo(classFilter) : null;

  // Popular quick chips
  const quickCategories = ['Semua', 'U6', 'U8', 'U10', 'U11', 'U12', 'U15', 'U17'];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Data Siswa Akademi</h1>
          <p className="text-xs text-slate-500">
            Daftar atlet BFA, filter kelompok umur (KU U3 - U30), tempat lahir, wali murid, dan berkas.
          </p>
        </div>
        <button
          onClick={onOpenAddStudent}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-orange-500/20 transition flex items-center space-x-1.5 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Siswa</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-xs">
        {/* Search input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari siswa, ID, tempat lahir, wali..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Category Controls & Popup Button */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
          {/* Main Category Popup Trigger Button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 border active:scale-95 ${
              classFilter !== 'Semua'
                ? 'bg-orange-50 border-orange-400 text-orange-700 ring-2 ring-orange-200'
                : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-orange-600" />
            <span>
              {classFilter !== 'Semua'
                ? `Kategori: ${classFilter} (${activeCategoryInfo?.age} Tahun)`
                : 'Pilih Kategori (U3 - 30 Tahun)'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {/* Quick Category Chips */}
          <div className="flex items-center space-x-1 shrink-0">
            {quickCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setClassFilter(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  classFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}

            {/* If a category outside quick list is selected, show its active badge */}
            {classFilter !== 'Semua' && !quickCategories.includes(classFilter) && (
              <button
                onClick={() => setClassFilter(classFilter)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs whitespace-nowrap"
              >
                {classFilter}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Notification Banner */}
      {classFilter !== 'Semua' && (
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
              {classFilter}
            </span>
            <span>
              Menampilkan filter kategori <strong>Kelompok {classFilter}</strong> (Usia {activeCategoryInfo?.age} Tahun • Lahir {activeCategoryInfo?.birthYear} • {activeCategoryInfo?.bracket}): <strong>{filtered.length} siswa ditemukan</strong>
            </span>
          </div>
          <button
            onClick={() => setClassFilter('Semua')}
            className="text-xs font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-white"
          >
            <X className="w-3.5 h-3.5" />
            <span>Hapus Filter</span>
          </button>
        </div>
      )}

      {/* Table Siswa */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">ID</th>
                <th className="px-4 py-3.5">Foto & Nama</th>
                <th className="px-4 py-3.5">Nama Orang Tua</th>
                <th className="px-4 py-3.5">Kelompok (KU)</th>
                <th className="px-4 py-3.5">Tempat & Tgl Lahir</th>
                <th className="px-4 py-3.5">Nomor WhatsApp</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <p className="text-sm font-bold text-slate-700">Tidak ada atlet ditemukan</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Tidak ada data siswa untuk kategori "{classFilter}" atau kata kunci "{search}".
                    </p>
                    <button
                      onClick={() => {
                        setClassFilter('Semua');
                        setSearch('');
                      }}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                    >
                      Tampilkan Semua Siswa
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-blue-50/40 transition">
                    <td
                      className="px-4 py-3 font-mono font-bold text-blue-700 cursor-pointer whitespace-nowrap"
                      onClick={() => onOpenDetailStudent(st)}
                    >
                      <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-md font-mono font-black text-[11px] shadow-2xs">
                        {st.id || 'BFA-???'}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => onOpenDetailStudent(st)}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={st.avatar}
                          className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-xs"
                          alt={st.name}
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">{st.name}</span>
                          <span className="text-[10px] text-slate-500">
                            #{st.jerseyNumber || '-'} • {st.position}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{st.parentName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-extrabold text-[10px]">
                        {st.classGroupId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-bold text-slate-900">{st.birthPlace || 'Karawang'}</span>,{' '}
                      <span className="text-slate-500">{formatDateIndo(st.birthDate)}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">{st.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onOpenEditStudent(st)}
                          title="Edit Data Siswa"
                          className="p-1.5 bg-white hover:bg-slate-100 text-orange-600 rounded-lg border border-slate-200 transition shadow-xs active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenDetailStudent(st)}
                          title="Detail Siswa"
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition shadow-xs active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Filter Popup Modal (U3 - U30) */}
      <CategoryFilterModal
        isOpen={isFilterModalOpen}
        selectedCategory={classFilter}
        students={students}
        onClose={() => setIsFilterModalOpen(false)}
        onSelectCategory={(cat) => setClassFilter(cat)}
      />
    </div>
  );
};
