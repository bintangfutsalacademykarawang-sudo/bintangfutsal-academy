import { Student, CashMutation, Invoice, Attendance, SkillIndicator, StudentReport, TrainingSchedule } from '../types';

export const CURRENT_SYSTEM_YEAR = 2026;

export const INITIAL_STUDENTS: Student[] = [
  { 
    id: 'BFA-001', 
    name: 'Andra', 
    nickname: 'Andra',
    avatar: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Karawang', 
    birthDate: '2015-05-21', // 2026 - 2015 = 11 -> U11
    gender: 'L', 
    parentName: 'Bpk. Bambang Supardi', 
    phone: '089634753330', 
    classGroupId: 'U11', 
    status: 'Aktif', 
    joinedDate: '2024-01-10', 
    position: 'Flank', 
    jerseyNumber: 10,
    documents: { kk: 'KK_Andra.pdf', akte: 'Akte_Andra.jpg', kia: 'KIA_Andra.jpg', ijazah: 'Ijazah_TK_Andra.pdf' }
  },
  { 
    id: 'BFA-002', 
    name: 'Bima', 
    nickname: 'Bima',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Sidoarjo', 
    birthDate: '2016-08-22', // 2026 - 2016 = 10 -> U10
    gender: 'L', 
    parentName: 'Bpk. Gunawan', 
    phone: '081398765432', 
    classGroupId: 'U10', 
    status: 'Aktif', 
    joinedDate: '2024-02-12', 
    position: 'Pivot', 
    jerseyNumber: 9,
    documents: { kk: 'KK_Bima.pdf', akte: 'Akte_Bima.jpg', kia: 'KIA_Bima.jpg', ijazah: '-' }
  },
  { 
    id: 'BFA-003', 
    name: 'Raka', 
    nickname: 'Raka',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Jakarta', 
    birthDate: '2014-07-08', // 2026 - 2014 = 12 -> U12
    gender: 'L', 
    parentName: 'Ibu Ratna Dewi', 
    phone: '082155443322', 
    classGroupId: 'U12', 
    status: 'Aktif', 
    joinedDate: '2023-03-05', 
    position: 'Anchor', 
    jerseyNumber: 4,
    documents: { kk: 'KK_Raka.pdf', akte: 'Akte_Raka.jpg', kia: '-', ijazah: 'Ijazah_SD_Raka.pdf' }
  },
  { 
    id: 'BFA-004', 
    name: 'Fahmi', 
    nickname: 'Fahmi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Karawang', 
    birthDate: '2018-11-19', // 2026 - 2018 = 8 -> U8
    gender: 'L', 
    parentName: 'Bpk. Rudi Salam', 
    phone: '081299887766', 
    classGroupId: 'U8', 
    status: 'Aktif', 
    joinedDate: '2025-04-14', 
    position: 'Flank', 
    jerseyNumber: 7,
    documents: { kk: 'KK_Fahmi.pdf', akte: 'Akte_Fahmi.jpg', kia: 'KIA_Fahmi.jpg', ijazah: '-' }
  },
  { 
    id: 'BFA-005', 
    name: 'Rizky', 
    nickname: 'Rizky',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Surabaya', 
    birthDate: '2016-03-03', // 2026 - 2016 = 10 -> U10
    gender: 'L', 
    parentName: 'Bpk. Hendra Kurniawan', 
    phone: '081211223344', 
    classGroupId: 'U10', 
    status: 'Aktif', 
    joinedDate: '2024-01-01', 
    position: 'Goalkeeper', 
    jerseyNumber: 1,
    documents: { kk: 'KK_Rizky.pdf', akte: 'Akte_Rizky.jpg', kia: 'KIA_Rizky.jpg', ijazah: '-' }
  },
  { 
    id: 'BFA-006', 
    name: 'Daffa', 
    nickname: 'Daffa',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Bekasi', 
    birthDate: '2014-10-11', // 2026 - 2014 = 12 -> U12
    gender: 'L', 
    parentName: 'Ibu Maya Lestari', 
    phone: '087811992288', 
    classGroupId: 'U12', 
    status: 'Aktif', 
    joinedDate: '2023-05-15', 
    position: 'Anchor', 
    jerseyNumber: 6,
    documents: { kk: 'KK_Daffa.pdf', akte: 'Akte_Daffa.jpg', kia: 'KIA_Daffa.jpg', ijazah: '-' }
  },
  { 
    id: 'BFA-007', 
    name: 'Fajar', 
    nickname: 'Fajar',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Karawang', 
    birthDate: '2020-01-25', // 2026 - 2020 = 6 -> U6
    gender: 'L', 
    parentName: 'Bpk. Ilham Ramli', 
    phone: '089677334455', 
    classGroupId: 'U6', 
    status: 'Aktif', 
    joinedDate: '2025-06-10', 
    position: 'Flank', 
    jerseyNumber: 11,
    documents: { kk: 'KK_Fajar.pdf', akte: 'Akte_Fajar.jpg', kia: '-', ijazah: '-' }
  },
  { 
    id: 'BFA-008', 
    name: 'Rafi', 
    nickname: 'Rafi',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Bandung', 
    birthDate: '2016-12-02', // 2026 - 2016 = 10 -> U10
    gender: 'L', 
    parentName: 'Bpk. Dani Setiawan', 
    phone: '081366554422', 
    classGroupId: 'U10', 
    status: 'Aktif', 
    joinedDate: '2024-02-20', 
    position: 'Pivot', 
    jerseyNumber: 19,
    documents: { kk: 'KK_Rafi.pdf', akte: 'Akte_Rafi.jpg', kia: 'KIA_Rafi.jpg', ijazah: '-' }
  },
  { 
    id: 'BFA-009', 
    name: 'Ilham', 
    nickname: 'Ilham',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Karawang', 
    birthDate: '2011-06-16', // 2026 - 2011 = 15 -> U15
    gender: 'L', 
    parentName: 'Bpk. Ahmad Fauzi', 
    phone: '085233445566', 
    classGroupId: 'U15', 
    status: 'Aktif', 
    joinedDate: '2022-08-19', 
    position: 'Anchor', 
    jerseyNumber: 8,
    documents: { kk: 'KK_Ilham.pdf', akte: 'Akte_Ilham.jpg', kia: 'KIA_Ilham.jpg', ijazah: 'Ijazah_SD_Ilham.pdf' }
  },
  { 
    id: 'BFA-010', 
    name: 'Bagas', 
    nickname: 'Bagas',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80', 
    birthPlace: 'Purwakarta', 
    birthDate: '2009-02-04', // 2026 - 2009 = 17 -> U17
    gender: 'L', 
    parentName: 'Ibu Sri Wahyuni', 
    phone: '081244556677', 
    classGroupId: 'U17', 
    status: 'Aktif', 
    joinedDate: '2021-02-10', 
    position: 'Pivot', 
    jerseyNumber: 14,
    documents: { kk: 'KK_Bagas.pdf', akte: 'Akte_Bagas.jpg', kia: 'KIA_Bagas.jpg', ijazah: 'Ijazah_SMP_Bagas.pdf' }
  }
];

