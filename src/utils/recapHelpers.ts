import * as XLSX from 'xlsx';
import { Student, Invoice } from '../types';
import { getDynamicInvoiceStatus } from './financeHelpers';

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export type MonthNameId = typeof MONTH_NAMES_ID[number];

/**
 * Normalisasi dan ekstraksi indeks bulan (0-11) dan tahun dari teks period invoice.
 * Menggunakan pencocokan nama bulan Bahasa Indonesia standar serta toleransi singkatan/spasi.
 */
export function parseInvoicePeriod(
  periodStr?: string,
  fallbackDueDate?: string
): { monthIndex: number; monthName: string; year: number | null } {
  const clean = (periodStr || '').trim().toLowerCase();

  // Deteksi indeks bulan
  let monthIndex = -1;
  const monthMap: { [key: string]: number } = {
    januari: 0,
    jan: 0,
    februari: 1,
    feb: 1,
    maret: 2,
    mar: 2,
    april: 3,
    apr: 3,
    mei: 4,
    juni: 5,
    jun: 5,
    juli: 6,
    jul: 6,
    agustus: 7,
    agu: 7,
    agt: 7,
    september: 8,
    sep: 8,
    oktober: 9,
    okt: 9,
    november: 10,
    nov: 10,
    desember: 11,
    des: 11,
  };

  for (const [key, idx] of Object.entries(monthMap)) {
    // Deteksi batas kata atau keberadaan nama bulan
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(clean) || clean.includes(key)) {
      monthIndex = idx;
      break;
    }
  }

  // Deteksi tahun 4 digit
  let year: number | null = null;
  const yearMatch = clean.match(/\b(20\d\d)\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  } else if (fallbackDueDate && /^\d{4}-\d{2}-\d{2}/.test(fallbackDueDate)) {
    year = parseInt(fallbackDueDate.slice(0, 4), 10);
  }

  // Jika nama bulan tidak ditemukan di period tapi fallbackDueDate valid YYYY-MM-DD
  if (monthIndex === -1 && fallbackDueDate && /^\d{4}-\d{2}-\d{2}/.test(fallbackDueDate)) {
    const mStr = fallbackDueDate.slice(5, 7);
    const mNum = parseInt(mStr, 10);
    if (mNum >= 1 && mNum <= 12) {
      monthIndex = mNum - 1;
    }
  }

  const monthName = monthIndex >= 0 ? MONTH_NAMES_ID[monthIndex] : '-';
  return { monthIndex, monthName, year };
}

/**
 * Memeriksa apakah bulan tertentu jatuh SEBELUM tanggal siswa resmi bergabung di BFA.
 */
export function isMonthBeforeJoinedDate(
  joinedDateStr: string | undefined,
  targetYear: number,
  monthIndex: number
): boolean {
  if (!joinedDateStr || !/^\d{4}-\d{2}/.test(joinedDateStr)) {
    return false;
  }
  const parts = joinedDateStr.split('-');
  const jYear = parseInt(parts[0], 10);
  const jMonth = parseInt(parts[1], 10); // 1-12

  if (jYear > targetYear) {
    return true; // Siswa belum bergabung pada tahun ini
  }
  if (jYear === targetYear && monthIndex < jMonth - 1) {
    return true; // Bulan sebelum bulan bergabung siswa
  }
  return false;
}

export type MonthlyCellStatus =
  | 'BELUM_BERGABUNG'
  | 'BELUM_DITERBITKAN'
  | 'LUNAS'
  | 'SEBAGIAN'
  | 'BELUM_BAYAR'
  | 'MENUNGGAK';

export interface MonthlyCellData {
  monthIndex: number;
  monthName: string;
  status: MonthlyCellStatus;
  invoices: Invoice[];
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  hasDuplicate: boolean;
  duplicateCount: number;
}

export interface StudentMonthlyRecapRow {
  student: Student;
  cells: MonthlyCellData[];
  totalBilled: number;
  totalPaid: number;
  totalRemaining: number;
  overdueCount: number;
  hasAnyDuplicate: boolean;
}

