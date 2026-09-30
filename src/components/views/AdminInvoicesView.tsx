import React from 'react';
import { Invoice } from '../../types';
import { CreditCard, Plus, Receipt, CheckCircle } from 'lucide-react';

interface AdminInvoicesViewProps {
  invoices: Invoice[];
  onGenerateInvoices: () => void;
  onMarkInvoicePaid: (id: string) => void;
  onShowReceipt: (invoice: Invoice) => void;
}

export const AdminInvoicesView: React.FC<AdminInvoicesViewProps> = ({
  invoices,
  onGenerateInvoices,
  onMarkInvoicePaid,
  onShowReceipt,
}) => {
  const totalAmount = invoices.reduce((a, b) => a + b.amount, 0);
  const paidAmount = invoices
    .filter((i) => i.status === 'LUNAS')
    .reduce((a, b) => a + b.amount, 0);
  const unpaidAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sistem Tagihan & Keuangan Siswa
          </h1>
          <p className="text-xs text-slate-500">
            Total tagihan bulanan Rp50.000 dan tagihan latihan Rp15.000 per kehadiran siswa.
          </p>
        </div>
        <button
          onClick={onGenerateInvoices}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-orange-500/20 transition flex items-center space-x-1.5 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Tagihan Bulanan</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Tagihan
          </span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
            Rp{totalAmount.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Sudah Dibayar
          </span>
          <div className="text-xl font-black text-emerald-700 mt-1 tabular-nums">
            Rp{paidAmount.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            Belum Dibayar
          </span>
          <div className="text-xl font-black text-rose-700 mt-1 tabular-nums">
            Rp{unpaidAmount.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
            Jumlah Transaksi
          </span>
          <div className="text-xl font-black text-blue-900 mt-1 tabular-nums">
            {invoices.length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Siswa</th>
                <th className="px-4 py-3.5">Jenis Tagihan</th>
                <th className="px-4 py-3.5">Tanggal Terbit</th>
                <th className="px-4 py-3.5">Nominal</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const isPaid = inv.status === 'LUNAS';
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{inv.studentName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{inv.id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {inv.type} ({inv.period})
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono tabular-nums">{inv.createdAt}</td>
                    <td className="px-4 py-3 font-black text-slate-900 tabular-nums">
                      Rp{inv.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPaid ? (
                        <button
                          onClick={() => onShowReceipt(inv)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 inline-flex items-center gap-1 active:scale-95"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-700" />
                          <span>Kuitansi</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onMarkInvoicePaid(inv.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold active:scale-95 shadow-xs inline-flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Tandai Lunas</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
