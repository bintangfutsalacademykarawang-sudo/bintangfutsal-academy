export interface Coach {
  id: string; // Format ID bisnis: 'COACH-001', 'COACH-002', dst.
  name: string; // Nama Lengkap / Panggilan Resmi Pelatih
  phone: string; // Nomor WhatsApp resmi (contoh: 081234567890)
  photoUrl?: string; // Tautan foto profil opsional
  status: 'Aktif' | 'Non-Aktif'; // Soft delete (hanya 'Aktif' yang muncul di pilihan jadwal)
  classGroups: string[]; // Kelompok Usia binaan (contoh: ['U-10', 'U-12'])
  joinedDate: string; // Format YYYY-MM-DD
  specialization?: string; // e.g. 'Pelatih Kepala', 'Pelatih Kiper', 'Pelatih Fisik'
  license?: string; // e.g. 'Lisensi C AFC / PSSI', 'Lisensi D Nasional'
  licenseNumber?: string; // Nomor lisensi resmi (opsional)
  licenseYear?: string; // Tahun perolehan lisensi (opsional)
}
