import React, { useState, useEffect, useRef } from 'react';
import { Student } from '../../types';
import { calculateAgeAndGroup, CURRENT_SYSTEM_YEAR, ALL_KU_CATEGORIES } from '../../data/initialData';
import { normalizePhoneNumber, isValidIndonesianMobile } from '../../utils/phoneUtils';
import { X, UserCheck, Camera, Image, FileUp, CheckCircle2, Check } from 'lucide-react';
import { BFALogo } from '../common/BFALogo';

interface StudentFormModalProps {
  isOpen: boolean;
  editStudent: Student | null;
  onClose: () => void;
  onSubmit: (data: Omit<Student, 'id' | 'joinedDate'> & { id?: string }) => void;
  onOpenLiveCamera: (target: 'photo' | 'kk' | 'akte' | 'kia' | 'ijazah') => void;
  capturedItem?: {
    dataUrl: string;
    target: 'photo' | 'kk' | 'akte' | 'kia' | 'ijazah';
    timestamp: number;
  } | null;
  nextStudentId?: string;
  isParentRole?: boolean;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  editStudent,
  onClose,
  onSubmit,
  onOpenLiveCamera,
  capturedItem,
  nextStudentId,
  isParentRole = false,
}) => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [birthPlace, setBirthPlace] = useState('Karawang');
  const [birthDate, setBirthDate] = useState('2015-05-21');
  const [classGroupId, setClassGroupId] = useState('U11');
  const [position, setPosition] = useState<string>('Belum Ditentukan');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Non-Aktif'>('Aktif');

  const [docKK, setDocKK] = useState('Belum diunggah');
  const [docAkte, setDocAkte] = useState('Belum diunggah');
  const [docKIA, setDocKIA] = useState('Belum diunggah');
  const [docIjazah, setDocIjazah] = useState('Belum diunggah');

  const [ageBadgeText, setAgeBadgeText] = useState('Pilih tanggal');

  const prevIsOpenRef = useRef(false);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form only when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (editStudent) {
        setName(editStudent.name);
        setNickname(editStudent.nickname || editStudent.name.split(' ')[0] || '');
        setAvatar(editStudent.avatar || '');
        setBirthPlace(editStudent.birthPlace || 'Karawang');
        setBirthDate(editStudent.birthDate);
        setClassGroupId(editStudent.classGroupId);
        setPosition(editStudent.position || 'Belum Ditentukan');
        setJerseyNumber(editStudent.jerseyNumber);
        setGender(editStudent.gender);
        setParentName(editStudent.parentName);
        setPhone(editStudent.phone || '');
        setStatus(editStudent.status);
        setDocKK(editStudent.documents?.kk || 'Belum diunggah');
        setDocAkte(editStudent.documents?.akte || 'Belum diunggah');
        setDocKIA(editStudent.documents?.kia || 'Belum diunggah');
        setDocIjazah(editStudent.documents?.ijazah || 'Belum diunggah');

        const { age, group } = calculateAgeAndGroup(editStudent.birthDate);
        setAgeBadgeText(`${CURRENT_SYSTEM_YEAR} - ${new Date(editStudent.birthDate).getFullYear()} = ${age} Thn (${group})`);
      } else {
        setName('');
        setNickname('');
        setAvatar('');
        setBirthPlace('Karawang');
        setBirthDate('2015-05-21');
        const { age, group } = calculateAgeAndGroup('2015-05-21');
        setClassGroupId(group);
        setAgeBadgeText(`${CURRENT_SYSTEM_YEAR} - 2015 = ${age} Thn (${group})`);
        setPosition('Belum Ditentukan');
        setJerseyNumber(10);
        setGender('L');
        setParentName('');
        setPhone('');
        setStatus('Aktif');
        setDocKK('Belum diunggah');
        setDocAkte('Belum diunggah');
        setDocKIA('Belum diunggah');
        setDocIjazah('Belum diunggah');
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, editStudent]);

  // When live camera snapshot is confirmed, apply immediately to form state!
  useEffect(() => {
    if (capturedItem && capturedItem.dataUrl) {
      if (capturedItem.target === 'photo') {
        setAvatar(capturedItem.dataUrl);
      } else if (capturedItem.target === 'kk') {
        setDocKK(capturedItem.dataUrl);
      } else if (capturedItem.target === 'akte') {
        setDocAkte(capturedItem.dataUrl);
      } else if (capturedItem.target === 'kia') {
        setDocKIA(capturedItem.dataUrl);
      } else if (capturedItem.target === 'ijazah') {
        setDocIjazah(capturedItem.dataUrl);
      }
    }
  }, [capturedItem]);

  if (!isOpen) return null;

  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    const { age, group } = calculateAgeAndGroup(val);
    if (age > 0) {
      setClassGroupId(group);
      const birthYear = new Date(val).getFullYear();
      setAgeBadgeText(`${CURRENT_SYSTEM_YEAR} - ${birthYear} = ${age} Thn (${group})`);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (name: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // If it's an image, read data url so thumbnail can be shown
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setter(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setter(file.name);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedId = editStudent?.id ? editStudent.id : undefined;
    const cleanPhone = normalizePhoneNumber(phone.trim());
    const finalAvatar = (avatar && avatar.trim() !== '' && !avatar.includes('unsplash.com'))
      ? avatar.trim()
      : (editStudent?.avatar || '');

    onSubmit({
      ...(assignedId ? { id: assignedId } : {}),
      name: name.trim(),
      nickname: nickname.trim() || name.trim().split(' ')[0] || name.trim(),
      avatar: finalAvatar,
      birthPlace: birthPlace.trim(),
      birthDate,
      classGroupId,
      position: position || 'Belum Ditentukan',
      jerseyNumber: Number(jerseyNumber) || 10,
      gender,
      parentName: parentName.trim(),
      phone: cleanPhone || phone.trim(),
      status,
      documents: {
        kk: docKK,
        akte: docAkte,
        kia: docKIA,
        ijazah: docIjazah,
      },
    });
    onClose();
  };

  const assignedStudentId = editStudent?.id || nextStudentId || 'BFA-039';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative my-6 border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {isParentRole
                ? `Edit Profil Ananda - ${editStudent ? editStudent.name : 'Siswa'} (${assignedStudentId})`
                : (editStudent ? `Edit Data Siswa - ${editStudent.name} (${editStudent.id})` : 'Pendaftaran Siswa Baru BFA')}
            </h3>
            <p className="text-xs text-slate-500">
              {isParentRole
                ? 'Perbarui foto, nama panggilan, nomor jersey, tempat & tgl lahir, data wali, dan berkas legalitas ananda.'
                : 'Kalkulasi otomatis kelompok umur (KU), ID otomatis, foto & dokumen legalitas.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Automatic ID Display Banner */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">
                Kode ID Atlet Akademi
              </span>
              <span className="text-base font-black font-mono text-blue-950 tracking-wide">
                {assignedStudentId}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 bg-blue-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                {editStudent ? 'ID Terdaftar' : '✓ Auto Nomor Server'}
              </span>
              <p className="text-[9px] text-slate-500 mt-0.5">
                {editStudent ? 'Nomor identitas atlet' : 'Nomor resmi dari Cloud Counter'}
              </p>
            </div>
          </div>

          {/* Foto Siswa Upload & Live Camera */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700">Foto Profil Siswa *</label>
              {avatar && avatar.startsWith('data:image') && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span>Foto Kamera Terpasang!</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3.5">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black border-2 border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                {avatar && avatar.trim() !== '' && !avatar.includes('unsplash.com') ? (
                  <img
                    src={avatar}
                    className="w-full h-full object-cover"
                    alt="Preview Foto Siswa"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center p-1.5 sm:p-2">
                    <BFALogo className="w-full h-full object-contain drop-shadow" />
                  </div>
                )}
                {avatar && avatar.startsWith('data:image') && (
                  <span className="absolute bottom-0 right-0 bg-emerald-500 text-white p-0.5 rounded-tl-lg shadow-xs" title="Foto Kamera Aktif">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  <label className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer border border-slate-300 flex items-center gap-1.5 shadow-xs transition active:scale-95 text-xs">
                    <Image className="w-3.5 h-3.5 text-orange-600" />
                    <span>Galeri</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onOpenLiveCamera('photo')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 text-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Live Kamera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => mobileCameraInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 rounded-xl font-bold border border-slate-300 flex items-center gap-1.5 shadow-xs transition active:scale-95 text-xs"
                    title="Buka kamera perangkat langsung"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kamera HP</span>
                  </button>
                  <input
                    ref={mobileCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Format: JPG, PNG maks 3MB. Hasil kamera otomatis tampil langsung di kotak foto.
                </p>
              </div>
            </div>
          </div>

          {/* Nama Lengkap & Nama Panggilan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!nickname && !editStudent) {
                    const first = e.target.value.trim().split(' ')[0];
                    if (first) setNickname(first);
                  }
                }}
                placeholder="Contoh: Muhammad Ziyadatul Khair"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-blue-900 mb-1 flex items-center justify-between">
                <span>Nama Panggilan *</span>
                <span className="text-[9px] text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">Kartu Member</span>
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Contoh: Ziya"
                className="w-full bg-blue-50/70 border border-blue-300 rounded-xl px-3 py-2 text-blue-950 focus:outline-none focus:border-blue-600 font-bold shadow-2xs"
              />
              <p className="text-[9px] text-slate-400 mt-0.5">Nama di Kartu Member</p>
            </div>
          </div>

          {/* Nomor Jersey */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor Jersey (Opsional)</label>
            <input
              type="number"
              min="0"
              max="99"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(Number(e.target.value))}
              placeholder="10"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tempat Lahir *</label>
              <input
                type="text"
                required
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Karawang"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Tanggal Lahir *</span>
                <span className="text-[10px] text-blue-700 bg-blue-100 font-bold px-2 py-0.5 rounded-md">
                  {ageBadgeText}
                </span>
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Kelompok (KU)</span>
                <span className="text-[9px] text-emerald-600 font-bold">Auto-set</span>
              </label>
              <select
                value={classGroupId}
                onChange={(e) => setClassGroupId(e.target.value)}
                className="w-full bg-blue-50 border-2 border-blue-400 rounded-xl px-3 py-2 text-blue-900 font-extrabold focus:outline-none focus:border-blue-600"
              >
                {ALL_KU_CATEGORIES.map((ku) => {
                  const age = parseInt(ku.replace('U', ''), 10);
                  return (
                    <option key={ku} value={ku}>
                      {ku} ({age} Tahun)
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Posisi</span>
                <span className="text-[9px] text-slate-400 font-normal">Bisa Nanti</span>
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
              >
                <option value="Belum Ditentukan">Bisa Diisi Nanti / Belum Ditentukan</option>
                <option value="Flank">Flank</option>
                <option value="Anchor">Anchor</option>
                <option value="Pivot">Pivot</option>
                <option value="Goalkeeper">Goalkeeper</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali *</label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Contoh: Bpk. Bambang Supardi"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-mono font-medium"
              />
            </div>
          </div>

          {isParentRole ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Status Keanggotaan</span>
                <span className="font-bold text-emerald-950 text-xs">Atlet Terdaftar BFA Karawang ({status})</span>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-black shadow-2xs">
                {status}
              </span>
            </div>
          ) : (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Keanggotaan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          )}

          {/* Dokumen Legalitas */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <label className="block font-extrabold text-slate-800">
              Upload Dokumen Legalitas (Galeri / Live Kamera):
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { title: '1. Kartu Keluarga (KK)', value: docKK, setter: setDocKK, target: 'kk' as const },
                { title: '2. Akte Kelahiran', value: docAkte, setter: setDocAkte, target: 'akte' as const },
                { title: '3. KIA / KTP Anak & Wali', value: docKIA, setter: setDocKIA, target: 'kia' as const },
                { title: '4. Ijazah Terakhir', value: docIjazah, setter: setDocIjazah, target: 'ijazah' as const },
              ].map((doc) => {
                const isImage = doc.value.startsWith('data:image');
                const isUploaded = doc.value !== 'Belum diunggah';

                return (
                  <div key={doc.target} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-700 block text-[11px]">{doc.title}</span>
                      {isImage ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <img
                            src={doc.value}
                            alt={doc.title}
                            className="w-8 h-8 rounded-lg object-cover border border-emerald-400"
                          />
                          <span className="text-[10px] text-emerald-700 font-bold">✓ Foto Tersimpan</span>
                        </div>
                      ) : (
                        <span className={`text-[10px] truncate block font-mono ${isUploaded ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                          {doc.value}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <label className="flex-1 py-1 bg-white hover:bg-slate-100 rounded-lg text-center font-bold text-[10px] cursor-pointer text-slate-700 border border-slate-300 shadow-xs active:scale-95">
                        <FileUp className="w-3 h-3 text-orange-600 inline mr-1" />
                        Pilih
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleDocumentFile(e, doc.setter)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => onOpenLiveCamera(doc.target)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-xs active:scale-95"
                        title="Ambil foto dokumen lewat live kamera"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-100 active:scale-95 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black rounded-xl shadow-md shadow-orange-600/25 transition active:scale-95 text-xs"
            >
              {isParentRole
                ? 'Simpan Perubahan Profil Ananda'
                : (editStudent ? 'Simpan Perubahan Siswa' : 'Simpan Data Siswa')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
