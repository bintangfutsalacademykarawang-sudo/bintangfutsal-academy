import React, { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [statusText, setStatusText] = useState('Menghubungkan ke kamera...');

  useEffect(() => {
    let localStream: MediaStream | null = null;

    if (isOpen) {
      setStatusText('Menghubungkan ke kamera...');
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        .then((s) => {
          localStream = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setStatusText('🟢 Kamera Aktif');
        })
        .catch((err) => {
          console.warn('Camera access unavailable:', err);
          setStatusText('Izin kamera ditolak / simulasi');
        });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    onClose();
  };

  const handleTakeSnapshot = () => {
    if (!target) return;

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl, target);
      }
    } else {
      // Fallback dummy avatar if video isn't streamed
      const fallbackUrl = 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=240&auto=format&fit=crop&q=80';
      onCapture(fallbackUrl, target);
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative border border-slate-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-700" />
          <span>Live Camera Viewfinder</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Posisikan subjek di tengah frame lalu klik tombol Ambil Foto.
        </p>

        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-300 flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 border-2 border-dashed border-orange-500/60 pointer-events-none rounded-2xl m-3" />
        </div>

        <div className="mt-4 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 font-mono">{statusText}</span>
          <button
            type="button"
            onClick={handleTakeSnapshot}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 transition"
          >
            <Camera className="w-4 h-4" />
            <span>Ambil Foto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