export const INITIAL_CASH_MUTATIONS: CashMutation[] = [];

export const INITIAL_SCHEDULES: TrainingSchedule[] = [
  {
    id: 'SCH-20261003-001',
    date: '2026-10-03',
    dayName: 'Sabtu, 3 Oktober 2026',
    startTime: '14:00',
    endTime: '16:00',
    classGroupId: 'U10',
    courtName: 'Bintang Futsal (Lap A,B,C)',
    coaches: ['Coach Hanif', 'Coach Panji', 'Coach Hesky', 'Coach Wirmar'],
    status: 'Akan Datang'
  },
  {
    id: 'SCH-20261003-002',
    date: '2026-10-03',
    dayName: 'Sabtu, 3 Oktober 2026',
    startTime: '08:00',
    endTime: '10:00',
    classGroupId: 'U11',
    courtName: 'FlaminGO Center (Vinyl)',
    coaches: ['Coach Hendra', 'Coach Dani'],
    status: 'Akan Datang'
  },
  {
    id: 'SCH-20261003-003',
    date: '2026-10-03',
    dayName: 'Sabtu, 3 Oktober 2026',
    startTime: '15:30',
    endTime: '17:30',
    classGroupId: 'U12',
    courtName: 'Bintang Futsal (Lap A)',
    coaches: ['Coach Hendra', 'Coach Ilham'],
    status: 'Akan Datang'
  }
];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_ATTENDANCES: Attendance[] = [];

