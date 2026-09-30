import React from 'react';
import { Role, AuthUser } from '../types';
import { Shield, LogOut, User, Lock } from 'lucide-react';

interface HeaderProps {
  role: Role;
  currentUser: AuthUser | null;
  onLogoClick: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  role, 
  currentUser, 
  onLogoClick,
  onLogout,
}) => {
  return (
    <header className="bg-[#0F274E] border-b border-blue-900/60 sticky top-0 z-40 backdrop-blur-md shadow-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand & Crest */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={onLogoClick}
          >
            {/* BFA Shield Crest SVG Logo */}
            <div className="w-10 h-12 sm:w-11 sm:h-13 shrink-0 drop-shadow-md transition-transform group-hover:scale-105">
              <svg viewBox="0 0 500 600" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M250 15 L475 90 V270 C475 425 250 580 250 580 C250 580 25 425 25 270 V90 L250 15 Z" fill="#060C18" stroke="#FFFFFF" strokeWidth="18"/>
                <path d="M250 35 L455 105 V270 C455 410 250 550 250 550 C250 550 45 410 45 270 V105 L250 35 Z" fill="#0A1428"/>
                <polygon points="250,55 272,125 345,125 286,168 308,235 250,192 192,235 214,168 155,125 228,125" fill="#D4FF00"/>
                <polygon points="175,235 250,290 325,235 345,260 250,335 155,260" fill="#D4FF00"/>
                <polygon points="110,185 118,208 142,208 122,222 130,245 110,230 90,245 98,222 78,208 102,208" fill="#FFFFFF"/>
                <polygon points="390,185 398,208 422,208 402,222 410,245 390,230 370,245 378,222 358,208 382,208" fill="#FFFFFF"/>
                <text x="250" y="375" textAnchor="middle" fill="#FFFFFF" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="52" letterSpacing="4">FUTSAL</text>
                <g transform="rotate(-6 250 440)">
                  <rect x="5" y="415" width="490" height="68" fill="#D4FF00"/>
                  <text x="250" y="466" textAnchor="middle" fill="#0A1428" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="44" letterSpacing="3">ACADEMY</text>
                </g>
                <text x="250" y="530" textAnchor="middle" fill="#94A3B8" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="700" fontSize="28">2018</text>
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">BFA HUB</span>
                <span className="bg-blue-950/90 text-amber-400 border border-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  2026
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Firestore Online</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-semibold text-blue-200">Bintang Futsal Academy Karawang</p>
            </div>
          </div>

          {/* User Info, Locked Mode Indicator & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User Profile Pill */}
            {currentUser && (
              <div className="hidden md:flex items-center space-x-2 bg-blue-950/70 border border-blue-800 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center text-amber-300 font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-white text-xs leading-none">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-blue-300">
                    {currentUser.role === 'admin' ? 'Staff BFA' : `Wali: ${currentUser.studentName || 'Siswa'}`}
                  </span>
                </div>
              </div>
            )}

            {/* Locked Role Badge (No free toggle button - strictly locked as requested) */}
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              role === 'admin' 
                ? 'bg-blue-900/60 border-blue-600 text-amber-300' 
                : 'bg-orange-950/60 border-orange-600 text-orange-300'
            }`}>
              <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="text-[11px] text-slate-300 font-semibold hidden sm:inline">Mode:</span>
              <span className="text-xs font-black uppercase tracking-wider">
                {role === 'admin' ? 'ADMIN (TERKUNCI)' : 'ORANG TUA (TERKUNCI)'}
              </span>
            </div>

            {/* Logout Button (The only official way to switch account / role) */}
            <button
              onClick={onLogout}
              title="Keluar / Ganti Akun"
              className="px-3.5 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-100 hover:text-white border border-rose-500/50 rounded-xl text-xs font-black transition flex items-center space-x-1.5 active:scale-95 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar / Ganti Akun</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
