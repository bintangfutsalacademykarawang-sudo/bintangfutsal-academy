import React, { useState, useRef, useEffect } from 'react';
import { Student, TrainingSchedule } from '../../types';
import { 
  X, 
  Fingerprint, 
  QrCode, 
  Camera, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Scan, 
  Sparkles, 
  Volume2, 
  User, 
  Search,
  Check
} from 'lucide-react';

interface FingerprintModalProps {
  isOpen: boolean;
  students: Student[];
  schedules?: TrainingSchedule[];
  initialScheduleId?: string;
  onClose: () => void;
  onSubmit: (studentId: string, date: string, time: string, status: 'HADIR' | 'TIDAK_HADIR') => void;
}

export const FingerprintModal: React.FC<FingerprintModalProps> = ({
  isOpen,
  students,
  schedules = [],
  initialScheduleId,
  onClose,
  onSubmit,
}) => {
  const [mode, setMode] = useState<'barcode' | 'fingerprint'>('barcode');
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialScheduleId || (schedules[0]?.id || ''));
  const activeSchedule = schedules.find((s) => s.id === selectedScheduleId);

  const [date, setDate] = useState(() => activeSchedule?.date || '2026-10-02');
  const [time, setTime] = useState(() => activeSchedule?.startTime || '14:02:15');
  const [status, setStatus] = useState<'HADIR' | 'TIDAK_HADIR'>('HADIR');

  const filteredStudents = activeSchedule
    ? students.filter((s) => s.classGroupId === activeSchedule.classGroupId)
    : students;

  const [selectedStudentId, setSelectedStudentId] = useState(
    () => (filteredStudents[0]?.id || students[0]?.id || 'BFA-001')
  );

  // Barcode Gun / Manual Input State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [scanSuccessAnim, setScanSuccessAnim] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcodeInput('');
      setScannedStudent(null);
      setScanSuccessAnim(false);
      // Automatically focus barcode input when in barcode mode
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 150);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (e) {
      console.warn('Camera access for barcode scanner unavailable:', e);
      setIsCameraActive(false);
    }
  };

  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Play a pleasant recognition beep audio
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {}
  };

  const triggerScanSuccess = (st: Student) => {
    playBeep();
    setScannedStudent(st);
    setScanSuccessAnim(true);
    
    // Auto-record attendance for scanned student
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    onSubmit(st.id, date, currentTimeStr, 'HADIR');

    setTimeout(() => {
      setScanSuccessAnim(false);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    }, 1800);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toUpperCase();
    if (!query) return;

    // Match either by student ID (e.g. BFA-001) or exact name
    const found = students.find(
      (s) => s.id.toUpperCase() === query || s.name.toUpperCase() === query
    );

    if (found) {
      triggerScanSuccess(found);
    } else {
      // If not exact match, check partial
      const partial = students.find((s) => s.name.toUpperCase().includes(query) || s.id.includes(query));
      if (partial) {
        triggerScanSuccess(partial);
      }
    }
  };

  const handleScheduleChange = (schId: string) => {
    setSelectedScheduleId(schId);
    const found = schedules.find((s) => s.id === schId);
    if (found) {
      setDate(found.date);
      setTime(`${found.startTime}:05`);
      const matchedStudents = students.filter((s) => s.classGroupId === found.classGroupId);
      if (matchedStudents.length > 0) {
        setSelectedStudentId(matchedStudents[0].id);
      }
    }
  };

  const handleFingerprintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playBeep();
    onSubmit(selectedStudentId, date, time, status);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative text-slate-800 my-8">
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            DUAL-MODE GATE PRESENSI BFA
          </span>
          <h2 className="text-lg font-black text-slate-900">
            {mode === 'barcode' ? 'Pemindai Barcode / QR Siswa' : 'Simulasi Sensor Sidik Jari'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pindai barcode kartu siswa atau tempelkan sidik jari pada sensor gate.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode('barcode');
              setTimeout(() => barcodeInputRef.current?.focus(), 100);
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
              mode === 'barcode'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Mode Barcode & QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setMode('fingerprint');
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
              mode === 'fingerprint'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'hover:text-slate-900'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Mode Sidik Jari</span>
          </button>
        </div>

        {/* Schedule Selector */}
        {schedules.length > 0 && (
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl mb-4 text-xs">
            <label className="block text-[11px] font-bold text-blue-900 mb-1">
              Hubungkan ke Sesi Latihan:
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => handleScheduleChange(e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {schedules.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.classGroupId} - {sch.dayName} ({sch.startTime}-{sch.endTime} WIB)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ---------------- MODE 1: BARCODE & QR SCANNER ---------------- */}
        {mode === 'barcode' && (
          <div className="space-y-4">
            {/* Camera Viewfinder Scanner */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-48 border-2 border-slate-300 shadow-inner flex items-center justify-center">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Kamera scanner standby atau gunakan scanner gun fisik / klik siswa di bawah
                  </p>
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Nyalakan Kamera HP/Laptop
                  </button>
                </div>
              )}

              {/* Viewfinder Target & Laser Line */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-32 border-2 border-emerald-400 rounded-xl relative">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-300" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-300" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-300" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-300" />
                    {/* Laser line animation */}
                    <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Turn Off Camera overlay button */}
              {isCameraActive && (
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold rounded-lg border border-slate-700 backdrop-blur-xs"
                >
                  Matikan Kamera
                </button>
              )}
            </div>

            {/* Scan Success Popup Banner */}
            {scannedStudent && (
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-300 ${
                  scanSuccessAnim
                    ? 'bg-emerald-50 border-emerald-300 scale-102 shadow-md'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 border border-emerald-400 shrink-0">
                    {scannedStudent.avatar ? (
                      <img
                        src={scannedStudent.avatar}
                        alt={scannedStudent.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400 m-3" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-900 text-xs uppercase">
                        {scannedStudent.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                        {scannedStudent.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Presensi HADIR Berhasil Dicatat!</span>
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 font-bold">
                  {scannedStudent.classGroupId}
                </span>
              </div>
            )}

            {/* Barcode Gun / Manual Input */}
            <form onSubmit={handleBarcodeSubmit} className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Pindai Barcode (Scanner Gun USB / Ketik ID Siswa):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Contoh: BFA-001 (lalu tekan Enter)"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  <Scan className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition"
                >
                  Pindai
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                *Scanner gun barcode kasir USB akan otomatis memindai dan menekan Enter.
              </p>
            </form>

            {/* Quick Tap Simulation for Testing */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 block mb-2">
                Atau Klik Langsung Kartu Barcode Siswa untuk Simulasi Scan:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {filteredStudents.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => triggerScanSuccess(st)}
                    className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition flex items-center gap-2 group active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                      {st.avatar ? (
                        <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400 m-2" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-black text-slate-900 truncate group-hover:text-blue-900">
                        {st.name}
                      </p>
                      <p className="text-[9px] font-mono text-slate-500">
                        {st.id} • {st.classGroupId}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- MODE 2: FINGERPRINT SENSOR ---------------- */}
        {mode === 'fingerprint' && (
          <form onSubmit={handleFingerprintSubmit} className="space-y-4">
            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Fingerprint className="w-8 h-8" />
              </div>
              <p className="text-xs font-black text-slate-900">Sensor Biometrik Siap</p>
              <p className="text-[11px] text-slate-500">Pilih nama siswa untuk simulasi tap sidik jari</p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Pilih Siswa:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {filteredStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.id}) - {st.classGroupId} - Posisi: {st.position}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Tanggal:</label>
                <div className="relative mt-1">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Waktu Tap:</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Status Kehadiran:</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setStatus('HADIR')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    status === 'HADIR'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>HADIR (Iuran Sesi)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('TIDAK_HADIR')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    status === 'TIDAK_HADIR'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  TIDAK HADIR
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md shadow-blue-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Fingerprint className="w-4 h-4" />
                <span>TAP SENSOR BIOMETRIK SEKARANG</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-slate-600">
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audio & Visual Verifier Aktif</span>
          </span>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-600 hover:text-slate-900 font-bold"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