export const INITIAL_SKILL_INDICATORS: SkillIndicator[] = [
  // 1. TEKNIK (SKILLS)
  { key: 'pass', name: 'Passing', shortName: 'Passing', score: 0, category: 'Teknik' },
  { key: 'ctrl', name: 'Ball Control', shortName: 'Ball Control', score: 0, category: 'Teknik' },
  { key: 'drib', name: 'Dribbling', shortName: 'Dribbling', score: 0, category: 'Teknik' },
  { key: 'shoot', name: 'Shooting', shortName: 'Shooting', score: 0, category: 'Teknik' },

  // 2. FISIK & MOTORIK
  { key: 'stamina', name: 'Stamina', shortName: 'Stamina', score: 0, category: 'Fisik' },
  { key: 'kelincahan', name: 'Kelincahan', shortName: 'Kelincahan', score: 0, category: 'Fisik' },
  { key: 'koordinasi', name: 'Koordinasi', shortName: 'Koordinasi', score: 0, category: 'Fisik' },
  { key: 'keseimbangan', name: 'Keseimbangan', shortName: 'Keseimbangan', score: 0, category: 'Fisik' },

  // 3. MENTAL & SIKAP
  { key: 'p_diri', name: 'Percaya Diri', shortName: 'Percaya Diri', score: 0, category: 'Mental' },
  { key: 'fokus', name: 'Fokus', shortName: 'Fokus', score: 0, category: 'Mental' },
  { key: 'disiplin', name: 'Disiplin', shortName: 'Disiplin', score: 0, category: 'Mental' },
  { key: 'k_sama', name: 'Kerja Sama', shortName: 'Kerja Sama', score: 0, category: 'Mental' },
  { key: 'sportif', name: 'Sportivitas', shortName: 'Sportivitas', score: 0, category: 'Mental' },
];

export const INITIAL_COACH_NOTES = 
  'Belum ada evaluasi nilai untuk periode Oktober. Silakan klik tombol Edit Nilai untuk memasukkan penilaian riil atlet.';

export function createDefaultReport(studentId: string, studentName?: string, position?: string): StudentReport {
  const indicators = INITIAL_SKILL_INDICATORS.map((item) => ({ ...item, score: 0 }));

  return {
    studentId,
    skillIndicators: indicators,
    coachNotes: 'Belum ada evaluasi nilai untuk periode Oktober. Silakan klik tombol Edit Nilai untuk memasukkan penilaian riil atlet.',
    evaluationDate: '2026-10-01',
    attendancePercent: 0,
    totalSessions: 0,
  };
}

export const INITIAL_STUDENT_REPORTS: Record<string, StudentReport> = {
  'BFA-001': createDefaultReport('BFA-001', 'Andra', 'Flank'),
  'BFA-002': createDefaultReport('BFA-002', 'Bima', 'Pivot'),
  'BFA-003': createDefaultReport('BFA-003', 'Raka', 'Anchor'),
  'BFA-004': createDefaultReport('BFA-004', 'Fahmi', 'Flank'),
  'BFA-005': createDefaultReport('BFA-005', 'Rizky', 'Goalkeeper'),
  'BFA-006': createDefaultReport('BFA-006', 'Daffa', 'Anchor'),
  'BFA-007': createDefaultReport('BFA-007', 'Fajar', 'Flank'),
  'BFA-008': createDefaultReport('BFA-008', 'Rafi', 'Pivot'),
  'BFA-009': createDefaultReport('BFA-009', 'Ilham', 'Anchor'),
  'BFA-010': createDefaultReport('BFA-010', 'Bagas', 'Pivot'),
};

