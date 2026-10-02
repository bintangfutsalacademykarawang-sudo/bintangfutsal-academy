import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, Check, RefreshCw, Sparkles, User, Image as ImageIcon } from 'lucide-react';

interface ChangePhotoModalProps {
  isOpen: boolean;
  studentName: string;
  currentAvatar?: string;
  onClose: () => void;
  onSave: (photoUrl: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=320&auto=format&fit=crop&q=80',
];

export const ChangePhotoModal: React.FC<ChangePhotoModalProps> = ({
  isOpen,
  studentName,
  currentAvatar,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatar || '');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentAvatar || '');
      setActiveTab('upload');
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, currentAvatar]);

  // Clean up camera stream when closing or switching away
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan opsi unggah foto.');
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - minDim) / 2;
      const sy = (video.videoHeight - minDim) / 2;
      ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewUrl(dataUrl);
      stopCamera();
      setActiveTab('upload');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize & resize to square 400x400 to prevent large payload
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 400, 400);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewUrl(optimizedDataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (previewUrl) {
      onSave(previewUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl relative border border-slate-200 my-8">
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

        <div className="text-center mb-5">
          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            Foto Profil Siswa BFA
          </span>
          <h2 className="text-lg font-black text-slate-900">Ubah Foto Profil Ananda</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbarui foto ananda <strong className="text-blue-900">{studentName}</strong> untuk ditampilkan di Dashboard Orang Tua & Kartu Siswa.
          </p>
        </div>

        {/* Live Preview Avatar */}
        <div className="flex flex-col items-center justify-center mb-5">
          <div className="relative group">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-3 border-blue-600 shadow-md ring-4 ring-blue-100 bg-slate-100 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>
            {previewUrl && (
              <span className="absolute -bottom-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white shadow-xs">
                Pratinjau
              </span>
            )}
          </div>
        </div>

        {/* Tabs: Upload / Camera / Presets */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'upload'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Galeri/File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'camera'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'presets'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Pilihan BFA</span>
          </button>
        </div>

        {/* Tab 1: Upload File */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-5 text-center cursor-pointer transition space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">Klik untuk Pilih Foto dari Perangkat</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Mendukung format JPG, PNG, atau WEBP</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Camera */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center text-xs text-rose-800 space-y-2">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px]"
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-[260px] mx-auto border-2 border-slate-300">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 transition active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500 font-semibold text-center mb-2">
              Pilih salah satu karakter atlet BFA di bawah:
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPreviewUrl(url)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition ${
                    previewUrl === url
                      ? 'border-blue-600 ring-2 ring-blue-300 scale-102 shadow-xs'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                  {previewUrl === url && (
                    <span className="absolute top-1 right-1 bg-blue-600 text-white p-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!previewUrl}
            className={`w-full py-2.5 rounded-xl text-xs font-black transition shadow-md ${
              previewUrl
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Simpan Foto
          </button>
        </div>
      </div>
    </div>
  );
};