/**
 * Menghitung matriks rekapitulasi SPP Bulanan (Januari - Desember) per siswa.
 */
export function buildStudentMonthlySppRecap(
  students: Student[],
  invoices: Invoice[],
  targetYear: number
): StudentMonthlyRecapRow[] {
  // 1. Filter hanya invoice SPP Bulanan yang relevan dengan targetYear
  const sppInvoices = invoices.filter((inv) => {
    if (inv.type !== 'Bulanan') return false;
    const parsed = parseInvoicePeriod(inv.period, inv.dueDate);
    return parsed.year === targetYear && parsed.monthIndex >= 0;
  });

  // 2. Petakan invoice berdasarkan studentId dan monthIndex
  const studentMonthMap = new Map<string, Map<number, Invoice[]>>();
  sppInvoices.forEach((inv) => {
    const sId = inv.studentId;
    if (!studentMonthMap.has(sId)) {
      studentMonthMap.set(sId, new Map());
    }
    const mMap = studentMonthMap.get(sId)!;
    const parsed = parseInvoicePeriod(inv.period, inv.dueDate);
    const mIdx = parsed.monthIndex;
    if (!mMap.has(mIdx)) {
      mMap.set(mIdx, []);
    }
    mMap.get(mIdx)!.push(inv);
  });

  // 3. Bangun baris per siswa
  return students.map((student) => {
    let rowBilled = 0;
    let rowPaid = 0;
    let rowRemaining = 0;
    let rowOverdueCount = 0;
    let studentHasDuplicate = false;

    const sMonthData = studentMonthMap.get(student.id);

    const cells: MonthlyCellData[] = MONTH_NAMES_ID.map((mName, mIdx) => {
      const isPreJoin = isMonthBeforeJoinedDate(student.joinedDate, targetYear, mIdx);
      if (isPreJoin) {
        return {
          monthIndex: mIdx,
          monthName: mName,
          status: 'BELUM_BERGABUNG',
          invoices: [],
          amount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          hasDuplicate: false,
          duplicateCount: 0,
        };
      }

      const invs = sMonthData?.get(mIdx) || [];
      if (invs.length === 0) {
        return {
          monthIndex: mIdx,
          monthName: mName,
          status: 'BELUM_DITERBITKAN',
          invoices: [],
          amount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          hasDuplicate: false,
          duplicateCount: 0,
        };
      }

      const hasDup = invs.length > 1;
      if (hasDup) {
        studentHasDuplicate = true;
      }

      // Aturan Agregasi Aman saat ada duplikasi:
      // Prioritaskan invoice yang sudah berstatus LUNAS atau yang memiliki pembayaran tertinggi / terbaru
      const sortedInvs = [...invs].sort((a, b) => {
        const aPaid = Number(a.paidAmount) || (a.status === 'LUNAS' ? Number(a.amount) || 0 : 0);
        const bPaid = Number(b.paidAmount) || (b.status === 'LUNAS' ? Number(b.amount) || 0 : 0);
        if (bPaid !== aPaid) return bPaid - aPaid;
        return (b.dueDate || '').localeCompare(a.dueDate || '');
      });

      const primaryInv = sortedInvs[0];
      const invTotal = Number(primaryInv.amount) || 0;
      const invPaid =
        primaryInv.paidAmount !== undefined
          ? Number(primaryInv.paidAmount) || 0
          : primaryInv.status === 'LUNAS'
          ? invTotal
          : 0;
      const invRemaining =
        primaryInv.remainingAmount !== undefined
          ? Math.max(0, Number(primaryInv.remainingAmount) || 0)
          : Math.max(0, invTotal - invPaid);

      const dynStatus = getDynamicInvoiceStatus(primaryInv);
      let cellStatus: MonthlyCellStatus;
      if (dynStatus === 'LUNAS') {
        cellStatus = 'LUNAS';
      } else if (dynStatus === 'MENUNGGAK') {
        cellStatus = 'MENUNGGAK';
        rowOverdueCount++;
      } else if (dynStatus === 'SEBAGIAN') {
        cellStatus = 'SEBAGIAN';
      } else {
        cellStatus = 'BELUM_BAYAR';
      }

      rowBilled += invTotal;
      rowPaid += invPaid;
      rowRemaining += invRemaining;

      return {
        monthIndex: mIdx,
        monthName: mName,
        status: cellStatus,
        invoices: invs,
        amount: invTotal,
        paidAmount: invPaid,
        remainingAmount: invRemaining,
        hasDuplicate: hasDup,
        duplicateCount: invs.length,
      };
    });

    return {
      student,
      cells,
      totalBilled: rowBilled,
      totalPaid: rowPaid,
      totalRemaining: rowRemaining,
      overdueCount: rowOverdueCount,
      hasAnyDuplicate: studentHasDuplicate,
    };
  });
}

