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
  Shield,
  Users
} from 'lucide-react';
import { BFALogo } from '../common/BFALogo';
import { normalizePhoneNumber, isValidIndonesianMobile, isExactPhoneMatch } from '../../utils/phoneUtils';

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
  const [candidateMatches, setCandidateMatches] = useState<Student[]>([]);
  const [newParentPassword, setNewParentPassword] = useState('');
  const [confirmParentPassword, setConfirmParentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSearchStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setCandidateMatches([]);
    const rawQ = parentQuery.trim();

    if (!rawQ) {
      setErrorMessage('Silakan masukkan ID Siswa atau No. WhatsApp.');
      return;
    }

    // 1. Exact match by student ID
    const cleanId = rawQ.replace(/[\s-]/g, '').toUpperCase();
    const matchedById = students.filter(
      (s) => s.id && (
        s.id.trim().toUpperCase() === rawQ.toUpperCase() ||
        s.id.replace(/[\s-]/g, '').toUpperCase() === cleanId
      )
    );

    // 2. Strict normalized exact match by phone
    const normalizedInput = normalizePhoneNumber(rawQ);
    let matchedByPhone: Student[] = [];
    if (isValidIndonesianMobile(normalizedInput)) {
      matchedByPhone = students.filter((s) => isExactPhoneMatch(s.phone, normalizedInput));
    }

    const matchedList = matchedById.length > 0 ? matchedById : matchedByPhone;

    if (matchedList.length === 1) {
      setMatchedStudent(matchedList[0]);
      setCandidateMatches([]);
      setErrorMessage('');
    } else if (matchedList.length > 1) {
      setMatchedStudent(null);
      setCandidateMatches(matchedList);
      setErrorMessage('');
    } else {
      setMatchedStudent(null);
      setCandidateMatches([]);
      setErrorMessage('Akun tidak ditemukan. Pastikan ID Siswa (contoh: BFA-001) atau No. WhatsApp (contoh: 08xxx) sudah terdaftar di akademi.');
    }
  };

  // Keamanan: Reset kata sandi mandiri tanpa autentikasi dua faktor (OTP) dinonaktifkan
  // untuk mencegah pengambilalihan akun oleh pihak ketiga yang hanya mengetahui ID/Nomor HP.
  // Permintaan reset diarahkan langsung melalui verifikasi Admin BFA via WhatsApp resmi.

  // Keamanan: Pemulihan sandi admin mandiri menggunakan kode statis di frontend
  // dinonaktifkan secara penuh untuk mencegah pembobolan akun administrator.
  // Staf diarahkan langsung ke prosedur otorisasi manual bersama Pimpinan Utama BFA.

  const handleClose = () => {
    setParentQuery('');
    setMatchedStudent(null);
    setNewParentPassword('');
    setConfirmParentPassword('');
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
              <div className="space-y-3">
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
                        onChange={(e) => {
                          setParentQuery(e.target.value);
                          if (candidateMatches.length > 0) setCandidateMatches([]);
                        }}
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

                {/* Candidate Selection if multiple children share this parent phone */}
                {candidateMatches.length > 1 && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Ditemukan {candidateMatches.length} Ananda Terdaftar:</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Silakan pilih ananda yang ingin diatur ulang kata sandinya:
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {candidateMatches.map((child) => (
                        <div
                          key={child.id}
                          onClick={() => {
                            setMatchedStudent(child);
                            setCandidateMatches([]);
                          }}
                          className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl cursor-pointer transition flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={child.avatar}
                              alt={child.name}
                              className="w-8 h-8 rounded-lg object-cover border border-blue-500 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs">{child.name}</span>
                                <span className="font-mono text-[9px] bg-blue-100 text-blue-800 px-1 rounded">{child.id}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">KU: {child.classGroupId} • Posisi: {child.position}</span>
                            </div>
                          </div>
                          <span className="text-blue-600 font-bold text-[11px]">Pilih &rarr;</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Matched Student Card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={matchedStudent.avatar}
                      alt={matchedStudent.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-xs">
                          {matchedStudent.name}
                        </span>
                        <span className="px-1.5 py-0.2 bg-blue-900 text-amber-300 font-mono text-[9px] font-bold rounded">
                          {matchedStudent.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        KU {matchedStudent.classGroupId} • Wali: {matchedStudent.parentName || '-'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMatchedStudent(null)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 underline font-bold"
                  >
                    Ganti
                  </button>
                </div>

                {/* Security Protection Notice */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Perlindungan Keamanan Akun Siswa</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Demi melindungi privasi atlet dan mencegah pergantian kata sandi oleh pihak yang tidak berhak, pengaturan kata sandi baru dilakukan melalui verifikasi resmi bersama Tim Admin BFA Karawang.
                  </p>
                </div>

                {/* Action: Contact Admin via WhatsApp */}
                <a
                  href={`https://wa.me/6281399201983?text=${encodeURIComponent(
                    `Halo Admin BFA, saya orang tua/wali dari ananda ${matchedStudent.name} (${matchedStudent.id}). Mohon bantuan verifikasi dan pengaturan kata sandi akun BFA Hub kami.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim Permintaan Reset ke WhatsApp Admin</span>
                </a>

                <button
                  type="button"
                  onClick={() => setMatchedStudent(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cari Akun Siswa Lain
                </button>
              </div>
            )}

            {/* Helpline via WhatsApp */}
            <div className="pt-2 text-center border-t border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1.5">
                Membutuhkan panduan aktivasi atau bantuan langsung?
              </span>
              <a
                href="https://wa.me/6281399201983?text=Halo%20Admin%20BFA%2C%20saya%20membutuhkan%20bantuan%20pengaturan%20kata%20sandi%20portal%20BFA%20Hub."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold transition text-[11px]"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Layanan Resmi WhatsApp Admin BFA</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: ADMIN / PELATIH */}
        {activeTab === 'admin' && (
          <div className="space-y-4 text-xs">
            {/* Security Advisory Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span className="text-xs">Otorisasi Akses Administrator</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Demi keamanan seluruh data akademi, pemulihan akun Administrator tidak dapat dilakukan secara mandiri di peramban menggunakan kode statis.
              </p>
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[10px] text-slate-400 space-y-1">
                <p>• Permohonan reset/pemulihan kredensial wajib diverifikasi langsung oleh Pembina / Pimpinan Utama BFA Karawang.</p>
                <p>• Kredensial baru akan diterbitkan secara aman melalui jalur komunikasi internal resmi.</p>
              </div>
            </div>

            {/* Official Assistance Action */}
            <div className="space-y-2">
              <a
                href={`https://wa.me/6281399201983?text=${encodeURIComponent(
                  'Halo Pimpinan BFA, saya petugas staf/admin membutuhkan bantuan verifikasi dan pemulihan kredensial login portal manajemen BFA Hub.'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-700/25 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Hubungi Pimpinan Utama via WhatsApp</span>
              </a>
              <span className="text-[10px] text-slate-400 text-center block">
                Catatan: Menghubungi WhatsApp merupakan permohonan bantuan awal, bukan verifikasi identitas otomatis.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
