import React, { useState } from 'react';
import { Student } from '../../types';
import { ALL_KU_CATEGORIES, getKUCategoryInfo } from '../../data/initialData';
import { X, Search, Filter, CheckCircle2, RotateCcw, Users } from 'lucide-react';

interface CategoryFilterModalProps {
  isOpen: boolean;
  selectedCategory: string; // 'Semua' or 'U3', 'U10', etc.
  students: Student[];
  onClose: () => void;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilterModal: React.FC<CategoryFilterModalProps> = ({
  isOpen,
  selectedCategory,
  students,
  onClose,
  onSelectCategory,
}) => {
  const [search, setSearch] = useState('');
  const [activeBracket, setActiveBracket] = useState<string>('Semua');

  if (!isOpen) return null;

  // Calculate count of students in each category
  const studentCountMap: Record<string, number> = {};
  students.forEach((st) => {
    const ku = st.classGroupId;
    studentCountMap[ku] = (studentCountMap[ku] || 0) + 1;
  });

  const brackets = [
    { id: 'Semua', label: 'Semua (U3 - U30)' },
    { id: 'Usia Dini', label: 'Usia Dini (U3 - U7)' },
    { id: 'Grassroots', label: 'Grassroots (U8 - U12)' },
    { id: 'Remaja', label: 'Remaja (U13 - U17)' },
    { id: 'Senior', label: 'Senior (U18 - U30)' },
  ];

  const filteredCategories = ALL_KU_CATEGORIES.filter((code) => {
    const info = getKUCategoryInfo(code);
    if (!info) return true;

    // Bracket filter
    if (activeBracket !== 'Semua' && info.bracket !== activeBracket) {
      return false;
    }

    // Search query filter (matches "U7", "7", "2019", "dini", etc.)
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCode = code.toLowerCase().includes(q);
      const matchAge = `${info.age}`.includes(q) || `${info.age} tahun`.includes(q);
      const matchYear = `${info.birthYear}`.includes(q);
      const matchBracket = info.bracket.toLowerCase().includes(q);
      return matchCode || matchAge || matchYear || matchBracket;
    }

    return true;
  });

  const handleSelect = (category: string) => {
    onSelectCategory(category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative my-6 border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Filter className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Pilih Kategori Kelompok Umur (U3 - 30 Tahun)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Filter data atlet akademi BFA sesuai kelompok usia spesifik atau jenjang pembinaan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Bracket Quick Filters */}
        <div className="py-3 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori (contoh: U7, 10 tahun, lahir 2016, grassroots)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          {/* Bracket Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {brackets.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBracket(b.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap text-[11px] ${
                  activeBracket === b.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Grid */}
        <div className="flex-1 overflow-y-auto pr-1 my-2">
          {/* Option: Semua Kategori Button */}
          <button
            onClick={() => handleSelect('Semua')}
            className={`w-full mb-3 p-3 rounded-2xl border transition flex items-center justify-between text-left ${
              selectedCategory === 'Semua'
                ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                ALL
              </span>
              <div>
                <span className="font-extrabold text-slate-900 text-xs block">
                  Tampilkan Semua Siswa (Semua Kelompok Umur)
                </span>
                <span className="text-[10px] text-slate-500">
                  Total {students.length} atlet terdaftar di seluruh tingkatan usia (U3 - U30)
                </span>
              </div>
            </div>
            {selectedCategory === 'Semua' && (
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            )}
          </button>

          {/* Grid of U3 - U30 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredCategories.map((code) => {
              const info = getKUCategoryInfo(code)!;
              const count = studentCountMap[code] || 0;
              const isSelected = selectedCategory === code;

              let bracketColor = 'bg-blue-50 text-blue-700 border-blue-200';
              if (info.bracket === 'Usia Dini') {
                bracketColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              } else if (info.bracket === 'Grassroots') {
                bracketColor = 'bg-blue-50 text-blue-800 border-blue-200';
              } else if (info.bracket === 'Remaja') {
                bracketColor = 'bg-purple-50 text-purple-800 border-purple-200';
              } else {
                bracketColor = 'bg-amber-50 text-amber-800 border-amber-200';
              }

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelect(code)}
                  className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-400'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-base font-black text-slate-900 font-mono tracking-tight">
                      {code}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${bracketColor}`}
                    >
                      {info.bracket}
                    </span>
                  </div>

                  <div className="mt-2 text-xs">
                    <p className="font-bold text-slate-800 text-[11px] leading-tight">
                      {info.age} Tahun
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Lahir {info.birthYear}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span
                      className={`font-extrabold flex items-center gap-1 ${
                        count > 0 ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>{count} Siswa</span>
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-black text-orange-600 uppercase">
                        Aktif
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ada kategori yang cocok dengan pencarian "{search}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => handleSelect('Semua')}
            className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Semua Kategori</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition active:scale-95"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
