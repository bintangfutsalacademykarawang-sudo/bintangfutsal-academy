import { TrainingSchedule } from '../types';

export function getScheduleStatus(schedule: { date: string; startTime: string; endTime: string; status?: string }): 'Akan Datang' | 'Sedang Berjalan' | 'Selesai' | 'Dibatalkan' {
  if (schedule.status === 'Dibatalkan') {
    return 'Dibatalkan';
  }

  // Get current time in WIB (Asia/Jakarta)
  const now = new Date();
  const wibFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = wibFormatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  const wibYear = parseInt(getPart('year'), 10);
  const wibMonth = parseInt(getPart('month'), 10);
  const wibDay = parseInt(getPart('day'), 10);
  const wibHour = parseInt(getPart('hour'), 10);
  const wibMinute = parseInt(getPart('minute'), 10);

  const currentDateStr = `${wibYear}-${String(wibMonth).padStart(2, '0')}-${String(wibDay).padStart(2, '0')}`;
  const currentTimeMins = wibHour * 60 + wibMinute;

  const schedDateStr = schedule.date; // e.g. '2026-10-03'
  
  const [startHour, startMin] = (schedule.startTime || '00:00').split(':').map(Number);
  const startTimeMins = (startHour || 0) * 60 + (startMin || 0);

  const [endHour, endMin] = (schedule.endTime || '00:00').split(':').map(Number);
  const endTimeMins = (endHour || 0) * 60 + (endMin || 0);

  if (schedDateStr < currentDateStr) {
    return 'Selesai';
  } else if (schedDateStr > currentDateStr) {
    return 'Akan Datang';
  } else {
    if (currentTimeMins < startTimeMins) {
      return 'Akan Datang';
    } else if (currentTimeMins >= startTimeMins && currentTimeMins <= endTimeMins) {
      return 'Sedang Berjalan';
    } else {
      return 'Selesai';
    }
  }
}

/**
 * Helper to simulate schedule status on a specific test date/time in WIB (for testing/verification)
 */
export function simulateScheduleStatus(
  schedule: { date: string; startTime: string; endTime: string; status?: string },
  simulatedWibDateStr: string, // 'YYYY-MM-DD'
  simulatedWibTimeStr: string  // 'HH:mm'
): 'Akan Datang' | 'Sedang Berjalan' | 'Selesai' | 'Dibatalkan' {
  if (schedule.status === 'Dibatalkan') {
    return 'Dibatalkan';
  }

  const schedDateStr = schedule.date;
  const [startHour, startMin] = (schedule.startTime || '00:00').split(':').map(Number);
  const startTimeMins = (startHour || 0) * 60 + (startMin || 0);

  const [endHour, endMin] = (schedule.endTime || '00:00').split(':').map(Number);
  const endTimeMins = (endHour || 0) * 60 + (endMin || 0);

  const [simHour, simMin] = simulatedWibTimeStr.split(':').map(Number);
  const simTimeMins = (simHour || 0) * 60 + (simMin || 0);

  if (schedDateStr < simulatedWibDateStr) {
    return 'Selesai';
  } else if (schedDateStr > simulatedWibDateStr) {
    return 'Akan Datang';
  } else {
    if (simTimeMins < startTimeMins) {
      return 'Akan Datang';
    } else if (simTimeMins >= startTimeMins && simTimeMins <= endTimeMins) {
      return 'Sedang Berjalan';
    } else {
      return 'Selesai';
    }
  }
}
