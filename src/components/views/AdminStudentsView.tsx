import React, { useState } from 'react';
import { Student } from '../../types';
import { formatDateIndo, getKUCategoryInfo } from '../../data/initialData';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Filter, 
  X, 
  ChevronDown, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  QrCode, 
  Trash2, 
  AlertTriangle,
  RefreshCw,
  Cloud,
  CloudOff
} from 'lucide-react';
import { CategoryFilterModal } from '../modals/CategoryFilterModal';
import { StudentBarcodeModal } from '../modals/StudentBarcodeModal';
import { exportStudentsExcel, exportStudentsPDF } from '../../utils/exportHelpers';

export interface CloudSyncStatusInfo {
  status: 'connecting' | 'connected' | 'error' | 'offline';
  source: 'server' | 'cache' | 'local_fallback';
  docCount: number;
  lastSynced: string | null;
  errorMessage: string | null;
}

interface AdminStudentsViewProps {
  students: Student[];
  onOpenAddStudent: () => void;
  onOpenEditStudent: (student: Student) => void;
  onOpenDetailStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  cloudSyncStatus?: CloudSyncStatusInfo;
  onRetrySync?: () => void;
}

export const AdminStudentsView: React.FC<AdminStudentsViewProps> = ({
  students,
  onOpenAddStudent,
  onOpenEditStudent,
  onOpenDetailStudent,
  onDeleteStudent,
  cloudSyncStatus,
  onRetrySync,
}) => {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('Semua');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [barcodeModalStudent, setBarcodeModalStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Filter students based on search and selected KU
  const filtered = students.filter((st) => {
    const matchSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      (st.nickname && st.nickname.toLowerCase().includes(search.toLowerCase())) ||
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Data Siswa Akademi</h1>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-extrabold text-xs rounded-full border border-blue-200">
              Total {students.length} Siswa
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Daftar atlet BFA terdaftar, filter kelompok umur (KU U3 - U30), tempat lahir, wali murid, dan berkas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onRetrySync && (
            <button
              onClick={onRetrySync}
              className="px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-xl text-xs shadow-2xs transition flex items-center space-x-1.5 active:scale-95"
              title="Sinkronkan ulang data siswa dengan database Cloud"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Sinkron Cloud</span>
            </button>
          )}

          <button
            onClick={() => exportStudentsExcel(filtered)}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center space-x-1.5 active:scale-95"
            title="Download Data Siswa format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Unduh Excel</span>
          </button>

          <button
            onClick={() => exportStudentsPDF(filtered)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center space-x-1.5 active:scale-95"
            title="Download Data Siswa format PDF"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Unduh PDF</span>
          </button>

          <button
            onClick={onOpenAddStudent}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-orange-500/20 transition flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Cloud Diagnostic Status Banner */}
      {cloudSyncStatus && (
        <div className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
          cloudSyncStatus.status === 'connected'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : cloudSyncStatus.status === 'error'
            ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            {cloudSyncStatus.status === 'connected' ? (
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
            ) : cloudSyncStatus.status === 'error' ? (
              <div className="w-7 h-7 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
            )}
            <div>
              {cloudSyncStatus.status === 'connected' && (
                <p className="font-bold">
                  ✓ Database Cloud Aktif:{' '}
                  <span className="font-normal">
                    {cloudSyncStatus.docCount} dokumen siswa ({cloudSyncStatus.source === 'server' ? 'Server Langsung' : 'Cache Cloud Persisten'}).
                    {cloudSyncStatus.lastSynced && ` Diperbarui: ${cloudSyncStatus.lastSynced}`}
                  </span>
                </p>
              )}
              {cloudSyncStatus.status === 'error' && (
                <div>
                  <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <span>Sinkronisasi Cloud Terkendala</span>
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {cloudSyncStatus.errorMessage} Menampilkan <strong>{students.length} siswa</strong> dari memori lokal/perangkat.
                  </p>
                </div>
              )}
              {cloudSyncStatus.status === 'connecting' && (
                <p className="font-bold text-blue-900">
                  Menghubungkan ke database Firebase Firestore...
                </p>
              )}
            </div>
          </div>

          {cloudSyncStatus.status === 'error' && onRetrySync && (
            <button
              onClick={onRetrySync}
              className="self-start sm:self-auto px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-[11px] transition shadow-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Coba Hubungkan Ulang</span>
            </button>
          )}
        </div>
      )}

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
                    {students.length === 0 ? (
                      cloudSyncStatus?.status === 'connecting' ? (
                        <div className="space-y-3 py-6 max-w-sm mx-auto">
                          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-sm font-extrabold text-slate-800">Menghubungkan ke Cloud Firestore...</p>
                          <p className="text-xs text-slate-500">Mengambil seluruh dokumen siswa resmi dari database cloud online.</p>
                        </div>
                      ) : cloudSyncStatus?.status === 'error' ? (
                        <div className="space-y-3 py-6 max-w-md mx-auto">
                          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                            <CloudOff className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-amber-950">Gagal Mengambil Data Siswa dari Cloud Server</p>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {cloudSyncStatus.errorMessage || 'Terjadi gangguan saat menghubungkan ke database Firestore.'}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1 italic">
                              Sistem tidak menampilkan data awal bawaan (10 siswa) untuk mencegah data palsu/parsial.
                            </p>
                          </div>
                          {onRetrySync && (
                            <button
                              type="button"
                              onClick={onRetrySync}
                              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 mx-auto active:scale-95"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Coba Hubungkan Ulang</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 py-6">
                          <p className="text-sm font-bold text-slate-700">Belum Ada Siswa Terdaftar</p>
                          <p className="text-xs text-slate-500">Database Firestore terhubung tetapi belum memiliki dokumen siswa aktif.</p>
                          <button
                            onClick={onOpenAddStudent}
                            className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition"
                          >
                            Tambah Siswa Pertama
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="space-y-2 py-4">
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
                          Tampilkan Semua Siswa ({students.length})
                        </button>
                      </div>
                    )}
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-xs block">{st.name}</span>
                            {st.nickname && (
                              <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                                {st.nickname}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            #{st.jerseyNumber || '-'} • {st.position || 'Belum Ditentukan'}
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
                          onClick={() => setBarcodeModalStudent(st)}
                          title="Buka & Cetak Kartu Barcode Siswa"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition shadow-xs active:scale-95"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
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
                        <button
                          onClick={() => setStudentToDelete(st)}
                          title={`Hapus Data ${st.name}`}
                          className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 hover:border-rose-300 transition shadow-xs active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Student Barcode ID Pass Modal */}
      <StudentBarcodeModal
        isOpen={Boolean(barcodeModalStudent)}
        student={barcodeModalStudent}
        onClose={() => setBarcodeModalStudent(null)}
      />

      {/* Modal Konfirmasi Hapus Siswa */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setStudentToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-lg"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 text-center tracking-tight">
              Hapus Data Siswa?
            </h3>
            
            <p className="text-xs text-slate-500 text-center mt-1">
              Data atlet ini akan dihapus permanen dari sistem BFA Hub & database online.
            </p>

            <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-3">
              <img
                src={studentToDelete.avatar}
                alt={studentToDelete.name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-300 shrink-0"
              />
              <div className="overflow-hidden">
                <span className="font-extrabold text-xs text-slate-900 block truncate">
                  {studentToDelete.name}
                </span>
                <span className="text-[10px] text-blue-700 font-mono font-bold block">
                  {studentToDelete.id} • KU {studentToDelete.classGroupId}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  Wali: {studentToDelete.parentName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteStudent(studentToDelete);
                  setStudentToDelete(null);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/30 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
