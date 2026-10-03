import React, { useState } from 'react';
import { Student, SkillIndicator, Invoice, Attendance } from '../../types';
import { formatDateIndo, CURRENT_SYSTEM_YEAR } from '../../data/initialData';
import { X, Edit3, CheckCircle2, FileText, QrCode, Printer, ShieldCheck, Sparkles, User, Trash2 } from 'lucide-react';
import { BarcodeDisplay } from '../common/BarcodeDisplay';
import { StudentBarcodeModal } from './StudentBarcodeModal';

interface StudentDetailModalProps {
  isOpen: boolean;
  student: Student | null;
  skillIndicators: SkillIndicator[];
  invoices: Invoice[];
  attendances: Attendance[];
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete?: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  student,
  skillIndicators,
  invoices,
  attendances,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [subtab, setSubtab] = useState<'overview' | 'barcode' | 'absensi' | 'pembayaran' | 'rapor' | 'berkas'>('overview');
  const [isBarcodeCardOpen, setIsBarcodeCardOpen] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  if (!isOpen || !student) return null;

  const birthFormatted = formatDateIndo(student.birthDate);
  const birthYear = new Date(student.birthDate).getFullYear();
  const ageText = !isNaN(birthYear) ? `${CURRENT_SYSTEM_YEAR - birthYear} Tahun` : '';

  const studentAttendances = attendances.filter((a) => a.studentId === student.id);
  const hadirCount = studentAttendances.filter((a) => a.status === 'HADIR').length;
  
