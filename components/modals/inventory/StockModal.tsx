'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Package, Hash, Tag, AlertTriangle } from 'lucide-react';

export default function StockModal({
  showStockModal, setShowStockModal,
  newStock, setNewStock,
  isSaving, handleAction,
  data
}: any) {

  // Form doğrulama: Parça adı ve miktarı zorunlu
  const isFormValid = newStock?.name?.trim() !== '' && newStock?.quantity !== '' && Number(newStock?.quantity) >= 0;

  return (
    <AnimatePresence>
      {showStockModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Arka plan tıklaması ile kapatma */}
          <div className="absolute inset-0" onClick={() => setShowStockModal(false)}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Yeni Stok / Parça Ekle</h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Deponuza yeni bir malzeme veya yedek parça girişi yapın.</div>
               </div>
               <button 
                  onClick={() => setShowStockModal(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
               >
                  <X size={20} />
               </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Parça / Ürün Adı */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Package size={14} /> Parça / Malzeme Adı <span className="text-rose-500">*</span>
                  </label>
                  <input 
                      type="text" 
                      placeholder="Örn: 12V Adaptör, 5m Kablo vb." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newStock.name || ''} 
                      onChange={e => setNewStock({...newStock, name: e.target.value})} 
                  />
                </div>

                {/* Kategori Seçimi */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Tag size={14} /> Kategori
                  </label>
                  <select 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                      value={newStock.category || ''} 
                      onChange={e => setNewStock({...newStock, category: e.target.value})}
                  >
                      <option value="" disabled>Kategori Seçin...</option>
                      {(data?.categories || []).map((cat: any) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="Diğer">Diğer / Sınıflandırılmamış</option>
                  </select>
                </div>

                {/* Miktar ve Birim */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                            <Hash size={14} /> Miktar <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            min="0"
                            placeholder="0" 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                            value={newStock.quantity || ''} 
                            onChange={e => setNewStock({...newStock, quantity: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                            Birim
                        </label>
                        <select 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                            value={newStock.unit || 'Adet'} 
                            onChange={e => setNewStock({...newStock, unit: e.target.value})}
                        >
                            <option value="Adet">Adet</option>
                            <option value="Metre">Metre</option>
                            <option value="Kg">Kilogram (Kg)</option>
                            <option value="Kutu">Kutu</option>
                            <option value="Litre">Litre</option>
                        </select>
                    </div>
                </div>

                {/* Minimum Stok Uyarısı */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Minimum Stok Uyarısı
                  </label>
                  <div className="relative">
                      <input 
                          type="number" 
                          min="0"
                          placeholder="Örn: 5" 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                          value={newStock.min_alert || ''} 
                          onChange={e => setNewStock({...newStock, min_alert: e.target.value})} 
                      />
                      <div className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                          {newStock.unit || 'Adet'} altına düşünce uyar
                      </div>
                  </div>
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => handleAction('add-stock', newStock, setShowStockModal, () => setNewStock({ name: '', quantity: '', unit: 'Adet', category: '', min_alert: '' }))} 
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50 disabled:hover:bg-slate-900"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Stok Ekle'}
               </button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}