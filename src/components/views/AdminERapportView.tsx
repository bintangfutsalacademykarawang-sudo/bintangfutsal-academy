import React, { useRef, useState, useMemo } from 'react';
import { Student, SkillIndicator, StudentReport, Attendance } from '../../types';
import { formatDateIndo, createDefaultReport } from '../../data/initialData';
import { 
  Edit3, 
  MessageCircle, 
  Quote, 
  Download, 
  Printer, 
  Loader2, 
  Search, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  UserPlus, 
  AlertCircle 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CreateReportModal } from '../modals/CreateReportModal';
import { BFALogo } from '../common/BFALogo';

interface AdminERapportViewProps {
  students: Student[];
  currentStudentId?: string;
  studentReports: Record<string, StudentReport>;
  attendances?: Attendance[];
  onSaveReportForStudent: (studentId: string, indicators: SkillIndicator[], notes: string) => void;
  onSaveFullReportForStudent?: (
    studentId: string,
    indicators: SkillIndicator[],
    notes: string,
    evaluationDate?: string,
    attendancePercent?: number,
    totalSessions?: number
  ) => void;
  onAddNewStudentWithReport?: (
    studentData: Omit<Student, 'id' | 'joinedDate'>,
    reportData: {
      indicators: SkillIndicator[];
      notes: string;
      evaluationDate: string;
      attendancePercent: number;
      totalSessions: number;
    }
  ) => string;
  onSendWhatsApp: (student: Student, report: StudentReport) => void;
  onOpenEditReportForStudent: (student: Student, currentIndicators: SkillIndicator[], currentNotes: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  isParentView?: boolean;
}

export const AdminERapportView: React.FC<AdminERapportViewProps> = ({
  students,
  currentStudentId,
  studentReports,
  attendances = [],
  onSaveReportForStudent,
  onSaveFullReportForStudent,
  onAddNewStudentWithReport,
  onSendWhatsApp,
  onOpenEditReportForStudent,
  onShowToast,
  isParentView = false,
}) => {
  // Selected student state for grading
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    currentStudentId || students[0]?.id || 'BFA-001'
  );
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedKUFilter, setSelectedKUFilter] = useState('Semua');

  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Synchronize when currentStudentId changes (e.g. parent switching active child)
  React.useEffect(() => {
    if (currentStudentId) {
      setSelectedStudentId(currentStudentId);
    }
  }, [currentStudentId]);

  // Active student object strictly resolving targeted student
  const activeStudent = useMemo(() => {
    const targetId = isParentView ? (currentStudentId || selectedStudentId) : selectedStudentId;
    if (!targetId) return isParentView ? null : (students[0] || null);
    const cleanTarget = targetId.trim().toUpperCase();
    const found = students.find((s) => s.id && s.id.trim().toUpperCase() === cleanTarget);
    if (found) return found;
    // In parent view, NEVER fallback to students[0]
    return isParentView ? null : (students[0] || null);
  }, [students, isParentView, currentStudentId, selectedStudentId]);

  // Active report for the selected student (Default 0 untuk semua indikator & kehadiran)
  const activeReport = useMemo(() => {
    if (!activeStudent) return createDefaultReport('BFA-001');
    const rep = studentReports[activeStudent.id];
    // Jika belum ada nilai atau berisi nilai demo bawaan, default semua angka menjadi 0
    if (!rep || rep.evaluationDate === '2026-09-25' || rep.coachNotes?.includes('first touch')) {
      return createDefaultReport(activeStudent.id, activeStudent.name, activeStudent.position);
    }
    return rep;
  }, [studentReports, activeStudent]);

  // Kehadiran & Total Sesi - otomatis mengikuti kehadiran latihan siswa (default 0)
  const studentAtts = useMemo(() => {
    if (!activeStudent || !attendances) return [];
    return attendances.filter(
      (a) => a.studentId === activeStudent.id || a.studentName === activeStudent.name
    );
  }, [activeStudent, attendances]);

  const realHadirSessions = studentAtts.filter((a) => a.status === 'HADIR').length;
  const realTotalSessions = studentAtts.length;
  const realAttendancePercent = realTotalSessions > 0 
    ? Math.round((realHadirSessions / realTotalSessions) * 100) 
    : 0;

  // Nilai total sesi dan kehadiran:
  // Default awal diisi 0 semua.
  // Total sesi otomatis mengikuti jumlah kehadiran latihan siswa secara riil.
  const isCustomAdminSessions = typeof activeReport.totalSessions === 'number' && activeReport.totalSessions !== 17 && activeReport.totalSessions > 0;
  const displayTotalSessions: number = (isCustomAdminSessions && typeof activeReport.totalSessions === 'number')
    ? activeReport.totalSessions
    : realTotalSessions;

  const isCustomAdminAttendance = typeof activeReport.attendancePercent === 'number' && activeReport.attendancePercent !== 100 && activeReport.attendancePercent > 0;
  const displayAttendancePercent: number = (isCustomAdminAttendance && typeof activeReport.attendancePercent === 'number')
    ? activeReport.attendancePercent 
    : (displayTotalSessions > 0 ? realAttendancePercent : 0);

  const skillIndicators = activeReport.skillIndicators;
  const coachNotes = activeReport.coachNotes;

  // Calculate OVR rating as average of the 13 indicators (default 0 if all 0)
  const totalScore = skillIndicators.reduce((acc, curr) => acc + curr.score, 0);
  const ovrRating = totalScore > 0 ? Math.round(totalScore / (skillIndicators.length || 1)) : 0;

  // Categorize 13 indicators
  const teknikItems = skillIndicators.filter((item) => item.category === 'Teknik');
  const fisikItems = skillIndicators.filter((item) => item.category === 'Fisik');
  const mentalItems = skillIndicators.filter((item) => item.category === 'Mental');

  // Compute 6 Pillars for the Hexagon Radar Chart
  const staminaScore = skillIndicators.find((i) => i.key === 'stamina')?.score ?? 0;
  const keseimbanganScore = skillIndicators.find((i) => i.key === 'keseimbangan')?.score ?? 0;
  const fisikPillar = Math.round((staminaScore + keseimbanganScore) / 2);

  const agilitasPillar = skillIndicators.find((i) => i.key === 'kelincahan')?.score ?? 0;

  const kSamaScore = skillIndicators.find((i) => i.key === 'k_sama')?.score ?? 0;
  const sportifScore = skillIndicators.find((i) => i.key === 'sportif')?.score ?? 0;
  const teamworkPillar = Math.round((kSamaScore + sportifScore) / 2);

  const disiplinScore = skillIndicators.find((i) => i.key === 'disiplin')?.score ?? 0;
  const pDiriScore = skillIndicators.find((i) => i.key === 'p_diri')?.score ?? 0;
  const karakterPillar = Math.round((disiplinScore + pDiriScore) / 2);

  const fokusPillar = skillIndicators.find((i) => i.key === 'fokus')?.score ?? 0;

  const teknikAvg = Math.round(
    teknikItems.reduce((acc, curr) => acc + curr.score, 0) / (teknikItems.length || 1)
  );

  const pillars = [
    { label: 'Fisik', score: fisikPillar },
    { label: 'Agilitas', score: agilitasPillar },
    { label: 'Kerja Sama', score: teamworkPillar },
    { label: 'Karakter', score: karakterPillar },
    { label: 'Fokus', score: fokusPillar },
    { label: 'Teknik', score: teknikAvg },
  ];

  // Radar geometry calculations (Hexagon centered at 190, 165 with radius 88 inside 380x340 viewBox)
  const cx = 190;
  const cy = 165;
  const maxRadius = 88;

  const getCoordinates = (index: number, radiusRatio: number) => {
    const angleDeg = index * 60 - 90;
    const angleRad = (angleDeg * Math.PI) / 180;
    const r = maxRadius * radiusRatio;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = gridLevels.map((lvl) => {
    return pillars.map((_, i) => {
      const pt = getCoordinates(i, lvl);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  });

  const playerPoints = pillars.map((p, i) => {
    const ratio = Math.min(100, Math.max(20, p.score)) / 100;
    const pt = getCoordinates(i, ratio);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  // Filtered students for picker
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = studentSearch.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.classGroupId.toLowerCase().includes(q);
      const matchKU = selectedKUFilter === 'Semua' || s.classGroupId === selectedKUFilter;
      return matchSearch && matchKU;
    });
  }, [students, studentSearch, selectedKUFilter]);

  if (!activeStudent) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-rose-200 shadow-md text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-slate-900">Rapor Siswa Tidak Ditemukan</h3>
        <p className="text-xs text-slate-600">
          Sistem tidak menemukan data atlet yang terhubung dengan sesi ini. Silakan hubungi admin atau login kembali dengan akun terdaftar.
        </p>
      </div>
    );
  }

  // Comprehensive WhatsApp Message Generator with FULL (unabbreviated) indicator names
  const generateWhatsAppMessage = () => {
    return (
`*BINTANG FUTSAL ACADEMY*
*KARAWANG • 13 PERFORMANCE RADAR*
━━━━━━━━━━━━━━━━━━━━
Yth. ${activeStudent.parentName},

Berikut laporan performa & evaluasi resmi atlet BFA:
• *Nama Siswa*: ${activeStudent.name}
• *ID Siswa*: ${activeStudent.id}
• *Kelompok*: ${activeStudent.classGroupId} (#${activeStudent.jerseyNumber} - ${activeStudent.position})
• *Tempat, Tgl Lahir*: ${activeStudent.birthPlace || 'Karawang'}, ${formatDateIndo(activeStudent.birthDate)}
• *OVR Rating*: *${ovrRating}*
• *Kehadiran*: ${activeReport.attendancePercent || 100}% (${activeReport.totalSessions || 17} Sesi)

*⚽ TEKNIK (SKILLS)*:
- Passing: ${skillIndicators.find((i) => i.key === 'pass')?.score ?? 83}
- Ball Control: ${skillIndicators.find((i) => i.key === 'ctrl')?.score ?? 81}
- Dribbling: ${skillIndicators.find((i) => i.key === 'drib')?.score ?? 84}
- Shooting: ${skillIndicators.find((i) => i.key === 'shoot')?.score ?? 80}

*🏃 FISIK & MOTORIK*:
- Stamina: ${skillIndicators.find((i) => i.key === 'stamina')?.score ?? 80}
- Kelincahan: ${skillIndicators.find((i) => i.key === 'kelincahan')?.score ?? 88}
- Koordinasi: ${skillIndicators.find((i) => i.key === 'koordinasi')?.score ?? 88}
- Keseimbangan: ${skillIndicators.find((i) => i.key === 'keseimbangan')?.score ?? 84}

*🧠 MENTAL & SIKAP*:
- Percaya Diri: ${skillIndicators.find((i) => i.key === 'p_diri')?.score ?? 85}
- Fokus: ${skillIndicators.find((i) => i.key === 'fokus')?.score ?? 82}
- Disiplin: ${skillIndicators.find((i) => i.key === 'disiplin')?.score ?? 85}
- Kerja Sama: ${skillIndicators.find((i) => i.key === 'k_sama')?.score ?? 82}
- Sportivitas: ${skillIndicators.find((i) => i.key === 'sportif')?.score ?? 85}

*CATATAN COACHING STAFF*:
"${coachNotes}"

Official Performance Report • BFA Karawang
#WeGrowTogether`
    );
  };

  // Helper to convert an image URL to a safe Base64 Data URL or fallback SVG
  const getSafeAvatarDataUrl = async (url?: string): Promise<string> => {
    const fallbackSvg = `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#0C1E3D"/><circle cx="60" cy="45" r="22" fill="#f59e0b"/><path d="M25 105 C25 80, 40 72, 60 72 C80 72, 95 80, 95 105 Z" fill="#f59e0b"/><text x="60" y="52" font-size="22" font-weight="900" fill="#071328" text-anchor="middle" font-family="sans-serif">${encodeURIComponent(activeStudent.name.charAt(0) || 'A')}</text></svg>`
    )}`;

    if (!url) return fallbackSvg;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) return fallbackSvg;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || fallbackSvg);
        reader.onerror = () => resolve(fallbackSvg);
        reader.readAsDataURL(blob);
      });
    } catch {
      return fallbackSvg;
    }
  };

  // Fail-proof capture that handles Tailwind v4 oklch colors, CSS variables, and SVGs seamlessly
  const captureReportCardImage = async (): Promise<string | null> => {
    if (!reportCardRef.current) return null;
    const node = reportCardRef.current;

    // Temporarily swap avatar with safe inline data URL
    const avatarImg = node.querySelector('img[data-avatar="true"]') as HTMLImageElement | null;
    const originalSrc = avatarImg ? avatarImg.src : '';
    const safeAvatar = await getSafeAvatarDataUrl(activeStudent.avatar);

    if (avatarImg && safeAvatar) {
      avatarImg.src = safeAvatar;
    }

    try {
      // 1. Primary: toJpeg with 2x resolution (crystal clear HD card)
      const dataUrl = await toJpeg(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#071328',
        skipFonts: true,
      });

      if (avatarImg && originalSrc) {
        avatarImg.src = originalSrc;
      }
      return dataUrl;
    } catch (err1) {
      console.warn('toJpeg capture failed, attempting toPng fallback:', err1);
      try {
        const pngUrl = await toPng(node, {
          pixelRatio: 1.5,
          backgroundColor: '#071328',
          skipFonts: true,
        });
        if (avatarImg && originalSrc) {
          avatarImg.src = originalSrc;
        }
        return pngUrl;
      } catch (err2) {
        console.warn('toPng capture failed, attempting html2canvas fallback:', err2);
        if (avatarImg && originalSrc) {
          avatarImg.src = originalSrc;
        }
        try {
          const canvas = await html2canvas(node, {
            scale: 1.5,
            useCORS: false,
            allowTaint: true,
            backgroundColor: '#071328',
            logging: false,
          });
          return canvas.toDataURL('image/jpeg', 0.9);
        } catch (err3) {
          console.error('All DOM capture methods failed:', err3);
          return null;
        }
      }
    }
  };

  // 1. Direct JPG file download (MURNI DOWNLOAD FILE LANGSUNG - TIDAK BUKA WHATSAPP)
  const handleDownloadJPG = async () => {
    setIsExporting(true);
    const fileName = `Rapor_BFA_${activeStudent.name.replace(/\s+/g, '_')}_${activeStudent.classGroupId}.jpg`;

    try {
      const dataUrl = await captureReportCardImage();
      if (!dataUrl) {
        onShowToast?.('Gagal memproses gambar rapor.', 'error');
        setIsExporting(false);
        return;
      }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast?.(`✓ File JPG (${fileName}) berhasil diunduh langsung!`, 'success');
    } catch (err) {
      console.error('Failed to download JPG:', err);
      onShowToast?.('Gagal mengunduh file JPG.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Direct PDF file download (MURNI SIMPAN FILE PDF LANGSUNG - TIDAK BUKA WHATSAPP)
  const handleSavePDF = async () => {
    setIsExporting(true);
    const fileName = `Rapor_BFA_${activeStudent.name.replace(/\s+/g, '_')}_${activeStudent.classGroupId}.pdf`;

    try {
      const dataUrl = await captureReportCardImage();
      if (!dataUrl) {
        onShowToast?.('Gagal memproses file PDF.', 'error');
        setIsExporting(false);
        return;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      // Calculate natural image dimensions for proportional scaling
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });

      const imgWidth = img.naturalWidth || 620;
      const imgHeight = img.naturalHeight || 850;
      const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

      const renderWidth = imgWidth * ratio;
      const renderHeight = imgHeight * ratio;
      const xOffset = margin + (maxWidth - renderWidth) / 2;
      const yOffset = margin + (maxHeight - renderHeight) / 2;

      pdf.setFillColor(7, 19, 40); // #071328
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.addImage(dataUrl, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);
      pdf.save(fileName);

      onShowToast?.(`✓ File PDF (${fileName}) berhasil disimpan langsung!`, 'success');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      onShowToast?.('Gagal menyimpan file PDF.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Kirim ke WhatsApp (Hanya fungsi ini yang menghubungkan ke WhatsApp)
  const handleSendWhatsApp = async () => {
    setIsExporting(true);
    const fileName = `Rapor_BFA_${activeStudent.name.replace(/\s+/g, '_')}_${activeStudent.classGroupId}.jpg`;
    const messageText = generateWhatsAppMessage();
    let cleanPhone = activeStudent.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }

    try {
      const dataUrl = await captureReportCardImage();
      if (dataUrl) {
        // Direct download file to device storage
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Try Web Share API if supported
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Rapor BFA - ${activeStudent.name}`,
              text: messageText,
            });
            onShowToast?.(`✓ Rapor JPG ${activeStudent.name} berhasil dibagikan ke WhatsApp!`, 'success');
            setIsExporting(false);
            return;
          }
        } catch {
          // Share was cancelled or unsupported
        }
      }

      const encoded = encodeURIComponent(messageText);
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
      window.open(waUrl, '_blank');
      onShowToast?.(`✓ Kartu JPG tersimpan & membuka WhatsApp wali murid...`, 'success');
    } catch {
      onSendWhatsApp(activeStudent, activeReport);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* MULTI-STUDENT PICKER SELECTOR (ADMIN ONLY) */}
      {!isParentView && (
        <div className="no-print bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-700" />
                <span>Pilih Siswa / Atlet untuk Penilaian E-Rapport</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Pilih atlet BFA untuk melihat rapor performa, input penilaian 13 indikator, atau kirim kartu via WhatsApp.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsCreateReportModalOpen(true)}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Input Rapor Siswa</span>
              </button>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Total {students.length} Atlet
              </span>
            </div>
          </div>

          {/* Search & KU Filter for Student Picker */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Cari atlet berdasarkan nama atau ID..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            <select
              value={selectedKUFilter}
              onChange={(e) => setSelectedKUFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600"
            >
              <option value="Semua">Semua Kategori (KU)</option>
              {['U6', 'U8', 'U10', 'U11', 'U12', 'U15', 'U17'].map((ku) => (
                <option key={ku} value={ku}>
                  Kelompok {ku}
                </option>
              ))}
            </select>
          </div>

          {/* Horizontal Scrollable Student Badges */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 pt-1">
            {filteredStudents.map((st) => {
              const isSelected = st.id === selectedStudentId;
              const stReport = studentReports[st.id] || createDefaultReport(st.id, st.name, st.position);
              const stOvr = Math.round(
                stReport.skillIndicators.reduce((a, b) => a + b.score, 0) / stReport.skillIndicators.length
              );

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStudentId(st.id)}
                  className={`px-3 py-2 rounded-2xl border transition text-left flex items-center space-x-2.5 shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-blue-900 border-blue-950 text-white shadow-md ring-2 ring-blue-500'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <img
                    src={st.avatar}
                    alt={st.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/40 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-xs block leading-tight">
                        {st.name}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-amber-400 text-blue-950' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {st.classGroupId}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] mt-0.5 opacity-80">
                      <span>#{st.jerseyNumber || '-'} • {st.position}</span>
                      <span className="font-mono font-bold text-amber-400">
                        OVR {stOvr}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-amber-300 ml-1 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Header Controls (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
            BFA E-RAPPORT MODULE • 13 PERFORMANCE RADAR
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight flex items-center gap-2">
            <span>Rapor Atlet:</span>
            <span className="text-blue-950 underline decoration-amber-400 decoration-4">
              {activeStudent.name} ({activeStudent.classGroupId})
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Penilaian resmi 13 indikator lengkap, radar 6 pilar heksagonal, dan ekspor format JPG / PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Nilai (Hanya untuk Admin - Primary Button Highlight) */}
          {!isParentView && (
            <button
              onClick={() => onOpenEditReportForStudent(activeStudent, skillIndicators, coachNotes)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white font-black rounded-xl text-xs border border-amber-400/40 flex items-center space-x-2 shadow-lg shadow-orange-600/30 transition active:scale-95"
              title="Edit Nilai 13 Indikator, Kehadiran, dan Catatan Rapor Atlet Ini"
            >
              <Edit3 className="w-4 h-4 text-amber-200" />
              <span>✏️ Edit Nilai Rapor ({activeStudent.name})</span>
            </button>
          )}

          {/* Input Data Rapor Baru / Lainnya Button (Admin Only) */}
          {!isParentView && (
            <button
              onClick={() => setIsCreateReportModalOpen(true)}
              className="px-3.5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition active:scale-95 shrink-0 border border-blue-800"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>+ Input Rapor Siswa Baru / Lainnya</span>
            </button>
          )}

          {/* Download JPG (Direct File Download - No WhatsApp) */}
          <button
            onClick={handleDownloadJPG}
            disabled={isExporting}
            className="px-3.5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <Download className="w-4 h-4 text-amber-300" />
            )}
            <span>Unduh JPG</span>
          </button>

          {/* Simpan PDF (Direct File Download - No WhatsApp) */}
          <button
            onClick={handleSavePDF}
            disabled={isExporting}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
            ) : (
              <Printer className="w-4 h-4 text-cyan-300" />
            )}
            <span>Simpan PDF</span>
          </button>

          {/* Kirim via WhatsApp with JPG Card */}
          <button
            onClick={handleSendWhatsApp}
            disabled={isExporting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/25 transition active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            <span>Kirim via WhatsApp (JPG)</span>
          </button>
        </div>
      </div>

      {/* Main E-Rapport Card - Captured into JPG or Printed */}
      <div className="flex justify-center w-full">
        <div
          ref={reportCardRef}
          id="bfa-rapport-card"
          className="print-card-only w-full max-w-[620px] bg-[#071328] text-white rounded-3xl border-2 border-blue-900/80 shadow-2xl p-5 sm:p-7 space-y-5 relative overflow-hidden"
        >
        {/* Background Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Branding with Authentic Logo */}
        <div className="text-center pb-1 relative z-10">
          <BFALogo className="w-12 h-14 mx-auto mb-1 drop-shadow-md" />
          <h2 className="text-lg sm:text-xl font-black tracking-wider text-amber-300 uppercase">
            BINTANG FUTSAL ACADEMY
          </h2>
          <p className="text-xs sm:text-sm font-extrabold text-cyan-400 tracking-widest uppercase mt-0.5">
            KARAWANG • 13 PERFORMANCE RADAR
          </p>
        </div>

        {/* 3 Top Circular Rings */}
        <div className="grid grid-cols-3 gap-3 max-w-xs sm:max-w-sm mx-auto pt-1 pb-3 text-center relative z-10">
          {/* Ring 1: OVR Rating */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-amber-400 bg-amber-400/10 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tabular-nums">
                {ovrRating}
              </span>
            </div>
            <span className="text-[10px] font-black tracking-wider text-slate-300 uppercase mt-1.5">
              OVR RATING
            </span>
          </div>

          {/* Ring 2: Kehadiran */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-cyan-400 bg-cyan-400/10 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-lg sm:text-xl font-black text-cyan-300 font-mono tabular-nums">
                {displayAttendancePercent}%
              </span>
            </div>
            <span className="text-[10px] font-black tracking-wider text-slate-300 uppercase mt-1.5">
              KEHADIRAN
            </span>
          </div>

          {/* Ring 3: Total Sesi */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-emerald-400 bg-emerald-400/10 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tabular-nums">
                {displayTotalSessions}
              </span>
            </div>
            <span className="text-[10px] font-black tracking-wider text-slate-300 uppercase mt-1.5">
              TOTAL SESI
            </span>
          </div>
        </div>

        {/* Player Profile Info Card (Preserved completely) */}
        <div className="bg-[#0C1E3D] border border-blue-800/80 rounded-2xl p-4 relative z-10 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <img
                data-avatar="true"
                src={activeStudent.avatar}
                alt={activeStudent.name}
                crossOrigin="anonymous"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {activeStudent.name}
                  </h3>
                  <span className="bg-amber-400 text-blue-950 font-black text-[10px] px-2 py-0.5 rounded-md">
                    {activeStudent.classGroupId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Posisi: <strong className="text-cyan-300">{activeStudent.position}</strong> • No. Jersey: <strong className="text-amber-400">#{activeStudent.jerseyNumber}</strong> • ID: <span className="font-mono text-slate-400">{activeStudent.id}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tempat, Tgl Lahir: {activeStudent.birthPlace || 'Karawang'}, {formatDateIndo(activeStudent.birthDate)}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-blue-800/70 pt-2 sm:pt-0 sm:pl-3.5 space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">
                TANGGAL EVALUASI
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300 block">
                {activeReport.evaluationDate && activeReport.evaluationDate !== '2026-09-25' ? activeReport.evaluationDate : 'Belum Dievaluasi'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Wali: <strong className="text-slate-200">{activeStudent.parentName}</strong>
              </span>

              {!isParentView && (
                <div className="pt-2 no-print">
                  <button
                    type="button"
                    onClick={() => onOpenEditReportForStudent(activeStudent, skillIndicators, coachNotes)}
                    className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-[11px] rounded-lg shadow-sm flex items-center gap-1 sm:ml-auto transition active:scale-95 border border-amber-300/40"
                    title="Edit nilai atlet ini sekarang"
                  >
                    <Edit3 className="w-3 h-3 text-amber-100" />
                    <span>✏️ Edit Nilai Rapor</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 13 PERFORMANCE INDICATORS SECTIONS - FULL (UNABBREVIATED) LABELS */}
        <div className="space-y-3.5 relative z-10">
          
          {/* SECTION 1: TEKNIK (SKILLS) - Full Words in 4 Columns */}
          <div className="bg-[#0C1E3D] border border-blue-800/70 rounded-2xl p-3.5 space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span>⚽</span>
              <span>TEKNIK (SKILLS)</span>
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {teknikItems.map((item) => (
                <div
                  key={item.key}
                  className="bg-[#071328]/95 border border-blue-800/90 rounded-xl p-2.5 text-center transition hover:border-cyan-400"
                >
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 block truncate" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-amber-300 font-mono mt-0.5 block tabular-nums">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: FISIK & MOTORIK - Full Words in 4 Columns */}
          <div className="bg-[#0C1E3D] border border-blue-800/70 rounded-2xl p-3.5 space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span>🏃</span>
              <span>FISIK & MOTORIK</span>
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {fisikItems.map((item) => (
                <div
                  key={item.key}
                  className="bg-[#071328]/95 border border-blue-800/90 rounded-xl p-2.5 text-center transition hover:border-cyan-400"
                >
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 block truncate" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-cyan-300 font-mono mt-0.5 block tabular-nums">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: MENTAL & SIKAP - Full Words in 5 Columns */}
          <div className="bg-[#0C1E3D] border border-blue-800/70 rounded-2xl p-3.5 space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span>🧠</span>
              <span>MENTAL & SIKAP</span>
            </h4>
            <div className="grid grid-cols-5 gap-1.5">
              {mentalItems.map((item) => (
                <div
                  key={item.key}
                  className="bg-[#071328]/95 border border-blue-800/90 rounded-xl p-2 text-center transition hover:border-emerald-400"
                >
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-200 block truncate" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-base sm:text-xl font-black text-emerald-300 font-mono mt-0.5 block tabular-nums">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CATATAN COACHING STAFF */}
        <div className="bg-[#0C1E3D] border border-blue-800/70 rounded-2xl p-3.5 relative z-10 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5 text-amber-400" />
            <span>CATATAN COACHING STAFF:</span>
          </span>
          <p className="text-[11px] sm:text-xs text-slate-200 italic leading-relaxed pl-2 border-l-2 border-amber-400">
            "{coachNotes}"
          </p>
        </div>

        {/* 6 PILAR PERFORMANCE RADAR (Hexagon Chart) */}
        <div className="bg-[#0C1E3D] border border-blue-800/70 rounded-2xl p-4 relative z-10 text-center space-y-3">
          <h3 className="text-xs font-black tracking-widest text-cyan-400 uppercase">
            6 PILAR PERFORMANCE RADAR
          </h3>

          <div className="flex justify-center items-center py-1">
            <div className="relative w-72 h-64 sm:w-80 sm:h-72">
              <svg viewBox="0 0 380 340" className="w-full h-full">
                {/* Concentric Hexagon Grid Rings */}
                {gridPolygons.map((pts, idx) => (
                  <polygon
                    key={idx}
                    points={pts}
                    fill="none"
                    stroke="#1e3a8a"
                    strokeWidth="1.2"
                    strokeDasharray={idx < 4 ? '3 3' : 'none'}
                    opacity={0.7}
                  />
                ))}

                {/* Spokes from Center to Outer Vertices */}
                {pillars.map((_, i) => {
                  const pt = getCoordinates(i, 1.0);
                  return (
                    <line
                      key={i}
                      x1={cx}
                      y1={cy}
                      x2={pt.x}
                      y2={pt.y}
                      stroke="#1e3a8a"
                      strokeWidth="1.2"
                      opacity={0.8}
                    />
                  );
                })}

                {/* Player Radar Polygon Area */}
                <polygon
                  points={playerPoints}
                  fill="rgba(6, 182, 212, 0.28)"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />

                {/* Data Points on Vertices */}
                {pillars.map((p, i) => {
                  const ratio = Math.min(100, Math.max(20, p.score)) / 100;
                  const pt = getCoordinates(i, ratio);
                  return (
                    <g key={i}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4.5"
                        fill="#06b6d4"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}

                {/* Pillar Labels around the Perimeter - FULL UNABBREVIATED WORDS (ZERO TRUNCATION) */}
                {/* 0: Top (Fisik) */}
                <text
                  x={cx}
                  y={getCoordinates(0, 1.0).y - 12}
                  textAnchor="middle"
                  fill="#93c5fd"
                  fontSize="11"
                  fontWeight="800"
                >
                  Fisik ({fisikPillar})
                </text>

                {/* 1: Top Right (Agilitas) */}
                <text
                  x={getCoordinates(1, 1.0).x + 8}
                  y={getCoordinates(1, 1.0).y - 4}
                  textAnchor="start"
                  fill="#93c5fd"
                  fontSize="11"
                  fontWeight="800"
                >
                  Agilitas ({agilitasPillar})
                </text>

                {/* 2: Bottom Right (Kerja Sama) */}
                <text
                  x={getCoordinates(2, 1.0).x + 8}
                  y={getCoordinates(2, 1.0).y + 12}
                  textAnchor="start"
                  fill="#93c5fd"
                  fontSize="11"
                  fontWeight="800"
                >
                  Kerja Sama ({teamworkPillar})
                </text>

                {/* 3: Bottom (Karakter) */}
                <text
                  x={cx}
                  y={getCoordinates(3, 1.0).y + 18}
                  textAnchor="middle"
                  fill="#93c5fd"
                  fontSize="11"
                  fontWeight="800"
                >
                  Karakter ({karakterPillar})
                </text>

                {/* 4: Bottom Left (Fokus) */}
                <text
                  x={getCoordinates(4, 1.0).x - 8}
                  y={getCoordinates(4, 1.0).y + 12}
                  textAnchor="end"
                  fill="#93c5fd"
                  fontSize="11"
                  fontWeight="800"
                >
                  Fokus ({fokusPillar})
                </text>

                {/* 5: Top Left (Teknik) */}
                <text
                  x={getCoordinates(5, 1.0).x - 8}
                  y={getCoordinates(5, 1.0).y - 4}
                  textAnchor="end"
                  fill="#93c5fd"
                  fontSize="11"
                  fontWeight="800"
                >
                  Teknik ({teknikAvg})
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-blue-900/60 flex flex-row items-center justify-between text-[10px] text-slate-400 relative z-10">
          <span>Official Performance Report • BFA Karawang</span>
          <span className="font-extrabold text-amber-400 tracking-wider">
            #WeGrowTogether
          </span>
        </div>

        </div>
      </div>

      {/* MODAL: INPUT DATA E-RAPPORT SISWA BARU / SISWA LAIN */}
      <CreateReportModal
        isOpen={isCreateReportModalOpen}
        students={students}
        studentReports={studentReports}
        onClose={() => setIsCreateReportModalOpen(false)}
        onSubmitExistingStudent={(stId, inds, nts, evalDate, attPct, totSes) => {
          if (onSaveFullReportForStudent) {
            onSaveFullReportForStudent(stId, inds, nts, evalDate, attPct, totSes);
          } else {
            onSaveReportForStudent(stId, inds, nts);
          }
          setSelectedStudentId(stId);
        }}
        onSubmitNewStudent={(stData, repData) => {
          if (onAddNewStudentWithReport) {
            const newId = onAddNewStudentWithReport(stData, repData);
            setSelectedStudentId(newId);
          }
        }}
      />

    </div>
  );
};
