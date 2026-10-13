import React, { useState, useMemo } from 'react';
import { Student, RegistrationStatus } from '../../types';
import { 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Phone, 
  FileText, 
  Eye, 
  Check, 
  X, 
  Loader2, 
  ShieldCheck, 
  Calendar, 
  Users, 
  ChevronRight, 
  MessageCircle,
  ExternalLink,
  AlertTriangle,
  Info
} from 'lucide-react';
import { calculateAgeAndGroup, CURRENT_SYSTEM_YEAR } from '../../data/initialData';
import { BFALogo } from '../common/BFALogo';

interface AdminRegistrationsViewProps {
  students: Student[];
  onApprove: (studentId: string) => Promise<void>;
  onReject: (studentId: string, reason: string) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  adminName?: string;
}

export const AdminRegistrationsView: React.FC<AdminRegistrationsViewProps> = ({
  students,
  onApprove,
  onReject,
  onShowToast,
  adminName = 'Admin BFA',
}) => {
  // Filter States
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [kuFilter, setKuFilter] = useState('Semua');

  // Action Dialog States
  const [studentToApprove, setStudentToApprove] = useState<Student | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const [studentToReject, setStudentToReject] = useState<Student | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Document Inspection Modal State
  const [inspectingStudent, setInspectingStudent] = useState<Student | null>(null);
  const [inspectingDocTarget, setInspectingDocTarget] = useState<'photo' | 'kk' | 'akte' | 'kia' | 'ijazah' | null>(null);

  // Filter registrations:
  // Any student that has a registrationStatus or is newly registered
  const registrants = useMemo(() => {
    return students.filter((s) => {
      // If registrationStatus is explicitly set
      if (s.registrationStatus) return true;
      // Default: historical students are considered already approved
      return false;
    });
  }, [students]);

  // Derived counts
  const countPending = useMemo(
    () => students.filter((s) => s.registrationStatus === 'MENUNGGU_VERIFIKASI').length,
    [students]
  );
  const countApproved = useMemo(
    () => students.filter((s) => s.registrationStatus === 'DISETUJUI').length,
    [students]
  );
  const countRejected = useMemo(
    () => students.filter((s) => s.registrationStatus === 'DITOLAK').length,
    [students]
  );
  const countTotal = registrants.length;

  // Filtered List
  const filteredRegistrants = useMemo(() => {
    return registrants.filter((st) => {
      // 1. Status Tab filter
      const effectiveStatus: RegistrationStatus = st.registrationStatus || 'DISETUJUI';
      if (activeTab === 'pending' && effectiveStatus !== 'MENUNGGU_VERIFIKASI') return false;
      if (activeTab === 'approved' && effectiveStatus !== 'DISETUJUI') return false;
      if (activeTab === 'rejected' && effectiveStatus !== 'DITOLAK') return false;

      // 2. KU Filter
      if (kuFilter !== 'Semua' && st.classGroupId !== kuFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = st.name.toLowerCase().includes(q);
        const matchNick = (st.nickname || '').toLowerCase().includes(q);
        const matchId = st.id.toLowerCase().includes(q);
        const matchParent = (st.parentName || '').toLowerCase().includes(q);
        const matchPhone = (st.phone || '').includes(q);
        if (!matchName && !matchNick && !matchId && !matchParent && !matchPhone) return false;
      }

      return true;
    });
  }, [registrants, activeTab, kuFilter, searchQuery]);

  // Confirm Approve Handler
  const handleConfirmApprove = async () => {
    if (!studentToApprove || isApproving) return;
    setIsApproving(true);
    try {
      await onApprove(studentToApprove.id);
      onShowToast(
        `✓ Pendaftaran ananda ${studentToApprove.name} (${studentToApprove.id}) berhasil DISETUJUI! Akun siswa aktif & dapat masuk Portal Orang Tua.`,
        'success'
      );
      setStudentToApprove(null);
    } catch (err: any) {
      console.error('Gagal menyetujui pendaftaran:', err);
      onShowToast(`Gagal menyetujui pendaftaran: ${err?.message || 'Error koneksi Firestore'}`, 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // Confirm Reject Handler
  const handleConfirmReject = async () => {
    if (!studentToReject || isRejecting) return;
    setIsRejecting(true);
    const reasonText = rejectionReason.trim() || 'Persyaratan administrasi atau berkas belum memenuhi kualifikasi akademi.';
    try {
      await onReject(studentToReject.id, reasonText);
      onShowToast(
        `Pendaftaran ananda ${studentToReject.name} (${studentToReject.id}) telah DITOLAK. Pendaftar tidak dapat mengakses Portal Orang Tua.`,
        'warning'
      );
      setStudentToReject(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Gagal menolak pendaftaran:', err);
      onShowToast(`Gagal menolak pendaftaran: ${err?.message || 'Error koneksi Firestore'}`, 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ---------------- 1. HEADER BANNER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-md shadow-blue-900/20">
              <UserCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Verifikasi Pendaftaran Siswa Baru</span>
                {countPending > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                    {countPending} Baru
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500">
                Persetujuan calon atlet baru BFA. Akun belum aktif sebelum disetujui resmi oleh Admin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 2. SUMMARY KPI CARDS ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Card */}
        <div 
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            activeTab === 'pending'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Menunggu Verifikasi
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {countPending} <span className="text-xs font-medium text-amber-700">Pendaftar</span>
          </div>
          <span className="text-[10px] text-amber-700 block mt-1">
            {countPending > 0 ? 'Perlu tindakan verifikasi admin' : 'Tidak ada antrean pendaftar'}
          </span>
        </div>

        {/* Approved Card */}
        <div 
          onClick={() => setActiveTab('approved')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            activeTab === 'approved'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Disetujui
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {countApproved} <span className="text-xs font-medium text-emerald-700">Siswa Aktif</span>
          </div>
          <span className="text-[10px] text-emerald-700 block mt-1">
            Akun aktif & Portal Orang Tua terbuka
          </span>
        </div>

        {/* Rejected Card */}
        <div 
          onClick={() => setActiveTab('rejected')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            activeTab === 'rejected'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400'
              : 'bg-white border-slate-200 hover:border-rose-200 hover:bg-rose-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">
              Ditolak
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-1">
            {countRejected} <span className="text-xs font-medium text-rose-700">Berkas</span>
          </div>
          <span className="text-[10px] text-rose-700 block mt-1">
            Akses portal diblokir secara permanen
          </span>
        </div>

        {/* Total Card */}
        <div 
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            activeTab === 'all'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400'
              : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">
              Total Pengajuan
            </span>
            <Users className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1">
            {countTotal} <span className="text-xs font-medium text-blue-700">Pendaftar</span>
          </div>
          <span className="text-[10px] text-blue-700 block mt-1">
            Semua catatan pendaftaran online
          </span>
        </div>
      </div>

      {/* ---------------- 3. FILTER DAN SEARCH BAR ---------------- */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'pending'
                  ? 'bg-white text-amber-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Menunggu ({countPending})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'all'
                  ? 'bg-white text-blue-950 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Semua ({countTotal})</span>
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'approved'
                  ? 'bg-white text-emerald-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Disetujui ({countApproved})</span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'rejected'
                  ? 'bg-white text-rose-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Ditolak ({countRejected})</span>
            </button>
          </div>

          {/* KU and Search */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={kuFilter}
              onChange={(e) => setKuFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Semua">Semua Kelompok Usia</option>
              {['U6', 'U8', 'U10', 'U11', 'U12', 'U15', 'U17'].map((ku) => (
                <option key={ku} value={ku}>KU {ku}</option>
              ))}
            </select>

            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, ID, wali, WhatsApp..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ---------------- 4. DAFTAR PENDAFTAR ---------------- */}
      <div className="space-y-3">
        {filteredRegistrants.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">
                Tidak Ada Pendaftar Pada Kategori Ini
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {activeTab === 'pending'
                  ? 'Semua pendaftaran telah diverifikasi. Tidak ada calon siswa yang sedang menunggu persetujuan.'
                  : 'Tidak ada data pendaftaran yang cocok dengan filter atau kata kunci pencarian.'}
              </p>
            </div>
          </div>
        ) : (
          filteredRegistrants.map((reg) => {
            const status: RegistrationStatus = reg.registrationStatus || 'DISETUJUI';
            const { age, group } = calculateAgeAndGroup(reg.birthDate);
            const waClean = (reg.phone || '').replace(/\D/g, '');
            const waLink = waClean.startsWith('0')
              ? `https://wa.me/62${waClean.slice(1)}`
              : waClean.startsWith('62')
              ? `https://wa.me/${waClean}`
              : `https://wa.me/${waClean}`;

            return (
              <div
                key={reg.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition hover:shadow-md ${
                  status === 'MENUNGGU_VERIFIKASI'
                    ? 'border-amber-300 ring-1 ring-amber-100 bg-gradient-to-r from-white via-amber-50/20 to-white'
                    : status === 'DISETUJUI'
                    ? 'border-emerald-200'
                    : 'border-rose-200 bg-rose-50/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Avatar & Candidate Info */}
                  <div className="flex items-start space-x-3.5">
                    {/* Photo / Avatar */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {reg.avatar && reg.avatar.startsWith('data:image') ? (
                        <img
                          src={reg.avatar}
                          alt={reg.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center p-2">
                          <BFALogo className="w-full h-full object-contain drop-shadow" />
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 bg-blue-900 text-white text-[9px] font-mono px-1 rounded-tl">
                        {reg.gender}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-900 text-amber-300 rounded-md font-mono font-black text-xs">
                          {reg.id}
                        </span>
                        <h3 className="font-black text-slate-900 text-sm sm:text-base">
                          {reg.name}
                        </h3>
                        {reg.nickname && (
                          <span className="text-xs text-slate-500 font-normal">
                            (Panggilan: {reg.nickname})
                          </span>
                        )}

                        {/* Status Badge */}
                        {status === 'MENUNGGU_VERIFIKASI' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                            <span>Menunggu Verifikasi</span>
                          </span>
                        )}
                        {status === 'DISETUJUI' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Disetujui (Aktif)</span>
                          </span>
                        )}
                        {status === 'DITOLAK' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </div>

                      {/* Bio & Family Line */}
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div>
                          <span className="text-slate-400">KU: </span>
                          <span className="font-bold text-blue-900">{reg.classGroupId}</span>
                          <span className="text-slate-400 text-[11px]"> ({age} Tahun • Thn {new Date(reg.birthDate).getFullYear()})</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Lahir: </span>
                          <span className="font-medium text-slate-800">{reg.birthPlace}, {reg.birthDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Posisi/No: </span>
                          <span className="font-semibold text-slate-800">{reg.position || 'Belum Ditentukan'} (#{reg.jerseyNumber})</span>
                        </div>
                      </div>

                      {/* Parent and Contact */}
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-400">Wali: </span>
                          <span className="font-bold text-slate-800">{reg.parentName || '-'}</span>
                        </div>

                        {reg.phone && (
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono font-semibold text-slate-800">{reg.phone}</span>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5 text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                              title="Hubungi Orang Tua lewat WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Chat WA</span>
                            </a>
                          </div>
                        )}

                        {reg.registrationDate && (
                          <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>Daftar: {new Date(reg.registrationDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>

                      {/* Rejection / Approval Note */}
                      {status === 'DITOLAK' && reg.rejectionReason && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-1.5 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Alasan Penolakan: </span>
                            <span>{reg.rejectionReason}</span>
                          </div>
                        </div>
                      )}

                      {status === 'DISETUJUI' && reg.verifiedAt && (
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 mt-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Diverifikasi oleh {reg.verifiedBy || 'Admin'} pada {new Date(reg.verifiedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Documents Inspection & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    {/* Document Badges */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Kelengkapan Berkas:
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {[
                          { label: 'KK', val: reg.documents?.kk, target: 'kk' as const },
                          { label: 'Akte', val: reg.documents?.akte, target: 'akte' as const },
                          { label: 'KIA', val: reg.documents?.kia, target: 'kia' as const },
                          { label: 'Ijazah', val: reg.documents?.ijazah, target: 'ijazah' as const },
                        ].map((doc) => {
                          const isUploaded = doc.val && doc.val !== 'Belum diunggah' && doc.val !== '-';
                          return (
                            <button
                              key={doc.label}
                              type="button"
                              onClick={() => {
                                setInspectingStudent(reg);
                                setInspectingDocTarget(doc.target);
                              }}
                              className={`px-2 py-0.5 rounded-lg border flex items-center space-x-1 font-bold transition ${
                                isUploaded
                                  ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
                              }`}
                              title={isUploaded ? `Lihat berkas ${doc.label}` : `${doc.label} belum diunggah`}
                            >
                              <span>{doc.label}</span>
                              {isUploaded ? (
                                <Check className="w-2.5 h-2.5 text-blue-700" />
                              ) : (
                                <span className="text-slate-300 font-normal">-</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons for Admin */}
                    <div className="flex items-center gap-2 self-end">
                      {status === 'MENUNGGU_VERIFIKASI' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentToReject(reg);
                              setRejectionReason('');
                            }}
                            className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 hover:border-rose-400 rounded-xl text-xs font-bold transition active:scale-95 flex items-center space-x-1.5 shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentToApprove(reg)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition active:scale-95 flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                        </>
                      ) : status === 'DITOLAK' ? (
                        <button
                          type="button"
                          onClick={() => setStudentToApprove(reg)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition active:scale-95 flex items-center space-x-1.5"
                          title="Tinjau ulang dan setujui pendaftar yang sebelumnya ditolak"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Pulihkan & Setujui</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Akun Terverifikasi</span>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------- 5. MODAL KONFIRMASI PERSETUJUAN ---------------- */}
      {studentToApprove && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Konfirmasi Persetujuan Calon Siswa
                </h3>
                <p className="text-xs text-slate-500">
                  Aktivasi akun resmi & pembukaan akses Portal Orang Tua.
                </p>
              </div>
            </div>

            {/* Candidate Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ID Siswa Resmi:</span>
                <span className="font-mono font-black text-blue-900">{studentToApprove.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Calon Atlet:</span>
                <span className="font-bold text-slate-900">{studentToApprove.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kelompok Usia (KU):</span>
                <span className="font-bold text-blue-900">{studentToApprove.classGroupId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Orang Tua / Wali:</span>
                <span className="font-semibold text-slate-800">{studentToApprove.parentName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">No. WhatsApp:</span>
                <span className="font-mono font-semibold text-slate-800">{studentToApprove.phone || '-'}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Efek Persetujuan Admin:</span>
              </p>
              <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5 pl-1">
                <li>Status pendaftaran berubah menjadi <strong>DISETUJUI</strong> secara permanen di database.</li>
                <li>Status siswa menjadi <strong>Aktif</strong> dalam kelas latihan {studentToApprove.classGroupId}.</li>
                <li>Orang Tua dapat langsung login menggunakan No. WhatsApp atau ID Siswa di formulir login.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToApprove(null)}
                disabled={isApproving}
                className="py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isApproving}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isApproving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isApproving ? 'Menyimpan ke Cloud...' : 'Ya, Setujui Pendaftaran'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- 6. MODAL KONFIRMASI PENOLAKAN ---------------- */}
      {studentToReject && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Konfirmasi Penolakan Pendaftaran
                </h3>
                <p className="text-xs text-slate-500">
                  Calon siswa tidak akan mendapatkan akses ke Portal Orang Tua.
                </p>
              </div>
            </div>

            {/* Candidate Summary */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Calon Atlet:</span>
                <span className="font-bold text-slate-900">{studentToReject.name} ({studentToReject.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wali & WhatsApp:</span>
                <span className="text-slate-700">{studentToReject.parentName || '-'} ({studentToReject.phone || '-'})</span>
              </div>
            </div>

            {/* Rejection Reason Form */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700">
                Alasan Penolakan Pendaftaran:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Berkas Akte/KK belum diunggah atau tidak jelas, kuota kelompok usia penuh, atau nomor telepon tidak dapat dikonfirmasi."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-[11px] text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Pengamanan Otorisasi:</span>
              </p>
              <p className="text-rose-800 leading-relaxed">
                Pendaftar berstatus <strong>DITOLAK</strong> akan otomatis diblokir saat mencoba masuk formulir login dengan pesan: <em>"Pendaftaran Anda belum disetujui. Silakan hubungi Admin BFA."</em>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStudentToReject(null);
                  setRejectionReason('');
                }}
                disabled={isRejecting}
                className="py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/25 active:scale-95 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isRejecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isRejecting ? 'Memproses Penolakan...' : 'Ya, Tolak Pendaftaran'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- 7. MODAL INSPEKSI DOKUMEN / FOTO ---------------- */}
      {inspectingStudent && inspectingDocTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 text-slate-800 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-900" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Pratinjau Berkas {inspectingDocTarget.toUpperCase()} — {inspectingStudent.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setInspectingStudent(null);
                  setInspectingDocTarget(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Render Area */}
            {(() => {
              const docValue = inspectingStudent.documents?.[inspectingDocTarget as keyof typeof inspectingStudent.documents];
              const isBase64Img = docValue && docValue.startsWith('data:image');
              const isPdf = docValue && (docValue.endsWith('.pdf') || docValue.startsWith('data:application/pdf'));

              if (!docValue || docValue === 'Belum diunggah' || docValue === '-') {
                return (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <AlertCircle className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs">Berkas ini belum diunggah oleh pendaftar.</p>
                  </div>
                );
              }

              if (isBase64Img) {
                return (
                  <div className="max-h-[60vh] overflow-auto rounded-2xl border border-slate-200 p-2 bg-slate-950 flex items-center justify-center">
                    <img
                      src={docValue}
                      alt={inspectingDocTarget}
                      className="max-h-[55vh] object-contain rounded-xl"
                    />
                  </div>
                );
              }

              return (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{docValue}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isPdf ? 'Dokumen PDF terlampir dalam pendaftaran' : 'Nama berkas tercatat'}
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setInspectingStudent(null);
                  setInspectingDocTarget(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
              >
                Tutup Pratinjau
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
