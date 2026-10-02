import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Student, CashMutation, Invoice, Attendance } from '../types';

/**
 * EXPORT DATA SISWA
 */
export const exportStudentsExcel = (students: Student[]) => {
  const data = students.map((s, idx) => ({
    'No': idx + 1,
    'ID Siswa': s.id,
    'Nama Lengkap': s.name,
    'Posisi': s.position || '-',
    'No Punggung': s.jerseyNumber || '-',
    'Kelompok Usia': s.classGroupId,
    'Tempat Lahir': s.birthPlace || '-',
    'Tanggal Lahir': s.birthDate || '-',
    'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    'Nama Orang Tua / Wali': s.parentName,
    'No. WhatsApp': s.phone,
    'Tanggal Bergabung': s.joinedDate,
    'Status Siswa': s.status,
    'Berkas KK': s.documents?.kk ? 'Ada' : 'Belum Ada',
    'Berkas Akte': s.documents?.akte ? 'Ada' : 'Belum Ada',
    'Berkas KIA': s.documents?.kia ? 'Ada' : 'Belum Ada',
    'Berkas Ijazah': s.documents?.ijazah ? 'Ada' : 'Belum Ada',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
    { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa BFA');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Data_Siswa_BFA_${dateStr}.xlsx`);
};

export const exportStudentsPDF = (students: Student[]) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const primaryNavy = [15, 23, 42];
  const slateBorder = [203, 213, 225];
  const slateText = [71, 85, 105];

  // Outer border
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(8, 8, 281, 194, 3, 3, 'S');

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(10, 10, 277, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('BINTANG FUTSAL ACADEMY KARAWANG', 148, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(251, 191, 36);
  doc.text('DAFTAR INDUK ATLET & DATA SISWA RESMI', 148, 24, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Total Siswa Terdaftar: ${students.length} Siswa • Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 148, 29, { align: 'center' });

  // Table
  const tableStartY = 37;
  const colWidths = [10, 22, 45, 20, 16, 24, 45, 30, 25, 20]; // Sum = 257 mm
  const headers = ['No', 'ID Siswa', 'Nama Lengkap', 'Posisi', 'No Pung', 'Kelompok', 'Nama Wali', 'No. WhatsApp', 'Tgl Gabung', 'Status'];
  const startX = 20;
  const rowHeight = 7.5;

  // Header Box
  let currentX = startX;
  headers.forEach((h, idx) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(currentX, tableStartY, colWidths[idx], rowHeight + 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(h, currentX + 2.5, tableStartY + 5.5);
    currentX += colWidths[idx];
  });

  // Rows
  let currentY = tableStartY + rowHeight + 1;
  const maxRows = Math.min(students.length, 18);

  for (let i = 0; i < maxRows; i++) {
    const s = students[i];
    const bgFill = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];

    currentX = startX;
    const values = [
      String(i + 1),
      s.id,
      s.name,
      s.position || '-',
      s.jerseyNumber ? `#${s.jerseyNumber}` : '-',
      s.classGroupId,
      s.parentName,
      s.phone,
      s.joinedDate,
      s.status
    ];

    values.forEach((val, idx) => {
      doc.setFillColor(bgFill[0], bgFill[1], bgFill[2]);
      doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
      doc.rect(currentX, currentY, colWidths[idx], rowHeight, 'FD');

      doc.setFont('helvetica', idx === 1 || idx === 2 ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      if (idx === 9) {
        doc.setTextColor(val === 'Aktif' ? 5 : 225, val === 'Aktif' ? 150 : 29, val === 'Aktif' ? 105 : 72);
      } else {
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      }
      doc.text(val, currentX + 2.5, currentY + 5.2);
      currentX += colWidths[idx];
    });

    currentY += rowHeight;
  }

  // Footer stamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen ini digenerate secara otomatis dari database resmi BFA HUB Karawang.', 148, 192, { align: 'center' });

  doc.save(`Data_Siswa_BFA_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * EXPORT KEUANGAN & BUKU KAS
 */
export const exportFinanceExcel = (
  mutations: CashMutation[],
  totalPemasukan: number,
  totalPengeluaran: number,
  totalKas: number
) => {
  const data: Record<string, any>[] = mutations.map((m, idx) => ({
    'No': idx + 1,
    'ID Mutasi': m.id,
    'Tanggal': m.date,
    'Tipe Arus': m.type,
    'Kategori': m.category,
    'Keterangan / Rincian': m.note,
    'Metode Pembayaran': m.method,
    'Petugas / Admin': m.staff,
    'Nominal Pemasukan (Rp)': m.type === 'Pemasukan' ? m.amount : 0,
    'Nominal Pengeluaran (Rp)': m.type === 'Pengeluaran' ? m.amount : 0,
  }));

  // Append summary row
  data.push({
    'No': null as any,
    'ID Mutasi': 'RINGKASAN TOTAL',
    'Tanggal': '',
    'Tipe Arus': '',
    'Kategori': '',
    'Keterangan / Rincian': `Saldo Kas Bersih: Rp${totalKas.toLocaleString('id-ID')}`,
    'Metode Pembayaran': '',
    'Petugas / Admin': '',
    'Nominal Pemasukan (Rp)': totalPemasukan,
    'Nominal Pengeluaran (Rp)': totalPengeluaran,
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
    { wch: 35 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 22 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Buku Kas & Keuangan BFA');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Laporan_Kas_BFA_${dateStr}.xlsx`);
};

/**
 * EXPORT TAGIHAN & SPP
 */
export const exportInvoicesExcel = (invoices: Invoice[]) => {
  const data = invoices.map((inv, idx) => ({
    'No': idx + 1,
    'Nomor Invoice': inv.id,
    'ID Siswa': inv.studentId,
    'Nama Siswa': inv.studentName,
    'Kelompok Usia': inv.classGroupId,
    'Jenis Tagihan': inv.type,
    'Periode / Sesi': inv.period,
    'Nominal Tagihan (Rp)': inv.amount,
    'Status Pembayaran': inv.status,
    'Tanggal Terbit': inv.createdAt,
    'Jatuh Tempo': inv.dueDate,
    'Waktu Bayar': inv.paidAt || '-',
    'Nomor Transaksi (TrxID)': inv.transactionId || '-',
    'Metode Bayar': inv.paymentMethod || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 22 }, { wch: 14 },
    { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 20 }, { wch: 24 }, { wch: 18 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Tagihan & SPP');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Data_Tagihan_SPP_BFA_${dateStr}.xlsx`);
};

export const exportInvoicesPDF = (invoices: Invoice[]) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const primaryNavy = [15, 23, 42];
  const slateBorder = [203, 213, 225];
  const slateText = [71, 85, 105];

  // Frame
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(8, 8, 194, 281, 3, 3, 'S');

  // Header
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(10, 10, 190, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('BINTANG FUTSAL ACADEMY KARAWANG', 105, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(251, 191, 36);
  doc.text('REKAPITULASI TAGIHAN SPP & IURAN SISWA', 105, 24, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Total Tagihan: ${invoices.length} • Lunas: ${invoices.filter(i => i.status === 'LUNAS').length} • Belum Bayar: ${invoices.filter(i => i.status === 'BELUM BAYAR').length}`, 105, 29, { align: 'center' });

  // Table
  const tableStartY = 40;
  const colWidths = [10, 32, 40, 18, 32, 28, 30]; // Sum = 190 mm
  const headers = ['No', 'No. Invoice', 'Nama Siswa', 'KU', 'Periode', 'Nominal', 'Status'];
  const startX = 10;
  const rowHeight = 8;

  let currentX = startX;
  headers.forEach((h, idx) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(currentX, tableStartY, colWidths[idx], rowHeight + 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(h, currentX + 3, tableStartY + 5.5);
    currentX += colWidths[idx];
  });

  let currentY = tableStartY + rowHeight + 1;
  const maxRows = Math.min(invoices.length, 24);

  for (let i = 0; i < maxRows; i++) {
    const inv = invoices[i];
    const isPaid = inv.status === 'LUNAS';
    const bgFill = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];

    currentX = startX;
    const values = [
      String(i + 1),
      inv.id,
      inv.studentName,
      inv.classGroupId,
      inv.period,
      `Rp${inv.amount.toLocaleString('id-ID')}`,
      inv.status
    ];

    values.forEach((val, idx) => {
      doc.setFillColor(bgFill[0], bgFill[1], bgFill[2]);
      doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
      doc.rect(currentX, currentY, colWidths[idx], rowHeight, 'FD');

      doc.setFont('helvetica', idx === 1 || idx === 6 ? 'bold' : 'normal');
      doc.setFontSize(7);
      if (idx === 6) {
        doc.setTextColor(isPaid ? 5 : 225, isPaid ? 150 : 29, isPaid ? 105 : 72);
      } else {
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      }
      doc.text(val, currentX + 3, currentY + 5.2);
      currentX += colWidths[idx];
    });

    currentY += rowHeight;
  }

  doc.save(`Data_Tagihan_BFA_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * EXPORT ABSENSI & PRESENSI
 */
export const exportAttendanceExcel = (attendances: Attendance[]) => {
  const data = attendances.map((att, idx) => ({
    'No': idx + 1,
    'ID Presensi': att.id,
    'ID Siswa': att.studentId,
    'Nama Siswa': att.studentName,
    'Kelompok Usia': att.classGroupId,
    'Tanggal Latihan': att.date,
    'Waktu Scan Fingerprint': att.checkInTime,
    'Status Kehadiran': att.status,
    'Tagihan Sesi Diterbitkan': att.feeGenerated ? 'Ya (Rp15.000)' : 'Tidak (Rp0)',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 22 }, { wch: 14 },
    { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 22 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Presensi Biometrik BFA');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Presensi_Biometrik_BFA_${dateStr}.xlsx`);
};

export const exportAttendancePDF = (attendances: Attendance[]) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const primaryNavy = [15, 23, 42];
  const slateBorder = [203, 213, 225];
  const slateText = [71, 85, 105];

  // Frame
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(8, 8, 194, 281, 3, 3, 'S');

  // Header
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(10, 10, 190, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('BINTANG FUTSAL ACADEMY KARAWANG', 105, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(251, 191, 36);
  doc.text('REKAPITULASI PRESENSI BIOMETRIK SISWA', 105, 24, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Total Catatan Presensi: ${attendances.length} • Hadir: ${attendances.filter(a => a.status === 'HADIR').length}`, 105, 29, { align: 'center' });

  // Table
  const tableStartY = 40;
  const colWidths = [10, 24, 46, 20, 26, 32, 32]; // Sum = 190 mm
  const headers = ['No', 'ID Siswa', 'Nama Siswa', 'KU', 'Tanggal', 'Jam Scan', 'Status'];
  const startX = 10;
  const rowHeight = 8;

  let currentX = startX;
  headers.forEach((h, idx) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(currentX, tableStartY, colWidths[idx], rowHeight + 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(h, currentX + 3, tableStartY + 5.5);
    currentX += colWidths[idx];
  });

  let currentY = tableStartY + rowHeight + 1;
  const maxRows = Math.min(attendances.length, 24);

  for (let i = 0; i < maxRows; i++) {
    const a = attendances[i];
    const isHadir = a.status === 'HADIR';
    const bgFill = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];

    currentX = startX;
    const values = [
      String(i + 1),
      a.studentId,
      a.studentName,
      a.classGroupId,
      a.date,
      a.checkInTime,
      a.status
    ];

    values.forEach((val, idx) => {
      doc.setFillColor(bgFill[0], bgFill[1], bgFill[2]);
      doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
      doc.rect(currentX, currentY, colWidths[idx], rowHeight, 'FD');

      doc.setFont('helvetica', idx === 6 ? 'bold' : 'normal');
      doc.setFontSize(7);
      if (idx === 6) {
        doc.setTextColor(isHadir ? 5 : 225, isHadir ? 150 : 29, isHadir ? 105 : 72);
      } else {
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      }
      doc.text(val, currentX + 3, currentY + 5.2);
      currentX += colWidths[idx];
    });

    currentY += rowHeight;
  }

  doc.save(`Data_Presensi_BFA_${new Date().toISOString().slice(0, 10)}.pdf`);
};
