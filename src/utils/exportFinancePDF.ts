import { jsPDF } from 'jspdf';
import { CashMutation } from '../types';

export const exportFinancePDF = (
  mutations: CashMutation[],
  totalPemasukan: number,
  totalPengeluaran: number,
  totalKas: number
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const primaryNavy = [15, 23, 42]; // #0f172a
  const slateBorder = [203, 213, 225]; // #cbd5e1
  const slateText = [71, 85, 105]; // #475569
  const greenText = [5, 150, 105]; // #059669
  const redText = [225, 29, 72]; // #e11d48

  // Outer frame border
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(8, 8, 194, 281, 3, 3, 'S');

  // Top Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(10, 10, 190, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('BINTANG FUTSAL ACADEMY KARAWANG', 105, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(251, 191, 36);
  doc.text('LAPORAN REKAPITULASI ARUS KAS & KEUANGAN RESMI', 105, 24, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Arena BFA Karawang, Jawa Barat • Sistem Terintegrasi BFA HUB', 105, 29, { align: 'center' });

  // Document Info
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Tanggal Cetak: ${dateStr} • Waktu: ${now.toLocaleTimeString('id-ID')} WIB`, 12, 40);
  doc.text(`Status Data: Terverifikasi Realtime Database`, 198, 40, { align: 'right' });

  // 3 Summary Cards with Kotak Border
  const cardY = 44;
  const cardW = 60;
  const cardH = 20;

  // Card 1: Pemasukan
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text('TOTAL PEMASUKAN', 16, cardY + 6);
  doc.setFontSize(11);
  doc.setTextColor(greenText[0], greenText[1], greenText[2]);
  doc.text(`Rp${totalPemasukan.toLocaleString('id-ID')}`, 16, cardY + 14);

  // Card 2: Pengeluaran
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(77, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(159, 18, 57);
  doc.text('TOTAL PENGELUARAN', 81, cardY + 6);
  doc.setFontSize(11);
  doc.setTextColor(redText[0], redText[1], redText[2]);
  doc.text(`Rp${totalPengeluaran.toLocaleString('id-ID')}`, 81, cardY + 14);

  // Card 3: Saldo Kas Bersih
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(142, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 64, 175);
  doc.text('SALDO KAS BERSIH (SURPLUS)', 146, cardY + 6);
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.text(`Rp${totalKas.toLocaleString('id-ID')}`, 146, cardY + 14);

  // Detailed Mutations Table with Kotak Border
  const tableStartY = 70;
  const colWidths = [10, 24, 24, 32, 54, 24, 22]; // Sum = 190 mm
  const headers = ['No', 'Tanggal', 'Tipe', 'Kategori', 'Keterangan / Rincian', 'Petugas', 'Nominal (Rp)'];
  const startX = 10;
  const rowHeight = 7.8;

  // Table Header Box
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.35);

  let currentX = startX;
  headers.forEach((h, idx) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(currentX, tableStartY, colWidths[idx], rowHeight + 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    const alignX = idx === 6 ? currentX + colWidths[idx] - 3 : currentX + 3;
    doc.text(h, alignX, tableStartY + 5.5, { align: idx === 6 ? 'right' : 'left' });
    currentX += colWidths[idx];
  });

  // Table Data Rows
  let currentY = tableStartY + rowHeight + 1;
  const maxRows = Math.min(mutations.length, 18);

  for (let i = 0; i < maxRows; i++) {
    const m = mutations[i];
    const isPemasukan = m.type === 'Pemasukan';
    const bgFill = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];

    currentX = startX;
    const values = [
      String(i + 1),
      m.date,
      m.type,
      m.category,
      m.note.length > 32 ? m.note.substring(0, 30) + '...' : m.note,
      m.staff,
      `${isPemasukan ? '+' : '-'}Rp${m.amount.toLocaleString('id-ID')}`,
    ];

    values.forEach((val, idx) => {
      doc.setFillColor(bgFill[0], bgFill[1], bgFill[2]);
      doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
      doc.rect(currentX, currentY, colWidths[idx], rowHeight, 'FD');

      doc.setFont('helvetica', idx === 6 || idx === 2 ? 'bold' : 'normal');
      doc.setFontSize(7);

      if (idx === 6) {
        doc.setTextColor(isPemasukan ? greenText[0] : redText[0], isPemasukan ? greenText[1] : redText[1], isPemasukan ? greenText[2] : redText[2]);
        doc.text(val, currentX + colWidths[idx] - 3, currentY + 5.2, { align: 'right' });
      } else if (idx === 2) {
        doc.setTextColor(isPemasukan ? greenText[0] : redText[0], isPemasukan ? greenText[1] : redText[1], isPemasukan ? greenText[2] : redText[2]);
        doc.text(val, currentX + 3, currentY + 5.2);
      } else {
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
        doc.text(val, currentX + 3, currentY + 5.2);
      }

      currentX += colWidths[idx];
    });

    currentY += rowHeight;
  }

  // Summary Row inside table
  doc.setFillColor(241, 245, 249);
  doc.rect(startX, currentY, 190 - colWidths[6], rowHeight + 1, 'FD');
  doc.rect(startX + 190 - colWidths[6], currentY, colWidths[6], rowHeight + 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('TOTAL SALDO KAS BERSIH', startX + 4, currentY + 6);

  doc.setTextColor(29, 78, 216);
  doc.text(`Rp${totalKas.toLocaleString('id-ID')}`, startX + 190 - 3, currentY + 6, { align: 'right' });

  currentY += rowHeight + 10;

  // Signatures Section
  const sigY = Math.max(currentY, 230);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);

  // Left: Bendahara
  doc.text('Mengetahui / Memeriksa:', 30, sigY, { align: 'center' });
  doc.text('Admin Keuangan & Kas BFA', 30, sigY + 5, { align: 'center' });
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.line(15, sigY + 28, 45, sigY + 28);
  doc.text('Admin Sari', 30, sigY + 33, { align: 'center' });

  // Right: Head Coach
  doc.text('Menyetujui:', 170, sigY, { align: 'center' });
  doc.text('Head Coach & Manajemen', 170, sigY + 5, { align: 'center' });
  doc.line(155, sigY + 28, 185, sigY + 28);
  doc.text('Coach Hendra', 170, sigY + 33, { align: 'center' });

  // Seal / Audit Stamp in center
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.roundedRect(80, sigY + 8, 45, 16, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text('[ VERIFIED AUDIT ]', 102.5, sigY + 15, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('BFA FINANCE SEAL', 102.5, sigY + 20, { align: 'center' });

  // Footer Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Laporan ini diterbitkan otomatis oleh Sistem Pembukuan Terintegrasi BFA HUB Karawang.', 105, 280, { align: 'center' });

  // Save document
  doc.save(`Laporan_Kas_Keuangan_BFA_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}.pdf`);
};
