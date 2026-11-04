import React, { useState } from 'react';
import { Role, Student, AuthUser } from '../../types';
import { 
  Shield, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { BFALogo } from '../common/BFALogo';
import { ForgotPasswordModal } from '../modals/ForgotPasswordModal';
import { normalizePhoneNumber, isValidIndonesianMobile, isExactPhoneMatch } from '../../utils/phoneUtils';
import { 
  fetchSingleStudentById, 
  fetchStudentsByPhone, 
  isFirestoreQuotaError, 
  isFirestoreOfflineError 
} from '../../firebase';
import { validateStudentPassword } from '../../utils/authUtils';
import { signInWithBfaAdapter } from '../../firebase/authAdapter';

interface LoginPageProps {
  students: Student[];
  onLogin: (user: AuthUser, password?: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onOpenRegister?: () => void;
  prefilledIdentifier?: string;
  onResetStudentPassword?: (studentId: string, newPassword: string) => void;
  onResetAdminPassword?: (newPassword: string) => void;
  cloudSyncStatus?: {
    status: 'connecting' | 'connected' | 'error' | 'offline';
    isQuotaExhausted?: boolean;
    isPartialCache?: boolean;
    docCount?: number;
    expectedCount?: number;
  };
}

export const LoginPage: React.FC<LoginPageProps> = ({
  students,
  onLogin,
  onShowToast,
  onOpenRegister,
  prefilledIdentifier = '',
  onResetStudentPassword,
  onResetAdminPassword,
  cloudSyncStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'parent' | 'admin'>('parent');
  
  // Parent Form State
  const [parentPhone, setParentPhone] = useState(() => {
    try {
      const remembered = localStorage.getItem('bfa_remembered_parent_id') || prefilledIdentifier;
      if (remembered.includes('|')) {
        return remembered.split('|')[0] || '';
      }
      return remembered.startsWith('08') || remembered.startsWith('62') ? remembered : '';
    } catch {
      return prefilledIdentifier;
    }
  });

  const [parentStudentId, setParentStudentId] = useState(() => {
    try {
      const remembered = localStorage.getItem('bfa_remembered_parent_id');
      if (remembered && remembered.includes('|')) {
        return remembered.split('|')[1] || '';
      }
      if (remembered && !remembered.startsWith('08') && !remembered.startsWith('62')) {
        return remembered;
      }
    } catch {}
    return '';
  });

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState(() => {
    try { return localStorage.getItem('bfa_remembered_admin_user') || ''; } catch { return ''; }
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [candidateStudents, setCandidateStudents] = useState<Student[]>([]);
  const [isSelectChildModalOpen, setIsSelectChildModalOpen] = useState(false);
  const [isVerifyingParent, setIsVerifyingParent] = useState(false);

  // Handle Parent Login Submission (Requires BOTH WhatsApp number AND Student ID matching the same student)
  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyingParent) return;
    const phoneInput = parentPhone.trim();
    const studentIdInput = parentStudentId.trim();

    if (!phoneInput || !studentIdInput) {
      onShowToast('Wajib memasukkan Nomor WhatsApp terdaftar DAN ID Siswa (NIS).', 'warning');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneInput);
    if (!isValidIndonesianMobile(normalizedPhone)) {
      onShowToast('Nomor WhatsApp tidak valid. Pastikan diawali 08... (minimal 10 digit).', 'warning');
      return;
    }

    const cleanIdInput = studentIdInput.replace(/[\s-]/g, '').toUpperCase();

    // 1. Find student by Student ID (local cache or Firestore fetch)
    let matchedStudent: Student | null = null;
    const foundLocalById = students.find(
      (s) => s.id && (
        s.id.trim().toUpperCase() === studentIdInput.toUpperCase() ||
        s.id.replace(/[\s-]/g, '').toUpperCase() === cleanIdInput
      )
    );

    if (foundLocalById) {
      matchedStudent = foundLocalById;
    } else {
      setIsVerifyingParent(true);
      try {
        const directStudent = await fetchSingleStudentById(studentIdInput);
        if (directStudent) {
          matchedStudent = directStudent;
        }
      } catch (fetchErr: any) {
        setIsVerifyingParent(false);
        if (isFirestoreQuotaError(fetchErr)) {
          onShowToast('Batas kuota harian cloud (Firestore) terlampaui. Silakan coba beberapa saat lagi.', 'warning');
          return;
        }
        if (isFirestoreOfflineError(fetchErr)) {
          onShowToast('Perangkat offline atau koneksi internet terputus.', 'warning');
          return;
        }
        onShowToast(`Gagal memverifikasi ke database: ${fetchErr?.message || 'Gangguan koneksi'}.`, 'error');
        return;
      } finally {
        setIsVerifyingParent(false);
      }
    }

    if (!matchedStudent) {
      onShowToast('ID Siswa (NIS) atau Nomor WhatsApp tidak cocok atau tidak ditemukan di database.', 'error');
      return;
    }

    // 2. Strict check: Both WhatsApp AND Student ID must match the same student document
    const isPhoneMatching = isExactPhoneMatch(matchedStudent.phone, normalizedPhone);
    if (!isPhoneMatching) {
      onShowToast('Nomor WhatsApp dan ID Siswa tidak cocok atau tidak terdaftar untuk siswa yang sama.', 'error');
      return;
    }

    // 3. Registration status verification guard
    if (matchedStudent.registrationStatus === 'MENUNGGU_VERIFIKASI') {
      onShowToast('Pendaftaran Anda sedang menunggu verifikasi Admin BFA.', 'warning');
      return;
    }
    if (matchedStudent.registrationStatus === 'DITOLAK') {
      onShowToast('Pendaftaran Anda belum disetujui. Silakan hubungi Admin BFA.', 'error');
      return;
    }

    if (rememberMe) {
      try {
        localStorage.setItem('bfa_remembered_parent_id', `${phoneInput}|${studentIdInput}`);
      } catch {}
    }

    // Check if WhatsApp matches multiple siblings (Family account)
    const siblings = students.filter(
      (s) => isExactPhoneMatch(s.phone, normalizedPhone) &&
             s.registrationStatus !== 'MENUNGGU_VERIFIKASI' &&
             s.registrationStatus !== 'DITOLAK'
    );

    if (siblings.length > 1) {
      setCandidateStudents(siblings);
      setIsSelectChildModalOpen(true);
      return;
    }

    // Successful login for single matched student
    onLogin({
      role: 'parent',
      name: matchedStudent.parentName || `Wali ${matchedStudent.name}`,
      emailOrPhone: matchedStudent.phone,
      studentId: matchedStudent.id,
      studentName: matchedStudent.name,
    });
    onShowToast(`Selamat datang, ${matchedStudent.parentName || 'Orang Tua'}! Berhasil masuk ke portal ananda ${matchedStudent.name}.`, 'success');
  };

  const handleSelectChild = (child: Student) => {
    if (child.registrationStatus === 'MENUNGGU_VERIFIKASI') {
      onShowToast('Pendaftaran Anda sedang menunggu verifikasi Admin BFA.', 'warning');
      return;
    }
    if (child.registrationStatus === 'DITOLAK') {
      onShowToast('Pendaftaran Anda belum disetujui. Silakan hubungi Admin BFA.', 'error');
      return;
    }

    setIsSelectChildModalOpen(false);
    setCandidateStudents([]);
    onLogin({
      role: 'parent',
      name: child.parentName || `Wali ${child.name}`,
      emailOrPhone: child.phone,
      studentId: child.id,
      studentName: child.name,
    });
    onShowToast(`Selamat datang, ${child.parentName || 'Orang Tua'}! Berhasil masuk ke portal ananda ${child.name}.`, 'success');
  };

  // Handle Admin Login Submission via Firebase Auth
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = adminUsername.trim();
    const pass = adminPassword.trim();

    if (!user || !pass) {
      onShowToast('Silakan isi Username dan Password Admin.', 'warning');
      return;
    }

    if (rememberMe) {
      try { localStorage.setItem('bfa_remembered_admin_user', adminUsername); } catch {}
    }

    try {
      const session = await signInWithBfaAdapter({
        identifier: user,
        password: pass,
        role: 'admin',
      });
      onLogin(session.authUser, session.token);
      onShowToast(`Selamat datang, ${session.authUser.name}! Berhasil masuk ke portal manajemen BFA via Firebase Auth.`, 'success');
    } catch (err: any) {
      onShowToast(`Login Admin gagal: ${err.message || 'Kredensial salah atau akun belum terdaftar di Firebase Auth'}.`, 'error');
    }
  };

  const handleResetStudentPasswordInternal = (studentId: string, newPassword: string) => {
    try {
      const raw = localStorage.getItem('bfa_student_passwords');
      const map = raw ? JSON.parse(raw) : {};
      map[studentId] = newPassword;
      localStorage.setItem('bfa_student_passwords', JSON.stringify(map));
    } catch {}

    if (onResetStudentPassword) {
      onResetStudentPassword(studentId, newPassword);
    }

    setParentStudentId(studentId);
  };

  const handleResetAdminPasswordInternal = (newPassword: string) => {
    try {
      localStorage.setItem('bfa_custom_admin_password', newPassword);
    } catch {}

    if (onResetAdminPassword) {
      onResetAdminPassword(newPassword);
    }

    setAdminPassword(newPassword);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header Logo & Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex flex-col items-center justify-center mb-2">
          <BFALogo className="w-16 h-20 drop-shadow-lg mb-1.5 transition-transform hover:scale-105" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">BFA HUB</span>
            <span className="text-xs bg-blue-900 text-white font-bold px-2 py-0.5 rounded-full">2026</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Bintang Futsal Academy Karawang • Sistem Terintegrasi
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 sm:px-8 rounded-3xl shadow-xl border border-slate-200">
          
          {/* Partial Cache Notice if Quota is Exhausted */}
          {cloudSyncStatus?.isQuotaExhausted && cloudSyncStatus?.isPartialCache && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed space-y-1">
              <p className="font-extrabold flex items-center gap-1.5 text-amber-950">
                <span>⚠️ Catatan Sinkronisasi Cloud</span>
              </p>
              <p>
                Perangkat ini memuat 10 data siswa dari cache lokal karena batas kuota harian Cloud Firestore (free tier) sedang terlampaui. Database Cloud berisi 24 siswa dan data Anda tetap aman.
              </p>
            </div>
          )}

          {/* Tab Selection */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('parent')}
              className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'parent'
                  ? 'bg-white text-blue-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Orang Tua / Wali</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-blue-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin / Pelatih</span>
            </button>
          </div>

          {/* TAB 1: ORANG TUA / WALI LOGIN */}
          {activeTab === 'parent' && (
            <form onSubmit={handleParentSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Masuk Portal Orang Tua
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau presensi biometrik anak, nilai rapor 20 indikator, dan bayar SPP.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Terdaftar *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nomor WhatsApp orang tua yang terdaftar (diawali 08...).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID Siswa / NIS (Contoh: BFA-001) *
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={parentStudentId}
                    onChange={(e) => setParentStudentId(e.target.value)}
                    placeholder="Contoh: BFA-001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono uppercase"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Masukkan NIS / ID Siswa ananda yang terdaftar di BFA.
                </span>
              </div>



              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span>Ingat akun saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-blue-700 hover:underline font-bold text-[11px]"
                >
                  Bantuan / Lupa Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifyingParent}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs shadow-md shadow-orange-500/25 transition active:scale-95 flex items-center justify-center space-x-2 tracking-wide disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isVerifyingParent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>MEMERIKSA DATABASE CLOUD...</span>
                  </>
                ) : (
                  <>
                    <span>MASUK SEBAGAI ORANG TUA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {onOpenRegister && (
                <div className="pt-2 text-center border-t border-slate-100 mt-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Belum memiliki akun siswa?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenRegister}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center space-x-2 tracking-wide"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-100" />
                    <span>REGISTRASI NEW MEMBER</span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Daftar siswa baru BFA Karawang secara online & otomatis terhubung ke sistem.
                  </p>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: ADMIN / PELATIH LOGIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Masuk Portal Manajemen & Pelatih
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akses kontrol penuh data siswa, hardware scanner, e-rapport, & pembukuan kas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Admin *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Contoh: admin@bfa.my.id"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Gunakan alamat email akun manajemen BFA Karawang yang terdaftar di Firebase Auth.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Password Admin *</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan password admin"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span>Ingat sesi browser ini</span>
                </label>
                <span className="text-[11px] text-slate-400">Enkripsi 256-bit</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0F274E] hover:bg-blue-950 text-white font-black rounded-xl text-xs shadow-md shadow-blue-950/25 transition active:scale-95 flex items-center justify-center space-x-2 tracking-wide"
              >
                <Shield className="w-4 h-4 text-amber-300" />
                <span>MASUK SEBAGAI ADMIN / PELATIH</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

        {/* Footer Information */}
        <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Sistem Absensi Biometrik & Keuangan Resmi BFA</span>
          </p>
          <p className="text-[11px]">
            © {new Date().getFullYear()} Bintang Futsal Academy Karawang. All rights reserved.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        students={students}
        onClose={() => setIsForgotPasswordOpen(false)}
        onResetStudentPassword={handleResetStudentPasswordInternal}
        onResetAdminPassword={handleResetAdminPasswordInternal}
        onSuccess={(msg) => onShowToast(msg, 'success')}
      />

      {/* Modal Pemilihan Siswa untuk 1 Nomor HP Banyak Anak (Family Account) */}
      {isSelectChildModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative my-8 border border-slate-200">
            <button
              onClick={() => setIsSelectChildModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-100 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2 font-bold shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Pilih Ananda untuk Membuka Dashboard
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Nomor WhatsApp <strong className="text-blue-900 font-mono">{parentPhone}</strong> terdaftar untuk {candidateStudents.length} siswa di akademi BFA Karawang:
              </p>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {candidateStudents.map((child) => (
                <div
                  key={child.id}
                  onClick={() => handleSelectChild(child)}
                  className="p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={child.avatar}
                      alt={child.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-orange-500 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-sm group-hover:text-blue-900">
                          {child.name}
                        </span>
                        {child.nickname && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            {child.nickname}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                        <span className="font-mono text-blue-800 font-bold">{child.id}</span>
                        <span>•</span>
                        <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                          {child.classGroupId}
                        </span>
                        {child.position && (
                          <>
                            <span>•</span>
                            <span>{child.position}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectChild(child);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center gap-1"
                  >
                    <span>Pilih</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-4">
              Anda juga dapat beralih antar ananda kapan saja langsung dari header dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
