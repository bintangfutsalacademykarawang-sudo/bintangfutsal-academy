import React, { useState } from 'react';
import { Student } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ShieldAlert, 
  User, 
  Calendar, 
  Phone, 
  Users, 
  FileCheck, 
  ArrowRight,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { BFALogo } from '../common/BFALogo';

interface RegistrationSubmittedModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
}

export const RegistrationSubmittedModal: React.FC<RegistrationSubmittedModalProps> = ({
  isOpen,
  student,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !student) return null;

  const adminWaPhone = '6281399201983';
  const adminWaDisplay = '0813-9920-1983';

  const generateWhatsAppMessage = () => {
    if (!student) return '';
    const studentNickname = student.nickname ? ` (${student.nickname})` : '';
    return [
      `*KONFIRMASI PENDAFTARAN SISWA BARU — BFA HUB*`,
      ``,
      `Halo Admin Bintang Futsal Academy,`,
      `Saya orang tua/wali dari calon atlet telah menyelesaikan formulir pendaftaran online BFA HUB dengan rincian berikut:`,
      ``,
      `📋 *Data Calon Siswa:*`,
      `• *ID Pendaftaran:* ${student.id}`,
      `• *Nama Lengkap:* ${student.name}${studentNickname}`,
      `• *Kelompok Usia (KU):* ${student.classGroupId}`,
      `• *Nama Orang Tua/Wali:* ${student.parentName || '-'}`,
      `• *No. WhatsApp Terdaftar:* ${student.phone || '-'}`,
      ``,
      `Mohon bantuannya untuk memeriksa berkas legalitas dan menyetujui pendaftaran ananda agar akun siswa dapat aktif di portal BFA HUB.`,
      ``,
      `Terima kasih.`
    ].join('\n');
  };

  const waMessage = generateWhatsAppMessage();
  const waUrl = `https://wa.me/${adminWaPhone}?text=${encodeURIComponent(waMessage)}`;

  const handleCopyId = () => {
    if (student.id) {
      navigator.clipboard.writeText(student.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative my-6 border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Header Icon & Logo */}
        <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 shadow-md">
            <Clock className="w-9 h-9 animate-pulse" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              STATUS: MENUNGGU VERIFIKASI ADMIN
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-2">
              Pendaftaran Berhasil Dikirim!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Data formulir dan berkas legalitas calon atlet telah diterima oleh sistem Bintang Futsal Academy Karawang.
            </p>
          </div>
        </div>

        {/* Assigned ID Highlight Box */}
        <div className="my-4 p-4 bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-blue-200">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              ID Pendaftaran Resmi Akademi
            </span>
            <span className="bg-blue-800/80 px-2 py-0.5 rounded text-[10px] font-mono text-blue-200">
              Tercatat di Cloud
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300">
              {student.id}
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 transition rounded-xl text-xs font-bold flex items-center gap-1.5 text-white border border-white/20"
              title="Salin ID Pendaftaran"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin ID'}</span>
            </button>
          </div>

          <p className="text-[11px] text-blue-200/90 leading-relaxed pt-1 border-t border-white/10">
            Simpan ID ini sebagai bukti tanda daftar resmi. ID ini dialokasikan permanen dan tidak akan tertukar dengan siswa lain.
          </p>
        </div>

        {/* Candidate Student Summary */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
          <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-900" />
            <span>Ringkasan Data Calon Siswa</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 block">Nama Lengkap:</span>
              <span className="font-bold text-slate-900">{student.name}</span>
              {student.nickname && (
                <span className="text-slate-500 font-normal"> ({student.nickname})</span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Kelompok Usia (KU):</span>
              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded text-[11px]">
                {student.classGroupId}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Nama Orang Tua / Wali:</span>
              <span className="font-semibold text-slate-800">{student.parentName || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">No. WhatsApp:</span>
              <span className="font-mono font-semibold text-slate-800">{student.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* Verification Warning Notice */}
        <div className="mt-3.5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-[11px] uppercase tracking-wide text-amber-900">
              Pemberitahuan Penting Akses Portal:
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Pendaftaran Anda saat ini <strong>belum aktif</strong> dan <strong>belum dapat digunakan untuk masuk Portal Orang Tua</strong> sampai diverifikasi & disetujui oleh Manajemen Admin BFA.
            </p>
            <p className="text-[10px] text-amber-700">
              Admin akan memeriksa kesesuaian dokumen dan kelompok usia. Jika disetujui, Anda dapat langsung masuk menggunakan Nomor WhatsApp atau ID di atas.
            </p>
          </div>
        </div>

        {/* WhatsApp Notification Card */}
        <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-xs space-y-2.5 text-xs text-emerald-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-black text-emerald-900 text-xs">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verifikasi WhatsApp ke Admin</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              {adminWaDisplay}
            </span>
          </div>

          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Kirimkan pemberitahuan pendaftaran langsung ke WhatsApp Admin BFA agar berkas legalitas dan kelompok usia ananda segera diverifikasi.
          </p>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/25"
          >
            <MessageCircle className="w-4 h-4" />
            <span>KIRIM NOTIFIKASI KE WHATSAPP ADMIN</span>
          </a>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 transition text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 border border-slate-300"
          >
            <span>TUTUP & KEMBALI KE HALAMAN LOGIN</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
