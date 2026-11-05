import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Clock, 
  X, 
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  XCircle,
  Smartphone
} from 'lucide-react';
import { ApprovalDiagnosticResult } from '../../types';

interface ApprovalDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ApprovalDiagnosticResult | null;
  studentName?: string;
  studentId?: string;
}

export const ApprovalDiagnosticModal: React.FC<ApprovalDiagnosticModalProps> = ({
  isOpen,
  onClose,
  result,
  studentName,
  studentId,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  const isResolved = result.promiseStatus === 'RESOLVED';

  const formatClaimValue = (val: string | boolean | null | undefined): string => {
    if (val === true) return 'true';
    if (val === false) return 'false';
    if (val === null || val === undefined) return 'null (tidak terdefinisi)';
    return String(val);
  };

  const generateDiagnosticText = (): string => {
    const lines = [
      '========================================',
      ' BFA HUB — DIAGNOSTIK APPROVAL (ANDROID)',
      '========================================',
      `Target Siswa : ${studentName || '-'} (${studentId || '-'})`,
      `Pemeriksaan Auth  : ${result.checkTimestamp}`,
      `Transaksi Server  : ${result.transactionTimestamp || '-'}`,
      '----------------------------------------',
      'IDENTITAS ADMIN & AUTHORIZATION:',
      `• Admin UID       : ${result.adminUid}`,
      `• Allowlist Match : ${result.isAllowlistedUid ? 'YA (Cocok Allowlist)' : 'TIDAK (Tidak Cocok)'}`,
      'CUSTOM CLAIMS FIREBASE AUTH:',
      `• Check Status    : ${result.claimsCheckFailed ? `GAGAL (${result.claimsErrorMessage || 'Unknown'})` : 'BERHASIL'}`,
      `• Claim [role]    : ${formatClaimValue(result.claims.role)}`,
      `• Claim [admin]   : ${formatClaimValue(result.claims.admin)}`,
      '----------------------------------------',
      'STATUS TRANSAKSI FIRESTORE:',
      `• Promise Status  : ${result.promiseStatus}`,
    ];

    if (result.errorDetails) {
      lines.push('----------------------------------------');
      lines.push('DETAIL ERROR SERAFIM / FIRESTORE:');
      lines.push(`• Name    : ${result.errorDetails.name}`);
      lines.push(`• Code    : ${result.errorDetails.code}`);
      lines.push(`• Message : ${result.errorDetails.message}`);
    }

    lines.push('========================================');
    return lines.join('\n');
  };

  const handleCopyDiagnostics = async () => {
    try {
      const text = generateDiagnosticText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Gagal menyalin hasil diagnostik:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 my-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Diagnostik Approval Android
              </h3>
              <p className="text-xs text-slate-500">
                {studentName ? `Hasil transaksi untuk ${studentName} (${studentId})` : 'Hasil transaksi approval Firestore'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Promise Card */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
          isResolved 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center space-x-3">
            {isResolved ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            )}
            <div>
              <div className="text-xs font-black uppercase tracking-wider">
                Status Promise Transaksi
              </div>
              <div className="text-sm font-bold mt-0.5">
                {isResolved ? 'RESOLVED — Berhasil Dikomit' : 'REJECTED — Transaksi Gagal / Ditolak'}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 ${
            isResolved ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
          }`}>
            {result.promiseStatus}
          </span>
        </div>

        {/* Timestamps Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Waktu Operasi Terpisah:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Waktu Pemeriksaan Auth/Claims:</span>
              <span className="font-mono font-bold text-slate-800 break-all">{result.checkTimestamp}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Waktu Selesai Transaksi Server:</span>
              <span className="font-mono font-bold text-slate-800 break-all">{result.transactionTimestamp || '-'}</span>
            </div>
          </div>
        </div>

        {/* Admin Identity & Allowlist Match Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Identitas Admin Auth Runtime:</span>
          </div>
          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-slate-500">UID Admin Saat Ini:</span>
              <span className="font-mono font-black text-slate-900 text-[11px] break-all">{result.adminUid}</span>
            </div>
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
              <span className="text-slate-500">Kecocokan Allowlist Rules:</span>
              {result.isAllowlistedUid ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>COCOK (Allowlisted UID)</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                  <span>TIDAK COCOK</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Custom Claims Inspection Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Hasil Custom Claims (Token Result):</span>
            {result.claimsCheckFailed ? (
              <span className="text-rose-600 font-bold text-[10px]">Pemeriksaan Gagal</span>
            ) : (
              <span className="text-emerald-600 font-bold text-[10px]">Berhasil Diperiksa</span>
            )}
          </div>

          {result.claimsCheckFailed && result.claimsErrorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error Membaca Claims: </span>
                <span>{result.claimsErrorMessage}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">Claim [role]:</span>
              <span className={`font-mono font-bold mt-1 ${
                result.claims.role === 'admin' 
                  ? 'text-emerald-700' 
                  : result.claims.role === false 
                  ? 'text-rose-700' 
                  : 'text-slate-700'
              }`}>
                {formatClaimValue(result.claims.role)}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">Claim [admin]:</span>
              <span className={`font-mono font-bold mt-1 ${
                result.claims.admin === true 
                  ? 'text-emerald-700' 
                  : result.claims.admin === false 
                  ? 'text-rose-700' 
                  : 'text-slate-700'
              }`}>
                {formatClaimValue(result.claims.admin)}
              </span>
            </div>
          </div>
        </div>

        {/* Error Details Card (rendered when REJECTED) */}
        {result.errorDetails && (
          <div className="bg-rose-50/80 rounded-2xl p-3.5 border border-rose-200 space-y-2 text-xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Detail Error Asli Firestore Server:</span>
            </div>
            <div className="space-y-1.5 bg-white p-3 rounded-xl border border-rose-200 text-[11px]">
              <div>
                <span className="text-slate-400 font-medium">Error Name: </span>
                <span className="font-mono font-bold text-rose-800">{result.errorDetails.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Error Code: </span>
                <span className="font-mono font-bold text-rose-800">{result.errorDetails.code}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Error Message: </span>
                <p className="font-mono text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] leading-relaxed break-all mt-1">
                  {result.errorDetails.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handleCopyDiagnostics}
            className={`py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 active:scale-95 shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-900 hover:bg-blue-950 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Diagnostik</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold rounded-xl text-xs transition active:scale-95"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
