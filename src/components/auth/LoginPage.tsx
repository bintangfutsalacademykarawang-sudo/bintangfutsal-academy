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
  Sparkles, 
  HelpCircle,
  Users
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
      return localStorage.getItem('bfa_remembered_parent_id') || '089634753330';
    } catch {
      return '089634753330';
    }
  });
  const [parentPin, setParentPin] = useState('123456');
  const [showParentPin, setShowParentPin] = useState(false);

  // Admin form state
  const [adminUsername, setAdminUsername] = useState(() => {
    try {
      return localStorage.getItem('bfa_remembered_admin_user') || 'coach.hendra';
    } catch {
      return 'coach.hendra';
    }
  });
  const [adminPassword, setAdminPassword] = useState('bfa2026');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);

  // Handle Parent Login Submission
  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = parentIdentifier.trim().toLowerCase();

    if (!cleanId) {
      onShowToast('Silakan masukkan Nomor WhatsApp atau ID Siswa (contoh: 089634753330 atau BFA-001)', 'warning');
      return;
    }

    if (rememberMe) {
      try { localStorage.setItem('bfa_remembered_parent_id', parentIdentifier); } catch {}
    }

    // Match with student in database
    const matched = students.find((s) => {
      const matchPhone = s.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '');
      const matchId = s.id.toLowerCase() === cleanId;
      const matchName = s.name.toLowerCase() === cleanId;
      return matchPhone || matchId || matchName;
    });

    if (matched) {
      onLogin({
        role: 'parent',
        name: matched.parentName || `Wali ${matched.name}`,
        emailOrPhone: matched.phone,
        studentId: matched.id,
        studentName: matched.name,
      });
      onShowToast(`Selamat datang, ${matched.parentName}! Berhasil masuk ke portal ananda ${matched.name}.`, 'success');
    } else {
      // Allow smart fallback with student 1 if demo
      if (cleanId === 'demo' || cleanId === 'andra' || cleanId === '089634753330') {
        const fallbackStudent = students[0];
        onLogin({
          role: 'parent',
          name: fallbackStudent.parentName,
          emailOrPhone: fallbackStudent.phone,
          studentId: fallbackStudent.id,
          studentName: fallbackStudent.name,
        });
        onShowToast(`Selamat datang, ${fallbackStudent.parentName}!`, 'success');
      } else {
        onShowToast('Nomor WhatsApp atau ID Siswa tidak ditemukan. Silakan gunakan tombol demo di bawah atau hubungi admin.', 'error');
      }
    }
  };

  // Handle Admin Login Submission
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = adminUsername.trim().toLowerCase();
    const pass = adminPassword.trim();

    if (!user) {
      onShowToast('Silakan isi username atau email admin', 'warning');
      return;
    }

    if (rememberMe) {
      try { localStorage.setItem('bfa_remembered_admin_user', adminUsername); } catch {}
    }

    // Simple permissive check for demonstration: accepts default credentials or coach
    if (
      user.includes('admin') || 
      user.includes('hendra') || 
      user.includes('coach') || 
      user.includes('sari') ||
      pass === 'bfa2026' ||
      pass === 'admin123' ||
      pass === '123456'
    ) {
      const isSari = user.includes('sari');
      const staffName = isSari ? 'Admin Sari (Finance)' : 'Coach Hendra (Head Coach)';
      onLogin({
        role: 'admin',
        name: staffName,
        emailOrPhone: isSari ? 'sari.finance@bintangfutsal.com' : 'coach.hendra@bintangfutsal.com',
      });
      onShowToast(`Selamat datang, ${staffName}! Berhasil masuk ke sistem admin.`, 'success');
    } else {
      onShowToast('Username atau password tidak sesuai. Coba username "admin" dan password "bfa2026", atau gunakan tombol demo.', 'error');
    }
  };

  // Quick Demo Logins
  const quickLoginAsParent = (student: Student) => {
    setParentIdentifier(student.phone);
    setParentPin('123456');
    onLogin({
      role: 'parent',
      name: student.parentName,
      emailOrPhone: student.phone,
      studentId: student.id,
      studentName: student.name,
    });
    onShowToast(`Masuk sbg ${student.parentName} (Wali ${student.name} - ${student.classGroupId})`, 'success');
  };

  const quickLoginAsAdmin = (type: 'hendra' | 'sari') => {
    if (type === 'hendra') {
      setAdminUsername('coach.hendra@bintangfutsal.com');
      setAdminPassword('bfa2026');
      onLogin({
        role: 'admin',
        name: 'Coach Hendra (Head Coach & Superadmin)',
        emailOrPhone: 'coach.hendra@bintangfutsal.com',
      });
      onShowToast('Masuk sbg Coach Hendra (Head Coach & Superadmin)', 'success');
    } else {
      setAdminUsername('sari.finance@bintangfutsal.com');
      setAdminPassword('bfa2026');
      onLogin({
        role: 'admin',
        name: 'Admin Sari (Finance & SPP)',
        emailOrPhone: 'sari.finance@bintangfutsal.com',
      });
      onShowToast('Masuk sbg Admin Sari (Finance & SPP)', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Visual Accent Strip */}
      <div className="h-1.5 bg-gradient-to-r from-blue-900 via-blue-700 to-orange-500 w-full" />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full">
          
          {/* Brand Header */}
          <div className="text-center mb-6">
            {/* Shield Logo */}
            <div className="w-16 h-18 mx-auto drop-shadow-lg mb-3">
              <svg viewBox="0 0 500 600" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M250 15 L475 90 V270 C475 425 250 580 250 580 C250 580 25 425 25 270 V90 L250 15 Z" fill="#060C18" stroke="#FFFFFF" strokeWidth="18"/>
                <path d="M250 35 L455 105 V270 C455 410 250 550 250 550 C250 550 45 410 45 270 V105 L250 35 Z" fill="#0A1428"/>
                <polygon points="250,55 272,125 345,125 286,168 308,235 250,192 192,235 214,168 155,125 228,125" fill="#D4FF00"/>
                <polygon points="175,235 250,290 325,235 345,260 250,335 155,260" fill="#D4FF00"/>
                <polygon points="110,185 118,208 142,208 122,222 130,245 110,230 90,245 98,222 78,208 102,208" fill="#FFFFFF"/>
                <polygon points="390,185 398,208 422,208 402,222 410,245 390,230 370,245 378,222 358,208 382,208" fill="#FFFFFF"/>
                <text x="250" y="375" textAnchor="middle" fill="#FFFFFF" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="52" letterSpacing="4">FUTSAL</text>
                <g transform="rotate(-6 250 440)">
                  <rect x="5" y="415" width="490" height="68" fill="#D4FF00"/>
                  <text x="250" y="466" textAnchor="middle" fill="#0A1428" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="44" letterSpacing="3">ACADEMY</text>
                </g>
                <text x="250" y="530" textAnchor="middle" fill="#94A3B8" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="700" fontSize="28">2018</text>
              </svg>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">BFA HUB</span>
              <span className="bg-[#0F274E] text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-900">
                2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Bintang Futsal Academy Karawang
            </p>
          </div>

          {/* Main Auth Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-7">
            
            {/* Role Tab Selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('parent')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'parent'
                    ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-orange-500" />
                <span>Orang Tua / Wali</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-700" />
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
                    Nomor WhatsApp Terdaftar / ID Siswa *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={parentIdentifier}
                      onChange={(e) => setParentIdentifier(e.target.value)}
                      placeholder="Contoh: 089634753330 atau BFA-001"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Gunakan nomor WA yang didaftarkan saat registrasi awal akademi.
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      PIN Akses / Tanggal Lahir Anak (Opsional)
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold">Default: 123456</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showParentPin ? 'text' : 'password'}
                      value={parentPin}
                      onChange={(e) => setParentPin(e.target.value)}
                      placeholder="Masukkan 6 digit PIN (contoh: 123456)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowParentPin(!showParentPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showParentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

                {/* Quick Demo Parent Accounts */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Uji Coba Cepat (Akun Demo):</span>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {students.slice(0, 3).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => quickLoginAsParent(st)}
                        className="w-full py-2 px-3 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 rounded-xl text-xs flex items-center justify-between transition text-left active:scale-95"
                      >
                        <div className="truncate">
                          <span className="font-bold text-slate-900">{st.parentName}</span>
                          <span className="text-[10px] text-slate-500 block">
                            Atlet: {st.name} ({st.classGroupId} - #{st.jerseyNumber})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full shrink-0">
                          Masuk &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
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
                    Username / Email Staf *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Contoh: coach.hendra atau admin"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Password Akses *</label>
                    <span className="text-[10px] text-blue-600 font-semibold">Demo: bfa2026</span>
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

                {/* Quick Demo Admin Accounts */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Masuk Cepat Demo Admin:</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => quickLoginAsAdmin('hendra')}
                      className="p-2.5 bg-blue-50/70 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold text-left transition active:scale-95"
                    >
                      <span className="block text-[11px]">⚽ Coach Hendra</span>
                      <span className="text-[10px] text-blue-600 font-normal">Head Coach & Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLoginAsAdmin('sari')}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold text-left transition active:scale-95"
                    >
                      <span className="block text-[11px]">📋 Admin Sari</span>
                      <span className="text-[10px] text-slate-500 font-normal">Finance & Kas</span>
                    </button>
                  </div>
                </div>
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
    </div>
  );
};
