import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Check,
  SwitchCamera,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import jsQR from 'jsqr';

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
  
  // Camera States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const isCooldownRef = useRef(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  }, []);

  // Cleanup on unmount or close
  useEffect(() => {
    if (isOpen) {
      setBarcodeInput('');
      setScannedStudent(null);
      setScanSuccessAnim(false);
      setCameraError(null);
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 150);
    } else {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // Robust Camera Starter with progressive fallbacks for Android/iOS
  const startCamera = async (targetFacing: 'environment' | 'user' = facingMode) => {
    setIsStartingCamera(true);
    setCameraError(null);
    stopCamera();

    let stream: MediaStream | null = null;

    // Attempt 1: Ideal facingMode and resolution
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1) {
      console.warn('Attempt 1 failed, trying fallback constraints...', err1);
      // Attempt 2: Simple facingMode without resolution constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing },
          audio: false,
        });
      } catch (err2) {
        console.warn('Attempt 2 failed, trying generic video...', err2);
        // Attempt 3: Any video device available
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err3: any) {
          console.error('All camera attempts failed:', err3);
          const errorMsg =
            err3?.name === 'NotAllowedError' || err3?.name === 'PermissionDeniedError'
              ? 'Izin kamera ditolak. Silakan izinkan akses kamera pada ikon gembok 🔒 di URL browser.'
              : err3?.name === 'NotFoundError' || err3?.name === 'DevicesNotFoundError'
              ? 'Kamera tidak ditemukan pada perangkat ini.'
              : 'Gagal membuka kamera: pastikan izin kamera aktif dan tidak sedang digunakan aplikasi lain.';
          setCameraError(errorMsg);
          setIsStartingCamera(false);
          setIsCameraActive(false);
          return;
        }
      }
    }

    if (stream) {
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play caught error:', playErr);
        }
      }
      setIsCameraActive(true);
      setIsStartingCamera(false);
      setFacingMode(targetFacing);
    }
  };

  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera(facingMode);
    }
  };

  const handleSwitchFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Play a pleasant verification beep audio
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {}
  };

  const triggerScanSuccess = useCallback((st: Student) => {
    if (isCooldownRef.current) return;
    isCooldownRef.current = true;

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
      isCooldownRef.current = false;
      barcodeInputRef.current?.focus();
    }, 2200);
  }, [date, onSubmit]);

  // Handle scanned raw text (from camera or barcode gun)
  const handleRawBarcodeScanned = useCallback((rawText: string) => {
    if (!rawText || isCooldownRef.current) return;
    const clean = rawText.trim().replace(/^\*|\*$/g, '').toUpperCase();
    
    // Match by ID (exact or without BFA prefix) or Name
    const found = students.find((s) => {
      const studentId = s.id.toUpperCase();
      const studentName = s.name.toUpperCase();
      return (
        studentId === clean ||
        clean.includes(studentId) ||
        studentId.replace('BFA-', '') === clean.replace('BFA-', '') ||
        studentName === clean
      );
    });

    if (found) {
      triggerScanSuccess(found);
    }
  }, [students, triggerScanSuccess]);

  // Real-time Barcode / QR Decoding Loop from Video Stream
  useEffect(() => {
    if (!isCameraActive) return;

    let animId: number;
    let isMounted = true;
    let lastDecodeTime = 0;

    // Check for native BarcodeDetector API (built-in on Android Chrome!)
    let nativeDetector: any = null;
    if ('BarcodeDetector' in window) {
      try {
        nativeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
        });
      } catch {
        nativeDetector = null;
      }
    }

    // Offscreen canvas for jsQR fallback
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

    const decodeFrame = async () => {
      if (!isMounted || !isCameraActive) return;
      const now = Date.now();

      // Run detection every 200ms to maintain smooth 60fps UI and preserve battery
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 && // HAVE_CURRENT_DATA or higher
        now - lastDecodeTime > 200 &&
        !isCooldownRef.current
      ) {
        lastDecodeTime = now;
        const video = videoRef.current;
        let detectedValue: string | null = null;

        // 1. Try Native BarcodeDetector (super fast GPU accelerated)
        if (nativeDetector) {
          try {
            const detected = await nativeDetector.detect(video);
            if (detected && detected.length > 0) {
              detectedValue = detected[0].rawValue;
            }
          } catch {}
        }

        // 2. Fallback to jsQR library
        if (!detectedValue && offscreenCtx && video.videoWidth > 0 && video.videoHeight > 0) {
          const w = Math.min(video.videoWidth, 640);
          const h = Math.min(video.videoHeight, 480);
          offscreenCanvas.width = w;
          offscreenCanvas.height = h;
          offscreenCtx.drawImage(video, 0, 0, w, h);
          const imgData = offscreenCtx.getImageData(0, 0, w, h);
          const qr = jsQR(imgData.data, w, h, { inversionAttempts: 'dontInvert' });
          if (qr && qr.data) {
            detectedValue = qr.data;
          }
        }

        if (detectedValue) {
          handleRawBarcodeScanned(detectedValue);
        }
      }

      animId = requestAnimationFrame(decodeFrame);
    };

    animId = requestAnimationFrame(decodeFrame);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
    };
  }, [isCameraActive, handleRawBarcodeScanned]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleRawBarcodeScanned(barcodeInput);
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 shadow-2xl relative text-slate-800 my-6">
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            DUAL-MODE GATE PRESENSI BFA
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            {mode === 'barcode' ? 'Pemindai Barcode / QR Siswa' : 'Simulasi Sensor Sidik Jari'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pindai barcode kartu siswa atau tempelkan sidik jari pada sensor gate.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold text-slate-600">
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
            {/* Camera Viewfinder Scanner Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-52 border-2 border-slate-300 shadow-inner flex items-center justify-center">
              {/* Always present video element to prevent black screen / unmounting race conditions */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isCameraActive ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
                }`}
              />

              {/* Viewfinder Target & Laser Line when camera is active */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="w-48 h-36 border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-300 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-300 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-300 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-300 rounded-br" />
                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_10px_#ef4444] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="absolute bottom-2 text-[10px] font-mono font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700">
                    Arahkan Barcode / QR ke Kotak Hijau
                  </span>
                </div>
              )}

              {/* Camera Controls Overlay when active */}
              {isCameraActive && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                  {/* Switch Front/Back Camera */}
                  <button
                    type="button"
                    onClick={handleSwitchFacingMode}
                    className="p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold rounded-xl border border-slate-700 shadow-xs flex items-center gap-1 backdrop-blur-xs"
                    title="Ganti Kamera Depan/Belakang"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{facingMode === 'environment' ? 'Belakang' : 'Depan'}</span>
                  </button>

                  {/* Turn off camera */}
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl shadow-xs backdrop-blur-xs"
                  >
                    Matikan
                  </button>
                </div>
              )}

              {/* Standby / Error / Starting Placeholder */}
              {!isCameraActive && (
                <div className="text-center p-4 space-y-2 z-10 max-w-sm">
                  {isStartingCamera ? (
                    <div className="space-y-2">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-white">Menghubungkan ke kamera HP...</p>
                      <p className="text-[10px] text-slate-400">Silakan izinkan akses kamera jika diminta browser.</p>
                    </div>
                  ) : cameraError ? (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <p className="text-[11px] font-bold text-rose-300 leading-tight">
                        {cameraError}
                      </p>
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Nyalakan Lagi</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Kamera scanner standby untuk scan kartu siswa otomatis
                      </p>
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-blue-500/25 active:scale-95 inline-flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Nyalakan Kamera HP / Laptop</span>
                      </button>
                    </div>
                  )}
                </div>
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
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      ✓ Tagihan sesi latihan Rp15.000 otomatis diterbitkan
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
