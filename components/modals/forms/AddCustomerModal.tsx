'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Phone, MapPin, FileText } from 'lucide-react';

export default function AddCustomerModal({
  showAddCustomer, setShowAddCustomer,
  newCustomer, setNewCustomer,
  isSaving, handleAction
}: any) {

  // Form doğrulama: Sadece Müşteri/Firma Adı zorunlu, diğerleri esnek bırakılabilir
  const isFormValid = newCustomer?.name?.trim() !== '';

  return (
    <AnimatePresence>
      {showAddCustomer && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Arka plan tıklaması ile kapatma */}
          <div className="absolute inset-0" onClick={() => setShowAddCustomer(false)}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Yeni Müşteri Ekle</h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Sisteme yeni bir müşteri veya firma kaydedin.</div>
               </div>
               <button 
                  onClick={() => setShowAddCustomer(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
               >
                  <X size={20} />
               </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Müşteri / Firma Adı */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <User size={14} /> Müşteri / Firma Adı <span className="text-rose-500">*</span>
                  </label>
                  <input 
                      type="text" 
                      placeholder="Örn: Ahmet Yılmaz veya ABC Ltd. Şti." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newCustomer.name} 
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                  />
                </div>

                {/* İletişim Numarası */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Phone size={14} /> İletişim Numarası
                  </label>
                  <input 
                      type="tel" 
                      placeholder="05XX XXX XX XX" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newCustomer.contact} 
                      onChange={e => setNewCustomer({...newCustomer, contact: e.target.value})} 
                  />
                </div>

                {/* Adres / Konum */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <MapPin size={14} /> Adres / Konum
                  </label>
                  <textarea 
                      rows={2}
                      placeholder="Müşterinin açık adresi..." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none resize-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newCustomer.address} 
                      onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                  />
                </div>

                {/* Vergi No / TC Kimlik */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <FileText size={14} /> Vergi No / TC Kimlik (İsteğe Bağlı)
                  </label>
                  <input 
                      type="text" 
                      placeholder="Fatura işlemleri için..." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newCustomer.tax_info || ''} 
                      onChange={e => setNewCustomer({...newCustomer, tax_info: e.target.value})} 
                  />
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => handleAction('add-customer', newCustomer, setShowAddCustomer, () => setNewCustomer({ name: '', contact: '', address: '', tax_info: '' }))} 
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50 disabled:hover:bg-blue-600"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Müşteriyi Kaydet'}
               </button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}