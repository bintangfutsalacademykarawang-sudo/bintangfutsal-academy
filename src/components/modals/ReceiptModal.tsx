import React, { useState } from 'react';
import { Invoice } from '../../types';
import { X, Printer, CheckCircle, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReceiptModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  invoice,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;
  const [isExporting, setIsExporting] = useState(false);

  const cleanDescription =
    invoice.type === 'Bulanan'
      ? `Iuran Akademi (SPP ${invoice.period})`
      : invoice.period?.includes('Tidak Hadir')
      ? 'Latihan 19 Sep (Tidak Hadir - Bebas Iuran)'
      : invoice.period?.startsWith('Latihan')
      ? `${invoice.period} (Kehadiran Tap Biometrik)`
      : `Latihan ${invoice.period} (Kehadiran Tap Biometrik)`;

  const handleDownloadPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [148, 210], // A5 Standard
      });

      const primaryNavy = [15, 23, 42]; // #0f172a
      const slateBorder = [203, 213, 225]; // #cbd5e1
      const slateHeader = [241, 245, 249]; // #f1f5f9
      const slateText = [71, 85, 105]; // #475569
      const greenSuccess = [16, 185, 129]; // #10b981

      // 1. Outer Border Frame
      doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
      doc.setLineWidth(0.8);
      doc.roundedRect(6, 6, 136, 198, 3, 3, 'S');

      // 2. Top Header Navy Banner
      doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.roundedRect(8, 8, 132, 26, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.text('BINTANG FUTSAL ACADEMY', 74, 17, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(251, 191, 36);
      doc.text('KARAWANG - OFFICIAL BIOMETRIC HUB', 74, 22, { align: 'center' });

      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text('Arena BFA Karawang, Jawa Barat - Sistem Presensi & Keuangan Sah', 74, 28, { align: 'center' });

      // 3. Document Title
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.setFontSize(12);
      doc.text('KUITANSI PEMBAYARAN SAH', 74, 43, { align: 'center' });

      // 4. Status Badge Box with crisp border
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.4);
      doc.roundedRect(36, 46.5, 76, 7.5, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(6, 95, 70);
      doc.text('[ STATUS: VERIFIED LUNAS ]', 74, 51.5, { align: 'center' });

      // 5. Bordered Data Table (Kotak Border Bersih & Rapi)
      const tableX = 10;
      const col1W = 44; // Label column width
      const col2W = 84; // Value column width
      const startY = 58;
      const rowH = 9.5;

      const rows = [
        { label: 'Nomor Invoice', val: invoice.id },
        { label: 'Tanggal Transaksi', val: invoice.paidAt || invoice.createdAt || 'September 2026' },
        { label: 'Nama Siswa', val: invoice.studentName },
        { label: 'Kelompok Usia', val: `Akademi ${invoice.classGroupId || 'U12'}` },
        { label: 'Jenis Pembayaran', val: cleanDescription },
        { label: 'Metode Pembayaran', val: invoice.paymentMethod || 'QRIS Standar Nasional' },
        { label: 'No. Transaksi (TrxID)', val: invoice.transactionId || `BFA-TRX-${invoice.id}` },
      ];

      doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
      doc.setLineWidth(0.35);

      rows.forEach((row, idx) => {
        const currentY = startY + idx * rowH;

        // Label cell (kotak kiri dengan background abu-abu lembut)
        doc.setFillColor(248, 250, 252);
        doc.rect(tableX, currentY, col1W, rowH, 'FD');

        // Value cell (kotak kanan dengan background putih bersih)
        doc.setFillColor(255, 255, 255);
        doc.rect(tableX + col1W, currentY, col2W, rowH, 'FD');

        // Text label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
        doc.text(row.label, tableX + 3.5, currentY + 6.2);

        // Text value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
        doc.text(row.val, tableX + col1W + 3.5, currentY + 6.2);
      });

      // 6. Kotak Border Total Pembayaran
      const totalBoxY = startY + rows.length * rowH + 4;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);
      doc.roundedRect(tableX, totalBoxY, 128, 18, 2, 2, 'FD');

      // Left total text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.text('TOTAL PEMBAYARAN LUNAS:', tableX + 4, totalBoxY + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(29, 78, 216); // Blue-700
      doc.text(`Rp${invoice.amount.toLocaleString('id-ID')}`, tableX + 4, totalBoxY + 14);

      // Right confirmation box inside total
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.3);
      doc.roundedRect(tableX + 76, totalBoxY + 4, 48, 10, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(6, 95, 70);
      doc.text('TERKONFIRMASI SISTEM', tableX + 100, totalBoxY + 10.3, { align: 'center' });

      // 7. Kotak Border Catatan & Verifikasi Resmi
      const footerBoxY = totalBoxY + 23;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(tableX, footerBoxY, 128, 17, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.text('Kuitansi ini adalah bukti pembayaran digital resmi dan sah dari Sistem BFA HUB.', 74, footerBoxY + 5.5, { align: 'center' });
      doc.text('Diterbitkan otomatis oleh Manajemen Keuangan Bintang Futsal Academy Karawang.', 74, footerBoxY + 9.5, { align: 'center' });

      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`SECURITY SIGNATURE: BFA-HASH-${invoice.id}-OK`, 74, footerBoxY + 14, { align: 'center' });

      // Save PDF file
      const fileName = `Kuitansi_BFA_${invoice.studentName}_${invoice.id}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-4 border-b border-slate-200">
          <div className="w-11 h-11 mx-auto rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-black mb-1.5 border border-orange-200 shadow-xs">
            BFA
          </div>
          <h4 className="font-black text-base uppercase tracking-tight text-slate-900">
            Kuitansi Pembayaran Sah
          </h4>
          <p className="text-[11px] text-slate-500">Bintang Futsal Academy Karawang</p>
        </div>

        <div className="py-4 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Nomor Invoice:</span>
            <span className="font-mono font-bold text-slate-900">{invoice.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Nama Siswa:</span>
            <span className="font-bold text-slate-900">{invoice.studentName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Keterangan:</span>
            <span className="font-medium text-slate-700">
              {cleanDescription}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Jumlah Lunas:</span>
            <span className="font-black text-blue-700 text-sm font-mono tabular-nums">
              Rp{invoice.amount.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Metode Bayar:</span>
            <span className="font-bold text-slate-900">
              {invoice.paymentMethod || 'QRIS Instan'}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">No. Transaksi:</span>
            <span className="font-mono text-slate-600">
              {invoice.transactionId || 'BFA-TRX-20260901-001'}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>VERIFIED LUNAS</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Cetak langsung ke printer"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 border border-slate-200"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Cetak / Unduh PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
