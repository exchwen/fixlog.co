'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Phone, Mail, ShieldCheck } from 'lucide-react';

export default function AddStaffModal({
  showAddStaff, setShowAddStaff,
  newStaff, setNewStaff,
  isSaving, handleAction
}: any) {

  // Form doğrulama: İsim ve Rol zorunlu
  const isFormValid = newStaff?.name?.trim() !== '' && newStaff?.role?.trim() !== '';

  return (
    <AnimatePresence>
      {showAddStaff && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowAddStaff(false)}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
               <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Yeni Personel Ekle</h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Ekibe yeni bir üye dahil edin.</div>
               </div>
               <button 
                  onClick={() => setShowAddStaff(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
               >
                  <X size={20} />
               </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar max-h-[70vh]">
                
                {/* Ad Soyad */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <User size={14} /> Ad Soyad
                  </label>
                  <input 
                      type="text" 
                      placeholder="Personelin tam adı" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newStaff.name} 
                      onChange={e => setNewStaff({...newStaff, name: e.target.value})} 
                  />
                </div>

                {/* Yetki Rolü */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Yetki / Rol
                  </label>
                  <select 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                      value={newStaff.role} 
                      onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                  >
                      <option value="" disabled>Rol Seçiniz...</option>
                      <option value="Yönetici">Yönetici (Tüm işleri görür ve atar)</option>
                      <option value="Usta">Usta (Sahada işlemi gerçekleştirir)</option>
                      <option value="Çırak">Çırak / Yardımcı</option>
                  </select>
                </div>

                {/* Telefon */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Phone size={14} /> Telefon Numarası
                  </label>
                  <input 
                      type="tel" 
                      placeholder="05XX XXX XX XX" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newStaff.contact} 
                      onChange={e => setNewStaff({...newStaff, contact: e.target.value})} 
                  />
                </div>

                {/* E-Posta */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Mail size={14} /> E-Posta Adresi (İsteğe Bağlı)
                  </label>
                  <input 
                      type="email" 
                      placeholder="personel@firma.com" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newStaff.email || ''} 
                      onChange={e => setNewStaff({...newStaff, email: e.target.value})} 
                  />
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => handleAction('add-staff', newStaff, setShowAddStaff, () => setNewStaff({ name: '', role: '', contact: '', email: '' }))} 
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Personeli Kaydet'}
               </button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}