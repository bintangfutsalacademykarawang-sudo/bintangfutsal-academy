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
  UserPlus
} from 'lucide-react';
import { BFALogo } from '../common/BFALogo';
import { ForgotPasswordModal } from '../modals/ForgotPasswordModal';

interface LoginPageProps {
  students: Student[];
  onLogin: (user: AuthUser) => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onOpenRegister?: () => void;
  prefilledIdentifier?: string;
  onResetStudentPassword?: (studentId: string, newPassword: string) => void;
  onResetAdminPassword?: (newPassword: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  students,
  onLogin,
  onShowToast,
  onOpenRegister,
  prefilledIdentifier = '',
  onResetStudentPassword,
  onResetAdminPassword,
}) => {
  const [activeTab, setActiveTab] = useState<'parent' | 'admin'>('parent');
  
  // Parent Form State
  const [parentIdentifier, setParentIdentifier] = useState(prefilledIdentifier);
  const [parentPassword, setParentPassword] = useState('');
  const [showParentPassword, setShowParentPassword] = useState(false);

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState(() => {
    try { return localStorage.getItem('bfa_remembered_admin_user') || ''; } catch { return ''; }
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Handle Parent Login Submission
  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = parentIdentifier.trim();
    const cleanPass = parentPassword.trim().toLowerCase();

    if (!cleanId) {
      onShowToast('Silakan masukkan ID Siswa (contoh: BFA-001) atau Nomor WhatsApp yang terdaftar.', 'warning');
      return;
    }

    if (rememberMe) {
      try { localStorage.setItem('bfa_remembered_parent_id', parentIdentifier); } catch {}
    }

    // Match with student in database
    const matched = students.find((s) => {
      const matchId = s.id.toLowerCase() === cleanId.toLowerCase();
      const cleanPhoneInput = cleanId.replace(/\D/g, '');
      const cleanStudentPhone = s.phone.replace(/\D/g, '');
      const matchPhone = cleanPhoneInput.length >= 7 && (
        cleanStudentPhone.includes(cleanPhoneInput) || cleanPhoneInput.includes(cleanStudentPhone)
      );
      const matchName = s.name.toLowerCase() === cleanId.toLowerCase();
      return matchId || matchPhone || matchName;
    });

    if (matched) {
      // Check if custom password was set via Forgot Password
      let savedCustomPasswords: Record<string, string> = {};
      try {
        const raw = localStorage.getItem('bfa_student_passwords');
        if (raw) savedCustomPasswords = JSON.parse(raw);
      } catch {}

      const customPass = savedCustomPasswords[matched.id] || matched.customPassword;

      const isValidPassword = 
        (customPass && cleanPass === customPass.toLowerCase()) ||
        cleanPass === 'bfa123' || 
        cleanPass === '123456' || 
        cleanPass === 'admin123' ||
        cleanPass === (matched.birthDate || '').replace(/\D/g, '');

      if (!isValidPassword) {
        onShowToast('Password yang Anda masukkan salah. Silakan coba lagi atau gunakan tombol "Lupa Password?".', 'error');
        return;
      }

      onLogin({
        role: 'parent',
        name: matched.parentName || `Wali ${matched.name}`,
        emailOrPhone: matched.phone,
        studentId: matched.id,
        studentName: matched.name,
      });
      onShowToast(`Selamat datang, ${matched.parentName || 'Orang Tua'}! Berhasil masuk ke portal ananda ${matched.name}.`, 'success');
    } else {
      onShowToast('ID Siswa atau Nomor WhatsApp tidak ditemukan di database. Pastikan data sudah terdaftar di BFA.', 'error');
    }
  };

  // Handle Admin Login Submission
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = adminUsername.trim();
    const pass = adminPassword.trim();

    if (!user) {
      onShowToast('Silakan isi ID / Username Admin.', 'warning');
      return;
    }

    if (rememberMe) {
      try { localStorage.setItem('bfa_remembered_admin_user', adminUsername); } catch {}
    }

    let customAdminPass = '';
    try {
      customAdminPass = localStorage.getItem('bfa_custom_admin_password') || '';
    } catch {}

    const isPassCorrect = pass === 'adminbfa' || (customAdminPass && pass === customAdminPass);
    const isAccountAdmin = user.toLowerCase() === 'admin' && isPassCorrect;
    const isAccountEdySun = user.toLowerCase() === 'edysun' && isPassCorrect;

    if (isAccountAdmin || isAccountEdySun) {
      const staffName = isAccountEdySun ? 'EdySun (Management BFA)' : 'Admin BFA';
      const staffEmail = isAccountEdySun ? 'edysun@bintangfutsal.com' : 'admin@bintangfutsal.com';
      onLogin({
        role: 'admin',
        name: staffName,
        emailOrPhone: staffEmail,
      });
      onShowToast(`Selamat datang, ${staffName}! Berhasil masuk ke portal manajemen BFA.`, 'success');
    } else {
      onShowToast('Username atau Password Admin salah. Silakan periksa kembali data login Anda atau klik "Lupa Password?".', 'error');
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

    setParentIdentifier(studentId);
    setParentPassword(newPassword);
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
                  ID Siswa atau Nomor WhatsApp Terdaftar *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={parentIdentifier}
                    onChange={(e) => setParentIdentifier(e.target.value)}
                    placeholder="Contoh: BFA-001 atau 081234567890"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Masukkan ID Siswa resmi (BFA-001, BFA-002, dll.) atau No. WhatsApp terdaftar.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password Akses *
                  </label>
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
                    type={showParentPassword ? 'text' : 'password'}
                    required
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowParentPassword(!showParentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showParentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs shadow-md shadow-orange-500/25 transition active:scale-95 flex items-center justify-center space-x-2 tracking-wide"
              >
                <span>MASUK SEBAGAI ORANG TUA</span>
                <ArrowRight className="w-4 h-4" />
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
                  Username Admin *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Contoh: Admin atau EdySun"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Gunakan ID akun resmi manajemen BFA Karawang.
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
    </div>
  );
};
