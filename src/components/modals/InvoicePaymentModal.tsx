import React, { useState } from 'react';
import { Invoice } from '../../types';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import { generateIdempotentPaymentId } from '../../utils/financeHelpers';

export interface PaymentSubmitData {
  paymentId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  note?: string;
}

interface InvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSubmit: (data: PaymentSubmitData) => Promise<void> | void;
}

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmit,
}) => {
  if (!isOpen || !invoice) return null;

  const totalAmount = invoice.amount || 0;
  const paidAmount = invoice.paidAmount !== undefined 
    ? invoice.paidAmount 
    : (invoice.status === 'LUNAS' ? totalAmount : 0);
  const remainingAmount = invoice.remainingAmount !== undefined 
    ? invoice.remainingAmount 
    : Math.max(0, totalAmount - paidAmount);

  const [amount, setAmount] = useState<number>(remainingAmount > 0 ? remainingAmount : totalAmount);
  const [method, setMethod] = useState<string>('Tunai');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const parsedAmount = Math.max(0, Number(amount) || 0);
  const willBeFullyPaid = parsedAmount >= remainingAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0 || isSubmitting) return;

    // Generated ONCE before calling runTransaction
    const paymentId = generateIdempotentPaymentId(invoice.id);

    try {
      setIsSubmitting(true);
      await onSubmit({
        paymentId,
        invoiceId: invoice.id,
        amount: parsedAmount,
        paymentMethod: method,
        paymentDate,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative border border-slate-200">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-900 font-black text-sm uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Pencatatan Pembayaran Tagihan</span>
          </div>
          <p className="text-xs text-slate-500">
            Transaksi pembayaran diproses secara atomik dan otomatis tersinkron ke Kas & Dashboard Orang Tua.
          </p>
        </div>

        {/* Invoice Summary Card */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Siswa:</span>
            <span className="font-extrabold text-slate-900">{invoice.studentName} ({invoice.classGroupId})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Jenis Tagihan:</span>
            <span className="font-bold text-blue-900">{invoice.type} ({invoice.period})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Total Tagihan:</span>
            <span className="font-mono font-bold text-slate-700">Rp{totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Sudah Dibayar:</span>
            <span className="font-mono font-bold text-emerald-700">Rp{paidAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-sm">
            <span className="text-rose-700">Sisa Tagihan:</span>
            <span className="font-mono text-rose-700 tabular-nums">Rp{remainingAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nominal yang Dibayarkan (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
              <input
                type="number"
                required
                min="1000"
                max={remainingAmount > 0 ? remainingAmount : undefined}
                step="1000"
                disabled={isSubmitting}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder={`Contoh: ${remainingAmount}`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-mono font-black focus:outline-none focus:border-blue-600 text-sm"
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className={willBeFullyPaid ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                {willBeFullyPaid ? '✓ Status akan menjadi LUNAS' : '• Status akan menjadi SEBAGIAN (Cicilan)'}
              </span>
              {remainingAmount > 0 && parsedAmount !== remainingAmount && (
                <button
                  type="button"
                  onClick={() => setAmount(remainingAmount)}
                  className="text-blue-600 hover:underline font-bold"
                >
                  Bayar Penuh
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Metode Pembayaran *
              </label>
              <select
                value={method}
                disabled={isSubmitting}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-600"
              >
                <option value="Tunai">Tunai Lapangan</option>
                <option value="Transfer Bank BFA">Transfer Bank BFA</option>
                <option value="QRIS Kasir">QRIS Kasir</option>
                <option value="Manual Verifikasi Admin">Verifikasi Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal Pembayaran *
              </label>
              <input
                type="date"
                required
                disabled={isSubmitting}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Pembayaran (Opsional)
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Titipan orang tua via Coach Hendra"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Anti-double payment aktif dengan transaction id terisolasi.</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || parsedAmount <= 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Simpan Pembayaran & Kas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