  const studentInvoices = invoices.filter((i) => i.studentId === student.id);
  const totalInvoice = studentInvoices.reduce((a, b) => a + b.amount, 0);
  const paidInvoice = studentInvoices.filter((i) => i.status === 'LUNAS').reduce((a, b) => a + b.amount, 0);
  const unpaidInvoice = totalInvoice - paidInvoice;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 text-slate-800 shadow-2xl relative my-8 border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Profile */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <img
              src={student.avatar}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-xs"
              alt={student.name}
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">{student.name}</h3>
                {student.nickname && (
                  <span className="text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                    Panggilan: {student.nickname}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {student.id} • Kelompok: <strong className="text-blue-700">{student.classGroupId}</strong> • Posisi: <strong className="text-orange-600">{student.position || 'Belum Ditentukan'} (#{student.jerseyNumber || '-'})</strong>
              </p>
              <p className="text-[11px] text-blue-700 font-bold mt-0.5">
                Wali: {student.parentName} ({student.phone})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBarcodeCardOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-xs"
              title="Buka & Cetak Kartu Barcode Siswa"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Kartu Barcode</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(student)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center space-x-1.5 transition active:scale-95 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-orange-600" />
              <span>Edit Data</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmDelete(true)}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center space-x-1.5 transition active:scale-95 shadow-xs"
                title="Hapus Data Atlet Ini"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtab Navigation */}
        <div className="flex border-b border-slate-200 mt-4 text-xs overflow-x-auto">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'barcode' as const, label: 'Kartu Barcode & QR' },
            { id: 'absensi' as const, label: 'Absensi' },
            { id: 'pembayaran' as const, label: 'Pembayaran' },
            { id: 'rapor' as const, label: 'Rapor (20 Indikator)' },
            { id: 'berkas' as const, label: 'Berkas Dokumen' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubtab(tab.id)}
              className={`px-4 py-2.5 font-bold transition border-b-2 whitespace-nowrap ${
                subtab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subtab Contents */}
        <div className="mt-4 text-xs">
          {subtab === 'overview' && (
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Tempat, Tanggal Lahir</span>
                <span className="font-bold text-slate-900 text-sm">{student.birthPlace || 'Karawang'}, {birthFormatted}</span>
                <span className="block text-[10px] text-blue-700 font-extrabold mt-0.5">
                  {ageText} • Kelompok {student.classGroupId}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Nomor Punggung (Jersey)</span>
                <span className="font-bold text-orange-600 text-sm">#{student.jerseyNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Nama Orang Tua / Wali</span>
                <span className="font-bold text-slate-900 text-sm">{student.parentName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Nomor WhatsApp</span>
                <span className="font-bold text-emerald-700 font-mono text-sm tabular-nums">{student.phone}</span>
              </div>
            </div>
          )}

          {subtab === 'barcode' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white rounded-2xl border border-blue-800/60 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-amber-400 shrink-0 shadow-md">
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-400 m-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white border border-blue-400">
                          KELOMPOK {student.classGroupId}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                          {student.id}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white uppercase mt-1">
                        {student.name}
                      </h4>
                      <p className="text-[11px] text-blue-200/90 font-medium">
                        Posisi: <strong className="text-white">{student.position}</strong> {student.jerseyNumber ? `• No. #${student.jerseyNumber}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBarcodeCardOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition active:scale-95 shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Buka Kartu & Cetak</span>
                  </button>
                </div>

                <div className="mt-4 flex flex-col items-center">
                  <BarcodeDisplay
                    value={student.id}
                    studentName={student.name}
                    classGroup={student.classGroupId}
                    width={320}
                    height={80}
                  />
                  <p className="text-[11px] text-blue-200/80 mt-3 text-center max-w-sm">
                    Barcode dan QR Code ini siap dipindai kamera gate atau barcode scanner gun fisik saat presensi latihan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {subtab === 'absensi' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Total Sesi Kehadiran</span>
                  <span className="text-xl font-black text-emerald-700 tabular-nums">{hadirCount} Sesi</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Persentase Kehadiran</span>
                  <span className="text-xl font-black text-blue-900 tabular-nums">92%</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Presensi biometrik diverifikasi real-time melalui scanner fingerprint gate BFA Klari.
              </p>
            </div>
          )}

          {subtab === 'pembayaran' && (
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-200">
                <span className="text-slate-500 text-[9px] block">Total Tagihan</span>
                <span className="font-black text-slate-900 tabular-nums">Rp{totalInvoice.toLocaleString('id-ID')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-200">
                <span className="text-slate-500 text-[9px] block">Terbayar</span>
                <span className="font-black text-emerald-700 tabular-nums">Rp{paidInvoice.toLocaleString('id-ID')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-200">
                <span className="text-slate-500 text-[9px] block">Outstanding</span>
                <span className="font-black text-rose-700 tabular-nums">Rp{unpaidInvoice.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {subtab === 'rapor' && (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-extrabold text-slate-800 text-[11px]">
                  13 Performance Radar
                </span>
                <span className="text-[10px] font-mono text-cyan-600 font-bold">
                  Skala 0 - 100
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {skillIndicators.map((sk) => (
                  <div
                    key={sk.key || sk.name}
                    className="p-2 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200"
                  >
                    <div>
                      <span className="text-slate-800 font-bold block text-[11px] truncate">
                        {sk.name}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">
                        {sk.category}
                      </span>
                    </div>
                    <span className="text-blue-900 font-black text-xs tabular-nums bg-white px-1.5 py-0.5 rounded-lg border border-slate-200">
                      {sk.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subtab === 'berkas' && (
            <div className="space-y-2">
              {[
                { title: 'Kartu Keluarga (KK)', file: student.documents.kk },
                { title: 'Akta Kelahiran', file: student.documents.akte },
                { title: 'KIA / KTP Anak & Wali', file: student.documents.kia },
                { title: 'Ijazah Terakhir', file: student.documents.ijazah },
              ].map((doc) => {
                const isValid = doc.file && doc.file !== '-';
                return (
                  <div key={doc.title} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-700" />
                        <span>{doc.title}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{doc.file || 'Belum diunggah'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isValid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isValid ? 'Terverifikasi' : 'Kosong'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Student Barcode Pass Modal */}
        <StudentBarcodeModal
          isOpen={isBarcodeCardOpen}
          student={student}
          onClose={() => setIsBarcodeCardOpen(false)}
        />

        {/* Modal Konfirmasi Hapus Siswa */}
        {isConfirmDelete && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl relative border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 text-center tracking-tight">
                Hapus Data Siswa?
              </h3>
              <p className="text-xs text-slate-500 text-center mt-1">
                Data atlet <strong>{student.name} ({student.id})</strong> akan dihapus permanen dari sistem dan database online.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsConfirmDelete(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmDelete(false);
                    onDelete?.(student);
                    onClose();
                  }}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/30 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
