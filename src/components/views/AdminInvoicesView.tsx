import React, { useState } from 'react';
import { Invoice } from '../../types';
import { CreditCard, Plus, Receipt, CheckCircle, Download, FileSpreadsheet, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { exportInvoicesExcel, exportInvoicesPDF } from '../../utils/exportHelpers';

interface AdminInvoicesViewProps {
  invoices: Invoice[];
  onGenerateInvoices: () => void;
  onMarkInvoicePaid: (id: string) => void;
  onShowReceipt: (invoice: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
  onClearAllInvoices?: () => void;
}

export const AdminInvoicesView: React.FC<AdminInvoicesViewProps> = ({
  invoices,
  onGenerateInvoices,
  onMarkInvoicePaid,
  onShowReceipt,
  onDeleteInvoice,
  onClearAllInvoices,
}) => {
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

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
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {invoices.length > 0 && (
            <>
              <button
                onClick={() => exportInvoicesExcel(invoices)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
                title="Download Tagihan format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Unduh Excel</span>
              </button>

              <button
                onClick={() => exportInvoicesPDF(invoices)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
                title="Download Tagihan format PDF"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Unduh PDF</span>
              </button>
            </>
          )}

          {onClearAllInvoices && invoices.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA TAGIHAN dan mereset total iuran menjadi Rp0 untuk memulai pembukuan riil?')) {
                  onClearAllInvoices();
                }
              }}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition active:scale-95 border border-rose-200"
              title="Reset seluruh tagihan ke Rp0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Tagihan ke Rp0</span>
            </button>
          )}

          <button
            onClick={onGenerateInvoices}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-orange-500/20 transition flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Tagihan SPP</span>
          </button>
        </div>
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
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Jumlah Transaksi
          </span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
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
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Belum Ada Tagihan Iuran Siswa (Rp0)</p>
                      <p className="text-xs text-slate-400">
                        Pembukuan dimulai bersih dari nol secara riil. Tagihan iuran latihan akan terbit otomatis saat siswa check-in kehadiran di lapangan, atau klik &quot;Generate Tagihan SPP&quot; untuk menerbitkan SPP bulanan.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
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
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid ? (
                            <button
                              type="button"
                              onClick={() => onShowReceipt(inv)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 inline-flex items-center gap-1 active:scale-95"
                              title="Cetak Kuitansi Resmi"
                            >
                              <Receipt className="w-3.5 h-3.5 text-blue-700" />
                              <span>Kuitansi</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onMarkInvoicePaid(inv.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold active:scale-95 shadow-xs inline-flex items-center gap-1"
                              title="Tandai Sudah Lunas"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Tandai Lunas</span>
                            </button>
                          )}

                          {onDeleteInvoice && (
                            <button
                              type="button"
                              onClick={() => setInvoiceToDelete(inv)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 rounded-lg text-xs font-bold border border-rose-200 inline-flex items-center transition active:scale-95 shadow-2xs"
                              title="Hapus Tagihan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Invoice Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl relative border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Hapus Tagihan Siswa?
              </h3>
              <p className="text-xs text-slate-500">
                Data tagihan akan dihapus permanen dari sistem dan buku kas akademi.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Siswa:</span>
                <span className="font-extrabold text-slate-900">{invoiceToDelete.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Jenis:</span>
                <span className="font-bold text-blue-900">{invoiceToDelete.type} ({invoiceToDelete.period})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nominal:</span>
                <span className="font-mono font-black text-slate-900">Rp{invoiceToDelete.amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className={`font-bold ${invoiceToDelete.status === 'LUNAS' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {invoiceToDelete.status}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-[10px]">
                <span className="text-slate-400 font-mono">ID Tagihan:</span>
                <span className="font-mono text-slate-600">{invoiceToDelete.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteInvoice) {
                    onDeleteInvoice(invoiceToDelete.id);
                  }
                  setInvoiceToDelete(null);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-rose-600/25 active:scale-95 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
