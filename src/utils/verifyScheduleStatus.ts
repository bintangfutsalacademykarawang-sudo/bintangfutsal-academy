import { simulateScheduleStatus } from './scheduleStatusHelper';

const testDates = [
  { date: '2026-10-03', name: '3 Oktober 2026' },
  { date: '2026-10-10', name: '10 Oktober 2026' },
  { date: '2026-10-17', name: '17 Oktober 2026' },
  { date: '2026-10-24', name: '24 Oktober 2026' },
  { date: '2026-11-07', name: '7 November 2026' }
];

// Test evaluation relative to current test simulation day (e.g. November 4, 2026 in WIB)
const simulatedCurrentWibDate = '2026-11-04';
const simulatedCurrentWibTime = '10:00';

console.log('=== BFA HUB — VERIFIKASI STATUS JADWAL LATIHAN (WIB Asia/Jakarta) ===');
console.log(`Waktu simulasi pengujian: ${simulatedCurrentWibDate} pukul ${simulatedCurrentWibTime} WIB\n`);

testDates.forEach((test, index) => {
  const schedule = {
    id: `SCH-TEST-00${index + 1}`,
    date: test.date,
    dayName: `${test.name}`,
    startTime: '14:00',
    endTime: '16:00',
    classGroupId: 'U10',
    courtName: 'Bintang Futsal',
    coaches: ['Coach Hanif'],
    status: 'Akan Datang' as const
  };

  const status = simulateScheduleStatus(schedule, simulatedCurrentWibDate, simulatedCurrentWibTime);
  console.log(`[Jadwal ${test.name}] Tanggal: ${test.date} | Waktu: 14:00 - 16:00 WIB --> Status Aktual: ${status}`);
});

console.log('\n=== UJI COBA SAAT HARI H (Contoh: 3 Oktober 2026 pukul 15:00 WIB) ===');
const sampleSchedule = {
  id: 'SCH-SAMPLE',
  date: '2026-10-03',
  dayName: 'Sabtu, 3 Oktober 2026',
  startTime: '14:00',
  endTime: '16:00',
  classGroupId: 'U10',
  courtName: 'Bintang Futsal',
  coaches: ['Coach Hanif'],
  status: 'Akan Datang' as const
};

console.log(`Pukul 12:00 WIB (Sebelum mulai): ${simulateScheduleStatus(sampleSchedule, '2026-10-03', '12:00')}`);
console.log(`Pukul 15:00 WIB (Sedang berlangsung): ${simulateScheduleStatus(sampleSchedule, '2026-10-03', '15:00')}`);
console.log(`Pukul 17:00 WIB (Selesai): ${simulateScheduleStatus(sampleSchedule, '2026-10-03', '17:00')}`);
console.log('=== VERIFIKASI SELESAI ===');
