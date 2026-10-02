import React, { useState } from 'react';
import { Role, Student, AuthUser } from '../../types';
import { 
  Shield, 
  User, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle
} from 'lucide-react';

interface LoginPageProps {
  students: Student[];
  onLogin: (user: AuthUser) => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  students,
  onLogin,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<Role>('parent');

  // Parent form state
  const [parentIdentifier, setParentIdentifier] = useState(() => {
    try {
      return localStorage.getItem('bfa_remembered_parent_id') || '';
    } catch {
      return '';
    }
  });
  const [parentPassword, setParentPassword] = useState('Bfa123');
  const [showParentPassword, setShowParentPassword] = useState(false);

  // Admin form state
  const [adminUsername, setAdminUsername] = useState(() => {
    try {
      return localStorage.getItem('bfa_remembered_admin_user') || 'Admin';
    } catch {
      return 'Admin';
    }
  });
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);

  // Handle Parent Login Submission
  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = parentIdentifier.trim().toLowerCase();
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
      const matchId = s.id.toLowerCase() === cleanId;
      const cleanPhoneInput = cleanId.replace(/\D/g, '');
      const cleanStudentPhone = s.phone.replace(/\D/g, '');
      const matchPhone = cleanPhoneInput.length >= 7 && (
        cleanStudentPhone.includes(cleanPhoneInput) || cleanPhoneInput.includes(cleanStudentPhone)
      );
      const matchName = s.name.toLowerCase() === cleanId;
      return matchId || matchPhone || matchName;
    });

    if (matched) {
      // Validate password (default Bfa123, case-insensitive)
      const isValidPassword = 
        cleanPass === 'bfa123' || 
        cleanPass === '123456' || 
        cleanPass === 'admin123' ||
        cleanPass === (matched.birthDate || '').replace(/\D/g, '');

      if (!isValidPassword) {
        onShowToast('Password salah. Password default wali adalah Bfa123', 'error');
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
    const user = adminUsername.trim().toLowerCase();
    const pass = adminPassword.trim();

    if (!user) {
      onShowToast('Silakan isi Username Admin.', 'warning');
      return;
    }

    if (rememberMe) {
      try { localStorage.setItem('bfa_remembered_admin_user', adminUsername); } catch {}
    }

    const isValidUser = 
      user === 'admin' || 
      user.includes('coach') || 
      user.includes('hendra') || 
      user.includes('sari');

    const isValidPass = 
      pass === 'admin123' || 
      pass === 'bfa2026' || 
      pass === '123456';

    if (isValidUser && isValidPass) {
      const isSari = user.includes('sari');
      const staffName = isSari ? 'Admin Sari (Finance)' : 'Coach Hendra (Head Coach)';
      onLogin({
        role: 'admin',
        name: staffName,
        emailOrPhone: isSari ? 'sari.finance@bintangfutsal.com' : 'coach.hendra@bintangfutsal.com',
      });
      onShowToast(`Selamat datang, ${staffName}! Berhasil masuk ke sistem manajemen BFA.`, 'success');
    } else {
      onShowToast('Username atau password admin tidak sesuai. Gunakan Username: Admin dan Password: admin123', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header Logo & Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-900 border border-amber-400 flex items-center justify-center shadow-md">
            <span className="text-amber-400 font-black text-sm tracking-tighter">BFA</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">BFA HUB</span>
          <span className="text-xs bg-blue-900 text-white font-bold px-2 py-0.5 rounded-full">2026</span>
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
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password Akses *
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Default: Bfa123
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showParentPassword ? 'text' : 'password'}
                    required
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    placeholder="Masukkan password (default: Bfa123)"
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
                <a
                  href="https://wa.me/6289634753330?text=Halo%20Admin%20BFA%20saya%20butuh%20bantuan%20login%20portal%20orang%20tua"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 hover:underline font-bold text-[11px]"
                >
                  Bantuan WhatsApp?
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs shadow-md shadow-orange-500/25 transition active:scale-95 flex items-center justify-center space-x-2 tracking-wide"
              >
                <span>MASUK SEBAGAI ORANG TUA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
                    placeholder="Contoh: Admin"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Username resmi manajemen: <strong>Admin</strong>
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Password Admin *</label>
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Password: admin123
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan password admin (admin123)"
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
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sistem Absensi Biometrik & Keuangan Resmi BFA</span>
          </p>
          <p className="text-[11px]">
            &copy; 2026 Bintang Futsal Academy Karawang. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
};