export interface TrainingSessionRecapItem {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  classGroupId: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'LUNAS' | 'SEBAGIAN' | 'BELUM BAYAR' | 'MENUNGGAK';
  dueDate: string;
}

export interface MonthlyTrainingSummary {
  monthIndex: number;
  monthName: string;
  sessionCount: number;
  totalBilled: number;
  totalPaid: number;
  totalRemaining: number;
}

export interface StudentTrainingSummary {
  studentId: string;
  studentName: string;
  classGroupId: string;
  studentStatus: 'Aktif' | 'Non-Aktif';
  sessionCount: number;
  totalBilled: number;
  totalPaid: number;
  totalRemaining: number;
  overdueCount: number;
}

/**
 * Menghitung rekapitulasi iuran latihan per sesi, per bulan, dan per siswa.
 */
export function buildTrainingFeeRecap(
  students: Student[],
  invoices: Invoice[],
  targetYear: number
) {
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  // 1. Ambil invoice latihan untuk targetYear
  const trainingInvoices = invoices.filter((inv) => {
    if (inv.type !== 'Latihan') return false;
    const sessionDate = inv.attendanceDate || inv.dueDate || '';
    return sessionDate.startsWith(String(targetYear));
  });

  // 2. Daftar sesi individual
  const sessionItems: TrainingSessionRecapItem[] = trainingInvoices.map((inv) => {
    const invTotal = Number(inv.amount) || 0;
    const invPaid =
      inv.paidAmount !== undefined
        ? Number(inv.paidAmount) || 0
        : inv.status === 'LUNAS'
        ? invTotal
        : 0;
    const invRemaining =
      inv.remainingAmount !== undefined
        ? Math.max(0, Number(inv.remainingAmount) || 0)
        : Math.max(0, invTotal - invPaid);

    return {
      id: inv.id,
      date: inv.attendanceDate || inv.dueDate || '-',
      studentId: inv.studentId,
      studentName: inv.studentName || studentMap.get(inv.studentId)?.name || 'Siswa BFA',
      classGroupId: inv.classGroupId || studentMap.get(inv.studentId)?.classGroupId || '-',
      amount: invTotal,
      paidAmount: invPaid,
      remainingAmount: invRemaining,
      status: getDynamicInvoiceStatus(inv),
      dueDate: inv.dueDate || '-',
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  // 3. Ringkasan per bulan (Januari - Desember)
  const monthlySummaries: MonthlyTrainingSummary[] = MONTH_NAMES_ID.map((mName, mIdx) => {
    const monthPrefix = `${targetYear}-${String(mIdx + 1).padStart(2, '0')}`;
    const monthlySessions = sessionItems.filter((s) => s.date.startsWith(monthPrefix));

    const totalBilled = monthlySessions.reduce((sum, s) => sum + s.amount, 0);
    const totalPaid = monthlySessions.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalRemaining = monthlySessions.reduce((sum, s) => sum + s.remainingAmount, 0);

    return {
      monthIndex: mIdx,
      monthName: mName,
      sessionCount: monthlySessions.length,
      totalBilled,
      totalPaid,
      totalRemaining,
    };
  });

  // 4. Rekap per siswa
  const studentSessionsMap = new Map<string, TrainingSessionRecapItem[]>();
  sessionItems.forEach((item) => {
    if (!studentSessionsMap.has(item.studentId)) {
      studentSessionsMap.set(item.studentId, []);
    }
    studentSessionsMap.get(item.studentId)!.push(item);
  });

  const studentSummaries: StudentTrainingSummary[] = students.map((s) => {
    const items = studentSessionsMap.get(s.id) || [];
    const totalBilled = items.reduce((sum, it) => sum + it.amount, 0);
    const totalPaid = items.reduce((sum, it) => sum + it.paidAmount, 0);
    const totalRemaining = items.reduce((sum, it) => sum + it.remainingAmount, 0);
    const overdueCount = items.filter((it) => it.status === 'MENUNGGAK').length;

    return {
      studentId: s.id,
      studentName: s.name,
      classGroupId: s.classGroupId,
      studentStatus: s.status,
      sessionCount: items.length,
      totalBilled,
      totalPaid,
      totalRemaining,
      overdueCount,
    };
  });

  return {
    sessionItems,
    monthlySummaries,
    studentSummaries,
  };
}

export interface StudentOverdueRecap {
  student: Student;
  sppOverdueCount: number;
  sppOverdueAmount: number;
  sppActiveRemaining: number;
  trainingOverdueCount: number;
  trainingOverdueAmount: number;
  trainingActiveRemaining: number;
  totalOverdueAmount: number;
  totalActiveRemaining: number;
  status: 'Lancar' | 'Menunggak';
}

/**
 * Menghitung rincian tunggakan jatuh tempo dan sisa tagihan aktif per siswa.
 */
export function buildStudentOverdueRecap(
  students: Student[],
  invoices: Invoice[],
  targetYear: number
): StudentOverdueRecap[] {
  // Saring invoice relevan untuk tahun target
  const yearInvoices = invoices.filter((inv) => {
    if (inv.type === 'Bulanan') {
      const parsed = parseInvoicePeriod(inv.period, inv.dueDate);
      return parsed.year === targetYear;
    }
    if (inv.type === 'Latihan') {
      const d = inv.attendanceDate || inv.dueDate || '';
      return d.startsWith(String(targetYear));
    }
    return (inv.dueDate || '').startsWith(String(targetYear));
  });

  const studentInvoicesMap = new Map<string, Invoice[]>();
  yearInvoices.forEach((inv) => {
    if (!studentInvoicesMap.has(inv.studentId)) {
      studentInvoicesMap.set(inv.studentId, []);
    }
    studentInvoicesMap.get(inv.studentId)!.push(inv);
  });

  return students.map((s) => {
    const sInvs = studentInvoicesMap.get(s.id) || [];
    let sppOverdueCount = 0;
    let sppOverdueAmount = 0;
    let sppActiveRemaining = 0;

    let trainingOverdueCount = 0;
    let trainingOverdueAmount = 0;
    let trainingActiveRemaining = 0;

    let totalOverdueAmount = 0;
    let totalActiveRemaining = 0;

    sInvs.forEach((inv) => {
      const invTotal = Number(inv.amount) || 0;
      const invPaid =
        inv.paidAmount !== undefined
          ? Number(inv.paidAmount) || 0
          : inv.status === 'LUNAS'
          ? invTotal
          : 0;
      const invRemaining =
        inv.remainingAmount !== undefined
          ? Math.max(0, Number(inv.remainingAmount) || 0)
          : Math.max(0, invTotal - invPaid);

      const dynStatus = getDynamicInvoiceStatus(inv);
      const isOverdue = dynStatus === 'MENUNGGAK';

      totalActiveRemaining += invRemaining;
      if (isOverdue) {
        totalOverdueAmount += invRemaining;
      }

      if (inv.type === 'Bulanan') {
        sppActiveRemaining += invRemaining;
        if (isOverdue) {
          sppOverdueCount++;
          sppOverdueAmount += invRemaining;
        }
      } else if (inv.type === 'Latihan') {
        trainingActiveRemaining += invRemaining;
        if (isOverdue) {
          trainingOverdueCount++;
          trainingOverdueAmount += invRemaining;
        }
      }
    });

    return {
      student: s,
      sppOverdueCount,
      sppOverdueAmount,
      sppActiveRemaining,
      trainingOverdueCount,
      trainingOverdueAmount,
      trainingActiveRemaining,
      totalOverdueAmount,
      totalActiveRemaining,
      status: totalOverdueAmount > 0 ? 'Menunggak' : 'Lancar',
    };
  });
}

/**
 * Menghitung ringkasan KPI eksekutif untuk kartu rekap.
 */
export function calculateRecapKpi(
  invoices: Invoice[],
  students: Student[],
  targetYear: number,
  typeFilter: 'Semua' | 'Bulanan' | 'Latihan' | 'Tunggakan' = 'Semua',
  kuFilter: string = 'Semua',
  studentStatusFilter: 'Semua' | 'Aktif' | 'Non-Aktif' = 'Semua'
) {
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  // Filter invoice
  const filteredInvoices = invoices.filter((inv) => {
    // 1. Tahun
    if (inv.type === 'Bulanan') {
      const parsed = parseInvoicePeriod(inv.period, inv.dueDate);
      if (parsed.year !== targetYear) return false;
    } else if (inv.type === 'Latihan') {
      const d = inv.attendanceDate || inv.dueDate || '';
      if (!d.startsWith(String(targetYear))) return false;
    } else {
      if (!(inv.dueDate || '').startsWith(String(targetYear))) return false;
    }

    // 2. Jenis
    if (typeFilter === 'Bulanan' && inv.type !== 'Bulanan') return false;
    if (typeFilter === 'Latihan' && inv.type !== 'Latihan') return false;

    // 3. Siswa & KU
    const s = studentMap.get(inv.studentId);
    if (kuFilter !== 'Semua') {
      const effectiveKu = s?.classGroupId || inv.classGroupId;
      if (effectiveKu !== kuFilter) return false;
    }

    // 4. Status Siswa
    if (studentStatusFilter !== 'Semua') {
      if (s && s.status !== studentStatusFilter) return false;
    }

    return true;
  });

  let totalBilled = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let totalOverdue = 0;
  const overdueStudentIds = new Set<string>();

  filteredInvoices.forEach((inv) => {
    const invTotal = Number(inv.amount) || 0;
    const invPaid =
      inv.paidAmount !== undefined
        ? Number(inv.paidAmount) || 0
        : inv.status === 'LUNAS'
        ? invTotal
        : 0;
    const invRemaining =
      inv.remainingAmount !== undefined
        ? Math.max(0, Number(inv.remainingAmount) || 0)
        : Math.max(0, invTotal - invPaid);

    totalBilled += invTotal;
    totalPaid += invPaid;
    totalRemaining += invRemaining;

    const dynStatus = getDynamicInvoiceStatus(inv);
    if (dynStatus === 'MENUNGGAK') {
      totalOverdue += invRemaining;
      overdueStudentIds.add(inv.studentId);
    }
  });

  return {
    invoiceCount: filteredInvoices.length,
    totalBilled,
    totalPaid,
    totalRemaining,
    totalOverdue,
    studentsWithOverdueCount: overdueStudentIds.size,
  };
}

/**
 * Ekspor Rekapitulasi Komprehensif ke format Excel (.xlsx) dengan 3 Lembar Kerja (Multi-sheet).
 */
export function exportComprehensiveRecapExcel(options: {
  targetYear: number;
  kuFilter: string;
  studentStatusFilter: string;
  sppRows: StudentMonthlyRecapRow[];
  trainingSessions: TrainingSessionRecapItem[];
  studentOverdueRows: StudentOverdueRecap[];
  exportedAt: string;
}) {
  const {
    targetYear,
    kuFilter,
    studentStatusFilter,
    sppRows,
    trainingSessions,
    studentOverdueRows,
    exportedAt,
  } = options;

  const wb = XLSX.utils.book_new();

  // --- SHEET 1: REKAP SPP BULANAN ---
  const sppData = sppRows.map((r, idx) => {
    const row: any = {
      'No': idx + 1,
      'ID Siswa': r.student.id,
      'Nama Siswa': r.student.name,
      'Kelompok Usia': r.student.classGroupId,
      'Status Siswa': r.student.status,
    };

    r.cells.forEach((c) => {
      let cellText = '-';
      if (c.status === 'BELUM_BERGABUNG') {
        cellText = 'Belum Bergabung';
      } else if (c.status === 'BELUM_DITERBITKAN') {
        cellText = '-';
      } else if (c.status === 'LUNAS') {
        cellText = 'LUNAS';
      } else if (c.status === 'SEBAGIAN') {
        cellText = `SEBAGIAN (Sisa Rp${c.remainingAmount.toLocaleString('id-ID')})`;
      } else if (c.status === 'MENUNGGAK') {
        cellText = `MENUNGGAK (Rp${c.remainingAmount.toLocaleString('id-ID')})`;
      } else {
        cellText = `BELUM BAYAR (Rp${c.remainingAmount.toLocaleString('id-ID')})`;
      }

      if (c.hasDuplicate) {
        cellText += ` [⚠️ Ganda ${c.duplicateCount}]`;
      }

      row[c.monthName] = cellText;
    });

    row['Total Ditagih (Rp)'] = r.totalBilled;
    row['Total Dibayar (Rp)'] = r.totalPaid;
    row['Sisa Tagihan (Rp)'] = r.totalRemaining;
    row['Bulan Menunggak'] = r.overdueCount;
    row['Status Duplikasi'] = r.hasAnyDuplicate ? 'Ada Data Ganda' : 'Normal';

    return row;
  });

  const wsSpp = XLSX.utils.json_to_sheet(sppData);
  wsSpp['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 16 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSpp, 'Rekap SPP Bulanan');

  // --- SHEET 2: REKAP IURAN LATIHAN ---
  const trainingData = trainingSessions.map((s, idx) => ({
    'No': idx + 1,
    'No. Invoice': s.id,
    'Tanggal Sesi': s.date,
    'ID Siswa': s.studentId,
    'Nama Siswa': s.studentName,
    'Kelompok Usia': s.classGroupId,
    'Nominal Tagihan (Rp)': s.amount,
    'Sudah Dibayar (Rp)': s.paidAmount,
    'Sisa Tagihan (Rp)': s.remainingAmount,
    'Status Pembayaran': s.status,
    'Jatuh Tempo': s.dueDate,
  }));

  const wsTraining = XLSX.utils.json_to_sheet(trainingData);
  wsTraining['!cols'] = [
    { wch: 5 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 22 },
    { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTraining, 'Rekap Iuran Latihan');

  // --- SHEET 3: REKAP TUNGGAKAN SISWA ---
  const overdueData = studentOverdueRows.map((o, idx) => ({
    'No': idx + 1,
    'ID Siswa': o.student.id,
    'Nama Siswa': o.student.name,
    'Kelompok Usia': o.student.classGroupId,
    'Status Siswa': o.student.status,
    'No. WhatsApp': o.student.phone,
    'Nama Wali': o.student.parentName,
    'Tunggakan SPP (Rp)': o.sppOverdueAmount,
    'Sesi SPP Menunggak': o.sppOverdueCount,
    'Tunggakan Latihan (Rp)': o.trainingOverdueAmount,
    'Sesi Latihan Menunggak': o.trainingOverdueCount,
    'TOTAL TUNGGAKAN JATUH TEMPO (Rp)': o.totalOverdueAmount,
    'Total Sisa Tagihan Berjalan (Rp)': o.totalActiveRemaining,
    'Status Kolektibilitas': o.status,
  }));

  const wsOverdue = XLSX.utils.json_to_sheet(overdueData);
  wsOverdue['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 20 },
    { wch: 20 }, { wch: 28 }, { wch: 26 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOverdue, 'Rekap Tunggakan Siswa');

  const cleanDate = exportedAt.replace(/[: ]/g, '_');
  const filename = `Rekap_Keuangan_Siswa_BFA_${targetYear}_KU-${kuFilter}_${cleanDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
