import React from 'react';
import { Role, AuthUser, Student } from '../types';
import { Shield, LogOut, User, Lock, Users } from 'lucide-react';
import { BFALogo } from './common/BFALogo';

interface HeaderProps {
  role: Role;
  currentUser: AuthUser | null;
  onLogoClick: () => void;
  onLogout: () => void;
  parentSiblings?: Student[];
  onSwitchStudent?: (studentId: string) => void;
  activeStudentId?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  role, 
  currentUser, 
  onLogoClick,
  onLogout,
  parentSiblings = [],
  onSwitchStudent,
  activeStudentId,
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
            {/* 100% Authentic BFA Shield Crest Logo */}
            <BFALogo className="w-10 h-12 sm:w-12 sm:h-14 shrink-0 drop-shadow-md transition-transform group-hover:scale-105" />
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
            {/* Multi-Child Family Switcher in Header */}
            {role === 'parent' && parentSiblings.length > 1 && onSwitchStudent && (
              <div className="flex items-center space-x-1.5 bg-blue-950/80 border border-amber-500/60 px-2.5 py-1.5 rounded-xl text-xs shadow-xs">
                <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline text-[10px] text-amber-300 font-bold">Ananda:</span>
                <select
                  value={activeStudentId || ''}
                  onChange={(e) => onSwitchStudent(e.target.value)}
                  className="bg-transparent text-white font-black text-xs focus:outline-none cursor-pointer pr-1"
                  title="Pilih ananda untuk beralih portal"
                >
                  {parentSiblings.map((sib) => (
                    <option key={sib.id} value={sib.id} className="bg-slate-900 text-white font-bold">
                      {sib.name} ({sib.classGroupId})
                    </option>
                  ))}
                </select>
              </div>
            )}

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
