/**
 * BFA HUB — READ-ONLY AUTH DIAGNOSTIC OVERLAY
 * Mode: READ-ONLY · ADMIN ONLY · SECURE TELEMETRY INSPECTION
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, X, ChevronUp, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { getIdTokenResult } from 'firebase/auth';
import { auth, activeConfig } from '../../firebase';
import { isBfaAdminUser } from '../../firebase/authAdapter';

interface AuthDiagnosticOverlayProps {
  currentUserRole?: string;
}

export const AuthDiagnosticOverlay: React.FC<AuthDiagnosticOverlayProps> = ({ currentUserRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<{
    uid: string | null;
    email: string | null;
    claims: Record<string, any>;
    isAdminResult: boolean;
    projectId: string;
    databaseId: string;
    error?: string;
  } | null>(null);

  const fetchDiagnostics = async (forceRefresh = false) => {
    const user = auth.currentUser;
    if (!user) {
      setDiagnosticData(null);
      return;
    }

    setLoading(true);
    try {
      const tokenResult = await getIdTokenResult(user, forceRefresh);
      const claims = tokenResult.claims || {};
      const isAdminResult = isBfaAdminUser(claims, user);

      setDiagnosticData({
        uid: user.uid,
        email: user.email,
        claims,
        isAdminResult,
        projectId: activeConfig?.projectId || 'unknown',
        databaseId: activeConfig?.firestoreDatabaseId || '(default)',
      });
    } catch (err: any) {
      setDiagnosticData({
        uid: user.uid,
        email: user.email,
        claims: {},
        isAdminResult: false,
        projectId: activeConfig?.projectId || 'unknown',
        databaseId: activeConfig?.firestoreDatabaseId || '(default)',
        error: err?.message || String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserRole === 'admin') {
      fetchDiagnostics(false);
    }
  }, [currentUserRole]);

  if (currentUserRole !== 'admin') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => {
            setIsOpen(true);
            fetchDiagnostics(true);
          }}
          className="bg-slate-900 text-white px-3.5 py-2 rounded-2xl shadow-xl hover:bg-slate-800 transition flex items-center space-x-2 text-xs font-bold border border-slate-700"
          title="Buka Diagnostik Auth Admin"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Auth Diagnostic</span>
        </button>
      ) : (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-80 sm:w-96 p-4 text-slate-800 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                AI
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">Auth Diagnostic Panel</h4>
                <p className="text-[10px] text-slate-400">Read-only Session Inspection</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => fetchDiagnostics(true)}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Refresh Claims"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {diagnosticData ? (
            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-[10px]">CURRENT UID:</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-700">{diagnosticData.uid || 'Null'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-[10px]">EMAIL:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[180px]">{diagnosticData.email || '-'}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1 text-[11px]">
                <div className="text-[10px] font-black uppercase text-slate-400">Client SDK Target:</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Project ID:</span>
                  <span className="font-mono font-bold text-slate-800">{diagnosticData.projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Database ID:</span>
                  <span className="font-mono font-bold text-slate-800 truncate max-w-[170px]" title={diagnosticData.databaseId}>
                    {diagnosticData.databaseId}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5">
                <div className="text-[10px] font-black uppercase text-slate-400 flex items-center justify-between">
                  <span>Custom Claims (getIdTokenResult):</span>
                  <span className="font-normal text-slate-500">Forced Refresh</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px]">Claim [role]</span>
                    <span className="font-bold text-slate-800">{String(diagnosticData.claims.role ?? 'null')}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px]">Claim [admin]</span>
                    <span className="font-bold text-slate-800">{String(diagnosticData.claims.admin ?? 'null')}</span>
                  </div>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                diagnosticData.isAdminResult 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center space-x-2">
                  {diagnosticData.isAdminResult ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-black text-[11px]">
                    isBfaAdminUser() Evaluation
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                  diagnosticData.isAdminResult ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                }`}>
                  {diagnosticData.isAdminResult ? 'TRUE (ADMIN)' : 'FALSE (DENIED)'}
                </span>
              </div>

              {diagnosticData.error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-xl text-[10px]">
                  ⚠️ Error: {diagnosticData.error}
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              Memuat data autentikasi...
            </div>
          )}

          <div className="text-[9px] text-center text-slate-400 pt-1 border-t border-slate-100">
            Read-only Diagnostic Overlay • No Firestore writes
          </div>
        </div>
      )}
    </div>
  );
};
