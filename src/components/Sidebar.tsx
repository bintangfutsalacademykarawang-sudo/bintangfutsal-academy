import React from 'react';
import { Role, RouteId } from '../types';
import { 
  Home, 
  Users, 
  Wallet, 
  Award, 
  CheckCircle, 
  Fingerprint, 
  CreditCard, 
  CalendarDays, 
  Receipt,
  PlusCircle
} from 'lucide-react';

interface SidebarProps {
  role: Role;
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  onOpenRecordCash: () => void;
  onOpenFingerprint: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentRoute,
  onNavigate,
  onOpenRecordCash,
  onOpenFingerprint,
}) => {
  const adminLinks = [
    { route: 'dashboard' as RouteId, label: 'Dashboard Admin', icon: Home },
    { route: 'students' as RouteId, label: 'Data Siswa', icon: Users },
    { route: 'keuangan' as RouteId, label: 'Keuangan & Buku Kas', icon: Wallet },
    { route: 'erapport' as RouteId, label: 'E-Rapport Siswa', icon: Award },
    { route: 'attendance' as RouteId, label: 'Absensi Lapangan', icon: CheckCircle },
    { route: 'fingerprint' as RouteId, label: 'Hardware Fingerprint', icon: Fingerprint },
    { route: 'invoices' as RouteId, label: 'Sistem Tagihan & SPP', icon: CreditCard },
  ];

  const parentLinks = [
    { route: 'parent-dashboard' as RouteId, label: 'Dashboard Orang Tua', icon: Home },
    { route: 'parent-attendance' as RouteId, label: 'Kalender Absensi', icon: CalendarDays },
    { route: 'parent-payment' as RouteId, label: 'Bayar Tagihan', icon: CreditCard },
    { route: 'parent-payments' as RouteId, label: 'Riwayat Pembayaran', icon: Receipt },
    { route: 'parent-report' as RouteId, label: 'Rapor Perkembangan', icon: Award },
  ];

  const links = role === 'admin' ? adminLinks : parentLinks;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 shrink-0 hidden md:block">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-28 space-y-4 shadow-sm">
          
          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  onClick={() => onNavigate(link.route)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Quick Actions for Admin */}
          {role === 'admin' && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button 
                onClick={onOpenRecordCash}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 flex items-center justify-center space-x-2 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Catat Mutasi Kas</span>
              </button>

              <button 
                onClick={onOpenFingerprint}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-center space-x-2 transition active:scale-95"
              >
                <Fingerprint className="w-4 h-4 text-orange-600" />
                <span>Simulasi Fingerprint</span>
              </button>
            </div>
          )}

        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 px-2 py-1.5 z-40 backdrop-blur-lg shadow-lg">
        <div className="flex justify-around items-center text-xs">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentRoute === link.route;
            return (
              <button
                key={link.route}
                onClick={() => onNavigate(link.route)}
                className={`flex flex-col items-center py-1 px-1.5 transition ${
                  isActive ? 'text-blue-700 font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-[10px] truncate max-w-[58px]">
                  {link.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
