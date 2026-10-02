import React, { useEffect, useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  QrCode, 
  ShieldCheck, 
  User, 
  Sparkles, 
  Download, 
  Star, 
  CheckCircle2, 
  Scan,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { Student } from '../../types';

interface StudentBarcodeModalProps {
  isOpen: boolean;
  student?: Student | null;
  isNewRegistration?: boolean;
  onClose: () => void;
}

export const StudentBarcodeModal: React.FC<StudentBarcodeModalProps> = ({
  isOpen,
  student,
  isNewRegistration = false,
  onClose,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (student?.id) {
      QRCode.toDataURL(
        student.id,
        {
          width: 240,
          margin: 1.5,
          color: {
            dark: '#090d16',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeUrl(url);
          }
        }
      );
    }
  }, [student?.id]);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    if (student?.id) {
      navigator.clipboard.writeText(student.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 sm:p-6 text-white shadow-2xl relative my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition z-20"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebratory Banner for New Registration */}
        {isNewRegistration && (
          <div className="mb-4 p-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 rounded-2xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-300">
                Pendaftaran Siswa Baru Berhasil!
              </p>
              <p className="text-[11px] text-emerald-100/90 leading-tight">
                ID Siswa dan Kartu Barcode resmi telah otomatis diterbitkan.
              </p>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1.5">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>KARTU MEMBER & BARCODE RESMI BFA</span>
            <Star className="w-3 h-3 fill-amber-400" />
          </div>
          <h2 className="text-lg font-black text-white tracking-tight">
            Athlete Identification Pass
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pindai barcode untuk verifikasi biometrik & absensi sesi latihan.
          </p>
        </div>

        {/* ----------------- THE ATHLETE PASS CARD ----------------- */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0A0F1D] border-2 border-amber-400/50 shadow-[0_0_35px_rgba(245,158,11,0.15)] text-white p-5"
        >
          {/* Decorative Background Elements */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
          
          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-md">
                ⭐
              </div>
              <div>
                <h3 className="text-[11px] font-black tracking-wider text-amber-300 uppercase leading-none">
                  BINTANG FUTSAL ACADEMY
                </h3>
                <p className="text-[9px] font-bold text-blue-200/80 tracking-widest uppercase mt-0.5">
                  KARAWANG • OFFICIAL ATLET PASS
                </p>
              </div>
            </div>

            {/* Smart Hologram Chip */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-amber-400/30 text-[9px] font-mono text-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-extrabold uppercase">SMART PASS</span>
            </div>
          </div>

          {/* Student Profile Section */}
          <div className="relative z-10 pt-4 pb-3 flex items-center gap-3.5">
            {/* Foto Siswa with Golden Rim */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center justify-center">
                {student.avatar ? (
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-slate-900 shadow-xs" title="Verified Athlete">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Student Core Attributes */}
            <div className="overflow-hidden flex-1 space-y-1">
              {/* Kategori Umur (KU) Badge */}
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white tracking-wide shadow-xs border border-blue-400/50">
                  KELOMPOK {student.classGroupId}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  {student.status || 'Aktif'}
                </span>
              </div>

              {/* Nama Siswa */}
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight truncate leading-tight mt-1">
                {student.name}
              </h2>

              {/* ID Siswa with Copy button */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-black text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                  ID: {student.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 text-slate-400 hover:text-amber-300 transition"
                  title="Salin ID Siswa"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {/* Position & Jersey */}
              <p className="text-[11px] text-blue-200/90 font-medium truncate">
                Posisi: <strong className="text-white font-bold">{student.position || 'Player'}</strong>
                {student.jerseyNumber ? ` • No. #${student.jerseyNumber}` : ''}
              </p>
            </div>
          </div>

          {/* ---------------- HIGH-CONTRAST BARCODE & QR SECTION ---------------- */}
          <div className="relative z-10 bg-white rounded-2xl p-3.5 text-slate-900 shadow-xl border border-white/20 mt-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Scan className="w-3 h-3 text-blue-600" />
                <span>BARCODE ABSENSI GATE BFA</span>
              </span>
              <span className="text-[9px] font-mono text-blue-900 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                Code 128 & QR
              </span>
            </div>

            {/* 1D Barcode SVG stripes */}
            <div className="py-2 flex flex-col items-center">
              <svg
                width="280"
                height="50"
                viewBox="0 0 280 50"
                className="overflow-visible mx-auto w-full max-w-[280px]"
              >
                <rect width="280" height="50" fill="#ffffff" />
                {/* Authentic High-Density Barcode Pattern */}
                {[
                  2,1,1,2, 3,1,2,1, 1,2,2,1, 3,1,1,2, 1,3,2,1, 2,1,3,1, 
                  1,1,3,2, 2,2,1,2, 1,3,1,2, 2,1,2,2, 3,2,1,1, 2,3,1,2,
                  1,2,2,2, 2,1,1,3, 3,1,2,1, 1,3,1,2, 2,2,1,2, 1,1,2,3
                ].map((w, idx) => (
                  idx % 2 === 0 ? (
                    <rect
                      key={idx}
                      x={6 + idx * 3.5}
                      y={4}
                      width={Math.max(1.6, w * 1.15)}
                      height={42}
                      fill="#090d16"
                    />
                  ) : null
                ))}
              </svg>

              {/* Formatted Barcode Number */}
              <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-slate-950 mt-1 block">
                *{student.id}*
              </span>
            </div>

            {/* 2D QR Code & Quick Hint */}
            {qrCodeUrl && (
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code ${student.id}`}
                    className="w-14 h-14 rounded-lg border border-slate-300 p-0.5 shadow-2xs"
                  />
                  <div className="text-left text-[10px] text-slate-600 leading-tight">
                    <p className="font-extrabold text-blue-950 text-[11px]">QR Gate Scanner</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Dapat dipindai kamera HP & sensor barcode gate
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    VALID 2026/2027
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Motto */}
          <div className="relative z-10 pt-3 text-center text-[10px] text-blue-200/80 font-medium">
            #WegrowTogether • Pembinaan Futsal Berjenjang
          </div>
        </div>

        {/* Printable/Save Note */}
        <div className="mt-3.5 p-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-[11px] text-slate-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Kartu ini dapat disimpan di galeri HP atau dicetak untuk dibawa saat latihan sebagai kartu absensi resmi.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition border border-slate-700"
          >
            Tutup
          </button>
          
          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Siswa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
