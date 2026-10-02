import React, { useState } from 'react';
import { Fingerprint, RefreshCw, Cpu, Activity, QrCode, Scan } from 'lucide-react';

interface AdminFingerprintViewProps {
  onOpenFingerprint: () => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const AdminFingerprintView: React.FC<AdminFingerprintViewProps> = ({
  onOpenFingerprint,
  onShowToast,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('14:15:32');

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(now.toTimeString().split(' ')[0]);
      onShowToast('Sinkronisasi perangkat hardware BFA Gate 01 berhasil!', 'success');
    }, 800);
  };

  const handleTestSensor = () => {
    onShowToast('Tes sensor: Sensor Sidik Jari & Scanner Barcode OK (Latency: 12ms)', 'info');
  };

  const logs = [
    { time: '14:15:32', event: 'Heartbeat ping: 12ms latency. Terminal Sidik Jari & Barcode siap scan.', status: 'OK' },
    { time: '14:12:10', event: 'Barcode Scanned: ID BFA-001 (Andra). Status HADIR.', status: 'SUCCESS' },
    { time: '14:08:44', event: 'Biometric matched: ID BFA-003 (Raka). Status HADIR.', status: 'SUCCESS' },
    { time: '14:05:00', event: 'Barcode Scanned: ID BFA-002 (Bima). Status HADIR.', status: 'SUCCESS' },
    { time: '14:02:15', event: 'Biometric matched: ID BFA-004 (Fikri). Status HADIR.', status: 'SUCCESS' },
    { time: '13:58:30', event: 'Barcode Scanned: ID BFA-005 (Rizky). Status HADIR.', status: 'SUCCESS' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Terminal Biometrik & Scanner Barcode IoT Gate
          </h1>
          <p className="text-xs text-slate-500">
            Koneksi sensor sidik jari optik & pemindai barcode / QR pintu masuk arena Bintang Futsal Karawang.
          </p>
        </div>
        <button
          onClick={onOpenFingerprint}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center space-x-2 self-start sm:self-auto"
        >
          <Scan className="w-4 h-4" />
          <span>BUKA SCANNER BIOMETRIK & BARCODE</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-slate-500">STATUS DEVICE:</span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-700" />
              <span>BFA Biometric Gate 01</span>
            </h2>
            <p className="text-xs text-slate-600">
              Lokasi: <strong className="text-blue-900">Bintang Futsal Arena Klari, Karawang</strong>
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              Last Sync: {lastSyncTime} • Firmware v3.2-IoT
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs border border-slate-300 transition flex items-center space-x-2 active:scale-95 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-orange-600' : 'text-slate-600'}`} />
              <span>{isSyncing ? 'Menghubungkan...' : 'SYNC SEKARANG'}</span>
            </button>
            <button
              onClick={handleTestSensor}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95"
            >
              Test Sensor
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>Riwayat Sinkronisasi & Sensor Biometrik Log</span>
        </h3>
        <div className="space-y-2">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-200"
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono text-slate-500 tabular-nums">{log.time}</span>
                <span className="text-slate-800 font-medium">{log.event}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
