import React, { useState } from 'react';
import { CashMutation } from '../../types';
import { X, Wallet } from 'lucide-react';

interface RecordCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mutation: Omit<CashMutation, 'id'>) => void;
}

export const RecordCashModal: React.FC<RecordCashModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<'Pengeluaran' | 'Pemasukan'>('Pengeluaran');
  const [method, setMethod] = useState('Tunai Lapangan');
  const [category, setCategory] = useState('Sewa Lapangan');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('2026-09-29');
  const [staff, setStaff] = useState('Coach Hendra');

  if (!isOpen) return null;

  const handleTypeChange = (newType: 'Pengeluaran' | 'Pemasukan') => {
    setType(newType);
    if (newType === 'Pemasukan') {
      setCategory('SPP Bulanan');
    } else {
      setCategory('Sewa Lapangan');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onSubmit({
      date,
      type,
      category,
      note,
      method,
      amount: numAmount,
      staff,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative my-8 border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-600" />
            <span>Catat Mutasi Kas Baru</span>
          </h3>
          <p className="text-xs text-slate-500">
            Pencatatan arus kas masuk & keluar operasional akademi BFA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipe Mutasi</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as 'Pengeluaran' | 'Pemasukan')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-600"
              >
                <option value="Pengeluaran">Pengeluaran (-)</option>
                <option value="Pemasukan">Pemasukan (+)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Metode</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-600"
              >
                <option value="Tunai Lapangan">Tunai Lapangan</option>
                <option value="Transfer Bank BFA">Transfer Bank BFA</option>
                <option value="QRIS Kasir">QRIS Kasir</option>
                <option value="Virtual Account">Virtual Account</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Kategori Transaksi</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-600"
            >
              {type === 'Pemasukan' ? (
                <>
                  <option value="SPP Bulanan">SPP Bulanan</option>
                  <option value="Iuran Sesi Lapangan">Iuran Sesi Lapangan</option>
                  <option value="Pendaftaran Anggota Baru">Pendaftaran Anggota Baru</option>
                  <option value="Operasional Lainnya">Operasional Lainnya</option>
                </>
              ) : (
                <>
                  <option value="Sewa Lapangan">Sewa Lapangan</option>
                  <option value="Honor Pelatih">Honor Pelatih</option>
                  <option value="Alat & Bola Futsal">Alat & Bola Futsal</option>
                  <option value="Operasional Lainnya">Operasional Lainnya</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
            <input
              type="number"
              required
              min="1000"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 150000"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan / Rincian Operasional *</label>
            <input
              type="text"
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Pembayaran sewa lapangan 2 jam FlaminGO"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Petugas / PIC</label>
              <input
                type="text"
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition active:scale-95"
            >
              Simpan Transaksi Kas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
