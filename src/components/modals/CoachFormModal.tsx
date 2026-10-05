import React, { useState, useEffect, useRef } from 'react';
import { Coach } from '../../types/coach';
import { 
  X, 
  User, 
  Phone, 
  Image as ImageIcon, 
  Award, 
  ShieldAlert, 
  Check, 
  Camera, 
  Upload, 
  Trash2, 
  FileBadge,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

interface CoachFormModalProps {
  isOpen: boolean;
  coachToEdit?: Coach | null;
  existingCoachesCount: number;
  onClose: () => void;
  onSubmit: (coachData: Coach) => void;
  isReadOnlyPreview?: boolean;
}

const AVAILABLE_KUS = [
  'U-6', 'U-8', 'U-10', 'U-11', 'U-12', 'U-13', 'U-14', 'U-15', 'U-17', 'U-20'
];

const PRESET_LICENSES = [
  'Lisensi D Nasional',
  'Lisensi C AFC / PSSI',
  'Lisensi B AFC / PSSI',
  'Lisensi A AFC / PSSI',
  'Sertifikasi Futsal Level 1 AFC / Nasional',
  'Sertifikasi Futsal Level 2 AFC',
  'Belum Berlisensi / Grassroots',
  'Lainnya',
];

export const CoachFormModal: React.FC<CoachFormModalProps> = ({
  isOpen,
  coachToEdit,
  existingCoachesCount,
  onClose,
  onSubmit,
  isReadOnlyPreview = false,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCompressionInfo, setPhotoCompressionInfo] = useState('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isManualUrlMode, setIsManualUrlMode] = useState(false);
  
  const [specialization, setSpecialization] = useState('Pelatih Kepala');
  const [selectedKUs, setSelectedKUs] = useState<string[]>(['U-10']);
  const [status, setStatus] = useState<'Aktif' | 'Non-Aktif'>('Aktif');

  // License states
  const [selectedLicensePreset, setSelectedLicensePreset] = useState('');
  const [customLicense, setCustomLicense] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseYear, setLicenseYear] = useState('');

  const [formError, setFormError] = useState('');

  // File input refs for Mobile Camera and Gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (coachToEdit) {
      setName(coachToEdit.name || '');
      setPhone(coachToEdit.phone || '');
      setPhotoUrl(coachToEdit.photoUrl || '');
      setSpecialization(coachToEdit.specialization || 'Pelatih Kepala');
      setSelectedKUs(
        coachToEdit.classGroups && coachToEdit.classGroups.length > 0 
          ? coachToEdit.classGroups 
          : ['U-10']
      );
      setStatus(coachToEdit.status || 'Aktif');

      // Populate license safely (backward-compatible)
      const existingLicense = coachToEdit.license || '';
      if (!existingLicense) {
        setSelectedLicensePreset('');
        setCustomLicense('');
      } else if (PRESET_LICENSES.filter((l) => l !== 'Lainnya').includes(existingLicense)) {
        setSelectedLicensePreset(existingLicense);
        setCustomLicense('');
      } else {
        setSelectedLicensePreset('Lainnya');
        setCustomLicense(existingLicense);
      }

      setLicenseNumber(coachToEdit.licenseNumber || '');
      setLicenseYear(coachToEdit.licenseYear || '');
      setIsManualUrlMode(Boolean(coachToEdit.photoUrl && coachToEdit.photoUrl.startsWith('http')));
    } else {
      setName('');
      setPhone('');
      setPhotoUrl('');
      setSpecialization('Pelatih Kepala');
      setSelectedKUs(['U-10']);
      setStatus('Aktif');
      setSelectedLicensePreset('');
      setCustomLicense('');
      setLicenseNumber('');
      setLicenseYear('');
      setIsManualUrlMode(false);
    }
    setPhotoCompressionInfo('');
    setFormError('');
  }, [coachToEdit, isOpen]);

  if (!isOpen) return null;

  const generatedId = coachToEdit
    ? coachToEdit.id
    : `COACH-${String(existingCoachesCount + 1).padStart(3, '0')}`;

  const toggleKU = (ku: string) => {
    if (selectedKUs.includes(ku)) {
      if (selectedKUs.length === 1) return; // minimal 1 KU
      setSelectedKUs(selectedKUs.filter((k) => k !== ku));
    } else {
      setSelectedKUs([...selectedKUs, ku]);
    }
  };

  // Process image from Camera or Gallery with client-side Canvas compression
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting same file works
    e.target.value = '';

    setIsCompressingPhoto(true);
    setFormError('');

    try {
      const result = await compressImage(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8,
      });

      setPhotoUrl(result.dataUrl);
      setPhotoCompressionInfo(
        `${Math.round(result.compressedSize / 1024)} KB (${result.width}×${result.height} px)`
      );
    } catch (err: any) {
      console.warn('Gagal memproses gambar:', err);
      setFormError(err?.message || 'Gagal memproses gambar yang dipilih.');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setPhotoCompressionInfo('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!cleanName) {
      setFormError('Nama pelatih wajib diisi.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setFormError('Nomor WhatsApp wajib diisi (minimal 10 digit, contoh: 081234567890).');
      return;
    }

    // Determine final license string
    let resolvedLicense: string | undefined;
    if (selectedLicensePreset === 'Lainnya') {
      resolvedLicense = customLicense.trim() || 'Lainnya';
    } else if (selectedLicensePreset) {
      resolvedLicense = selectedLicensePreset;
    }

    const payload: Coach = {
      id: generatedId,
      name: cleanName,
      phone: cleanPhone.startsWith('0') ? cleanPhone : `0${cleanPhone}`,
      photoUrl: photoUrl.trim() || undefined,
      status,
      classGroups: selectedKUs,
      joinedDate: coachToEdit?.joinedDate || new Date().toISOString().split('T')[0],
      specialization: specialization.trim() || 'Pelatih',
      license: resolvedLicense,
      licenseNumber: licenseNumber.trim() || undefined,
      licenseYear: licenseYear.trim() || undefined,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 sm:py-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {coachToEdit ? 'Edit Data Pelatih' : 'Tambah Pelatih Baru'}
              </h2>
              <p className="text-xs text-blue-200 font-mono">
                ID Bisnis: {generatedId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Preview Warning */}
        {isReadOnlyPreview && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center space-x-2 text-amber-800 text-xs shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Preview Terisolasi:</strong> Data pelatih dan simulasi foto disimpan aman dalam memori sesi tanpa menulis ke Firestore atau Storage produksi.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {formError}
            </div>
          )}

          {/* ID (Read-only) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              ID Pelatih (Tetap)
            </label>
            <input
              type="text"
              readOnly
              value={generatedId}
              className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
            />
          </div>

          {/* Nama Pelatih */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Lengkap Pelatih <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Coach Hendra / Hendra Wijaya"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Digunakan untuk koordinasi jadwal latihan dan komunikasi resmi akademi.
            </p>
          </div>

          {/* Spesialisasi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Spesialisasi / Peran Pelatih
            </label>
            <div className="relative">
              <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Contoh: Pelatih Kepala, Pelatih Kiper, Pelatih Fisik"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* SECTION: FOTO PELATIH (Kamera, Galeri & Kompresi Browser) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Foto Profil Pelatih (Opsional)
              </label>
              <button
                type="button"
                onClick={() => setIsManualUrlMode(!isManualUrlMode)}
                className="text-[10px] text-blue-700 hover:text-blue-900 font-bold hover:underline"
              >
                {isManualUrlMode ? 'Beralih ke Unggah / Kamera' : 'Gunakan URL Manual'}
              </button>
            </div>

            {/* Hidden File Inputs for Mobile Camera and Gallery */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              ref={galleryInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            {!isManualUrlMode ? (
              <div className="space-y-3">
                {/* Photo Preview Box if exists */}
                {photoUrl ? (
                  <div className="flex items-center space-x-3.5 p-3 bg-white rounded-xl border border-slate-200">
                    <img
                      src={photoUrl}
                      alt="Preview Foto Pelatih"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        Foto Pelatih Siap Disimpan
                      </p>
                      {photoCompressionInfo ? (
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1 mt-0.5">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span>Terkompresi: {photoCompressionInfo}</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-0.5">Format terverifikasi</p>
                      )}
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Ganti</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg transition flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition text-center flex flex-col items-center justify-center space-y-1.5 shadow-xs group"
                    >
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:scale-110 transition">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">
                        Ambil Foto Kamera
                      </span>
                      <span className="text-[9px] text-slate-400">Kamera langsung HP</span>
                    </button>

                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => galleryInputRef.current?.click()}
                      className="p-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition text-center flex flex-col items-center justify-center space-y-1.5 shadow-xs group"
                    >
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg group-hover:scale-110 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-900">
                        Pilih dari Galeri
                      </span>
                      <span className="text-[9px] text-slate-400">File album foto</span>
                    </button>
                  </div>
                )}

                {isCompressingPhoto && (
                  <p className="text-xs text-blue-600 font-bold flex items-center justify-center space-x-1 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengompresi foto di browser (Canvas ~500px)...</span>
                  </p>
                )}

                <p className="text-[10px] text-slate-400 text-center">
                  Foto dikompresi otomatis di browser hingga ~500x500 px. Foto tidak diunggah ke cloud sampai tombol Simpan ditekan.
                </p>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://... (URL foto eksternal)"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION: LISENSI & SERTIFIKASI PELATIH */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2">
              <FileBadge className="w-4 h-4 text-blue-700" />
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Lisensi / Sertifikasi Pelatih (Opsional)
              </label>
            </div>

            {/* Pilihan Lisensi Preset */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tingkat Lisensi
              </label>
              <select
                value={selectedLicensePreset}
                onChange={(e) => setSelectedLicensePreset(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              >
                <option value="">-- Pilih Lisensi Resmi (Opsional) --</option>
                {PRESET_LICENSES.map((lic) => (
                  <option key={lic} value={lic}>
                    {lic}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Tambahan Jika Memilih 'Lainnya' */}
            {selectedLicensePreset === 'Lainnya' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nama Lisensi Spesifik
                </label>
                <input
                  type="text"
                  value={customLicense}
                  onChange={(e) => setCustomLicense(e.target.value)}
                  placeholder="Contoh: Sertifikasi Pelatih Fisik Level 1 / Lisensi Luar Negeri"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>
            )}

            {/* Grid: Nomor Lisensi & Tahun Perolehan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nomor Registrasi Lisensi
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Contoh: PSSI/2023/C-891"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tahun Perolehan
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={licenseYear}
                  onChange={(e) => setLicenseYear(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 2023"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Kelompok Usia Binaan (Multi-Select) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Kelompok Usia (KU) Binaan</span>
              <span className="text-[10px] text-blue-600 font-semibold">{selectedKUs.length} dipilih</span>
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              {AVAILABLE_KUS.map((ku) => {
                const isSelected = selectedKUs.includes(ku);
                return (
                  <button
                    key={ku}
                    type="button"
                    onClick={() => toggleKU(ku)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{ku}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status (Aktif / Non-Aktif) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status Keanggotaan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Aktif')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                  status === 'Aktif'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Aktif (Muncul di Jadwal)</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('Non-Aktif')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                  status === 'Non-Aktif'
                    ? 'bg-slate-100 text-slate-800 border-slate-400 ring-2 ring-slate-400/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Non-Aktif (Diarsipkan)</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-700/20 active:scale-95 transition"
            >
              {coachToEdit ? 'Simpan Perubahan' : 'Tambah Pelatih'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
