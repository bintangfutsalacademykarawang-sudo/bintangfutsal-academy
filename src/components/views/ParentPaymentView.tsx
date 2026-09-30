import React, { useState, useEffect, useRef } from 'react';
import { RouteId, Student, Invoice } from '../../types';
import { 
  QrCode, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Building, 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import QRCode from 'qrcode';

interface ParentPaymentViewProps {
  student?: Student;
  invoices: Invoice[];
  onNavigate: (route: RouteId) => void;
  onPaymentSuccess: (method: string, trxId: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const ParentPaymentView: React.FC<ParentPaymentViewProps> = ({
  student,
  invoices,
  onNavigate,
  onPaymentSuccess,
  onShowToast,
}) => {
  const childName = student?.name || 'Andra';
  const childGroup = student?.classGroupId || 'U11';
  const [step, setStep] = useState<'checkout' | 'waiting' | 'success'>('checkout');
  const [selectedMethod, setSelectedMethod] = useState<'QRIS' | 'Transfer Bank'>('QRIS');
  const [lastTrxId, setLastTrxId] = useState('');

  // Dynamic invoices & amounts for active student
  const childInvoices = invoices.filter(
    (i) => (student?.id && i.studentId === student.id) || i.studentName === childName
  );
  const unpaidInvoices = childInvoices.filter((i) => i.status === 'BELUM BAYAR');
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const isAllPaid = unpaidInvoices.length === 0;

  // Session specific paid checks
  const invMonthly = childInvoices.find((i) => i.type === 'Bulanan');
  const inv5 = childInvoices.find(
    (i) => i.attendanceDate === '2026-09-05' || i.period?.includes('5 Sep')
  );
  const inv12 = childInvoices.find(
    (i) => i.attendanceDate === '2026-09-12' || i.period?.includes('12 Sep')
  );
  const inv26 = childInvoices.find(
    (i) => i.attendanceDate === '2026-09-26' || i.period?.includes('26 Sep')
  );

  const isMonthlyPaid = invMonthly ? invMonthly.status === 'LUNAS' : isAllPaid;
  const is5Paid = inv5 ? inv5.status === 'LUNAS' : isAllPaid;
  const is12Paid = inv12 ? inv12.status === 'LUNAS' : isAllPaid;
  const is26Paid = inv26 ? inv26.status === 'LUNAS' : isAllPaid;

  // Copy state feedbacks
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // QRIS Barcode Data URL
  const [qrisDataUrl, setQrisDataUrl] = useState<string>('');
  const qrisCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Standard QRIS EMV Payload for NMID: ID1026580229536, BFA Karawang, A01
  const QRIS_NMID = 'ID1026580229536';
  const QRIS_MERCHANT = 'BFA Karawang';
  const QRIS_TERMINAL = 'A01';
  const QRIS_PRINTED_BY = '93600915';
  const QRIS_VERSION = '1.0.30.09.26';

  const BCA_ACCOUNT_NO = '5270878115';
  const BCA_ACCOUNT_HOLDER = 'EDY SUNARSO';
  const BILL_AMOUNT = totalUnpaidAmount;

  useEffect(() => {
    // Generate crisp QR code matching official Indonesian QRIS standard
    const qrisPayload = `00020101021126600014ID.GO.ID102658022953601189360091510265802295360215ID10265802295360303A0151440014ID.LINKAJA.WWW01189360091510265802295360215ID10265802295360303A015204581253033605802ID5912BFA Karawang6008Karawang61054137162070703A016304`;
    QRCode.toDataURL(qrisPayload, {
      width: 400,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrisDataUrl(url))
      .catch((err) => console.error('Failed to generate QRIS:', err));
  }, []);

  const handleCopy = (text: string, type: 'account' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
      onShowToast?.(`✓ Nomor rekening BCA (${text}) berhasil disalin!`, 'success');
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2500);
      onShowToast?.(`✓ Nominal Rp${BILL_AMOUNT.toLocaleString('id-ID')} berhasil disalin!`, 'success');
    }
  };

  const handleDownloadQRIS = () => {
    if (!qrisDataUrl) return;
    const link = document.createElement('a');
    link.download = `QRIS_BFA_Karawang_${QRIS_NMID}.png`;
    link.href = qrisDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast?.('✓ Gambar barcode QRIS berhasil diunduh ke galeri!', 'success');
  };

  const handleSimulateSuccess = () => {
    const trx = `BFA-TRX-20260912-${Math.floor(100 + Math.random() * 900)}`;
    setLastTrxId(trx);
    setStep('success');
    onPaymentSuccess(selectedMethod, trx);
  };

  // STEP 1: CHECKOUT & PAYMENT METHOD SELECTOR
  if (step === 'checkout') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <button onClick={() => onNavigate('parent-dashboard')} className="hover:text-blue-700">
            Dashboard
          </button>
          <span>/</span>
          <span className="text-slate-900 font-bold">Pembayaran Tagihan</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Rincian Tagihan Belum Dibayar
            </h2>
            <p className="text-xs text-slate-500">Siswa: {childName} (Kelompok {childGroup})</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            {/* 1. Iuran SPP Bulanan */}
            <div className="flex justify-between items-center">
              <span className={isMonthlyPaid ? 'text-slate-600' : 'font-bold text-slate-900'}>
                Iuran Akademi (SPP September 2026)
              </span>
              <span className={`font-mono font-bold ${isMonthlyPaid ? 'text-emerald-700' : 'text-orange-600'}`}>
                Rp50.000 {isMonthlyPaid ? '(Lunas ✓)' : ''}
              </span>
            </div>

            {/* 2. Sesi 5 Sep */}
            <div className="flex justify-between items-center">
              <span className={is5Paid ? 'text-slate-600' : 'font-bold text-slate-900'}>
                Latihan 5 Sep (Kehadiran Tap)
              </span>
              <span className={`font-mono font-bold ${is5Paid ? 'text-emerald-700' : 'text-orange-600'}`}>
                Rp15.000 {is5Paid ? '(Lunas ✓)' : ''}
              </span>
            </div>

            {/* 3. Sesi 12 Sep */}
            <div className="flex justify-between items-center">
              <span className={is12Paid ? 'text-slate-600' : 'font-bold text-slate-900'}>
                Latihan 12 Sep (Kehadiran Tap)
              </span>
              <span className={`font-mono font-bold ${is12Paid ? 'text-emerald-700' : 'text-orange-600'}`}>
                Rp15.000 {is12Paid ? '(Lunas ✓)' : ''}
              </span>
            </div>

            {/* 4. Sesi 19 Sep (Tidak Hadir) */}
            <div className="flex justify-between items-center text-slate-400">
              <span>Latihan 19 Sep (Tidak Hadir)</span>
              <span className="font-mono text-emerald-700 font-semibold">Rp0 (Bebas Iuran ✓)</span>
            </div>

            {/* 5. Sesi 26 Sep */}
            <div className="flex justify-between items-center">
              <span className={is26Paid ? 'text-slate-600' : 'font-bold text-slate-900'}>
                Latihan 26 Sep (Kehadiran Tap)
              </span>
              <span className={`font-mono font-bold ${is26Paid ? 'text-emerald-700' : 'text-orange-600'}`}>
                Rp15.000 {is26Paid ? '(Lunas ✓)' : ''}
              </span>
            </div>

            <div className="pt-2.5 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
              <span>Total yang Harus Dibayar:</span>
              <span className={`font-mono text-base font-black ${isAllPaid ? 'text-emerald-600' : 'text-orange-600'}`}>
                Rp{totalUnpaidAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Conditional UI: If all paid vs when there are unpaid bills */}
          {isAllPaid ? (
            <div className="space-y-3.5 pt-1">
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-black text-xs text-emerald-950">Semua Tagihan Sudah Lunas ✓</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    Tidak ada tunggakan iuran untuk ananda <strong>{childName}</strong>. Seluruh tagihan akademi & latihan telah berstatus Lunas.
                  </p>
                </div>
              </div>

              {/* Disabled button cannot proceed */}
              <button
                type="button"
                disabled
                className="w-full py-3.5 bg-slate-100 text-slate-400 font-black rounded-xl text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center space-x-2 border border-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SEMUA TAGIHAN TELAH LUNAS</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('parent-dashboard')}
                className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs transition border border-blue-200 flex items-center justify-center space-x-1.5"
              >
                <span>Kembali ke Dashboard Orang Tua</span>
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Pilihan Kanal Pembayaran Resmi BFA:
                </label>
                <div className="space-y-2 text-xs">
                  {[
                    {
                      id: 'QRIS' as const,
                      label: 'QRIS Standar Pembayaran Nasional',
                      desc: 'BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay',
                      badge: 'Instan & Otomatis',
                      icon: QrCode,
                    },
                    {
                      id: 'Transfer Bank' as const,
                      label: 'Transfer Bank BFA Manual',
                      desc: `Bank BCA: ${BCA_ACCOUNT_NO} a.n ${BCA_ACCOUNT_HOLDER}`,
                      badge: 'BCA Manual',
                      icon: Building,
                    },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = selectedMethod === m.id;
                    return (
                      <label
                        key={m.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <input
                            type="radio"
                            name="payOption"
                            value={m.id}
                            checked={isSelected}
                            onChange={() => setSelectedMethod(m.id)}
                            className="accent-blue-600 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-extrabold text-slate-900 text-xs">{m.label}</p>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {m.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-blue-700 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('waiting')}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs shadow-md shadow-orange-500/20 transition uppercase tracking-wider active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>LANJUTKAN PEMBAYARAN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // STEP 2: WAITING PAYMENT (QRIS CARD OR BCA MANUAL TRANSFER)
  if (step === 'waiting') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          
          {/* Header Status */}
          <div className="text-center space-y-1">
            <div className="w-11 h-11 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Menunggu Pembayaran
            </h2>
            <p className="text-xs text-slate-500">
              Total Tagihan Siswa: <strong className="text-orange-600 font-mono text-sm">Rp{totalUnpaidAmount.toLocaleString('id-ID')}</strong>
            </p>
          </div>

          {/* VIEW A: OFFICIAL INDONESIAN QRIS CARD */}
          {selectedMethod === 'QRIS' && (
            <div className="space-y-3">
              {/* The National Standard QRIS Card */}
              <div className="relative bg-white rounded-2xl border-2 border-slate-300 shadow-md p-4 sm:p-5 overflow-hidden text-slate-900 max-w-sm mx-auto">
                {/* Red Top-Left Geometric Triangle Banner */}
                <div 
                  className="absolute top-0 left-0 w-28 h-28 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 50%, transparent 50%)',
                  }}
                />

                {/* Red Bottom-Right Geometric Triangle Banner */}
                <div 
                  className="absolute bottom-0 right-0 w-36 h-36 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, transparent 50%, #dc2626 50%)',
                  }}
                />

                {/* QRIS Top Header: Official QRIS Logo & GPN Logo */}
                <div className="flex items-start justify-between relative z-10 pt-1 pb-2">
                  <div className="pl-6">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-black text-xl tracking-tight text-slate-900 font-sans">
                        QRIS
                      </span>
                    </div>
                    <p className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tighter -mt-0.5">
                      QR Code Standar Pembayaran Nasional
                    </p>
                  </div>

                  {/* GPN Emblem */}
                  <div className="flex items-center space-x-1 text-right">
                    <div>
                      <span className="font-black text-base tracking-wider text-slate-900 block leading-none">
                        GPN
                      </span>
                    </div>
                    {/* Red Bird Logo Symbol */}
                    <div className="w-5 h-5 flex items-center justify-center text-red-600">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Merchant Name & Details */}
                <div className="text-center pt-2 pb-1 relative z-10">
                  <h3 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-wide">
                    {QRIS_MERCHANT}
                  </h3>
                  <p className="text-[11px] font-extrabold font-mono text-slate-800 tracking-wider">
                    NMID : {QRIS_NMID}
                  </p>
                  <p className="text-[10px] font-black font-mono text-slate-700">
                    {QRIS_TERMINAL}
                  </p>
                </div>

                {/* High Resolution Barcode Canvas / Image */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 my-2 flex justify-center items-center relative z-10 shadow-2xs">
                  {qrisDataUrl ? (
                    <img
                      src={qrisDataUrl}
                      alt="QRIS Barcode BFA Karawang"
                      className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                      <Clock className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Slogan & Verification Link */}
                <div className="text-center pt-1 pb-2 relative z-10">
                  <p className="text-[11px] font-black text-slate-900 tracking-widest uppercase">
                    SATU QRIS UNTUK SEMUA
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5">
                    Cek aplikasi penyelenggara di: <span className="font-semibold underline">www.aspi-qris.id</span>
                  </p>
                </div>

                {/* Bottom Footer Info */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-700 relative z-10">
                  <div>
                    <p>Dicetak oleh: <span className="font-mono font-bold">{QRIS_PRINTED_BY}</span></p>
                    <p>Versi cetak: <span className="font-mono font-bold">{QRIS_VERSION}</span></p>
                  </div>
                  <div className="text-right pr-6">
                    <p className="font-extrabold text-slate-900">Buka Aplikasi Berlogo QRIS</p>
                    <p className="text-slate-600">Scan dan Cek • Bayar</p>
                  </div>
                </div>
              </div>

              {/* Action: Download QRIS Image to mobile gallery */}
              <div className="flex gap-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleDownloadQRIS}
                  className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 flex items-center justify-center space-x-1.5 transition active:scale-95 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>Simpan Barcode ke Galeri</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 text-center max-w-sm mx-auto">
                Buka m-Banking (BCA, Mandiri, BRI, BNI) atau e-Wallet (GoPay, OVO, Dana, ShopeePay), lalu arahkan kamera ke barcode di atas atau upload dari galeri foto.
              </div>
            </div>
          )}

          {/* VIEW B: MANUAL BANK TRANSFER (BCA: 5270878115 a.n EDY SUNARSO) */}
          {selectedMethod === 'Transfer Bank' && (
            <div className="space-y-4 max-w-sm mx-auto text-left">
              <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-5 border border-blue-800 shadow-md space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-amber-400" />
                    <span className="font-black text-sm tracking-wider uppercase">
                      BANK BCA
                    </span>
                  </div>
                  <span className="bg-blue-800/80 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-700">
                    Rekening Resmi BFA
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    NOMOR REKENING BCA:
                  </span>
                  <div className="flex items-center justify-between bg-blue-950/80 p-2.5 rounded-xl border border-blue-800">
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-amber-300">
                      {BCA_ACCOUNT_NO}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(BCA_ACCOUNT_NO, 'account')}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-blue-950 rounded-lg text-xs font-black flex items-center space-x-1 shadow-xs transition active:scale-95"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAccount ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs border-t border-blue-800/70">
                  <div>
                    <span className="text-[10px] text-slate-400 block">ATAS NAMA PENERIMA:</span>
                    <span className="font-black text-white text-sm tracking-wide">
                      {BCA_ACCOUNT_HOLDER}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">NOMINAL TRANSFER:</span>
                    <div className="flex items-center space-x-1 justify-end">
                      <span className="font-black font-mono text-cyan-300 text-sm">
                        Rp{BILL_AMOUNT.toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(BILL_AMOUNT), 'amount')}
                        className="p-1 hover:text-amber-300 transition"
                        title="Salin Nominal"
                      >
                        {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panduan Pembayaran BCA */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Petunjuk Transfer Bank BCA:</span>
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>Buka aplikasi <strong>BCA Mobile / myBCA / ATM BCA</strong>.</li>
                  <li>Pilih menu <strong>m-Transfer &gt; Antar Rekening BCA</strong>.</li>
                  <li>Masukkan nomor rekening: <strong className="text-blue-900 font-mono">{BCA_ACCOUNT_NO}</strong>.</li>
                  <li>Pastikan nama penerima adalah: <strong className="text-blue-900">{BCA_ACCOUNT_HOLDER}</strong>.</li>
                  <li>Ketik nominal transfer tepat: <strong className="text-orange-600 font-mono">Rp{BILL_AMOUNT.toLocaleString('id-ID')}</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Verification Trigger Button */}
          <div className="pt-2 space-y-2 max-w-sm mx-auto">
            <button
              onClick={handleSimulateSuccess}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SAYA SUDAH BAYAR (VERIFIKASI SEKARANG)</span>
            </button>

            <button
              onClick={() => setStep('checkout')}
              className="w-full py-2 bg-transparent hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition"
            >
              Ubah Metode Pembayaran
            </button>
          </div>

        </div>
      </div>
    );
  }

  // STEP 3: PAYMENT VERIFIED & SUCCESS
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            ✓ Pembayaran Berhasil Diverifikasi!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Status tagihan siswa telah otomatis diubah menjadi{' '}
            <strong className="text-emerald-700">LUNAS</strong> dan tercatat resmi di buku kas akademi.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 text-left border border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-500">Nomor Transaksi:</span>
            <span className="font-mono font-bold text-slate-900">{lastTrxId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Nama Siswa:</span>
            <span className="font-bold text-slate-900">{childName} (Kelompok {childGroup})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jumlah Bayar:</span>
            <span className="font-black text-emerald-700 font-mono">Rp{totalUnpaidAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Kanal Pembayaran:</span>
            <span className="font-bold text-slate-900">
              {selectedMethod === 'QRIS' ? 'QRIS Standar Nasional (BFA Karawang)' : `Transfer Bank BCA (${BCA_ACCOUNT_HOLDER})`}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('parent-payments')}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-300 transition active:scale-95"
          >
            Riwayat Pembayaran
          </button>
          <button
            onClick={() => onNavigate('parent-dashboard')}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition active:scale-95"
          >
            Ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