export const ALL_KU_CATEGORIES: string[] = Array.from({ length: 38 }, (_, i) => `U${i + 3}`); // U3 to U40

export interface KUCategoryInfo {
  code: string;
  age: number;
  birthYear: number;
  bracket: 'Usia Dini' | 'Grassroots' | 'Remaja' | 'Senior';
}

export function getKUCategoryInfo(code: string, currentYear = CURRENT_SYSTEM_YEAR): KUCategoryInfo | null {
  const ageNum = parseInt(code.replace('U', ''), 10);
  if (isNaN(ageNum)) return null;
  let bracket: 'Usia Dini' | 'Grassroots' | 'Remaja' | 'Senior' = 'Grassroots';
  if (ageNum <= 7) bracket = 'Usia Dini';
  else if (ageNum <= 12) bracket = 'Grassroots';
  else if (ageNum <= 17) bracket = 'Remaja';
  else bracket = 'Senior';

  return {
    code: `U${ageNum}`,
    age: ageNum,
    birthYear: currentYear - ageNum,
    bracket,
  };
}

export function calculateAgeAndGroup(birthDateStr: string, currentYear = CURRENT_SYSTEM_YEAR): { age: number; group: string } {
  if (!birthDateStr) return { age: 0, group: 'U10' };
  const birthYear = new Date(birthDateStr).getFullYear();
  if (isNaN(birthYear)) return { age: 0, group: 'U10' };
  
  const calculatedAge = currentYear - birthYear;
  const clampedAge = Math.max(3, Math.min(40, calculatedAge));
  const groupKey = 'U' + clampedAge;
  return { age: calculatedAge, group: groupKey };
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (monthIndex < 0 || monthIndex >= 12) return dateStr;
  return `${day} ${months[monthIndex]} ${year}`;
}

/**
 * Automatically calculates the next student ID by finding the maximum numerical suffix
 * among all existing IDs and adding 1 (e.g. if BFA-001 ... BFA-010 exist, returns BFA-011).
 */
export function getNextStudentId(existingStudents: { id?: string }[]): string {
  let maxNum = 38; // Ground-truth baseline from production Firestore (never suggests below BFA-039)
  for (const s of existingStudents) {
    if (!s || !s.id || typeof s.id !== 'string') continue;
    const match = s.id.match(/\d+/g);
    if (match && match.length > 0) {
      const num = parseInt(match[match.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `BFA-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Sanitizes students list ensuring every student has a valid non-empty ID.
 * If any student has an empty or missing ID, sequentially generates one.
 */
export function sanitizeStudentsList(studentsList: Student[]): { list: Student[]; changed: boolean } {
  let maxNum = 0;
  for (const s of studentsList) {
    if (s && s.id && typeof s.id === 'string' && s.id.trim() !== '') {
      const match = s.id.match(/\d+/g);
      if (match && match.length > 0) {
        const num = parseInt(match[match.length - 1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let changed = false;
  const list = studentsList.map((st) => {
    let item = st;
    if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
      changed = true;
      maxNum += 1;
      const assignedId = `BFA-${String(maxNum).padStart(3, '0')}`;
      item = {
        ...item,
        id: assignedId,
      };
    }
    // Clean up placeholder phone '08' or '0' so it never falsely matches parent logins
    if (item.phone && (item.phone.trim() === '08' || item.phone.trim() === '0')) {
      changed = true;
      item = {
        ...item,
        phone: '',
      };
    }
    return item;
  });

  return { list, changed };
}
