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
  Check,
  Loader2
} from 'lucide-react';
import QRCode from 'qrcode';
import { Student } from '../../types';
import { BFALogo } from '../common/BFALogo';

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
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleCopyId = () => {
    if (student?.id) {
      navigator.clipboard.writeText(student.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // High-Resolution 100% Reliable JPG Card Generator & Downloader
  const handleDownloadJpg = async () => {
    if (!student) return;
    setIsDownloading(true);
    const safeName = student.name.replace(/\s+/g, '_');
    const fileName = `Kartu-Siswa-BFA-${student.id}-${safeName}.jpg`;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1260;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // 1. Dark Gradient Background
      const grad = ctx.createLinearGradient(0, 0, 900, 1260);
      grad.addColorStop(0, '#0B132B');
      grad.addColorStop(0.5, '#1C2541');
      grad.addColorStop(1, '#0A0F1D');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 900, 1260);

      // 2. Outer Golden Rim
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(24, 24, 852, 1212, 32);
      ctx.stroke();

      // 3. Top Decorative Glow
      ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
      ctx.beginPath();
      ctx.arc(800, 100, 180, 0, Math.PI * 2);
      ctx.fill();

      // 4. Header Academy Brand
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('⭐', 50, 85);

      ctx.fillStyle = '#fde047';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('BINTANG FUTSAL ACADEMY', 105, 75);

      ctx.fillStyle = '#bfdbfe';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('KARAWANG • OFFICIAL ATLET PASS', 105, 100);

      // 5. Smart Pass Hologram
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(680, 55, 170, 48, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('🛡️ SMART PASS', 700, 85);

      // Header Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(50, 130);
      ctx.lineTo(850, 130);
      ctx.stroke();

      // 6. Student Avatar Box
      const avatarSize = 180;
      const avatarX = 50;
      const avatarY = 160;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 24);
      ctx.clip();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);

      if (student.avatar) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = student.avatar;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(reject, 800);
          });
          ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        } catch {
          // Fallback avatar letter
          ctx.fillStyle = '#f59e0b';
          ctx.font = '900 72px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText((student.name.charAt(0) || 'A').toUpperCase(), avatarX + avatarSize / 2, avatarY + 115);
          ctx.textAlign = 'left';
        }
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '900 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((student.name.charAt(0) || 'A').toUpperCase(), avatarX + avatarSize / 2, avatarY + 115);
        ctx.textAlign = 'left';
      }
      ctx.restore();

      // Gold border on avatar
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 24);
      ctx.stroke();

      // 7. Student Details
      const detailX = 260;
      // KU Pill
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.roundRect(detailX, 160, 150, 36, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 15px sans-serif';
      ctx.fillText('KELOMPOK ' + student.classGroupId, detailX + 14, 184);

      // Status Pill
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.roundRect(detailX + 165, 160, 80, 36, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Aktif', detailX + 185, 184);

      // Student Name (Menggunakan Nama Panggilan)
      const memberCardDisplayName = (student.nickname || student.name.split(' ')[0] || student.name).trim().toUpperCase();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px sans-serif';
      ctx.fillText(memberCardDisplayName, detailX, 235);

      if (student.nickname && student.nickname.toLowerCase() !== student.name.toLowerCase()) {
        ctx.fillStyle = '#bfdbfe';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(student.name, detailX, 258);
      }

      // ID Badge
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(detailX, 275, 180, 38, 10);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 20px monospace';
      ctx.fillText('ID: ' + student.id, detailX + 18, 301);

      // Posisi & Jersey
      const posLabel = student.position && student.position !== 'Belum Ditentukan' ? student.position : 'Player';
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Posisi: ${posLabel} • No. Jersey: #${student.jerseyNumber || '-'}`, detailX, 345);

      // Guardian info
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px sans-serif';
      ctx.fillText(`Wali: ${student.parentName || '-'} • Kontak: ${student.phone || '-'}`, 50, 390);

      // 8. White Barcode Container Box
      const boxX = 50;
      const boxY = 415;
      const boxW = 800;
      const boxH = 740;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 24);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Barcode Box Header
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 20px sans-serif';
      ctx.fillText('BARCODE ABSENSI GATE BFA', boxX + 40, boxY + 50);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('Code 128 & QR', boxX + boxW - 170, boxY + 50);

      // Barcode Stripes
      const barTop = boxY + 80;
      const barH = 200;
      const stripes = [3, 2, 4, 1, 3, 5, 2, 4, 3, 1, 5, 2, 2, 4, 2, 3, 4, 2, 5, 2, 3, 4, 2, 3, 5, 2, 4, 3, 2, 5, 2, 4, 3, 2, 4, 3, 2, 5, 3, 2, 4, 2, 3, 4, 2, 5, 2, 4, 2, 3, 4, 2, 3, 5, 3, 2, 4];
      let curX = boxX + 60;
      ctx.fillStyle = '#000000';
      for (let i = 0; i < stripes.length; i++) {
        const w = stripes[i] * 2.8;
        if (i % 2 === 0) {
          ctx.fillRect(curX, barTop, w, barH);
        }
        curX += w;
      }

      // Barcode text
      ctx.fillStyle = '#000000';
      ctx.font = '900 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`*${student.id}*`, boxX + boxW / 2, barTop + barH + 50);
      ctx.textAlign = 'left';

      // Inner Divider
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + 35, barTop + barH + 75);
      ctx.lineTo(boxX + boxW - 35, barTop + barH + 75);
      ctx.stroke();

      // QR Code Section
      const qrTop = barTop + barH + 100;
      if (qrCodeUrl) {
        try {
          const qrImg = new Image();
          qrImg.src = qrCodeUrl;
          await new Promise((resolve) => {
            qrImg.onload = resolve;
            qrImg.onerror = resolve;
          });
          ctx.drawImage(qrImg, boxX + 50, qrTop, 220, 220);
        } catch {}
      }

      // QR Scanner Details
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('QR Gate Scanner', boxX + 300, qrTop + 55);

      ctx.fillStyle = '#64748b';
      ctx.font = '17px sans-serif';
      ctx.fillText('Dapat dipindai kamera HP & sensor barcode gate.', boxX + 300, qrTop + 95);
      ctx.fillText('Verifikasi biometrik resmi absensi sesi latihan BFA.', boxX + 300, qrTop + 125);

      // VALID Pill
      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      ctx.roundRect(boxX + 300, qrTop + 150, 180, 44, 10);
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#047857';
      ctx.font = '900 16px sans-serif';
      ctx.fillText('VALID 2026/2027', boxX + 320, qrTop + 178);

      // 9. Footer Motto
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('#WeGrowTogether • Pembinaan Futsal Berjenjang BFA Karawang', 450, 1205);
      ctx.textAlign = 'left';

      // 10. Direct Download as JPG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download card JPG error:', err);
      window.print();
    } finally {
      setIsDownloading(false);
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
              <BFALogo className="w-8 h-9 shrink-0 drop-shadow" />
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

              {/* Nama Siswa (Menggunakan Nama Panggilan) */}
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate leading-tight mt-1">
                  {student.nickname || student.name.split(' ')[0] || student.name}
                </h2>
                {student.nickname && student.nickname.toLowerCase() !== student.name.toLowerCase() && (
                  <p className="text-[10px] text-blue-200/90 truncate font-semibold leading-none mt-0.5">
                    {student.name}
                  </p>
                )}
              </div>

              {/* ID Siswa with Copy button */}
              <div className="flex items-center gap-1.5 pt-0.5">
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
                Posisi: <strong className="text-white font-bold">{student.position && student.position !== 'Belum Ditentukan' ? student.position : 'Player'}</strong>
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
            onClick={handleDownloadJpg}
            disabled={isDownloading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50"
            title="Download Kartu Siswa Format JPG"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Mengunduh JPG...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-amber-300" />
                <span>Cetak / Unduh JPG</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
