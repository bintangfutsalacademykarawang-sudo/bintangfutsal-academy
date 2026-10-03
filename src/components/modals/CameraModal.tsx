import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, CheckCircle2, RotateCcw, Image, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  target: 'photo' | 'kk' | 'akte' | 'kia' | 'ijazah' | null;
  onClose: () => void;
  onCapture: (dataUrl: string, target: 'photo' | 'kk' | 'akte' | 'kia' | 'ijazah') => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  target,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [statusText, setStatusText] = useState('Menghubungkan ke kamera...');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);

  // Initialize or restart camera stream
  useEffect(() => {
    let localStream: MediaStream | null = null;

    if (isOpen && !capturedPreview) {
      setCameraError(false);
      setStatusText('Menghubungkan ke kamera...');

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: { 
              facingMode: { ideal: facingMode }, 
              width: { ideal: 1280 }, 
              height: { ideal: 720 } 
            },
            audio: false,
          })
          .then((s) => {
            localStream = s;
            setStream(s);
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.setAttribute('playsinline', 'true');
              videoRef.current.setAttribute('webkit-playsinline', 'true');
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
            setStatusText(facingMode === 'user' ? '🟢 Kamera Depan Aktif' : '🟢 Kamera Belakang Aktif');
          })
          .catch((err) => {
            console.warn('Camera access unavailable:', err);
            setCameraError(true);
            setStatusText('Kamera tidak dapat diakses langsung. Silakan gunakan tombol Ambil dari Kamera HP di bawah.');
          });
      } else {
        setCameraError(true);
        setStatusText('Browser tidak mendukung WebRTC camera langsung.');
      }
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, capturedPreview]);

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCapturedPreview(null);
    setCameraError(false);
    onClose();
  };

  const handleFlipCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleTakeSnapshot = () => {
    if (!target) return;

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // If front camera, mirror image for natural selfie feel
        if (facingMode === 'user') {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Show preview first before confirming
        setCapturedPreview(dataUrl);

        // Stop live stream while reviewing photo
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          setStream(null);
        }
      }
    }
  };

  // Confirm and apply the captured photo
  const handleConfirmPhoto = () => {
    if (capturedPreview && target) {
      onCapture(capturedPreview, target);
      handleClose();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPreview(null);
  };

  // Direct native mobile camera capture
  const handleNativeMobileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && target) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setCapturedPreview(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const targetTitle = target === 'photo' 
    ? 'Foto Profil Siswa' 
    : `Dokumen ${target?.toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative border border-slate-200 my-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition z-10"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Ambil {targetTitle}
            </h3>
            <p className="text-xs text-slate-500">
              Posisikan subjek di tengah frame lalu klik tombol Ambil Foto.
            </p>
          </div>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div className="mt-3 relative w-full aspect-4/3 sm:aspect-video bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-300 flex items-center justify-center shadow-inner">
          {capturedPreview ? (
            // REVIEW PHOTO STATE
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPreview}
                alt="Hasil Foto"
                className="w-full h-full object-contain"
              />
              <span className="absolute top-3 left-3 bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Foto Berhasil Diambil</span>
              </span>
            </div>
          ) : (
            // LIVE WEBCAM VIEWFINDER
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Target Guidelines Overlay */}
              <div className="absolute inset-0 border-2 border-dashed border-amber-400/70 pointer-events-none rounded-2xl m-4 flex items-center justify-center">
                {target === 'photo' && (
                  <div className="w-36 h-48 border-2 border-amber-300/60 rounded-full pointer-events-none" />
                )}
              </div>

              {/* Camera Switch Button */}
              <button
                type="button"
                onClick={handleFlipCamera}
                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-xl border border-white/20 shadow-md backdrop-blur-xs transition active:scale-95 text-xs flex items-center gap-1.5"
                title="Ganti Kamera Depan / Belakang"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] font-bold">Putar</span>
              </button>
            </>
          )}
        </div>

        {/* Native Camera input fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture={facingMode}
          className="hidden"
          onChange={handleNativeMobileCapture}
        />

        {/* Status text or Camera Error Alert */}
        {cameraError && !capturedPreview && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Akses Kamera Langsung Terbatas</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Gunakan tombol "Buka Kamera HP" di bawah untuk memotret menggunakan aplikasi kamera bawaan ponsel Anda.
              </p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-4">
          {capturedPreview ? (
            // REVIEW CONTROLS
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>Foto Ulang</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Gunakan Foto Ini</span>
              </button>
            </div>
          ) : (
            // CAPTURE CONTROLS
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500 font-mono">{statusText}</span>
                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-orange-500/25 active:scale-95 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto</span>
                </button>
              </div>

              {/* Secondary fallback button for direct mobile camera */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-blue-700 border border-slate-200 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Image className="w-3.5 h-3.5" />
                <span>Atau Buka Kamera Bawaan HP / Unggah Foto</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
