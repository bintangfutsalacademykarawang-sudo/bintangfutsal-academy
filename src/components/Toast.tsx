import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        let bgStyle = 'bg-slate-900 text-white border-slate-700';
        let Icon = Info;

        if (toast.type === 'success') {
          bgStyle = 'bg-emerald-700 text-white border-emerald-500 shadow-emerald-900/20';
          Icon = CheckCircle2;
        } else if (toast.type === 'warning') {
          bgStyle = 'bg-amber-600 text-white border-amber-400 shadow-amber-900/20';
          Icon = AlertTriangle;
        } else if (toast.type === 'error') {
          bgStyle = 'bg-rose-700 text-white border-rose-500 shadow-rose-900/20';
          Icon = XCircle;
        } else if (toast.type === 'info') {
          bgStyle = 'bg-[#0F274E] text-white border-blue-500 shadow-blue-950/30';
          Icon = Info;
        }

        return (
          <div
            key={toast.id}
            onClick={() => onDismiss(toast.id)}
            className={`${bgStyle} px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold border transition-all duration-300 pointer-events-auto cursor-pointer animate-in fade-in slide-in-from-top-2`}
          >
            <Icon className="w-4 h-4 shrink-0 text-white" />
            <span className="flex-1 leading-snug">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
