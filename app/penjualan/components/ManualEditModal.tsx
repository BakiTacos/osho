// app/penjualan/components/ManualEditModal.tsx
import React from 'react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editForm: any;
  setEditForm: (form: any) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ManualEditModal = ({ isOpen, onClose, editForm, setEditForm, isProcessing, onSubmit }: EditModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">🔧 Petakan Produk Pending</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-bold">ID Pesanan:</span>
              <span className="font-black text-slate-700">{editForm.orderId}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold">Marketplace:</span>
              <span className="font-black text-slate-700 uppercase">{editForm.marketplace}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-600 block mb-1">Nama Barang Luar Katalog (Dari Nota)</label>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 italic">
              {editForm.product}
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">Masukkan SKU Katalog yang Benar</label>
            <input 
              type="text" 
              required 
              placeholder="CONTOH: SMBL-MRH-1LNS"
              className="w-full border border-slate-200 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none transition-all shadow-xs" 
              value={editForm.sku} 
              onChange={(e) => setEditForm({...editForm, sku: e.target.value.toUpperCase().replace(/\s+/g, '')})}
            />
            <p className="text-[10px] text-slate-400 mt-1">Sistem akan otomatis menghitung ulang HPP, margin keuntungan, dan memotong stok di katalog asli.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-600 block mb-1">Kuantitas (Qty)</label>
              <input type="number" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500" value={editForm.qty} />
            </div>
            <div>
              <label className="text-xs font-black text-slate-600 block mb-1">Omset Penjualan</label>
              <input type="text" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500" value={`Rp ${editForm.total.toLocaleString('id-ID')}`} />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black py-3 rounded-xl transition-all">Batal</button>
            <button type="submit" disabled={isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 rounded-xl transition-all shadow-md disabled:opacity-50">
              {isProcessing ? "Menyimpan..." : "Simpan & Hubungkan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};