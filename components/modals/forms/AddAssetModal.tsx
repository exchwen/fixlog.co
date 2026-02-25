'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Box, User, MapPin, Settings, Hash } from 'lucide-react';

export default function AddAssetModal({
  showAddAsset, setShowAddAsset,
  newAsset, setNewAsset,
  isSaving, handleAction,
  data
}: any) {

  // Form doğrulama: Varlık adı ve müşteri seçimi zorunlu
  const isFormValid = newAsset?.name?.trim() !== '' && newAsset?.customer_id !== '';

  return (
    <AnimatePresence>
      {showAddAsset && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Arka plan tıklaması ile kapatma */}
          <div className="absolute inset-0" onClick={() => setShowAddAsset(false)}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Yeni Cihaz / Varlık Ekle</h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Müşteriye ait yeni bir varlık tanımlayın.</div>
               </div>
               <button 
                  onClick={() => setShowAddAsset(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
               >
                  <X size={20} />
               </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Varlık / Cihaz Adı */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Box size={14} /> Cihaz / Varlık Adı <span className="text-rose-500">*</span>
                  </label>
                  <input 
                      type="text" 
                      placeholder="Örn: B Blok Ana Klima, Tıbbi Cihaz #12 vb." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newAsset.name} 
                      onChange={e => setNewAsset({...newAsset, name: e.target.value})} 
                  />
                </div>

                {/* Ait Olduğu Müşteri */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <User size={14} /> Ait Olduğu Müşteri <span className="text-rose-500">*</span>
                      </label>
                  <select 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                      value={newAsset.customer_id} 
                      onChange={e => setNewAsset({...newAsset, customer_id: e.target.value})}
                  >
                      <option value="" disabled>Lütfen Müşteri Seçin...</option>
                      {(data?.customers || []).map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>

                {/* Konum / Şube */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <MapPin size={14} /> Konum / Departman / Şube
                  </label>
                  <input 
                      type="text" 
                      placeholder="Örn: 2. Kat Sistem Odası" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newAsset.location} 
                      onChange={e => setNewAsset({...newAsset, location: e.target.value})} 
                  />
                </div>

                {/* Tür / Model */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Settings size={14} /> Türü / Modeli
                  </label>
                  <input 
                      type="text" 
                      placeholder="Cihazın markası veya modeli..." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newAsset.type || ''} 
                      onChange={e => setNewAsset({...newAsset, type: e.target.value})} 
                  />
                </div>

                {/* Seri Numarası */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Hash size={14} /> Seri / Barkod Numarası
                  </label>
                  <input 
                      type="text" 
                      placeholder="SN: 1234567890" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400 font-mono" 
                      value={newAsset.serial_number || ''} 
                      onChange={e => setNewAsset({...newAsset, serial_number: e.target.value})} 
                  />
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => handleAction('add-asset', newAsset, setShowAddAsset, () => setNewAsset({ name: '', location: '', customer_id: '', type: '', serial_number: '' }))} 
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50 disabled:hover:bg-blue-600"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Cihazı Kaydet'}
               </button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}