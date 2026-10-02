import React, { useState } from 'react';
import { Student } from '../../types';
import { 
  X, 
  KeyRound, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  MessageCircle,
  ArrowRight,
  User,
  Shield
} from 'lucide-react';
import { BFALogo } from '../common/BFALogo';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  students: Student[];
  onClose: () => void;
  onResetStudentPassword: (studentId: string, newPassword: string) => void;
  onResetAdminPassword?: (newPassword: string) => void;
  onSuccess: (message: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  students,
  onClose,
  onResetStudentPassword,
  onResetAdminPassword,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'parent' | 'admin'>('parent');
  
  // Parent state
  const [parentQuery, setParentQuery] = useState('');
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [newParentPassword, setNewParentPassword] = useState('');
  const [confirmParentPassword, setConfirmParentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Admin state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminRecoveryCode, setAdminRecoveryCode] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [adminVerified, setAdminVerified] = useState(false);

  if (!isOpen) return null;

  const handleSearchStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const q = parentQuery.trim().toLowerCase();

    if (!q) {
      setErrorMessage('Silakan masukkan ID Siswa atau No. WhatsApp.');
      return;
    }

    const cleanInputPhone = q.replace(/\D/g, '');
    const found = students.find((s) => {
      const matchId = s.id.toLowerCase() === q;
      const cleanStudentPhone = s.phone.replace(/\D/g, '');
      const matchPhone = cleanInputPhone.length >= 7 && (
        cleanStudentPhone.includes(cleanInputPhone) || cleanInputPhone.includes(cleanStudentPhone)
      );
      const matchName = s.name.toLowerCase() === q;
      return matchId || matchPhone || matchName;
    });

    if (found) {
      setMatchedStudent(found);
      setErrorMessage('');
    } else {
      setMatchedStudent(null);
      setErrorMessage('Akun tidak ditemukan. Pastikan ID Siswa (contoh: BFA-001) atau No. WhatsApp sudah benar.');
    }
  };

  const handleSaveParentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedStudent) return;

    if (newParentPassword.length < 4) {
      setErrorMessage('Password minimal 4 karakter.');
      return;
    }

    if (newParentPassword !== confirmParentPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }

    onResetStudentPassword(matchedStudent.id, newParentPassword);
    onSuccess(`✓ Password akun ${matchedStudent.name} (${matchedStudent.id}) berhasil diperbarui! Silakan login.`);
    handleClose();
  };

  const handleVerifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const user = adminUsername.trim().toLowerCase();
    const code = adminRecoveryCode.trim().toLowerCase();

    const isValidUser = user === 'admin' || user === 'edysun';
    // Recovery code for management BFA
    const isValidCode = code === 'bfa2026' || code === 'karawang2026' || code === 'adminbfa';

    if (isValidUser && isValidCode) {
      setAdminVerified(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Username Admin atau Kode Pemulihan Manajemen tidak valid.');
    }
  };

  const handleSaveAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminVerified) return;

    if (newAdminPassword.length < 6) {
      setErrorMessage('Password baru admin minimal 6 karakter.');
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setErrorMessage('Konfirmasi password baru tidak cocok.');
      return;
    }

    if (onResetAdminPassword) {
      onResetAdminPassword(newAdminPassword);
    } else {
      try {
        localStorage.setItem('bfa_custom_admin_password', newAdminPassword);
      } catch {}
    }

    onSuccess('✓ Password Admin berhasil diperbarui! Silakan masuk kembali.');
    handleClose();
  };

  const handleClose = () => {
    setParentQuery('');
    setMatchedStudent(null);
    setNewParentPassword('');
    setConfirmParentPassword('');
    setAdminUsername('');
    setAdminRecoveryCode('');
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    setAdminVerified(false);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative my-6 border border-slate-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition z-10"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Pemulihan Akun & Lupa Password
            </h3>
            <p className="text-xs text-slate-500">
              Atur ulang kata sandi portal BFA Hub Anda dengan mudah.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('parent');
              setErrorMessage('');
            }}
            className={`py-2 font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'parent'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Orang Tua / Wali</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage('');
            }}
            className={`py-2 font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin / Pelatih</span>
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: ORANG TUA / WALI */}
        {activeTab === 'parent' && (
          <div className="space-y-4 text-xs">
            {!matchedStudent ? (
              <form onSubmit={handleSearchStudent} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ID Siswa atau No. WhatsApp Terdaftar:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={parentQuery}
                      onChange={(e) => setParentQuery(e.target.value)}
                      placeholder="Contoh: BFA-001 atau 081283623727"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Sistem akan memverifikasi data atlet di database resmi akademi.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md shadow-blue-500/25 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>Verifikasi Akun Siswa</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveParentPassword} className="space-y-3.5">
                {/* Matched Student Card */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={matchedStudent.avatar}
                      alt={matchedStudent.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-xs">
                          {matchedStudent.name}
                        </span>
                        <span className="px-1.5 py-0.2 bg-blue-600 text-white font-mono text-[9px] font-bold rounded">
                          {matchedStudent.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-semibold">
                        Wali: {matchedStudent.parentName} ({matchedStudent.phone})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMatchedStudent(null)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline font-bold"
                  >
                    Ganti
                  </button>
                </div>

                {/* New Password Inputs */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Buat Password Baru:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newParentPassword}
                      onChange={(e) => setNewParentPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ulangi Password Baru:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmParentPassword}
                      onChange={(e) => setConfirmParentPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/25 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Perbarui Password</span>
                </button>
              </form>
            )}

            {/* Helpline via WhatsApp */}
            <div className="pt-2 text-center border-t border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1.5">
                Mengalami kendala saat pemulihan mandiri?
              </span>
              <a
                href="https://wa.me/6281399201983?text=Halo%20Admin%20BFA%2C%20saya%20lupa%20password%20akun%20BFA%20Hub.%20Mohon%20bantuan%20reset%20kata%20sandi."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold transition text-[11px]"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bantuan Reset via WhatsApp Admin BFA</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: ADMIN / PELATIH */}
        {activeTab === 'admin' && (
          <div className="space-y-4 text-xs">
            {!adminVerified ? (
              <form onSubmit={handleVerifyAdmin} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username Akun Admin:
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Contoh: Admin atau EdySun"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Pemulihan Manajemen (PIN Otorisasi):
                  </label>
                  <input
                    type="password"
                    required
                    value={adminRecoveryCode}
                    onChange={(e) => setAdminRecoveryCode(e.target.value)}
                    placeholder="Masukkan kode pemulihan pimpinan BFA"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Kode pemulihan resmi diberikan oleh Pembina / Manajemen Utama BFA Karawang.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0F274E] hover:bg-blue-950 text-white font-black rounded-xl text-xs shadow-md shadow-blue-950/25 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Verifikasi Hak Akses Admin</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveAdminPassword} className="space-y-3.5">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-black text-slate-900 text-xs block">
                        Otorisasi Admin Berhasil
                      </span>
                      <span className="text-[11px] text-blue-700 font-semibold">
                        Akun: {adminUsername}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password Baru Admin:
                  </label>
                  <input
                    type="password"
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ulangi Password Baru Admin:
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="Ketik ulang password baru admin"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-black rounded-xl text-xs shadow-md shadow-blue-700/25 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Password Baru Admin</span>
                </button>
              </form>
            )}

            {/* Helpline via WhatsApp */}
            <div className="pt-2 text-center border-t border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1.5">
                Butuh verifikasi langsung dengan Pengurus Pusat BFA?
              </span>
              <a
                href="https://wa.me/6281399201983?text=Halo%20Ketua%20BFA%2C%20saya%20admin%20membutuhkan%20pemulihan%20akses%20login%20manajemen%20BFA%20Hub."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold transition text-[11px]"
              >
                <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Hubungi Pimpinan BFA via WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
