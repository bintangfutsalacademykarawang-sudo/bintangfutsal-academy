import React, { useState, useMemo, useEffect } from 'react';
import { Student } from '../../types';
import { 
  X, 
  MessageCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Phone, 
  AlertCircle, 
  Edit3, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { normalizePhoneNumber, isValidIndonesianMobile } from '../../utils/phoneUtils';

interface WhatsAppAccountNotificationModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const WhatsAppAccountNotificationModal: React.FC<WhatsAppAccountNotificationModalProps> = ({
  isOpen,
  student,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  // 1. Reset state pesan kustom, mode edit, dan status copied secara otomatis saat siswa berubah atau modal ditutup
  useEffect(() => {
    setCustomMessage(null);
    setIsEditing(false);
    setCopied(false);
  }, [student?.id, isOpen]);

  // Generate standard WhatsApp template
  const defaultMessage = useMemo(() => {
    if (!student) return '';
    const portalUrl = 'https://bfa.my.id';
    const nicknameSuffix = student.nickname ? ` (${student.nickname})` : '';
    const parentSalutation = student.parentName ? student.parentName.trim() : 'Orang Tua / Wali';

    return [
      `*KONFIRMASI AKUN RESMI BFA HUB — BINTANG FUTSAL ACADEMY*`,
      ``,
      `Yth. Bapak/Ibu *${parentSalutation}*,`,
      `Wali dari ananda *${student.name}*${nicknameSuffix}`,
      ``,
      `Selamat! Pendaftaran calon siswa ananda untuk *Kelompok Usia (KU) ${student.classGroupId}* telah resmi *DIVERIFIKASI & DISETUJUI* oleh Tim Manajemen Bintang Futsal Academy Karawang.`,
      ``,
      `Akun siswa ananda kini telah *AKTIF*. Bapak/Ibu sudah dapat masuk dan menggunakan *Portal Orang Tua BFA HUB* dengan rincian berikut:`,
      ``,
      `🌐 *Tautan Akses Portal:*`,
      `${portalUrl}`,
      ``,
      `🔑 *Informasi Akses Login:*`,
      `• *ID Siswa Resmi:* ${student.id}`,
      `• *No. WhatsApp Terdaftar:* ${student.phone || '-'}`,
      `_(Bapak/Ibu dapat masuk menggunakan ID Siswa atau No. WhatsApp terdaftar, serta mengatur sandi melalui fitur 'Lupa / Atur Kata Sandi' di halaman utama portal)_`,
      ``,
      `📋 *Layanan & Fitur yang Dapat Diakses:*`,
      `1. Jadwal sesi latihan & riwayat presensi kehadiran`,
      `2. Rincian tagihan iuran & konfirmasi pembayaran resmi (QRIS/Transfer)`,
      `3. Rapor perkembangan keterampilan atlet (E-Rapport)`,
      `4. Kartu anggota digital resmi (ID Card)`,
      ``,
      `🔒 *Catatan Keamanan:*`,
      `Demi kenyamanan dan keamanan, Bapak/Ibu dapat memperbarui kata sandi setelah berhasil login ke portal melalui pengaturan akun.`,
      ``,
      `Apabila Bapak/Ibu memerlukan bantuan lebih lanjut mengenai akses portal atau jadwal latihan, silakan hubungi Admin BFA via nomor ini.`,
      ``,
      `Terima kasih dan selamat bergabung dalam keluarga besar BFA!`,
      ``,
      `Salam Olahraga,`,
      `*Manajemen Bintang Futsal Academy (BFA) Karawang*`
    ].join('\n');
  }, [student]);

  const activeMessage = customMessage !== null ? customMessage : defaultMessage;

  // Phone calculation
  const { cleanWaPhone, isPhoneValid, formattedDisplayPhone } = useMemo(() => {
    if (!student?.phone) {
      return { cleanWaPhone: '', isPhoneValid: false, formattedDisplayPhone: '-' };
    }
    const normalized = normalizePhoneNumber(student.phone);
    const valid = isValidIndonesianMobile(normalized);
    let waPhone = '';
    if (normalized.startsWith('08')) {
      waPhone = '628' + normalized.slice(2);
    } else if (normalized.startsWith('8')) {
      waPhone = '628' + normalized.slice(1);
    } else {
      waPhone = normalized;
    }
    return {
      cleanWaPhone: waPhone,
      isPhoneValid: valid,
      formattedDisplayPhone: student.phone
    };
  }, [student]);

  if (!isOpen || !student) return null;

  const waUrl = isPhoneValid
    ? `https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(activeMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(activeMessage)}`;

  // 2. Handle clipboard copy asynchronously with async/await and robust try/catch
  const handleCopyMessage = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API tidak didukung pada peramban ini.');
      }
      await navigator.clipboard.writeText(activeMessage);
      setCopied(true);
      onShowToast?.('Teks pesan konfirmasi akun berhasil disalin ke clipboard.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Gagal menyalin ke clipboard:', err);
      setCopied(false);
      onShowToast?.('Gagal menyalin teks secara otomatis. Silakan pilih dan salin manual.', 'warning');
    }
  };

  const handleResetTemplate = () => {
    setCustomMessage(null);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative my-6 border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-slate-900">
                  Kirim Info Akun via WhatsApp
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Resmi BFA
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pemberitahuan akun aktif, ID login, dan password awal kepada orang tua/wali.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student & Parent Info Strip */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-900 text-amber-300 rounded-md font-mono font-black text-xs">
                {student.id}
              </span>
              <span className="font-black text-slate-900">
                {student.name}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded text-[10px]">
                KU {student.classGroupId}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Status: DISETUJUI</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/70">
            <div>
              <span className="text-slate-400">Orang Tua/Wali: </span>
              <span className="font-semibold text-slate-800">{student.parentName || '-'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Tujuan WA: </span>
              <span className="font-mono font-bold text-slate-900">{formattedDisplayPhone}</span>
              {!isPhoneValid && (
                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  Format No. Belum Standar
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Security & Password Audit Notice */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Kredensial Login yang Diinformasikan:</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed space-y-1">
            • <strong>ID Login:</strong> <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-blue-900">{student.id}</code> atau Nomor WhatsApp <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-blue-900">{student.phone}</code>
            <br />
            • <strong>Password:</strong> <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-amber-900">bfa123</code>
          </p>
        </div>

        {/* Message Preview / Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pratinjau Pesan WhatsApp:</span>
            </label>
            <div className="flex items-center gap-2">
              {customMessage !== null && (
                <button
                  type="button"
                  onClick={handleResetTemplate}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                  title="Kembalikan ke pesan standar BFA"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Template</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditing ? 'Selesai Edit' : 'Edit Pesan'}</span>
              </button>
            </div>
          </div>

          {isEditing ? (
            <textarea
              rows={10}
              value={activeMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
              placeholder="Tuliskan pesan konfirmasi kustom..."
            />
          ) : (
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner select-all">
              {activeMessage}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition active:scale-95 flex items-center justify-center space-x-1.5 shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Salin Teks Pesan</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Tutup
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/25 transition active:scale-95 flex items-center justify-center space-x-1.5 shrink-0"
              title="Buka WhatsApp untuk mengirim pesan"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Buka WhatsApp & Kirim</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
